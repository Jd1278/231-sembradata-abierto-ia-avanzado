import { supabase, isSupabaseConfigured } from "./supabase";

const CACHE_TTL: Record<string, number> = {
  ideam: 24 * 60 * 60 * 1000, // 24 horas
  nasa_power: 7 * 24 * 60 * 60 * 1000, // 7 días
  commodity: 60 * 60 * 1000, // 1 hora
};

function isFresh(fetchedAt: string, ttlMs: number): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < ttlMs;
}

// ============================================================
// IDEAM Cache
// ============================================================
export interface IdeamCacheRow {
  estacion_id: string;
  fecha: string;
  temperatura: number | null;
  humedad: number | null;
  precipitacion: number | null;
  velocidad_viento: number | null;
  direccion_viento: number | null;
  presion: number | null;
  radiacion_solar: number | null;
}

export async function getCachedIdeamObservations(
  estacionId: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<IdeamCacheRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("ideam_cache")
      .select("*")
      .eq("estacion_id", estacionId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha");

    if (error || !data || data.length === 0) return null;

    const fresh = data.filter((row) => isFresh(row.fetched_at, CACHE_TTL.ideam));
    if (fresh.length === 0) return null;

    return fresh;
  } catch {
    return null;
  }
}

export async function setCachedIdeamObservations(rows: IdeamCacheRow[]): Promise<void> {
  if (!isSupabaseConfigured() || rows.length === 0) return;

  try {
    const upserts = rows.map((r) => ({
      estacion_id: r.estacion_id,
      fecha: r.fecha,
      temperatura: r.temperatura,
      humedad: r.humedad,
      precipitacion: r.precipitacion,
      velocidad_viento: r.velocidad_viento,
      direccion_viento: r.direccion_viento,
      presion: r.presion,
      radiacion_solar: r.radiacion_solar,
      fetched_at: new Date().toISOString(),
    }));

    await supabase.from("ideam_cache").upsert(upserts, {
      onConflict: "estacion_id,fecha",
    });
  } catch {
    // Cache write failure is non-critical
  }
}

// ============================================================
// NASA POWER Cache
// ============================================================
export interface NasaPowerCacheRow {
  lat: number;
  lng: number;
  fecha: string;
  temp_avg: number;
  temp_max: number;
  temp_min: number;
  precipitacion: number;
  humedad: number;
  velocidad_viento: number;
  radiacion_solar: number;
  evapotranspiracion: number;
}

function roundCoord(v: number): number {
  return Math.round(v * 100) / 100;
}

export async function getCachedNasaPower(
  lat: number,
  lng: number,
  fechaInicio: string,
  fechaFin: string,
): Promise<NasaPowerCacheRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const rLat = roundCoord(lat);
    const rLng = roundCoord(lng);

    const { data, error } = await supabase
      .from("nasa_power_cache")
      .select("*")
      .eq("lat", rLat)
      .eq("lng", rLng)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha");

    if (error || !data || data.length === 0) return null;

    const fresh = data.filter((row) => isFresh(row.fetched_at, CACHE_TTL.nasa_power));
    if (fresh.length === 0) return null;

    return fresh;
  } catch {
    return null;
  }
}

export async function setCachedNasaPower(rows: NasaPowerCacheRow[]): Promise<void> {
  if (!isSupabaseConfigured() || rows.length === 0) return;

  try {
    const upserts = rows.map((r) => ({
      lat: roundCoord(r.lat),
      lng: roundCoord(r.lng),
      fecha: r.fecha,
      temp_avg: r.temp_avg,
      temp_max: r.temp_max,
      temp_min: r.temp_min,
      precipitacion: r.precipitacion,
      humedad: r.humedad,
      velocidad_viento: r.velocidad_viento,
      radiacion_solar: r.radiacion_solar,
      evapotranspiracion: r.evapotranspiracion,
      fetched_at: new Date().toISOString(),
    }));

    await supabase.from("nasa_power_cache").upsert(upserts, {
      onConflict: "lat,lng,fecha",
    });
  } catch {
    // Cache write failure is non-critical
  }
}

// ============================================================
// Commodity Cache
// ============================================================
export async function getCachedCommodity<T>(symbol: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("commodity_cache")
      .select("payload, fetched_at")
      .eq("symbol", symbol)
      .maybeSingle();

    if (error || !data) return null;
    if (!isFresh(data.fetched_at, CACHE_TTL.commodity)) return null;

    return data.payload as T;
  } catch {
    return null;
  }
}

export async function setCachedCommodity<T>(symbol: string, payload: T): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from("commodity_cache").upsert(
      {
        symbol,
        payload,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "symbol" },
    );
  } catch {
    // Cache write failure is non-critical
  }
}

// ============================================================
// Cache Cleanup
// ============================================================

export async function clearExpiredCache(): Promise<{ cleaned: number }> {
  if (!isSupabaseConfigured()) return { cleaned: 0 };

  let cleaned = 0;
  const now = Date.now();

  try {
    const ideamCutoff = new Date(now - CACHE_TTL.ideam).toISOString();
    const { count: ideamCount } = await supabase
      .from("ideam_cache")
      .delete()
      .lt("fetched_at", ideamCutoff);
    cleaned += ideamCount ?? 0;
  } catch {
    /* ignore */
  }

  try {
    const nasaCutoff = new Date(now - CACHE_TTL.nasa_power).toISOString();
    const { count: nasaCount } = await supabase
      .from("nasa_power_cache")
      .delete()
      .lt("fetched_at", nasaCutoff);
    cleaned += nasaCount ?? 0;
  } catch {
    /* ignore */
  }

  try {
    const commodityCutoff = new Date(now - CACHE_TTL.commodity).toISOString();
    const { count: commodityCount } = await supabase
      .from("commodity_cache")
      .delete()
      .lt("fetched_at", commodityCutoff);
    cleaned += commodityCount ?? 0;
  } catch {
    /* ignore */
  }

  return { cleaned };
}
