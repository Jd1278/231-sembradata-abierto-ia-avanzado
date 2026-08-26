import { describe, it, expect } from "vitest";
import {
  recommendAlternativeCrops,
  type CropRecommendationContext,
} from "../../src/services/crop-recommendations";

describe("Phase 2: Crop Recommendations & Bioclimatic Compatibility Engine", () => {
  describe("1. Hot Lowland Zone (Zona Caliente: 28°C, 120 msnm — e.g. Barrancabermeja)", () => {
    const hotZoneContext: CropRecommendationContext = {
      temperature: 28,
      altitude: 120,
      precipitationDaily: 5.5, // ~2000 mm/year
      humidity: 80,
      precipitationAnnual: 2000,
    };

    it("excludes high-altitude/cold crops (Granadilla, Café, Tomate de árbol, Lulo) from hot zones", () => {
      const recommendations = recommendAlternativeCrops(hotZoneContext, "cacao");

      const names = recommendations.map((r) => r.name);
      expect(names).not.toContain("Granadilla");
      expect(names).not.toContain("Café");
      expect(names).not.toContain("Tomate de árbol");
      expect(names).not.toContain("Lulo");

      // Cacao is the selected crop, so it must not be recommended
      expect(names).not.toContain("Cacao");
    });

    it("favors hot-climate compatible crops (Plátano, Yuca, Cítricos) with high scores", () => {
      const recommendations = recommendAlternativeCrops(hotZoneContext, "cacao");

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      const names = recommendations.map((r) => r.name);
      expect(names.some((n) => n === "Plátano" || n === "Yuca" || n.includes("Cítricos"))).toBe(
        true,
      );

      // Verify all recommended crops have high compatibility scores
      for (const rec of recommendations) {
        expect(rec.score).toBeGreaterThanOrEqual(50);
        expect(rec.reason).toContain("Compatibilidad");
      }
    });
  });

  describe("2. Cold Highland Zone (Zona Fría: 17°C, 1900 msnm — e.g. California / Vetas)", () => {
    const coldHighlandContext: CropRecommendationContext = {
      temperature: 17,
      altitude: 1900,
      precipitationDaily: 4.5,
      humidity: 75,
      precipitationAnnual: 1650,
    };

    it("excludes lowland warm crops (Cacao, Yuca) from cold highland zones", () => {
      const recommendations = recommendAlternativeCrops(coldHighlandContext, "cafe");

      const names = recommendations.map((r) => r.name);
      expect(names).not.toContain("Cacao");
      expect(names).not.toContain("Yuca");

      // Café is the selected crop, so it must be excluded
      expect(names).not.toContain("Café");
    });

    it("favors highland compatible crops (Granadilla, Aguacate Hass, Lulo, Tomate de árbol)", () => {
      const recommendations = recommendAlternativeCrops(coldHighlandContext, "cafe");

      expect(recommendations.length).toBeGreaterThan(0);
      const names = recommendations.map((r) => r.name);

      expect(
        names.some(
          (n) =>
            n === "Granadilla" || n === "Aguacate Hass" || n === "Lulo" || n === "Tomate de árbol",
        ),
      ).toBe(true);
    });
  });

  describe("3. Temperate Sub-Andean Zone (Zona Templada: 21°C, 1250 msnm — e.g. Socorro / San Gil)", () => {
    const temperateContext: CropRecommendationContext = {
      temperature: 21,
      altitude: 1250,
      precipitationDaily: 4.8,
      humidity: 75,
      precipitationAnnual: 1750,
    };

    it("recommends optimum coffee-belt crops when analyzing Cacao in temperate elevation", () => {
      const recommendations = recommendAlternativeCrops(temperateContext, "cacao");

      const names = recommendations.map((r) => r.name);
      expect(names).toContain("Café");
      expect(names).not.toContain("Cacao");
    });
  });

  describe("4. Hard Constraints & Physiological Boundary Enforcement", () => {
    it("strictly excludes crops with out-of-range temperature", () => {
      // Temperature 35°C (too hot for Café max 26°C and Granadilla max 22°C)
      const extremeHeatContext: CropRecommendationContext = {
        temperature: 35,
        altitude: 200,
        precipitationDaily: 5,
        humidity: 65,
        precipitationAnnual: 1800,
      };

      const recommendations = recommendAlternativeCrops(extremeHeatContext, "yuca");
      const names = recommendations.map((r) => r.name);

      expect(names).not.toContain("Café");
      expect(names).not.toContain("Granadilla");
      expect(names).not.toContain("Aguacate Hass");
    });

    it("strictly excludes crops with out-of-range altitude", () => {
      // Altitude 2800 msnm (too high for Cacao max 1000m and Yuca max 1500m)
      const highAltContext: CropRecommendationContext = {
        temperature: 13,
        altitude: 2800,
        precipitationDaily: 4,
        humidity: 80,
        precipitationAnnual: 1500,
      };

      const recommendations = recommendAlternativeCrops(highAltContext, "granadilla");
      const names = recommendations.map((r) => r.name);

      expect(names).not.toContain("Cacao");
      expect(names).not.toContain("Yuca");
      expect(names).not.toContain("Cítricos (Naranja/Limón)");
    });

    it("strictly excludes crops with out-of-range annual precipitation", () => {
      // Arid condition (400 mm/year — too dry for Cacao min 1200mm and Café min 1200mm)
      const aridContext: CropRecommendationContext = {
        temperature: 24,
        altitude: 600,
        precipitationDaily: 1.1,
        humidity: 50,
        precipitationAnnual: 400,
      };

      const recommendations = recommendAlternativeCrops(aridContext, "yuca");
      const names = recommendations.map((r) => r.name);

      expect(names).not.toContain("Cacao");
      expect(names).not.toContain("Café");
      expect(names).not.toContain("Plátano");
    });
  });

  describe("5. Extreme Environments, Missing Data & Fallback Handling", () => {
    it("returns empty array (0 recommendations) when no crops meet physiological criteria (Páramo at 3800 msnm, 4°C)", () => {
      const paramoContext: CropRecommendationContext = {
        temperature: 4,
        altitude: 3800,
        precipitationDaily: 2,
        humidity: 85,
        precipitationAnnual: 800,
      };

      const recommendations = recommendAlternativeCrops(paramoContext, "cafe");
      expect(recommendations).toEqual([]);
    });

    it("returns empty array when climate context contains NaN or invalid data", () => {
      const invalidContext: CropRecommendationContext = {
        temperature: Number.NaN,
        altitude: 1000,
        precipitationDaily: 3,
        humidity: 70,
      };

      const recommendations = recommendAlternativeCrops(invalidContext, "cafe");
      expect(recommendations).toEqual([]);
    });
  });
});
