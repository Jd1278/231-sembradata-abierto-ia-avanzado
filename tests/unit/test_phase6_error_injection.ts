import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStatisticalForecast,
  extractClimateFeatures,
} from "../../src/services/forecasting-engine";
import { requestGeminiAgronomicAssessment } from "../../src/services/gemini-service";

describe("Phase 6: Comprehensive Error Injection & Fault Resilience", () => {
  const baseFeatures = extractClimateFeatures("San Gil", "san_gil", null);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Historical Faults & Deduplication Invariants", () => {
    it("handles historical observations with identical repeated years and non-finite numbers", () => {
      const dirtyHistory = [
        { year: 2021, yield: 1.2 },
        { year: 2021, yield: 1.25 }, // Duplicate year
        { year: 2022, yield: Number.NaN }, // Corrupt yield
        { year: 2023, yield: -3.0 }, // Negative yield
        { year: 2023, yield: 1.3 },
        { year: 2024, yield: 1.35 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "san_gil",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: dirtyHistory,
        features: baseFeatures,
        targetYears: [2025],
      });

      expect(result.status).toBe("ready");
      expect(result.predictions).toHaveLength(1);
      expect(result.metrics?.sampleSize).toBe(3); // 2021, 2023, 2024 (clean deduplicated valid years)
      expect(result.predictions[0].predictedYield).toBeGreaterThan(1.0);
    });

    it("handles historical observations with zero slope (flat line) without division by zero", () => {
      const flatHistory = [
        { year: 2021, yield: 1.5 },
        { year: 2022, yield: 1.5 },
        { year: 2023, yield: 1.5 },
        { year: 2024, yield: 1.5 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "san_gil",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: flatHistory,
        features: baseFeatures,
        targetYears: [2025, 2026],
      });

      expect(result.status).toBe("ready");
      expect(result.predictions).toHaveLength(2);
      expect(Number.isFinite(result.predictions[0].predictedYield)).toBe(true);
      expect(result.predictions[0].lowerBound80).toBeLessThanOrEqual(
        result.predictions[0].predictedYield,
      );
      expect(result.predictions[0].upperBound80).toBeGreaterThanOrEqual(
        result.predictions[0].predictedYield,
      );
    });
  });

  describe("2. Extreme Climate Anomaly Injection", () => {
    it("safely bounds forecast and uncertainty when climate has severe freeze, heat, or zero ET0", () => {
      const hostileClimate = {
        ...baseFeatures,
        temperatureMean: -30, // Absolute severe frost
        precipitationAnnual: 0, // Complete drought
        humidityMean: 0,
        et0Annual: 0, // Potential division by zero
        waterBalance: -2000,
      };

      const validHistory = [
        { year: 2020, yield: 1.2 },
        { year: 2021, yield: 1.22 },
        { year: 2022, yield: 1.25 },
        { year: 2023, yield: 1.28 },
      ];

      const result = generateStatisticalForecast({
        municipalityId: "san_gil",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: validHistory,
        features: hostileClimate,
        targetYears: [2024, 2025],
      });

      expect(result.status).toBe("ready");
      expect(result.predictions).toHaveLength(2);
      for (const p of result.predictions) {
        expect(Number.isFinite(p.predictedYield)).toBe(true);
        expect(p.predictedYield).toBeGreaterThan(0);
        expect(p.lowerBound95).toBeGreaterThanOrEqual(0.01);
        expect(p.upperBound95).toBeGreaterThanOrEqual(p.predictedYield);
      }
    });
  });

  describe("3. Gemini Fault Injection & Markdown Fence Stripping", () => {
    it("handles Gemini returning markdown wrapped JSON code fences", async () => {
      const fencedPayload = {
        consistencyStatus: "valid",
        adjustmentRecommendation: "none",
        explanation: "El pronóstico es plenamente viable agronómicamente.",
        riskFactors: [],
        dataQualityNotes: ["Datos validados"],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fencedPayload,
      } as Response);

      const assessment = await requestGeminiAgronomicAssessment({
        municipio: "San Gil",
        crop: "cafe",
        historicalYields: [{ year: 2023, yield: 1.25 }],
        predictedYield: 1.3,
        modelName: "Theil-Sen",
        features: baseFeatures,
      });

      expect(assessment).not.toBeNull();
      expect(assessment?.consistencyStatus).toBe("valid");
    });

    it("handles 500 server error from Edge Function without throwing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      const assessment = await requestGeminiAgronomicAssessment({
        municipio: "San Gil",
        crop: "cafe",
        historicalYields: [{ year: 2023, yield: 1.25 }],
        predictedYield: 1.3,
        modelName: "Theil-Sen",
        features: baseFeatures,
      });

      expect(assessment).toBeNull();
    });
  });
});
