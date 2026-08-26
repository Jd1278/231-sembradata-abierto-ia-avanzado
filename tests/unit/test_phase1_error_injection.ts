import { describe, it, expect, vi } from "vitest";
import {
  trapezoidalScore,
  calculateClimateMetrics,
  evaluateCropCompatibility,
  calculateAgroclimaticRisk,
  type RawDailyClimate,
} from "../../src/services/climate-calculator";
import { buildMunicipalityClimateStates, type Location } from "../../src/services/climate-state";
import { getOfficialAltitude } from "../../src/components/sembradata/data";
import * as climateApi from "../../src/services/climate-api";

describe("Phase 1: Fault Injection & Extreme Error Testing", () => {
  describe("1. Mathematical & Boundary Error Edge Cases", () => {
    it("handles zero division when sample size n = 1 (temperatureStdDev & precipitationCv must be null, not NaN)", () => {
      const singleObs: RawDailyClimate[] = [
        {
          date: "2026-01-01",
          tempMax: 24,
          tempMin: 18,
          precip: 10,
          humidity: 70,
          et0: 3,
        },
      ];

      const metrics = calculateClimateMetrics(singleObs, { expectedDays: 1 });
      expect(metrics.meanTemperature).toBe(21);
      expect(metrics.temperatureStdDev).toBeNull(); // n < 2 -> no sample stddev
      expect(metrics.precipitationStdDev).toBeNull();
      expect(metrics.precipitationCv).toBeNull();
      expect(Number.isNaN(metrics.meanTemperature)).toBe(false);
    });

    it("handles zero precipitation without dividing by zero for CV% (precipCv must be null)", () => {
      const zeroPrecipObs: RawDailyClimate[] = [
        { date: "2026-01-01", tempMax: 25, tempMin: 15, precip: 0, humidity: 60, et0: 4 },
        { date: "2026-01-02", tempMax: 25, tempMin: 15, precip: 0, humidity: 60, et0: 4 },
        { date: "2026-01-03", tempMax: 25, tempMin: 15, precip: 0, humidity: 60, et0: 4 },
      ];

      const metrics = calculateClimateMetrics(zeroPrecipObs, { expectedDays: 3 });
      expect(metrics.accumulatedPrecipitation).toBe(0);
      expect(metrics.dailyMeanPrecipitation).toBe(0);
      expect(metrics.precipitationCv).toBeNull(); // Must not be NaN or Infinity!
    });

    it("handles zero evapotranspiration without dividing by zero for waterDeficitIndex", () => {
      const zeroEt0Obs: RawDailyClimate[] = [
        { date: "2026-01-01", tempMax: 20, tempMin: 16, precip: 5, humidity: 80, et0: 0 },
        { date: "2026-01-02", tempMax: 20, tempMin: 16, precip: 5, humidity: 80, et0: 0 },
      ];

      const metrics = calculateClimateMetrics(zeroEt0Obs, { expectedDays: 2 });
      expect(metrics.evapotranspiration).toBe(0);
      expect(metrics.waterDeficitIndex).toBeNull(); // Must not be 0/0 (NaN)
    });

    it("handles corrupt observations (NaN, Infinity, negative temperatures, negative precipitation)", () => {
      const corruptObs: RawDailyClimate[] = [
        {
          date: "2026-01-01",
          tempMax: Number.NaN,
          tempMin: 15,
          precip: -10,
          humidity: -5,
          et0: -2,
        },
        {
          date: "2026-01-02",
          tempMax: Infinity,
          tempMin: -Infinity,
          precip: Number.NaN,
          humidity: 150,
          et0: Number.NaN,
        },
        { date: "2026-01-03", tempMax: 22, tempMin: 14, precip: 8, humidity: 75, et0: 3 },
      ];

      const metrics = calculateClimateMetrics(corruptObs, { expectedDays: 3 });
      expect(metrics.dataQuality.validObservations).toBe(1);
      expect(metrics.meanTemperature).toBe(18); // (22 + 14)/2 = 18
      expect(metrics.accumulatedPrecipitation).toBe(8);
      expect(metrics.meanHumidity).toBe(75);
    });

    it("trapezoidalScore gracefully handles undefined, null, NaN, and negative infinity", () => {
      expect(trapezoidalScore(undefined, 10, 15, 20, 25)).toBe(0);
      expect(trapezoidalScore(null, 10, 15, 20, 25)).toBe(0);
      expect(trapezoidalScore(Number.NaN, 10, 15, 20, 25)).toBe(0);
      expect(trapezoidalScore(-Infinity, 10, 15, 20, 25)).toBe(0);
      expect(trapezoidalScore(Infinity, 10, 15, 20, 25)).toBe(0);
    });
  });

  describe("2. Agronomic Hard Boundary Violations & Environmental Stress", () => {
    it("strictly excludes crops at 0.01 degrees outside physiological tolerance", () => {
      // Cacao: min=18°C. At 17.99°C it must be excluded with overallScore = 0
      const coldObs: RawDailyClimate[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${i + 1}`,
        tempMax: 18.99,
        tempMin: 16.99, // Mean = 17.99
        precip: 5,
        humidity: 80,
        et0: 3,
      }));
      const metrics = calculateClimateMetrics(coldObs, { expectedDays: 30 });
      const compat = evaluateCropCompatibility(metrics, 300, "cacao");

      expect(compat.compatible).toBe(false);
      expect(compat.overallScore).toBe(0);
      expect(compat.exclusionReason).toContain("Temperatura media");
    });

    it("penalizes extreme drought when water deficit index is critical (> 0.4)", () => {
      // 90 days with 0 rain and high ET0
      const droughtObs: RawDailyClimate[] = Array.from({ length: 90 }, (_, i) => ({
        date: `2026-01-${i + 1}`,
        tempMax: 30,
        tempMin: 22, // Mean = 26
        precip: 0,
        humidity: 40,
        et0: 5, // Total ET0 = 450 mm, Peff = 0 -> deficit = 450, index = 1.0
      }));
      const metrics = calculateClimateMetrics(droughtObs, { expectedDays: 90 });
      const risk = calculateAgroclimaticRisk("Barrancabermeja", "cacao", metrics, 112);

      expect(risk.penalties.drought).toBeGreaterThan(0);
      expect(risk.riskLevel).toBe("Alto");
    });

    it("penalizes frost events when min temperature drops below 3°C", () => {
      const frostObs: RawDailyClimate[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${i + 1}`,
        tempMax: 18,
        tempMin: i === 5 ? 1.0 : 12.0, // Day 6 has 1°C frost
        precip: 4,
        humidity: 75,
        et0: 2,
      }));
      const metrics = calculateClimateMetrics(frostObs, { expectedDays: 30 });
      const risk = calculateAgroclimaticRisk("Vetas", "granadilla", metrics, 2200);

      expect(risk.penalties.frost).toBe(0.25);
    });
  });

  describe("3. Simulated Network Outages, Rate Limits & 87 Municipalities Concurrency Pool", () => {
    it("handles mass network failures where 50 out of 87 municipalities fail, keeping healthy ones intact", async () => {
      // Generate 87 mock Santander municipalities
      const testMunis: Location[] = Array.from({ length: 87 }, (_, i) => ({
        name: `Municipio_${i + 1}`,
        geolat: 6.0 + (i % 20) * 0.05,
        geolng: -73.0 - (i % 20) * 0.05,
        altitude: 500 + i * 20,
      }));

      // Mock fetchCurrentClimate: Even numbered fail with network timeout / 429 rate limit, Odd numbered succeed
      const spy = vi
        .spyOn(climateApi, "fetchCurrentClimate")
        .mockImplementation(async (lat, _lng) => {
          const id = Math.round((lat - 6.0) / 0.05);
          if (id % 2 === 0) {
            throw new Error("HTTP 429: Too Many Requests / Network Timeout");
          }
          return {
            temperature: 22,
            temperatureMax: 26,
            temperatureMin: 18,
            humidity: 75,
            precipitation: 4,
            windSpeed: 2,
            windDirection: 0,
            solarRadiation: 18,
            uvIndex: 8,
            cloudCover: 20,
            pressure: 1013,
            evapotranspiration: 250,
            dailyData: Array.from({ length: 30 }, (_, j) => ({
              date: `2026-01-${j + 1}`,
              tempMax: 26,
              tempMin: 18,
              precip: 4,
              humidity: 75,
              windSpeed: 2,
              solarRad: 18,
              uvIndex: 8,
              et0: 3,
            })),
            monthlyPrecipitation: [{ year: 2026, month: 1, precipitation: 120 }],
            agriculturalIndex: {
              GrowingDegreeDays: 360,
              aridityIndex: 1.5,
              moistureStressIndex: 0.1,
              frostRisk: 0,
              droughtRisk: 0.1,
            },
          };
        });

      const states = await buildMunicipalityClimateStates(testMunis, "cacao");

      // Verify all 87 keys exist in the returned dictionary
      expect(Object.keys(states).length).toBe(87);

      let readyCount = 0;
      let errorCount = 0;

      for (const [, state] of Object.entries(states)) {
        if (state.status === "ready") {
          readyCount++;
          expect(["Bajo", "Medio", "Alto"]).toContain(state.level);
          expect(state.climate).not.toBeNull();
        } else {
          errorCount++;
          expect(state.level).toBe("NoData");
          expect(state.climate).toBeNull();
          expect(state.error).toContain("HTTP 429");
        }
      }

      // Assert that partial failures were isolated and did not corrupt the whole map
      expect(readyCount).toBeGreaterThan(0);
      expect(errorCount).toBeGreaterThan(0);
      expect(readyCount + errorCount).toBe(87);

      spy.mockRestore();
    });

    it("safely handles unknown municipality names in getOfficialAltitude without throwing", () => {
      expect(getOfficialAltitude("NonExistentCity_12345")).toBe(1000); // safe default
      expect(getOfficialAltitude("")).toBe(1000);
      expect(getOfficialAltitude("   ")).toBe(1000);
    });
  });
});
