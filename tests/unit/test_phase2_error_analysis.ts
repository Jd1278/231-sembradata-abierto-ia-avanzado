import { describe, it, expect } from "vitest";
import {
  recommendAlternativeCrops,
  CANDIDATE_CROPS,
  type CropRecommendationContext,
} from "../../src/services/crop-recommendations";

describe("Phase 2: Comprehensive Error Analysis & Boundary Stress Testing", () => {
  describe("1. Corrupted, Missing and Extreme Numerical Inputs", () => {
    it("handles null, undefined, NaN, and Infinite temperatures without throwing", () => {
      const contexts: CropRecommendationContext[] = [
        { temperature: Number.NaN, altitude: 1000, precipitationDaily: 4, humidity: 70 },
        { temperature: Infinity, altitude: 1000, precipitationDaily: 4, humidity: 70 },
        { temperature: -Infinity, altitude: 1000, precipitationDaily: 4, humidity: 70 },
        { temperature: 20, altitude: Number.NaN, precipitationDaily: 4, humidity: 70 },
        { temperature: 20, altitude: 1000, precipitationDaily: Number.NaN, humidity: 70 },
        { temperature: 20, altitude: 1000, precipitationDaily: 4, humidity: Number.NaN },
      ];

      for (const ctx of contexts) {
        const result = recommendAlternativeCrops(ctx, "cacao");
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      }
    });

    it("handles extreme negative temperatures and extreme altitudes safely", () => {
      // Sub-zero temperature (Antarctica condition in Santander)
      const subZeroContext: CropRecommendationContext = {
        temperature: -15,
        altitude: 4200,
        precipitationDaily: 1,
        humidity: 80,
      };
      expect(recommendAlternativeCrops(subZeroContext)).toEqual([]);

      // Negative elevation (below sea level)
      const belowSeaLevelContext: CropRecommendationContext = {
        temperature: 30,
        altitude: -200,
        precipitationDaily: 5,
        humidity: 80,
      };
      // Crops requiring altMin >= 0 with altitude < 0 must be rejected
      const res = recommendAlternativeCrops(belowSeaLevelContext);
      expect(res).toEqual([]);
    });

    it("handles zero precipitation and zero humidity without producing NaN scores", () => {
      const zeroCtx: CropRecommendationContext = {
        temperature: 24,
        altitude: 500,
        precipitationDaily: 0,
        humidity: 0,
        precipitationAnnual: 0,
      };
      // All crops require precipAnnual >= 600mm and humidity >= 45% -> all must be excluded
      const res = recommendAlternativeCrops(zeroCtx);
      expect(res).toEqual([]);
    });
  });

  describe("2. Exhaustive Boundary Rejection for Every Candidate Crop", () => {
    it("tests hard boundary rejection across all 9 catalog crops", () => {
      for (const crop of CANDIDATE_CROPS) {
        const [tMin, , , tMax] = crop.temp;
        const [altMin, , , altMax] = crop.altitude;
        const [pMin, , , pMax] = crop.precipAnnual;

        // Context 1: Temperature slightly below minimum
        const ctxTempLow: CropRecommendationContext = {
          temperature: tMin - 0.1,
          altitude: altMin + 50,
          precipitationDaily: 4,
          humidity: 75,
          precipitationAnnual: pMin + 200,
        };
        const recsTempLow = recommendAlternativeCrops(ctxTempLow);
        expect(recsTempLow.map((r) => r.name)).not.toContain(crop.name);

        // Context 2: Temperature slightly above maximum
        const ctxTempHigh: CropRecommendationContext = {
          temperature: tMax + 0.1,
          altitude: altMin + 50,
          precipitationDaily: 4,
          humidity: 75,
          precipitationAnnual: pMin + 200,
        };
        const recsTempHigh = recommendAlternativeCrops(ctxTempHigh);
        expect(recsTempHigh.map((r) => r.name)).not.toContain(crop.name);

        // Context 3: Altitude slightly below minimum (if altMin > 0)
        if (altMin > 0) {
          const ctxAltLow: CropRecommendationContext = {
            temperature: (tMin + tMax) / 2,
            altitude: altMin - 1,
            precipitationDaily: 4,
            humidity: 75,
            precipitationAnnual: pMin + 200,
          };
          const recsAltLow = recommendAlternativeCrops(ctxAltLow);
          expect(recsAltLow.map((r) => r.name)).not.toContain(crop.name);
        }

        // Context 4: Altitude slightly above maximum
        const ctxAltHigh: CropRecommendationContext = {
          temperature: (tMin + tMax) / 2,
          altitude: altMax + 1,
          precipitationDaily: 4,
          humidity: 75,
          precipitationAnnual: pMin + 200,
        };
        const recsAltHigh = recommendAlternativeCrops(ctxAltHigh);
        expect(recsAltHigh.map((r) => r.name)).not.toContain(crop.name);

        // Context 5: Precipitation slightly below minimum
        const ctxPrecipLow: CropRecommendationContext = {
          temperature: (tMin + tMax) / 2,
          altitude: altMin + 50,
          precipitationDaily: 1,
          humidity: 75,
          precipitationAnnual: pMin - 1,
        };
        const recsPrecipLow = recommendAlternativeCrops(ctxPrecipLow);
        expect(recsPrecipLow.map((r) => r.name)).not.toContain(crop.name);

        // Context 6: Precipitation slightly above maximum
        const ctxPrecipHigh: CropRecommendationContext = {
          temperature: (tMin + tMax) / 2,
          altitude: altMin + 50,
          precipitationDaily: 12,
          humidity: 75,
          precipitationAnnual: pMax + 1,
        };
        const recsPrecipHigh = recommendAlternativeCrops(ctxPrecipHigh);
        expect(recsPrecipHigh.map((r) => r.name)).not.toContain(crop.name);
      }
    });
  });

  describe("3. Crop Exclusion String & Accents Normalization Permutations", () => {
    const favorableContext: CropRecommendationContext = {
      temperature: 20,
      altitude: 1400,
      precipitationDaily: 4.8,
      humidity: 75,
      precipitationAnnual: 1750,
    };

    it("excludes selected crops irrespective of casing, accents, or extra whitespace", () => {
      const exclusionCases = [
        { input: "cafe", expectedExcluded: "Café" },
        { input: "Café", expectedExcluded: "Café" },
        { input: "CAFÉ", expectedExcluded: "Café" },
        { input: "  cafe  ", expectedExcluded: "Café" },
        { input: "cacao", expectedExcluded: "Cacao" },
        { input: "CACAO", expectedExcluded: "Cacao" },
        { input: "granadilla", expectedExcluded: "Granadilla" },
        { input: "Granadilla", expectedExcluded: "Granadilla" },
        { input: "aguacate", expectedExcluded: "Aguacate Hass" },
        { input: "Aguacate Hass", expectedExcluded: "Aguacate Hass" },
        { input: "tomate_arbol", expectedExcluded: "Tomate de árbol" },
        { input: "Tomate de Árbol", expectedExcluded: "Tomate de árbol" },
      ];

      for (const testCase of exclusionCases) {
        const results = recommendAlternativeCrops(favorableContext, testCase.input);
        const names = results.map((r) => r.name);
        expect(names).not.toContain(testCase.expectedExcluded);
      }
    });
  });

  describe("4. Structural & Data Invariant Guarantees", () => {
    it("guarantees that return length is always between 0 and 3, sorted descending by score", () => {
      const ctx: CropRecommendationContext = {
        temperature: 22,
        altitude: 1100,
        precipitationDaily: 4.5,
        humidity: 75,
        precipitationAnnual: 1650,
      };

      const results = recommendAlternativeCrops(ctx);
      expect(results.length).toBeGreaterThanOrEqual(0);
      expect(results.length).toBeLessThanOrEqual(3);

      if (results.length >= 2) {
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score ?? 0);
      }
      if (results.length === 3) {
        expect(results[1].score).toBeGreaterThanOrEqual(results[2].score ?? 0);
      }

      for (const r of results) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
        expect(Number.isInteger(r.score)).toBe(true);
        expect(r.name).toBeDefined();
        expect(r.estimatedYield).toBeDefined();
        expect(r.bestSeason).toBeDefined();
        expect(r.reason).toContain("Compatibilidad");
      }
    });
  });
});
