import { describe, it, expect, vi } from "vitest";
import { searchKnowledgeBase } from "../../supabase/functions/chat/rag";
import { evaluateViability } from "../../src/types/prediction-v2";
import {
  CommodityService,
  type CommodityPriceProvider,
  type RawCommodityForecast,
} from "../../src/services/commodity-service";

describe("Phase 7: Full System Validation Suite", () => {
  describe("1. Strict RAG Isolation & Context-Aware Scoring", () => {
    it("prioritizes cacao agronomic entries over coffee or market entries for cacao planting questions", () => {
      const results = searchKnowledgeBase("¿Cómo sembrar cacao y preparar el suelo?", 2, 3.0, {
        crop: "cacao",
        intent: "CROP_REQUIREMENTS",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entry.crop).toBe("cacao");
      expect(results[0].entry.category).not.toBe("mercado");
    });

    it("demotes market price entries when asking for agronomic requirements", () => {
      const results = searchKnowledgeBase("requisitos de siembra y clima", 3, 2.0, {
        crop: "cafe",
        intent: "CROP_REQUIREMENTS",
      });

      for (const res of results) {
        expect(res.entry.category).not.toBe("mercado");
      }
    });

    it("matches plaga entries when intent is CROP_RISK_ANALYSIS", () => {
      const results = searchKnowledgeBase("plagas y enfermedades monilia del cacao", 2, 3.0, {
        crop: "cacao",
        intent: "CROP_RISK_ANALYSIS",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entry.category).toBe("plaga");
    });
  });

  describe("2. Pure Deterministic Agroclimatic Recommendation Engine", () => {
    it("generates deterministic recommendations for cacao based purely on soil and climate", () => {
      const res = evaluateViability(
        "cacao",
        6.0, // pH
        3.2, // Organic matter
        "Franco", // Texture
        24.5, // Temperature
        5.0, // Precipitation
        78, // Humidity
        8, // Wind
        18, // Solar
        400, // Altitude
        5, // Month (May)
        true,
      );

      expect(res.viable).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(70);
      expect(res.recommendations.length).toBeGreaterThan(0);
      expect(res.alternatives.length).toBeGreaterThan(0);
      // No conversational or RAG hallucination
      expect(typeof res.recommendations[0]).toBe("string");
    });

    it("recalculates recommendations when crop or conditions change", () => {
      const cacaoRes = evaluateViability(
        "cacao",
        4.2, // Acid pH
        1.0, // Low OM
        "Arenoso",
        32,
        1,
        50,
        15,
        20,
        1800, // High altitude for cacao
        1,
        true,
      );

      const cafeRes = evaluateViability(
        "cafe",
        5.5,
        3.5,
        "Franco-arcilloso",
        20,
        5,
        75,
        8,
        18,
        1600, // Optimal altitude for coffee
        4,
        true,
      );

      expect(cacaoRes.viable).toBe(false);
      expect(cafeRes.viable).toBe(true);
      expect(cacaoRes.recommendations.some((r) => r.includes("pH"))).toBe(true);
    });
  });

  describe("3. Commodity Service Resilience & Granadilla National Reference", () => {
    it("returns explicit national reference for Granadilla without international futures", async () => {
      const dummyProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async () => {
          throw new Error("External API down");
        }),
      };

      const service = new CommodityService(dummyProvider);
      const res = await service.getCommodityPrice("granadilla");

      expect(res.referenceType).toBe("unavailable");
      expect(res.price).toBeNull();
      expect(res.disclaimer).toContain("SIPSA");
    });

    it("returns cached commodity status when provider is offline but cache exists", async () => {
      const mockForecast: RawCommodityForecast = {
        symbol: "COFFEE",
        signal: "BULLISH",
        recommendation: "BUY",
        climateScore: 78,
        confidence: 0.85,
        currentPrice: {
          value: 2.15,
          unit: "USD/lb",
          source: "ICE",
          date: new Date().toISOString().slice(0, 10),
        },
        reasoning: "Sequía en Brasil",
        stressors: [],
        regions: [],
        sources: [],
        forecastedAt: new Date().toISOString(),
      };

      const cachedProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async () => mockForecast),
      };

      const service = new CommodityService(cachedProvider);
      const res = await service.getCommodityPrice("cafe");

      expect(res.status).toBe("live");
      expect(res.price).toBe(2.15);
    });
  });
});
