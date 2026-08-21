import { createClient } from "@supabase/supabase-js";
import type {
  MunicipioDB,
  CultivoDB,
  ClimaMensual,
  RendimientoHistorico,
  RiesgoAgroclimatico,
  Prediccion,
} from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder",
);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder"));
}

export async function getMunicipios(): Promise<MunicipioDB[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from("municipios").select("*").order("nombre");
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCultivos(): Promise<CultivoDB[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from("cultivos").select("*").order("nombre");
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getClimaMensual(
  municipioId: string,
  anio: number,
  mes?: number,
): Promise<ClimaMensual[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("clima_mensual")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("anio", anio)
      .order("mes");
    if (mes !== undefined) {
      query = query.eq("mes", mes);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getRendimientoHistorico(
  municipioId: string,
  cultivoId: string,
  anioGte?: number,
  anioLte?: number,
): Promise<RendimientoHistorico[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("rendimiento_historico")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("cultivo_id", cultivoId)
      .order("anio");
    if (anioGte !== undefined) query = query.gte("anio", anioGte);
    if (anioLte !== undefined) query = query.lte("anio", anioLte);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getRiesgoAgroclimatico(
  municipioId: string,
  cultivoId: string,
  anio: number,
  mes?: number,
): Promise<RiesgoAgroclimatico[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("riesgo_agroclimatico")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("cultivo_id", cultivoId)
      .eq("anio", anio)
      .order("mes");
    if (mes !== undefined) query = query.eq("mes", mes);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPredicciones(
  municipioId: string,
  cultivoId: string,
  anioGte?: number,
): Promise<Prediccion[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("predicciones")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("cultivo_id", cultivoId)
      .order("anio")
      .order("mes");
    if (anioGte !== undefined) query = query.gte("anio", anioGte);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getYieldSeriesByNames(
  municipioNombre: string,
  cultivoClave: string,
): Promise<{
  historical: RendimientoHistorico[];
  predictions: Prediccion[];
}> {
  if (!isSupabaseConfigured()) return { historical: [], predictions: [] };
  try {
    const [{ data: municipio, error: municipioError }, { data: cultivo, error: cultivoError }] =
      await Promise.all([
        supabase.from("municipios").select("id").eq("nombre", municipioNombre).maybeSingle(),
        supabase.from("cultivos").select("id").eq("clave", cultivoClave).maybeSingle(),
      ]);
    if (municipioError || cultivoError || !municipio || !cultivo)
      return { historical: [], predictions: [] };
    const [historical, predictions] = await Promise.all([
      getRendimientoHistorico(municipio.id, cultivo.id),
      getPredicciones(municipio.id, cultivo.id),
    ]);
    return { historical, predictions };
  } catch {
    return { historical: [], predictions: [] };
  }
}

export async function getCropClimateRequirements(cropId?: string) {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase.from("crop_climate_requirements").select("*").eq("active", true);
    if (cropId) query = query.eq("crop_id", cropId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getClimateSummaries(municipioId: string, periodType?: string) {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("climate_summaries")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("period_end", { ascending: false });
    if (periodType) query = query.eq("period_type", periodType);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getLatestCommodityPrices(commodity?: "cafe" | "cacao" | "granadilla") {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from("commodity_prices")
      .select("*")
      .order("fetched_at", { ascending: false });
    if (commodity) query = query.eq("commodity", commodity);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
