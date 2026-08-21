import { describe, it, expect } from "vitest";
import {
  isSupabaseConfigured,
  getMunicipios,
  getCultivos,
  getCropClimateRequirements,
  getClimateSummaries,
  getLatestCommodityPrices,
} from "@/services/supabase";
import type {
  CropClimateRequirements,
  ClimateSummary,
  CommodityPriceRecord,
} from "@/types/database";

describe("Phase 0 Database Schema & Service Functions", () => {
  it("should verify isSupabaseConfigured function contract", () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("should have correct CropClimateRequirements interface type shape", () => {
    const sampleReq: CropClimateRequirements = {
      id: "test-id",
      crop_id: "cafe",
      temperature_min_c: 15,
      temperature_optimal_min_c: 18,
      temperature_optimal_max_c: 22,
      temperature_max_c: 26,
      precipitation_min_mm: 1200,
      precipitation_optimal_min_mm: 1500,
      precipitation_optimal_max_mm: 2000,
      precipitation_max_mm: 3000,
      humidity_min_pct: 60,
      humidity_optimal_min_pct: 70,
      humidity_optimal_max_pct: 85,
      humidity_max_pct: 95,
      altitude_min_m: 900,
      altitude_optimal_min_m: 1200,
      altitude_optimal_max_m: 1800,
      altitude_max_m: 2200,
      weight_temperature: 0.35,
      weight_precipitation: 0.3,
      weight_altitude: 0.2,
      weight_humidity: 0.15,
      source: "Cenicafé",
      active: true,
    };

    expect(sampleReq.crop_id).toBe("cafe");
    expect(
      sampleReq.weight_temperature +
        sampleReq.weight_precipitation +
        sampleReq.weight_altitude +
        sampleReq.weight_humidity,
    ).toBeCloseTo(1.0);
    expect(sampleReq.temperature_min_c).toBeLessThan(sampleReq.temperature_optimal_min_c);
    expect(sampleReq.temperature_optimal_min_c).toBeLessThan(sampleReq.temperature_optimal_max_c);
    expect(sampleReq.temperature_optimal_max_c).toBeLessThan(sampleReq.temperature_max_c);
  });

  it("should have correct ClimateSummary interface type shape", () => {
    const sampleSummary: ClimateSummary = {
      id: "summary-123",
      municipio_id: "bucaramanga",
      period_type: "recent_90d",
      period_start: "2026-05-23",
      period_end: "2026-08-21",
      mean_temperature_c: 22.4,
      min_temperature_c: 17.1,
      max_temperature_c: 27.8,
      temperature_stddev: 1.2,
      precipitation_mm: 280.5,
      precipitation_daily_mean_mm: 3.1,
      precipitation_stddev: 4.8,
      precipitation_cv: 1.54,
      mean_humidity_pct: 76.5,
      et0_mm: 310.2,
      water_balance_mm: -29.7,
      water_deficit_mm: 29.7,
      valid_observations: 90,
      expected_observations: 90,
      completeness: 1.0,
      source: "Open-Meteo",
      calculated_at: new Date().toISOString(),
    };

    expect(sampleSummary.municipio_id).toBe("bucaramanga");
    expect(sampleSummary.completeness).toBe(1.0);
    expect(sampleSummary.water_deficit_mm).toBeGreaterThanOrEqual(0);
  });

  it("should have correct CommodityPriceRecord interface type shape", () => {
    const samplePrice: CommodityPriceRecord = {
      id: 1,
      commodity: "cafe",
      symbol: "KC=F",
      market: "ICE Futures US",
      contract: "Coffee C",
      price: 245.8,
      currency: "USD",
      unit: "lb",
      change: 2.1,
      change_percent: 0.86,
      is_forecast: false,
      is_cached: false,
      source: "ICE",
      fetched_at: new Date().toISOString(),
    };

    expect(samplePrice.commodity).toBe("cafe");
    expect(samplePrice.currency).toBe("USD");
    expect(samplePrice.unit).toBe("lb");
  });

  it("should return arrays gracefully when querying Supabase helper functions", async () => {
    const [crops, munis, reqs, summaries, prices] = await Promise.all([
      getCultivos(),
      getMunicipios(),
      getCropClimateRequirements(),
      getClimateSummaries("bucaramanga"),
      getLatestCommodityPrices(),
    ]);

    expect(Array.isArray(crops)).toBe(true);
    expect(Array.isArray(munis)).toBe(true);
    expect(Array.isArray(reqs)).toBe(true);
    expect(Array.isArray(summaries)).toBe(true);
    expect(Array.isArray(prices)).toBe(true);
  });
});
