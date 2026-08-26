import { describe, it, expect, vi } from "vitest";
import {
  CommodityService,
  normalizePerKg,
  GRANADILLA_UNAVAILABLE,
  type CommodityPriceProvider,
  type RawCommodityForecast,
} from "../../src/services/commodity-service";

describe("Phase 3: International Commodity Prices & Market Disclaimers", () => {
  const mockCoffeeForecast: RawCommodityForecast = {
    symbol: "COFFEE",
    signal: "BUY",
    recommendation: "BUY",
    climateScore: 78,
    confidence: 0.85,
    currentPrice: {
      value: 264.1,
      unit: "¢/lb",
      source: "ICE Futures U.S.",
      date: "2026-08-20T18:00:00Z",
    },
    reasoning: "High thermal anomaly in Minas Gerais impacting supply.",
    stressors: [
      {
        factor: "Drought",
        severity: "HIGH",
        region: "Brazil",
        priceImpact: "+12%",
        probability: 0.8,
        horizon: "3M",
      },
    ],
    regions: [
      {
        name: "Minas Gerais",
        tempAnomaly: 2.1,
        drought: "Severe",
        productionShare: 0.5,
        climateScore: 42,
      },
    ],
    sources: ["ICE Futures", "NOAA Climate Data"],
    forecastedAt: "2026-08-20T18:00:00Z",
  };

  const mockCocoaForecast: RawCommodityForecast = {
    symbol: "COCOA",
    signal: "HOLD",
    recommendation: "HOLD",
    climateScore: 65,
    confidence: 0.75,
    currentPrice: {
      value: 8650,
      unit: "USD/MT",
      source: "ICE Futures U.S.",
      date: "2026-08-20T18:00:00Z",
    },
    reasoning: "West Africa rainfall normalization.",
    stressors: [],
    regions: [],
    sources: ["ICE Futures"],
    forecastedAt: "2026-08-20T18:00:00Z",
  };

  describe("1. Market Attribution & Instrument Integrity", () => {
    const mockProvider: CommodityPriceProvider = {
      fetchPrice: vi.fn(async (symbol) => {
        if (symbol === "COFFEE") return mockCoffeeForecast;
        if (symbol === "COCOA") return mockCocoaForecast;
        throw new Error(`Unknown symbol: ${symbol}`);
      }),
    };

    const service = new CommodityService(mockProvider);

    it("maps Coffee to ICE Coffee C futures with explicit disclaimer", async () => {
      const coffee = await service.getCommodityPrice("cafe");
      expect(coffee.crop).toBe("cafe");
      expect(coffee.market).toContain("ICE Futures U.S.");
      expect(coffee.instrument).toBe("ICE US Coffee C (KC)");
      expect(coffee.currency).toBe("USD");
      expect(coffee.price).toBe(264.1);
      expect(coffee.unit).toBe("¢/lb");
      expect(coffee.disclaimer).toContain("No equivale al precio interno");
      expect(coffee.disclaimer).toContain("FNC");
      expect(coffee.normalizedPricePerKg).toBeCloseTo(5.8224, 2);
    });

    it("maps Cocoa to ICE US Cocoa futures with explicit disclaimer", async () => {
      const cocoa = await service.getCommodityPrice("cacao");
      expect(cocoa.crop).toBe("cacao");
      expect(cocoa.market).toContain("ICE Futures U.S.");
      expect(cocoa.instrument).toBe("ICE US Cocoa (CC)");
      expect(cocoa.currency).toBe("USD");
      expect(cocoa.price).toBe(8650);
      expect(cocoa.unit).toBe("USD/MT");
      expect(cocoa.disclaimer).toContain("No representa el precio de compra local en finca");
      expect(cocoa.normalizedPricePerKg).toBe(8.65);
    });

    it("returns explicit unavailable state for Granadilla without inventing international prices", async () => {
      const granadilla = await service.getCommodityPrice("granadilla");
      expect(granadilla).toEqual(GRANADILLA_UNAVAILABLE);
      expect(granadilla.price).toBeNull();
      expect(granadilla.referenceType).toBe("unavailable");
      expect(granadilla.disclaimer).toContain("SIPSA");
    });
  });

  describe("2. Normalized Price per Kilogram Calculations", () => {
    it("correctly converts metric tons (MT) to USD/kg", () => {
      expect(normalizePerKg(8000, "USD/MT")).toBe(8.0);
      expect(normalizePerKg(9500, "USD/tonne")).toBe(9.5);
    });

    it("correctly converts cents per pound (¢/lb) to USD/kg", () => {
      // 100 ¢/lb = 1 USD / 0.45359237 kg = 2.2046 USD/kg
      expect(normalizePerKg(100, "¢/lb")).toBeCloseTo(2.2046, 3);
      // 250 ¢/lb = 2.50 USD / 0.45359237 kg = 5.5116 USD/kg
      expect(normalizePerKg(250, "cents/lb")).toBeCloseTo(5.5116, 3);
    });

    it("handles null, NaN and invalid units safely", () => {
      expect(normalizePerKg(null, "USD/MT")).toBeNull();
      expect(normalizePerKg(Number.NaN, "USD/MT")).toBeNull();
      expect(normalizePerKg(100, "unknown_unit")).toBeNull();
    });
  });

  describe("3. Resilience & Offline Fallback", () => {
    it("handles all settled prices cleanly across cafe, cacao, and granadilla", async () => {
      const mockProvider: CommodityPriceProvider = {
        fetchPrice: vi.fn(async (symbol) => {
          if (symbol === "COFFEE") return mockCoffeeForecast;
          throw new Error("COCOA endpoint offline (503 Service Unavailable)");
        }),
      };

      const service = new CommodityService(mockProvider);
      const allPrices = await service.getAllCommodityPrices();

      expect(allPrices.length).toBeGreaterThanOrEqual(2);
      const crops = allPrices.map((p) => p.crop);
      expect(crops).toContain("cafe");
      expect(crops).toContain("granadilla");
    });
  });
});
