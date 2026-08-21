import { describe, it, expect } from "vitest";
import {
  isMunicipalityCompatible,
  getMunicipalityMapStyle,
} from "../../src/services/map-compatibility";
import {
  calculateAgroclimaticYieldPrediction,
  extractClimateFeatures,
  normalizeHistoricalPredictionData,
  type HistoricalPredictionPoint,
} from "../../src/services/historical-prediction-service";
import type { AdvancedFilterValues } from "../../src/components/sembradata/AdvancedFilters";

describe("Phase 5: Fault Injection & Boundary Error Analysis", () => {
  describe("1. Map Compatibility Inverted Ranges & Malformed Inputs", () => {
    it("handles inverted filter ranges gracefully via min/max normalization", () => {
      const muni = { name: "Bucaramanga", altitude: 959 };
      // Inverted altitude range: [2000, 500] instead of [500, 2000]
      const invertedFilter: AdvancedFilterValues = {
        altitudeRange: [2000, 500],
        tempRange: [35, 10],
        precipRange: [4000, 0],
        soilType: "all",
      };

      // 959m is within [500, 2000]
      expect(isMunicipalityCompatible(muni, invertedFilter)).toBe(true);
    });

    it("handles null, undefined or NaN municipality objects safely without throwing", () => {
      const defaultFilter: AdvancedFilterValues = {
        altitudeRange: [0, 4000],
        tempRange: [10, 35],
        precipRange: [0, 4000],
        soilType: "all",
      };

      expect(isMunicipalityCompatible(null as unknown as { name: string }, defaultFilter)).toBe(
        false,
      );
      expect(
        isMunicipalityCompatible(undefined as unknown as { name: string }, defaultFilter),
      ).toBe(false);

      const nanMuni = { name: "TestMuni", altitude: Number.NaN };
      expect(isMunicipalityCompatible(nanMuni, defaultFilter)).toBe(true); // fallbacks to 1000m
    });

    it("returns safe neutral style for unknown risk levels", () => {
      const style = getMunicipalityMapStyle({
        risk: "UnknownRisk" as unknown as "Bajo",
        compatible: true,
        hasActiveFilters: false,
        selected: false,
        hovered: false,
        focused: false,
      });

      expect(style.fillClass).toBe("fill-muted/70");
      expect(style.isCompatible).toBe(true);
    });
  });

  describe("2. Prediction Model Faults, Outliers & Zero Division Safeguards", () => {
    const baseFeatures = extractClimateFeatures("Bucaramanga", "bucaramanga", null);

    it("handles single-point historical data without division by zero in trend regression", () => {
      const singlePointHistory = [{ year: 2024, yield: 1.25 }];

      const preds = calculateAgroclimaticYieldPrediction({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: singlePointHistory,
        features: baseFeatures,
        futureYears: [2025, 2026],
      });

      expect(preds.length).toBe(2);
      expect(Number.isFinite(preds[0].predictedValue)).toBe(true);
      expect(preds[0].predictedValue).toBeGreaterThan(0);
      expect(preds[0].scores?.trendFactor).toBe(1.0);
    });

    it("discards corrupt, NaN or negative yields from historical series", () => {
      const corruptedHistory = [
        { year: 2020, yield: Number.NaN },
        { year: 2021, yield: -5.0 },
        { year: 2022, yield: 0 },
        { year: 2023, yield: 1.3 },
        { year: 2024, yield: 1.35 },
      ];

      const preds = calculateAgroclimaticYieldPrediction({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: corruptedHistory,
        features: baseFeatures,
        futureYears: [2025],
      });

      expect(preds.length).toBe(1);
      expect(preds[0].predictedValue).toBeGreaterThan(0.8);
      expect(preds[0].predictedValue).toBeLessThan(2.5);
    });

    it("handles extreme temperature and precipitation anomalies safely without crashing", () => {
      const extremeFeatures = {
        ...baseFeatures,
        temperatureMean: -15, // Severe freeze
        precipitationAnnual: 0, // Complete drought
        humidityMean: 10,
        et0Annual: 0,
      };

      const preds = calculateAgroclimaticYieldPrediction({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: [{ year: 2024, yield: 1.2 }],
        features: extremeFeatures,
        futureYears: [2025],
      });

      expect(preds.length).toBe(1);
      expect(Number.isFinite(preds[0].predictedValue)).toBe(true);
      expect(preds[0].predictedValue).toBeGreaterThanOrEqual(0);
      expect(preds[0].scores?.climateScore).toBeLessThan(0.1);
      expect(preds[0].lowerBound).toBeGreaterThanOrEqual(0);
    });

    it("normalizes and removes corrupted points with invalid year or missing values", () => {
      const malformedPoints: HistoricalPredictionPoint[] = [
        {
          date: "2024",
          year: Number.NaN,
          historicalValue: 1.2,
          predictedValue: null,
          lowerBound: null,
          upperBound: null,
          dataType: "historical",
          source: "EVA",
          confidence: 0.95,
          municipalityId: "bucaramanga",
          cropId: "cafe",
          variable: "yield",
          unit: "Ton/Ha",
        },
        {
          date: "2025",
          year: 2025,
          historicalValue: null,
          predictedValue: 1.3,
          lowerBound: 1.1,
          upperBound: 1.5,
          dataType: "prediction",
          source: "Model",
          confidence: 0.85,
          municipalityId: "bucaramanga",
          cropId: "cafe",
          variable: "yield",
          unit: "Ton/Ha",
        },
      ];

      const clean = normalizeHistoricalPredictionData(malformedPoints);
      expect(clean.length).toBe(1);
      expect(clean[0].year).toBe(2025);
    });
  });
});
