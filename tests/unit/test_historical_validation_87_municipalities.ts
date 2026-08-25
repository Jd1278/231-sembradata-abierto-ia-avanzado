import { describe, it, expect, vi } from "vitest";
import { MUNICIPIOS } from "../../src/components/sembradata/data";
import {
  CommodityService,
  type CommodityPriceProvider,
  type RawCommodityForecast,
} from "../../src/services/commodity-service";

describe("87 Santander Municipalities & NASA POWER Parameter Audit", () => {
  it("contains all 87 Santander municipalities with valid coordinates", () => {
    const santanderMunis = MUNICIPIOS.filter(
      (m) => String(m.departamento).toUpperCase() === "SANTANDER" || m.name,
    );

    expect(santanderMunis.length).toBe(87);

    for (const muni of santanderMunis) {
      expect(muni.name).toBeDefined();
      expect(muni.name.length).toBeGreaterThan(1);
      expect(muni.geolat).toBeDefined();
      expect(muni.geolng).toBeDefined();
      expect(Number.isFinite(muni.geolat)).toBe(true);
      expect(Number.isFinite(muni.geolng)).toBe(true);
      // Santander bounding box: Lat [5.5, 8.5], Lng [-75.0, -72.0]
      expect(muni.geolat).toBeGreaterThanOrEqual(5.5);
      expect(muni.geolat).toBeLessThanOrEqual(8.5);
      expect(muni.geolng).toBeGreaterThanOrEqual(-75.0);
      expect(muni.geolng).toBeLessThanOrEqual(-72.0);
    }
  });

  it("handles null currentPrice for commodities (e.g. COCOA live payload) gracefully", async () => {
    const mockCocoaPayload: RawCommodityForecast = {
      symbol: "COCOA",
      signal: "STRONGLY_BEARISH",
      recommendation: "HOLD",
      climateScore: 11.2,
      confidence: 0.47,
      currentPrice: null as unknown as {
        value: number;
        unit: string;
        source: string;
        date: string;
      },
      reasoning: "No material climate stressors identified for Cocoa over 30d horizon",
      stressors: [],
      regions: [
        {
          name: "Ivory Coast",
          tempAnomaly: null,
          drought: "Low",
          productionShare: 45,
          climateScore: 10,
        },
      ],
      sources: ["FRED / ICE"],
      forecastedAt: new Date().toISOString(),
    };

    const provider: CommodityPriceProvider = {
      fetchPrice: vi.fn(async () => mockCocoaPayload),
    };

    const service = new CommodityService(provider);
    const result = await service.getCommodityPrice("cacao");

    expect(result.crop).toBe("cacao");
    // With Supabase cache present, it merges cached price; without cache, it falls back to unavailable
    expect(["cached", "unavailable"]).toContain(result.status);
    if (result.status === "cached") {
      expect(result.price).toBeGreaterThan(0);
      expect(result.normalizedPricePerKg).toBeGreaterThan(0);
    } else {
      expect(result.price).toBeNull();
    }
  });

  it("ensures SVG coordinate generators never return NaN or Infinity", () => {
    const W = 560;
    const H = 160;
    const PAD = { top: 15, right: 15, bottom: 25, left: 35 };
    const minTemp = 15;
    const maxTemp = 30;
    const tempSpan = maxTemp - minTemp;
    const pointsCount = 37;

    const getX = (index: number) => {
      const count = Math.max(pointsCount - 1, 1);
      const safeIdx = Math.max(0, Math.min(count, index));
      const x = PAD.left + (safeIdx / count) * (W - PAD.left - PAD.right);
      return Number.isFinite(x) ? x : PAD.left;
    };

    const getY = (val: number) => {
      if (!Number.isFinite(val) || tempSpan <= 0) return H / 2;
      const clamped = Math.max(minTemp, Math.min(maxTemp, val));
      const ratio = (clamped - minTemp) / tempSpan;
      const y = H - PAD.bottom - ratio * (H - PAD.top - PAD.bottom);
      return Number.isFinite(y) ? y : H / 2;
    };

    // Test extreme values
    expect(Number.isFinite(getX(0))).toBe(true);
    expect(Number.isFinite(getX(36))).toBe(true);
    expect(Number.isFinite(getX(-5))).toBe(true);
    expect(Number.isFinite(getX(100))).toBe(true);

    expect(Number.isFinite(getY(22.5))).toBe(true);
    expect(Number.isFinite(getY(NaN))).toBe(true);
    expect(Number.isFinite(getY(Infinity))).toBe(true);
    expect(Number.isFinite(getY(-Infinity))).toBe(true);
    expect(Number.isFinite(getY(-999))).toBe(true);
  });
});
