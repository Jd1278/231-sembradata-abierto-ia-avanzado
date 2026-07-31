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
  const upsert = vi.fn().mockResolvedValue({ error: null });

  return { select, upsert, eq: eqChain, gte, lte, order, single, maybeSingle, _state: state };
}

let mockBuilder: ReturnType<typeof createMockQueryBuilder>;

vi.mock("../../src/services/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockBuilder),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

import { supabase, isSupabaseConfigured } from "../../src/services/supabase";
import {
  getCachedIdeamObservations,
  setCachedIdeamObservations,
  getCachedNasaPower,
  setCachedNasaPower,
  getCachedCommodity,
  setCachedCommodity,
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

  it("returns null when cache entries are stale", async () => {
    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    mockBuilder._state.data = [
      { estacion_id: "EST001", fecha: "2024-01-15", fetched_at: staleDate, temperatura: 20 },
    ];
    mockBuilder._state.error = null;

    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns cached data when fresh", async () => {
    const freshDate = new Date().toISOString();
    const rows = [
      { estacion_id: "EST001", fecha: "2024-01-15", fetched_at: freshDate, temperatura: 22 },
    ];
    mockBuilder._state.data = rows;
    mockBuilder._state.error = null;

    const result = await getCachedIdeamObservations("EST001", "2024-01-01", "2024-01-31");
    expect(result).toEqual(rows);
  });
});

describe("setCachedIdeamObservations", () => {
  it("does nothing when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    await setCachedIdeamObservations([
      {
        estacion_id: "EST001",
        fecha: "2024-01-01",
        temperatura: 20,
        humedad: 80,
        precipitacion: 10,
        velocidad_viento: 5,
        direccion_viento: 180,
        presion: 1013,
        radiacion_solar: 500,
      },
    ]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("does nothing for empty rows", async () => {
    await setCachedIdeamObservations([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("calls upsert with fetched_at timestamp", async () => {
    await setCachedIdeamObservations([
      {
        estacion_id: "EST001",
        fecha: "2024-01-01",
        temperatura: 20,
        humedad: 80,
        precipitacion: 10,
        velocidad_viento: 5,
        direccion_viento: 180,
        presion: 1013,
        radiacion_solar: 500,
      },
    ]);

    expect(mockBuilder.upsert).toHaveBeenCalled();
    const upsertArg = mockBuilder.upsert.mock.calls[0][0];
    expect(upsertArg[0].fetched_at).toBeDefined();
    expect(upsertArg[0].estacion_id).toBe("EST001");
    expect(upsertArg[0].temperatura).toBe(20);
  });
});

describe("getCachedNasaPower", () => {
  it("returns null when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    const result = await getCachedNasaPower(6.25, -75.58, "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockBuilder._state.data = null;
    mockBuilder._state.error = { message: "fail" };
    const result = await getCachedNasaPower(6.25, -75.58, "2024-01-01", "2024-01-31");
    expect(result).toBeNull();
  });

  it("returns null when empty data", async () => {
    mockBuilder._state.data = [];
    mockBuilder._state.error = null;
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

describe("setCachedNasaPower", () => {
  it("does nothing when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    await setCachedNasaPower([
      {
        lat: 6.25,
        lng: -75.58,
        fecha: "2024-01-01",
        temp_avg: 22,
        temp_max: 28,
        temp_min: 16,
        precipitacion: 80,
        humedad: 75,
        velocidad_viento: 10,
        radiacion_solar: 450,
        evapotranspiracion: 3.5,
      },
    ]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("does nothing for empty rows", async () => {
    await setCachedNasaPower([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("calls upsert with rounded coordinates", async () => {
    await setCachedNasaPower([
      {
        lat: 6.2543,
        lng: -75.5821,
        fecha: "2024-01-01",
        temp_avg: 22,
        temp_max: 28,
        temp_min: 16,
        precipitacion: 80,
        humedad: 75,
        velocidad_viento: 10,
        radiacion_solar: 450,
        evapotranspiracion: 3.5,
      },
    ]);

    expect(mockBuilder.upsert).toHaveBeenCalled();
    const upsertArg = mockBuilder.upsert.mock.calls[0][0];
    expect(upsertArg[0].lat).toBe(6.25);
    expect(upsertArg[0].lng).toBe(-75.58);
    expect(upsertArg[0].fetched_at).toBeDefined();
  });
});

describe("getCachedCommodity", () => {
  it("returns null when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    const result = await getCachedCommodity("CORN");
    expect(result).toBeNull();
  });

  it("returns null when entry is stale", async () => {
    const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockBuilder._state.data = { payload: { price: 200 }, fetched_at: staleDate };
    mockBuilder._state.error = null;

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

  it("returns null when no data found", async () => {
    mockBuilder._state.data = null;
    mockBuilder._state.error = { message: "not found" };

    const result = await getCachedCommodity("NONEXISTENT");
    expect(result).toBeNull();
  });
});

describe("setCachedCommodity", () => {
  it("does nothing when supabase is not configured", async () => {
    mockedIsConfigured.mockReturnValue(false);
    await setCachedCommodity("CORN", { price: 200 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("calls upsert with symbol, payload, and fetched_at", async () => {
    const payload = { price: 200, currency: "USD" };
    await setCachedCommodity("CORN", payload);

    expect(mockBuilder.upsert).toHaveBeenCalled();
    const upsertArg = mockBuilder.upsert.mock.calls[0][0];
    expect(upsertArg.symbol).toBe("CORN");
    expect(upsertArg.payload).toEqual(payload);
    expect(upsertArg.fetched_at).toBeDefined();
  });
});
