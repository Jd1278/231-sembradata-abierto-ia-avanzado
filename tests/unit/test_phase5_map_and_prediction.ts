import { describe, it, expect } from "vitest";
import {
  isMunicipalityCompatible,
  hasActiveAdvancedFilters,
  getMunicipalityMapStyle,
  DEFAULT_ADVANCED_FILTERS,
} from "../../src/services/map-compatibility";
import {
  extractClimateFeatures,
  calculateAgroclimaticYieldPrediction,
} from "../../src/services/historical-prediction-service";
import type { AdvancedFilterValues } from "../../src/components/sembradata/AdvancedFilters";

describe("Phase 5: Map Compatibility & Zonal Agroclimatic Yield Prediction Engine", () => {
  describe("1. Map Compatibility Logic & Filter Detection", () => {
    it("detects whether advanced filters are in their default state", () => {
      expect(hasActiveAdvancedFilters(DEFAULT_ADVANCED_FILTERS)).toBe(false);

      const modifiedFilters: AdvancedFilterValues = {
        ...DEFAULT_ADVANCED_FILTERS,
        altitudeRange: [1200, 2000],
      };
      expect(hasActiveAdvancedFilters(modifiedFilters)).toBe(true);
    });

    it("evaluates municipality compatibility strictly against altitude, temperature and precipitation", () => {
      const muniBucaramanga = { name: "Bucaramanga", altitude: 959 };
      const muniMalaga = { name: "Málaga", altitude: 2235 };

      const coffeeAltitudeFilter: AdvancedFilterValues = {
        altitudeRange: [1200, 1800],
        tempRange: [15, 25],
        precipRange: [1000, 3000],
        soilType: "all",
      };

      // Bucaramanga (959m) and Málaga (2235m) are both outside [1200, 1800]
      expect(isMunicipalityCompatible(muniBucaramanga, coffeeAltitudeFilter)).toBe(false);
      expect(isMunicipalityCompatible(muniMalaga, coffeeAltitudeFilter)).toBe(false);

      const muniSanGil = { name: "San Gil", altitude: 1114 };
      const broadFilter: AdvancedFilterValues = {
        altitudeRange: [800, 1500],
        tempRange: [15, 30],
        precipRange: [500, 3000],
        soilType: "all",
      };
      expect(isMunicipalityCompatible(muniSanGil, broadFilter)).toBe(true);
    });

    it("respects soil texture filter constraints based on altitude bands", () => {
      const muniLow = { name: "Puerto Wilches", altitude: 75 }; // arcilla (<800m)
      const muniHigh = { name: "Vetas", altitude: 3350 }; // arena (>2200m)

      const clayFilter: AdvancedFilterValues = {
        ...DEFAULT_ADVANCED_FILTERS,
        soilType: "arcilla",
      };

      expect(isMunicipalityCompatible(muniLow, clayFilter)).toBe(true);
      expect(isMunicipalityCompatible(muniHigh, clayFilter)).toBe(false);
    });
  });

  describe("2. Map Visual Hierarchy & Polygon Styling", () => {
    it("preserves true risk colors when NO filters are active", () => {
      const lowRiskStyle = getMunicipalityMapStyle({
        risk: "Bajo",
        compatible: true,
        hasActiveFilters: false,
        selected: false,
        hovered: false,
        focused: false,
      });
      expect(lowRiskStyle.fillClass).toBe("fill-risk-low");
      expect(lowRiskStyle.isCompatible).toBe(true);

      const highRiskStyle = getMunicipalityMapStyle({
        risk: "Alto",
        compatible: false,
        hasActiveFilters: false,
        selected: false,
        hovered: false,
        focused: false,
      });
      // When hasActiveFilters is false, risk color is preserved regardless
      expect(highRiskStyle.fillClass).toBe("fill-risk-high");
    });

    it("turns incompatible municipalities into neutral/muted gray without using low-risk green", () => {
      const incompatibleHighRisk = getMunicipalityMapStyle({
        risk: "Alto",
        compatible: false,
        hasActiveFilters: true,
        selected: false,
        hovered: false,
        focused: false,
      });

      // MUST NOT be red or green
      expect(incompatibleHighRisk.fillClass).not.toBe("fill-risk-high");
      expect(incompatibleHighRisk.fillClass).not.toBe("fill-risk-low");
      expect(incompatibleHighRisk.fillClass).toContain("fill-muted");
      expect(incompatibleHighRisk.isCompatible).toBe(false);
    });

    it("retains true risk color for compatible municipalities when filters ARE active", () => {
      const compatibleMedRisk = getMunicipalityMapStyle({
        risk: "Medio",
        compatible: true,
        hasActiveFilters: true,
        selected: false,
        hovered: false,
        focused: false,
      });

      expect(compatibleMedRisk.fillClass).toBe("fill-risk-med");
      expect(compatibleMedRisk.isCompatible).toBe(true);
    });

    it("maintains selection stroke priority for selected municipalities", () => {
      const selectedStyle = getMunicipalityMapStyle({
        risk: "Bajo",
        compatible: true,
        hasActiveFilters: true,
        selected: true,
        hovered: false,
        focused: false,
      });

      expect(selectedStyle.strokeWidth).toBeGreaterThan(1.2);
      expect(selectedStyle.strokeColor).toBe("currentColor");
    });
  });

  describe("3. Zonal Agroclimatic Yield Prediction Model (Sensitivity & Uniqueness)", () => {
    it("produces distinct yield predictions for different municipalities under the same crop", () => {
      // Bucaramanga (Warm/Subtropical, 959m)
      const bucaraFeatures = extractClimateFeatures("Bucaramanga", "bucaramanga", null);
      // Málaga (Cold Andean, 2235m)
      const malagaFeatures = extractClimateFeatures("Málaga", "malaga", null);

      const bucaraPreds = calculateAgroclimaticYieldPrediction({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: [
          { year: 2022, yield: 1.3 },
          { year: 2023, yield: 1.35 },
          { year: 2024, yield: 1.32 },
        ],
        features: bucaraFeatures,
        futureYears: [2025, 2026],
      });

      const malagaPreds = calculateAgroclimaticYieldPrediction({
        municipalityId: "malaga",
        municipalityName: "Málaga",
        crop: "cafe",
        historicalRecords: [
          { year: 2022, yield: 1.1 },
          { year: 2023, yield: 1.15 },
          { year: 2024, yield: 1.12 },
        ],
        features: malagaFeatures,
        futureYears: [2025, 2026],
      });

      expect(bucaraPreds[0].predictedValue).not.toBe(malagaPreds[0].predictedValue);
      expect(bucaraPreds[0].scores?.climateScore).not.toBe(malagaPreds[0].scores?.climateScore);
      expect(bucaraPreds[0].scores?.altitudeScore).not.toBe(malagaPreds[0].scores?.altitudeScore);
    });

    it("produces distinct bioclimatic responses when changing crops in the same municipality", () => {
      const features = extractClimateFeatures(
        "San Vicente de Chucurí",
        "san_vicente_de_chucuri",
        null,
      );

      const cocoaPreds = calculateAgroclimaticYieldPrediction({
        municipalityId: "san_vicente_de_chucuri",
        municipalityName: "San Vicente de Chucurí",
        crop: "cacao",
        historicalRecords: [
          { year: 2022, yield: 0.8 },
          { year: 2023, yield: 0.82 },
          { year: 2024, yield: 0.85 },
        ],
        features,
        futureYears: [2025],
      });

      const granadillaPreds = calculateAgroclimaticYieldPrediction({
        municipalityId: "san_vicente_de_chucuri",
        municipalityName: "San Vicente de Chucurí",
        crop: "granadilla",
        historicalRecords: [],
        features,
        futureYears: [2025],
      });

      expect(cocoaPreds[0].predictedValue).toBeLessThan(2.0); // Cacao ~0.8-1.0 t/ha
      expect(granadillaPreds[0].predictedValue).toBeGreaterThan(4.0); // Granadilla ~9.0 t/ha
      expect(cocoaPreds[0].scores?.temperatureScore).not.toBe(
        granadillaPreds[0].scores?.temperatureScore,
      );
    });

    it("adjusts predicted yield and climate score proportionally when input climate variables change", () => {
      const baseFeatures = extractClimateFeatures("San Gil", "san_gil", null);

      const optimalClimateFeatures = {
        ...baseFeatures,
        temperatureMean: 20.0, // Optimal for Coffee (18-22°C)
        precipitationAnnual: 1750, // Optimal for Coffee (1500-2000 mm)
        humidityMean: 75,
      };

      const stressedClimateFeatures = {
        ...baseFeatures,
        temperatureMean: 34.0, // Severe heat stress for Coffee (>30°C)
        precipitationAnnual: 400, // Severe drought (<600 mm)
        humidityMean: 40,
      };

      const optimalPred = calculateAgroclimaticYieldPrediction({
        municipalityId: "san_gil",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: [{ year: 2024, yield: 1.25 }],
        features: optimalClimateFeatures,
        futureYears: [2025],
      });

      const stressedPred = calculateAgroclimaticYieldPrediction({
        municipalityId: "san_gil",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: [{ year: 2024, yield: 1.25 }],
        features: stressedClimateFeatures,
        futureYears: [2025],
      });

      expect(optimalPred[0].scores!.climateScore).toBeGreaterThan(
        stressedPred[0].scores!.climateScore,
      );
      expect(optimalPred[0].predictedValue!).toBeGreaterThan(stressedPred[0].predictedValue!);
    });

    it("computes dynamic confidence and valid residual-based uncertainty intervals", () => {
      const features = extractClimateFeatures("Bucaramanga", "bucaramanga", null);

      const preds = calculateAgroclimaticYieldPrediction({
        municipalityId: "bucaramanga",
        municipalityName: "Bucaramanga",
        crop: "cafe",
        historicalRecords: [
          { year: 2020, yield: 1.2 },
          { year: 2021, yield: 1.25 },
          { year: 2022, yield: 1.28 },
          { year: 2023, yield: 1.3 },
          { year: 2024, yield: 1.35 },
        ],
        features,
        futureYears: [2025, 2026],
      });

      const p2025 = preds[0];
      expect(p2025.confidence).toBeGreaterThan(0.5);
      expect(p2025.confidence).toBeLessThanOrEqual(0.96);
      expect(p2025.lowerBound).toBeLessThan(p2025.predictedValue!);
      expect(p2025.upperBound).toBeGreaterThan(p2025.predictedValue!);
      expect(p2025.lowerBound).toBeGreaterThanOrEqual(0);
    });
  });
});
