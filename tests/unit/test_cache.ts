import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a flexible chainable mock for Supabase query builder
function createMockQueryBuilder(initialData: unknown = null, initialError: unknown = null) {
  const state = { data: initialData, error: initialError };

  const order = vi.fn().mockResolvedValue(state);
  const single = vi.fn().mockResolvedValue(state);
  const maybeSingle = vi.fn().mockResolvedValue(state);
  const eqChain = vi.fn();
  const lte = vi.fn().mockReturnValue({ order, single, maybeSingle, eq: eqChain });
  const gte = vi.fn().mockReturnValue({ order, single, lte, maybeSingle, eq: eqChain });
  eqChain.mockReturnValue({ order, single, gte, lte, maybeSingle, eq: eqChain });
  const select = vi.fn().mockReturnValue({ order, single, eq: eqChain, gte, lte, maybeSingle });

  return { select, eq: eqChain, gte, lte, order, single, maybeSingle, _state: state };
}

let mockBuilder: ReturnType<typeof createMockQueryBuilder>;

vi.mock("../../src/services/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockBuilder),
    rpc: vi.fn().mockResolvedValue({ data: 5, error: null }),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

import { supabase, isSupabaseConfigured } from "../../src/services/supabase";
import {
  getCachedIdeamObservations,
  getCachedNasaPower,
  getCachedCommodity,
  clearExpiredCache,
} from "../../src/services/cache";

const mockedIsConfigured = vi.mocked(isSupabaseConfigured);

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsConfigured.mockReturnValue(true);
  mockBuilder = createMockQueryBuilder();
});

describe("getCachedIdeamObservations", () => {
  it("returns null when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns null when no data exists", async () => {
    mockBuilder._state.data = null;
    mockBuilder._state.error = null;
    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns data when fresh", async () => {
    const freshDate = new Date().toISOString();
    const rows = [
      {
        estacion_id: "EST001",
        fecha: "2024-01-15",
        temperatura: 25.4,
        humedad: 70,
        precipitacion: 12.5,
        velocidad_viento: 8,
        direccion_viento: 180,
        presion: 1013,
        radiacion_solar: 500,
        fetched_at: freshDate,
      },
    ];
    mockBuilder._state.data = rows;
    mockBuilder._state.error = null;

    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toEqual(rows);
  });

  it("returns null when all records are stale", async () => {
    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    mockBuilder._state.data = [
      {
        estacion_id: "EST001",
        fecha: "2024-01-15",
        temperatura: 25.4,
        humedad: 70,
        precipitacion: 12.5,
        velocidad_viento: 8,
        direccion_viento: 180,
        presion: 1013,
        radiacion_solar: 500,
        fetched_at: staleDate,
      },
    ];
    mockBuilder._state.error = null;

    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });
});

describe("getCachedNasaPower", () => {
  it("returns null when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    const result = await getCachedNasaPower(6.25, -75.58, "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns data when fresh", async () => {
    const freshDate = new Date().toISOString();
    const rows = [
      {
        lat: 6.25,
        lng: -75.58,
        fecha: "2024-01-15",
        fetched_at: freshDate,
        temp_avg: 22,
        temp_max: 28,
        temp_min: 16,
        precipitacion: 80,
        humedad: 75,
        velocidad_viento: 10,
        radiacion_solar: 450,
        evapotranspiracion: 3.5,
      },
    ];
    mockBuilder._state.data = rows;
    mockBuilder._state.error = null;

    const result = await getCachedNasaPower(6.25, -75.58, "2024-01-01", "2024-01-31");
    expect(result).toEqual(rows);
  });

  it("returns null when stale", async () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    mockBuilder._state.data = [
      {
        lat: 6.25,
        lng: -75.58,
        fecha: "2024-01-15",
        fetched_at: staleDate,
        temp_avg: 22,
        temp_max: 28,
        temp_min: 16,
        precipitacion: 80,
        humedad: 75,
        velocidad_viento: 10,
        radiacion_solar: 450,
        evapotranspiracion: 3.5,
      },
    ];
    mockBuilder._state.error = null;

    const result = await getCachedNasaPower(6.25, -75.58, "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });
});

describe("getCachedCommodity", () => {
  it("returns null when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    const result = await getCachedCommodity("CORN");
    expect(result).toBeNull();
  });

  it("returns payload when fresh", async () => {
    const freshDate = new Date().toISOString();
    const payload = { price: 200, currency: "USD" };
    mockBuilder._state.data = { payload, fetched_at: freshDate };
    mockBuilder._state.error = null;

    const result = await getCachedCommodity("CORN");
    expect(result).toEqual(payload);
  });

  it("returns null when entry is stale", async () => {
    const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockBuilder._state.data = { payload: { price: 200 }, fetched_at: staleDate };
    mockBuilder._state.error = null;

    const result = await getCachedCommodity("CORN");
    expect(result).toBeNull();
  });
});

describe("clearExpiredCache (Server-Side Maintenance)", () => {
  it("executes administrative RPC clean_system_cache_and_audit", async () => {
    const result = await clearExpiredCache();
    expect(supabase.rpc).toHaveBeenCalledWith("clean_system_cache_and_audit");
    expect(result.cleaned).toBe(5);
  });
});
