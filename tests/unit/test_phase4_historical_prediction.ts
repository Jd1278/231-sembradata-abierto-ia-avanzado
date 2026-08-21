import { describe, it, expect } from "vitest";
import {
  normalizeMunicipalitySlug,
  normalizeHistoricalPredictionData,
  fetchHistoricalAndPredictionSeries,
  type HistoricalPredictionPoint,
  type ChartFilters,
} from "../../src/services/historical-prediction-service";

describe("Phase 4: Historical vs. Prediction Series & Advanced Filters Engine", () => {
  describe("1. Municipality Slug Normalization & Resolution", () => {
    it("normalizes various name casings and accents into standard slugs", () => {
      expect(normalizeMunicipalitySlug("Bucaramanga")).toBe("bucaramanga");
      expect(normalizeMunicipalitySlug("BUCARAMANGA")).toBe("bucaramanga");
      expect(normalizeMunicipalitySlug("San Vicente de Chucurí")).toBe("san_vicente_de_chucuri");
      expect(normalizeMunicipalitySlug("SAN GIL")).toBe("san_gil");
      expect(normalizeMunicipalitySlug("Puerto Wilches")).toBe("puerto_wilches");
    });
  });

  describe("2. Chronological Normalization & Null Handling", () => {
    it("sorts points strictly in chronological order (date ASC)", () => {
      const unsortedPoints: HistoricalPredictionPoint[] = [
        {
          date: "2024",
          year: 2024,
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
          date: "2020",
          year: 2020,
          historicalValue: 1.1,
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
          date: "2026",
          year: 2026,
          historicalValue: null,
          predictedValue: 1.35,
          lowerBound: 1.2,
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

      const normalized = normalizeHistoricalPredictionData(unsortedPoints);
      expect(normalized.map((p) => p.year)).toEqual([2020, 2024, 2026]);
    });

    it("filters out corrupted points without finite values", () => {
      const corruptPoints: HistoricalPredictionPoint[] = [
        {
          date: "2022",
          year: 2022,
          historicalValue: null,
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
      ];

      const normalized = normalizeHistoricalPredictionData(corruptPoints);
      expect(normalized).toEqual([]);
    });

    it("preserves nulls and never substitutes 0 for missing historical or prediction values", () => {
      const point: HistoricalPredictionPoint = {
        date: "2025",
        year: 2025,
        historicalValue: null,
        predictedValue: 1.28,
        lowerBound: 1.15,
        upperBound: 1.4,
        dataType: "prediction",
        source: "SembraData Model",
        confidence: 0.85,
        municipalityId: "bucaramanga",
        cropId: "cafe",
        variable: "yield",
        unit: "Ton/Ha",
      };

      const normalized = normalizeHistoricalPredictionData([point]);
      expect(normalized[0].historicalValue).toBeNull();
      expect(normalized[0].historicalValue).not.toBe(0);
      expect(normalized[0].predictedValue).toBe(1.28);
    });
  });

  describe("3. Data Contract & Transition Separation", () => {
    it("strictly differentiates historical observations from prediction forecasts", () => {
      const series: HistoricalPredictionPoint[] = [
        {
          date: "2023",
          year: 2023,
          historicalValue: 0.92,
          predictedValue: null,
          lowerBound: null,
          upperBound: null,
          dataType: "historical",
          source: "EVA",
          confidence: 0.95,
          municipalityId: "bucaramanga",
          cropId: "cacao",
          variable: "yield",
          unit: "Ton/Ha",
        },
        {
          date: "2025",
          year: 2025,
          historicalValue: null,
          predictedValue: 0.95,
          lowerBound: 0.85,
          upperBound: 1.05,
          dataType: "prediction",
          source: "SembraData Model",
          confidence: 0.85,
          municipalityId: "bucaramanga",
          cropId: "cacao",
          variable: "yield",
          unit: "Ton/Ha",
        },
      ];

      const histOnly = series.filter((p) => p.dataType === "historical");
      const predOnly = series.filter((p) => p.dataType === "prediction");

      expect(histOnly.length).toBe(1);
      expect(histOnly[0].historicalValue).toBe(0.92);
      expect(histOnly[0].predictedValue).toBeNull();

      expect(predOnly.length).toBe(1);
      expect(predOnly[0].predictedValue).toBe(0.95);
      expect(predOnly[0].historicalValue).toBeNull();
      expect(predOnly[0].lowerBound).toBe(0.85);
      expect(predOnly[0].upperBound).toBe(1.05);
    });
  });

  describe("4. Filter Query Processing & Fallback", () => {
    it("returns empty array safely when municipality name is empty", async () => {
      const filters: ChartFilters = {
        municipality: "",
        crop: "cafe",
      };

      const result = await fetchHistoricalAndPredictionSeries(filters);
      expect(result).toEqual([]);
    });
  });
});
