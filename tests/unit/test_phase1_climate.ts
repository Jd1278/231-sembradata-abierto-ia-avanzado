import { describe, it, expect } from "vitest";
import {
  trapezoidalScore,
  calculateClimateMetrics,
  evaluateCropCompatibility,
  calculateAgroclimaticRisk,
  type RawDailyClimate,
} from "../../src/services/climate-calculator";
import { classifyMunicipalityClimate } from "../../src/services/climate-state";
import {
  OFFICIAL_SANTANDER_ALTITUDES,
  getOfficialAltitude,
} from "../../src/components/sembradata/data";
import type { ClimateData } from "../../src/services/climate-api";

describe("Phase 1: ClimateCalculator — Mathematical & Statistical Formulas", () => {
  it("computes pure trapezoidal score accurately across all regions", () => {
    // Range: min=15, optMin=18, optMax=24, max=28
    expect(trapezoidalScore(10, 15, 18, 24, 28)).toBe(0); // below min
    expect(trapezoidalScore(15, 15, 18, 24, 28)).toBe(0); // at min
    expect(trapezoidalScore(16.5, 15, 18, 24, 28)).toBeCloseTo(0.5, 2); // halfway ascending
    expect(trapezoidalScore(18, 15, 18, 24, 28)).toBe(1); // at optMin
    expect(trapezoidalScore(21, 15, 18, 24, 28)).toBe(1); // inside optimal plateau
    expect(trapezoidalScore(24, 15, 18, 24, 28)).toBe(1); // at optMax
    expect(trapezoidalScore(26, 15, 18, 24, 28)).toBeCloseTo(0.5, 2); // halfway descending
    expect(trapezoidalScore(28, 15, 18, 24, 28)).toBe(0); // at max
    expect(trapezoidalScore(32, 15, 18, 24, 28)).toBe(0); // above max
    expect(trapezoidalScore(null, 15, 18, 24, 28)).toBe(0); // null safety
  });

  it("calculates mean, max, min, thermal range, and standard deviation without converting null to zero", () => {
    const rawObs: RawDailyClimate[] = [
      { date: "2026-01-01", tempMax: 26, tempMin: 16, precip: 5, humidity: 75, et0: 3.5 },
      { date: "2026-01-02", tempMax: 28, tempMin: 18, precip: 0, humidity: 70, et0: 4.0 },
      { date: "2026-01-03", tempMax: null, tempMin: null, precip: null, humidity: null, et0: null }, // missing day
      { date: "2026-01-04", tempMax: 24, tempMin: 14, precip: 10, humidity: 80, et0: 3.0 },
    ];

    const metrics = calculateClimateMetrics(rawObs, { expectedDays: 4, source: "Test-API" });

    // Daily averages: Day 1: 21, Day 2: 23, Day 4: 19. Mean = (21 + 23 + 19)/3 = 21
    expect(metrics.meanTemperature).toBe(21);
    expect(metrics.maxTemperature).toBe(28);
    expect(metrics.minTemperature).toBe(14);
    expect(metrics.meanMaxTemperature).toBe(26);
    expect(metrics.meanMinTemperature).toBe(16);
    expect(metrics.thermalRange).toBe(10); // 26 - 16
    expect(metrics.temperatureStdDev).toBe(2); // stddev of [21, 23, 19] = 2

    // Precipitation: [5, 0, 10] -> sum = 15, mean = 5
    expect(metrics.accumulatedPrecipitation).toBe(15);
    expect(metrics.dailyMeanPrecipitation).toBe(5);
    expect(metrics.precipitationStdDev).toBeCloseTo(5.0, 1);
    expect(metrics.precipitationCv).toBeCloseTo(100.0, 1); // (5 / 5) * 100

    // Humidity: [75, 70, 80] -> mean = 75
    expect(metrics.meanHumidity).toBe(75);

    // Evapotranspiration: [3.5, 4.0, 3.0] = 10.5
    expect(metrics.evapotranspiration).toBe(10.5);

    // Data quality: 3 valid days out of 4 expected = 0.75 completeness
    expect(metrics.dataQuality.expectedObservations).toBe(4);
    expect(metrics.dataQuality.validObservations).toBe(3);
    expect(metrics.dataQuality.completeness).toBe(0.75);
  });

  it("handles empty observations gracefully with null metrics", () => {
    const metrics = calculateClimateMetrics([], { expectedDays: 30 });
    expect(metrics.meanTemperature).toBeNull();
    expect(metrics.accumulatedPrecipitation).toBeNull();
    expect(metrics.temperatureStdDev).toBeNull();
    expect(metrics.dataQuality.completeness).toBe(0);
  });
});

describe("Phase 1: Crop Compatibility & Agroclimatic Risk Engine", () => {
  it("enforces HARD EXCLUSION filters when temperature is outside crop limits", () => {
    // Cacao in a freezing climate (8°C) should be strictly incompatible
    const rawObs: RawDailyClimate[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      tempMax: 10,
      tempMin: 6,
      precip: 4,
      humidity: 80,
      et0: 2,
    }));
    const metrics = calculateClimateMetrics(rawObs, { expectedDays: 30 });

    const compat = evaluateCropCompatibility(metrics, 2800, "cacao");
    expect(compat.compatible).toBe(false);
    expect(compat.overallScore).toBe(0);
    expect(compat.exclusionReason).toContain("Temperatura media");

    const risk = calculateAgroclimaticRisk("Vetas", "cacao", metrics, 2800);
    expect(risk.riskLevel).toBe("Alto");
    expect(risk.riskScore).toBeGreaterThanOrEqual(0.85);
  });

  it("enforces HARD EXCLUSION filters when altitude is outside crop limits", () => {
    // Granadilla at 100 msnm (sea level) should be excluded (Granadilla requires 1600-2600 msnm)
    const rawObs: RawDailyClimate[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      tempMax: 20,
      tempMin: 14,
      precip: 5,
      humidity: 75,
      et0: 3,
    }));
    const metrics = calculateClimateMetrics(rawObs, { expectedDays: 30 });

    const compat = evaluateCropCompatibility(metrics, 100, "granadilla");
    expect(compat.compatible).toBe(false);
    expect(compat.overallScore).toBe(0);
    expect(compat.exclusionReason).toContain("Altitud");
  });

  it("assigns Low Risk to highly compatible zones with optimal conditions", () => {
    // San Vicente de Chucurí: Cacao at 25°C, 220 msnm, 80% humidity, 1800mm annual precip
    const rawObs: RawDailyClimate[] = Array.from({ length: 90 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      tempMax: 29,
      tempMin: 21,
      precip: 5, // 5 mm/day * 365 ≈ 1825 mm/year
      humidity: 80,
      et0: 3.5,
    }));
    const metrics = calculateClimateMetrics(rawObs, { expectedDays: 90 });

    const risk = calculateAgroclimaticRisk("San Vicente de Chucuri", "cacao", metrics, 220);
    expect(risk.riskLevel).toBe("Bajo");
    expect(risk.riskScore).toBeLessThanOrEqual(0.33);
    expect(risk.status).toBe("ready");
  });

  it("assigns NoData risk level when observations are severely missing", () => {
    const rawObs: RawDailyClimate[] = [
      { date: "2026-01-01", tempMax: null, tempMin: null, precip: null, humidity: null, et0: null },
    ];
    const metrics = calculateClimateMetrics(rawObs, { expectedDays: 90 });

    const risk = calculateAgroclimaticRisk("Unknown", "cafe", metrics, 1200);
    expect(risk.riskLevel).toBe("NoData");
    expect(risk.status).toBe("no-data");
  });
});

describe("Phase 1: Resilience & Concurrency Pool for 87 Santander Municipalities", () => {
  it("preserves official altitude lookup for all 87 municipalities", () => {
    expect(Object.keys(OFFICIAL_SANTANDER_ALTITUDES).length).toBe(87);
    expect(getOfficialAltitude("Bucaramanga")).toBe(950);
    expect(getOfficialAltitude("Barrancabermeja")).toBe(112);
    expect(getOfficialAltitude("Vetas")).toBe(2500);
    expect(getOfficialAltitude("San Vicente de Chucurí")).toBe(200);
  });

  it("handles single-municipality failure without crashing or corrupting other municipalities", async () => {
    // Mock classifyMunicipalityClimate with null climate (error simulated)
    const errorTownState = classifyMunicipalityClimate("ErrorTown", "cafe", null, 1000);
    expect(errorTownState.level).toBe("NoData");
    expect(errorTownState.status).toBe("no-data");

    // Normal town with mock climate
    const mockClimate: ClimateData = {
      temperature: 20,
      temperatureMax: 24,
      temperatureMin: 16,
      humidity: 75,
      precipitation: 4,
      windSpeed: 2,
      windDirection: 0,
      solarRadiation: 18,
      uvIndex: 8,
      cloudCover: 30,
      pressure: 1013,
      evapotranspiration: 300,
      dailyData: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${i + 1}`,
        tempMax: 24,
        tempMin: 16,
        precip: 4,
        humidity: 75,
        windSpeed: 2,
        solarRad: 18,
        uvIndex: 8,
        et0: 3,
      })),
      monthlyPrecipitation: [{ year: 2026, month: 1, precipitation: 120 }],
      agriculturalIndex: {
        GrowingDegreeDays: 300,
        aridityIndex: 1.2,
        moistureStressIndex: 0.1,
        frostRisk: 0,
        droughtRisk: 0.1,
      },
    };

    const sanGilState = classifyMunicipalityClimate("San Gil", "cafe", mockClimate, 1160);
    expect(sanGilState.level).toBe("Bajo");
    expect(sanGilState.status).toBe("ready");
    expect(sanGilState.score).toBeGreaterThan(70);
  });
});
