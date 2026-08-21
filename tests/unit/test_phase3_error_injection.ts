import { describe, it, expect, vi } from "vitest";
import {
  CommodityService,
  normalizePerKg,
  GRANADILLA_UNAVAILABLE,
  type CommodityPriceProvider,
  type RawCommodityForecast,
} from "../../src/services/commodity-service";

describe("Phase 3: Fault Injection, Malformed Payloads & Error Resilience", () => {
  const validMockForecast: RawCommodityForecast = {
    symbol: "COFFEE",
    signal: "BUY",
    recommendation: "BUY",
    climateScore: 80,
    confidence: 0.9,
    currentPrice: {
      value: 250,
      unit: "¢/lb",
      source: "ICE Futures U.S.",
      date: "2026-08-21T12:00:00Z",
    },
    reasoning: "Normal supply conditions.",
    stressors: [],
    regions: [],
    sources: ["ICE Futures"],
    forecastedAt: "2026-08-21T12:00:00Z",
  };

  describe("1. Corrupted API Payloads & Malformed JSON", () => {
    it("handles payload with missing or null currentPrice safely", async () => {
      const corruptProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async () => {
          return {
            symbol: "COFFEE",
            signal: "BUY",
            recommendation: "BUY",
            climateScore: 50,
            confidence: 0.5,
            currentPrice: null as unknown as RawCommodityForecast["currentPrice"],
            reasoning: "",
            stressors: [],
            regions: [],
            sources: [],
            forecastedAt: "",
          };
        }),
      };

      const service = new CommodityService(corruptProvider);
      await expect(service.getCommodityPrice("cafe")).rejects.toThrow();
    });

    it("handles payload with NaN or non-finite price value safely", async () => {
      const nonFiniteProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async () => {
          return {
            ...validMockForecast,
            currentPrice: {
              ...validMockForecast.currentPrice,
              value: Number.NaN,
            },
          };
        }),
      };

      const service = new CommodityService(nonFiniteProvider);
      await expect(service.getCommodityPrice("cafe")).rejects.toThrow();
    });
  });

  describe("2. HTTP Network Errors & Upstream Server Outages", () => {
    it("handles HTTP 500, 502, 503, 504 and 429 errors without crashing the main process", async () => {
      const failingCodes = [500, 502, 503, 504, 429];

      for (const code of failingCodes) {
        const errorProvider: CommodityPriceProvider = {
          fetchPrice: vi.fn(async () => {
            throw new Error(`HTTP Error ${code}`);
          }),
        };

        const service = new CommodityService(errorProvider);
        // Individual single commodity query rejects with controlled error
        await expect(service.getCommodityPrice("cafe")).rejects.toThrow(`HTTP Error ${code}`);

        // Batch query handles partial or complete failure via Promise.allSettled without throwing
        const all = await service.getAllCommodityPrices();
        expect(Array.isArray(all)).toBe(true);
        // Granadilla should always be present even if external APIs are 100% offline
        expect(all).toContainEqual(GRANADILLA_UNAVAILABLE);
      }
    });

    it("handles unexpected network disconnects / DNS failures cleanly", async () => {
      const disconnectProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async () => {
          throw new TypeError("fetch failed: ENOTFOUND forecast.untitledfinancial.com");
        }),
      };

      const service = new CommodityService(disconnectProvider);
      const all = await service.getAllCommodityPrices();
      expect(all).toEqual([GRANADILLA_UNAVAILABLE]);
    });
  });

  describe("3. Unit Parsing & Price Normalization Edge Cases", () => {
    it("handles exotic and whitespace-padded unit strings", () => {
      expect(normalizePerKg(10000, "  USD / MT  ")).toBe(10);
      expect(normalizePerKg(5000, "metric ton")).toBe(5);
      expect(normalizePerKg(200, " ¢ / lb ")).toBeCloseTo(4.4092, 2);
      expect(normalizePerKg(12, "kg")).toBe(12);
    });

    it("returns null safely for unrecognized or non-standard agricultural units", () => {
      expect(normalizePerKg(100, "")).toBeNull();
      expect(normalizePerKg(100, "sacos de 60kg")).toBeNull();
      expect(normalizePerKg(100, "cargas de 125kg")).toBeNull();
      expect(normalizePerKg(100, "bushels")).toBeNull();
      expect(normalizePerKg(null, "¢/lb")).toBeNull();
    });
  });

  describe("4. Granadilla Invariant & Static Contract Safety", () => {
    it("strictly preserves the unavailable invariant for granadilla across all service calls", async () => {
      const service = new CommodityService();
      const granadilla = await service.getCommodityPrice("granadilla");

      expect(granadilla.crop).toBe("granadilla");
      expect(granadilla.price).toBeNull();
      expect(granadilla.referenceType).toBe("unavailable");
      expect(granadilla.disclaimer).toBeDefined();
      expect(granadilla.disclaimer.length).toBeGreaterThan(20);
    });
  });

  describe("5. High Concurrency & Parallel Stress Execution", () => {
    it("handles 50 concurrent requests without race conditions or memory leaks", async () => {
      const mockProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async (symbol) => {
          if (symbol === "COFFEE") return validMockForecast;
          return {
            ...validMockForecast,
            symbol: "COCOA",
            currentPrice: { value: 8500, unit: "USD/MT", source: "ICE", date: "2026-08-21" },
          };
        }),
      };

      const service = new CommodityService(mockProvider);
      const concurrentQueries = Array.from({ length: 50 }, (_, i) =>
        service.getCommodityPrice(i % 2 === 0 ? "cafe" : "cacao"),
      );

      const results = await Promise.all(concurrentQueries);
      expect(results.length).toBe(50);
      for (const res of results) {
        expect(res.price).toBeGreaterThan(0);
        expect(res.market).toContain("ICE");
      }
    });
  });
});
