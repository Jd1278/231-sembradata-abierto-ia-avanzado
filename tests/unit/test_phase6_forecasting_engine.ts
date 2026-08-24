import { describe, it, expect } from "vitest";
import {
  generateStatisticalForecast,
  extractClimateFeatures,
  calculateBioclimaticScore,
  buildUnifiedSeriesPoints,
} from "../../src/services/forecasting-engine";
import type { ValidatedHistoricalObservation } from "../../src/types/historical-prediction";

describe("Phase 6: Reproducible Statistical Forecasting Engine & Invariant Verification", () => {
  const bucaraFeatures = extractClimateFeatures("Bucaramanga", "bucaramanga", null);

  describe("1. Historical Integrity & Insufficient Data Handling", () => {
    it("never manufactures or extrapolates artificial historical observations", () => {
      const historical: ValidatedHistoricalObservation[] = [
        {
          id: "eva-1",
          year: 2021,
          date: "2021",
          yieldTonHa: 1.2,
          harvestedAreaHa: 150,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
        {
          id: "eva-2",
          year: 2023,
          date: "2023",
          yieldTonHa: 1.35,
          harvestedAreaHa: 160,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
      ];

      const unified = buildUnifiedSeriesPoints(historical, []);
      // Should NOT invent 2022
      expect(unified.map((p) => p.year)).toEqual([2021, 2023]);
      expect(unified.every((p) => p.dataType === "historical")).toBe(true);
    });

    it("returns strictly 'insufficient_data' and 0 prediction points when N < 3", () => {
      const fewRecords = [
        { year: 2023, yield: 1.25 },
        { year: 2024, yield: 1.3 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: fewRecords,
        features: bucaraFeatures,
        targetYears: [2025, 2026],
      });

      expect(result.status).toBe("insufficient_data");
      expect(result.predictions).toHaveLength(0);
      expect(result.insufficientReason).toContain("mínimo de 3 años");
    });
  });

  describe("2. Forecast Horizon & Temporal Separation Invariants", () => {
    it("starts prediction strictly in future years after the last observed historical record", () => {
      const records = [
        { year: 2020, yield: 1.15 },
        { year: 2021, yield: 1.2 },
        { year: 2022, yield: 1.22 },
        { year: 2023, yield: 1.28 },
      ]; // last observed is 2023

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: records,
        features: bucaraFeatures,
        targetYears: [2022, 2023, 2024, 2025], // 2022 & 2023 are in the past
      });

      expect(result.status).toBe("ready");
      expect(result.predictions).toHaveLength(2);
      expect(result.predictions.map((p) => p.year)).toEqual([2024, 2025]);
    });

    it("never shows statistical predictions for periods prior to or equal to last observed year", () => {
      const records = [
        { year: 2019, yield: 1.0 },
        { year: 2020, yield: 1.1 },
        { year: 2021, yield: 1.15 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: records,
        features: bucaraFeatures,
        targetYears: [2018, 2019, 2020, 2021], // all in the past
      });

      expect(result.predictions).toHaveLength(0);
    });
  });

  describe("3. Dual Prediction Interval Invariant (80% and 95%)", () => {
    it("satisfies 0 <= lower95 <= lower80 <= predictedYield <= upper80 <= upper95", () => {
      const records = [
        { year: 2018, yield: 1.1 },
        { year: 2019, yield: 1.18 },
        { year: 2020, yield: 1.2 },
        { year: 2021, yield: 1.25 },
        { year: 2022, yield: 1.28 },
        { year: 2023, yield: 1.32 },
        { year: 2024, yield: 1.35 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: records,
        features: bucaraFeatures,
        targetYears: [2025, 2026, 2027],
      });

      expect(result.status).toBe("ready");
      expect(result.predictions).toHaveLength(3);

      for (const p of result.predictions) {
        expect(p.lowerBound95).toBeGreaterThanOrEqual(0);
        expect(p.lowerBound95).toBeLessThanOrEqual(p.lowerBound80);
        expect(p.lowerBound80).toBeLessThanOrEqual(p.predictedYield);
        expect(p.predictedYield).toBeLessThanOrEqual(p.upperBound80);
        expect(p.upperBound80).toBeLessThanOrEqual(p.upperBound95);
      }
    });

    it("inflates prediction intervals as forecast horizon steps further into the future", () => {
      const records = [
        { year: 2019, yield: 1.1 },
        { year: 2020, yield: 1.15 },
        { year: 2021, yield: 1.2 },
        { year: 2022, yield: 1.22 },
        { year: 2023, yield: 1.28 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: records,
        features: bucaraFeatures,
        targetYears: [2024, 2026],
      });

      const p1 = result.predictions[0]; // year 2024
      const p2 = result.predictions[1]; // year 2026

      const width1 = p1.upperBound95 - p1.lowerBound95;
      const width2 = p2.upperBound95 - p2.lowerBound95;

      expect(width2).toBeGreaterThan(width1);
    });
  });

  describe("4. Model Selection & Cross Validation Metrics", () => {
    it("computes validation metrics (MAE, RMSE, sMAPE) and selects a valid statistical model", () => {
      const records = [
        { year: 2017, yield: 1.0 },
        { year: 2018, yield: 1.08 },
        { year: 2019, yield: 1.15 },
        { year: 2020, yield: 1.2 },
        { year: 2021, yield: 1.22 },
        { year: 2022, yield: 1.26 },
        { year: 2023, yield: 1.3 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: records,
        features: bucaraFeatures,
        targetYears: [2024],
      });

      expect(result.metrics).not.toBeNull();
      expect(result.metrics!.sampleSize).toBe(7);
      expect(result.metrics!.mae).toBeGreaterThanOrEqual(0);
      expect(result.metrics!.rmse).toBeGreaterThanOrEqual(0);
      expect(result.metrics!.smape).toBeGreaterThanOrEqual(0);
      expect(result.metrics!.smape).toBeLessThan(100);
      expect(result.predictions[0].modelName).toBeTruthy();
    });

    it("adjusts bioclimatic score when physiological temperature or precipitation anomalies occur", () => {
      const optimalFeatures = {
        ...bucaraFeatures,
        temperatureMean: 20, // Optimal for Coffee (18-22°C)
        precipitationAnnual: 1800, // Optimal for Coffee (1500-2000mm)
      };

      const stressedFeatures = {
        ...bucaraFeatures,
        temperatureMean: 35, // Extreme heat for Coffee
        precipitationAnnual: 300, // Extreme drought
      };

      const optScore = calculateBioclimaticScore("cafe", optimalFeatures);
      const strScore = calculateBioclimaticScore("cafe", stressedFeatures);

      expect(optScore.climateScore).toBeGreaterThan(strScore.climateScore);
      expect(optScore.climateFactor).toBeGreaterThan(strScore.climateFactor);
    });
  });
});
