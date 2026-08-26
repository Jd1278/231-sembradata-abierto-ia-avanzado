import { describe, it, expect, vi } from "vitest";
import { classifyIntent } from "../../supabase/functions/chat/shared";
import { extractEntities } from "../../supabase/functions/chat/entities";
import {
  CommodityService,
  type CommodityPriceProvider,
} from "../../src/services/commodity-service";
import { fetchSoilData } from "../../src/services/soil-service";
import { calculateAgroclimaticYieldPrediction } from "../../src/services/historical-prediction-service";

describe("Phase 6 Fixes Validation Suite", () => {
  describe("1. Groq Chatbot 12-Intent Taxonomy", () => {
    it("classifies all 12 distinct intents with high accuracy", () => {
      expect(classifyIntent("hola buenas tardes")).toBe("GREETING");
      expect(classifyIntent("¿cuáles son los 87 municipios de Santander?")).toBe(
        "MUNICIPALITY_LIST",
      );
      expect(classifyIntent("comparar café y cacao en rendimiento")).toBe("COMPARE_CROPS");
      expect(classifyIntent("¿cuál es el precio de mercado en bolsa ICE?")).toBe("MARKET_PRICE");
      expect(classifyIntent("¿qué significa el índice de aridez y GDD?")).toBe(
        "INDICATOR_EXPLANATION",
      );
      expect(classifyIntent("¿qué rendimiento histórico se ha obtenido en EVA?")).toBe(
        "HISTORICAL_YIELD",
      );
      expect(
        classifyIntent("¿cuál es la predicción estadística Theil-Sen para los próximos años?"),
      ).toBe("STATISTICAL_PREDICTION");
      expect(classifyIntent("¿cómo está el clima actual y la lluvia hoy?")).toBe("CURRENT_CLIMATE");
      expect(classifyIntent("¿cuál es el riesgo de helada y sequía?")).toBe("CROP_RISK_ANALYSIS");
      expect(classifyIntent("¿cuáles son los requisitos de altitud y pH para sembrar café?")).toBe(
        "CROP_REQUIREMENTS",
      );
      expect(classifyIntent("¿qué?")).toBe("CLARIFICATION_REQUIRED");
      expect(classifyIntent("buenas prácticas de conservación de suelos")).toBe("GENERAL");
    });
  });

  describe("2. Entity Resolution & selectedContext Priority", () => {
    it("prioritizes explicit municipality in user message over selectedContext", () => {
      const entities = extractEntities("¿Cómo está el clima en Socorro?", {
        municipio: "San Gil",
        cultivo: "cafe",
      });

      expect(entities.municipio).toBe("socorro");
      expect(entities.sourceOfMunicipality).toBe("message");
      expect(entities.conflictDetected).toBe(true);
      expect(entities.cultivo).toBe("cafe");
      expect(entities.sourceOfCrop).toBe("selected_context");
    });

    it("falls back to selectedContext when message has no explicit location", () => {
      const entities = extractEntities("¿Es viable sembrar aquí?", {
        municipio: "Rionegro",
        cultivo: "cacao",
      });

      expect(entities.municipio).toBe("rionegro");
      expect(entities.sourceOfMunicipality).toBe("selected_context");
      expect(entities.cultivo).toBe("cacao");
      expect(entities.sourceOfCrop).toBe("selected_context");
    });

    it("detects out of scope Colombian cities", () => {
      const entities = extractEntities("¿Cómo cultivar café en Medellín?", {
        municipio: "San Gil",
        cultivo: "cafe",
      });

      expect(entities.outOfScopeLocation).toBe("medellin");
    });

    it("correctly handles Santander municipality aliases", () => {
      const entities1 = extractEntities("Rendimiento en Río Negro", null);
      expect(entities1.municipio).toBe("rionegro");

      const entities2 = extractEntities("Producción en San Vicente", null);
      expect(entities2.municipio).toBe("san vicente de chucuri");

      const entities3 = extractEntities("Clima en Pto Nacional", null);
      expect(entities3.municipio).toBe("puente nacional");
    });
  });

  describe("3. Commodity Service Robust States & Granadilla Handling", () => {
    it("returns permanent unavailable state for Granadilla with SIPSA reference", async () => {
      const service = new CommodityService();
      const price = await service.getCommodityPrice("granadilla");

      expect(price.crop).toBe("granadilla");
      expect(price.referenceType).toBe("unavailable");
      expect(price.status).toBe("unavailable");
      expect(price.price).toBeNull();
      expect(price.sources).toContain("DANE SIPSA (referencia nacional)");
    });

    it("returns structured unavailable state when external market API fails without crashing", async () => {
      const mockProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn().mockRejectedValue(new Error("API 503 Service Unavailable")),
      };

      const service = new CommodityService(mockProvider);
      const price = await service.getCommodityPrice("cafe");

      expect(price.crop).toBe("cafe");
      expect(price.status).toBe("unavailable");
      expect(price.errorCode).toBe("PROVIDER_UNAVAILABLE");
      expect(price.price).toBeNull();
    });

    it("returns all 3 crops from getAllCommodityPrices even when API fails", async () => {
      const mockProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn().mockRejectedValue(new Error("API timeout")),
      };

      const service = new CommodityService(mockProvider);
      const prices = await service.getAllCommodityPrices();

      expect(prices.length).toBe(3);
      expect(prices.map((p) => p.crop)).toEqual(["cafe", "cacao", "granadilla"]);
      expect(prices[0].status).toBe("unavailable");
      expect(prices[1].status).toBe("unavailable");
      expect(prices[2].status).toBe("unavailable");
    });
  });

  describe("4. Soil Transparency (measured vs estimated)", () => {
    it("returns estimated soil with explicit description when SoilGrids is unreachable", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("SoilGrids timeout"));

      try {
        const soil = await fetchSoilData(6.5, -73.2); // Santander coordinates

        expect(soil.sourceType).toBe("estimated");
        expect(soil.sourceDescription).toContain("OAT");
        expect(soil.ph).toBeGreaterThan(0);
        expect(soil.organicMatter).toBeGreaterThan(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("5. Historical vs Prediction Decoupled Engine", () => {
    it("strictly returns empty predictions when N < 3 historical observations without synthetic data", () => {
      const points = calculateAgroclimaticYieldPrediction({
        municipalityId: "muni-test",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: [
          { year: 2021, yield: 1.4 },
          { year: 2022, yield: 1.5 },
        ],
        features: {
          municipalityId: "muni-test",
          municipalityName: "San Gil",
          altitude: 1200,
          temperatureMean: 21,
          temperatureMin: 16,
          temperatureMax: 26,
          precipitationAnnual: 1400,
          humidityMean: 78,
          et0Annual: 1100,
          waterBalance: 300,
          dataQuality: 0.95,
        },
        futureYears: [2024, 2025, 2026],
      });

      expect(points).toEqual([]);
    });

    it("computes valid Theil-Sen forecast strictly for future years when N >= 3", () => {
      const points = calculateAgroclimaticYieldPrediction({
        municipalityId: "muni-test",
        municipalityName: "San Gil",
        crop: "cafe",
        historicalRecords: [
          { year: 2019, yield: 1.3 },
          { year: 2020, yield: 1.4 },
          { year: 2021, yield: 1.45 },
          { year: 2022, yield: 1.5 },
        ],
        features: {
          municipalityId: "muni-test",
          municipalityName: "San Gil",
          altitude: 1200,
          temperatureMean: 21,
          temperatureMin: 16,
          temperatureMax: 26,
          precipitationAnnual: 1400,
          humidityMean: 78,
          et0Annual: 1100,
          waterBalance: 300,
          dataQuality: 0.95,
        },
        futureYears: [2023, 2024, 2025],
      });

      expect(points.length).toBe(3);
      expect(points.every((p) => p.dataType === "prediction")).toBe(true);
      expect(points.every((p) => p.predictedValue !== null && p.predictedValue > 0)).toBe(true);
      expect(
        points.every(
          (p) =>
            p.lowerBound80 !== null &&
            p.upperBound80 !== null &&
            p.lowerBound80! <= p.upperBound80!,
        ),
      ).toBe(true);
      expect(
        points.every(
          (p) =>
            p.lowerBound95 !== null &&
            p.upperBound95 !== null &&
            p.lowerBound95! <= p.upperBound95!,
        ),
      ).toBe(true);
    });
  });
});
