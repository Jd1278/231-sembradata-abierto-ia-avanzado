import { supabase, isSupabaseConfigured } from "./supabase";

const CACHE_TTL: Record<string, number> = {
  ideam: 24 * 60 * 60 * 1000, // 24 horas
  nasa_power: 7 * 24 * 60 * 60 * 1000, // 7 días
  commodity: 60 * 60 * 1000, // 1 hora
};

function isFresh(fetchedAt: string, ttlMs: number): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < ttlMs;
}

export interface CacheQueryResult<T> {
  ok: boolean;
  data: T | null;
  source: "supabase_cache" | "live_fetch" | "none";
  errorCode?: string;
}

// ============================================================
// IDEAM Cache (Read-Only Client)
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
  fetched_at?: string;
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

// ============================================================
// NASA POWER Cache (Read-Only Client)
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
  fetched_at?: string;
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

// ============================================================
// Commodity Cache (Read-Only Client)
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

// ============================================================
// Server-side Administrative Cache Maintenance
// ============================================================
export async function clearExpiredCache(): Promise<{ cleaned: number }> {
  if (!isSupabaseConfigured()) return { cleaned: 0 };

  try {
    const { data, error } = await supabase.rpc("clean_system_cache_and_audit");
    if (error || !data) {
      console.warn(
        "[Cache] RPC clean_system_cache_and_audit requires administrative role:",
        error?.message,
      );
      return { cleaned: 0 };
    }
    const count = typeof data === "number" ? data : 0;
    return { cleaned: count };
  } catch (err) {
    console.warn("[Cache] Exception running server-side cache cleanup:", err);
    return { cleaned: 0 };
  }
}
