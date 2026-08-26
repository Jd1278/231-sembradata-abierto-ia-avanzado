export interface MunicipioDB {
  id: string;
  nombre: string;
  departamento: string;
  latitud: number;
  longitud: number;
  altitud_msnm: number;
  area_km2: number;
  poblacion: number;
  zone_agroecologica: string;
}

export interface CultivoDB {
  id: string;
  nombre: string;
  clave: string;
  rendimiento_base: number;
  ventana_siembra: string;
  descripcion: string;
  scientific_name?: string | null;
  active?: boolean;
}

export interface CropClimateRequirements {
  id: string;
  crop_id: string;
  temperature_min_c: number;
  temperature_optimal_min_c: number;
  temperature_optimal_max_c: number;
  temperature_max_c: number;
  precipitation_min_mm: number;
  precipitation_optimal_min_mm: number;
  precipitation_optimal_max_mm: number;
  precipitation_max_mm: number;
  humidity_min_pct: number;
  humidity_optimal_min_pct: number;
  humidity_optimal_max_pct: number;
  humidity_max_pct: number;
  altitude_min_m: number;
  altitude_optimal_min_m: number;
  altitude_optimal_max_m: number;
  altitude_max_m: number;
  ph_min?: number | null;
  ph_optimal_min?: number | null;
  ph_optimal_max?: number | null;
  ph_max?: number | null;
  weight_temperature: number;
  weight_precipitation: number;
  weight_altitude: number;
  weight_humidity: number;
  cycle_days?: number | null;
  soil_preference?: string | null;
  source: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClimateSummary {
  id: string;
  municipio_id: string;
  period_type: "daily" | "monthly" | "annual" | "historical" | "recent_90d";
  period_start: string;
  period_end: string;
  mean_temperature_c: number | null;
  min_temperature_c: number | null;
  max_temperature_c: number | null;
  temperature_stddev: number | null;
  precipitation_mm: number | null;
  precipitation_daily_mean_mm: number | null;
  precipitation_stddev: number | null;
  precipitation_cv: number | null;
  mean_humidity_pct: number | null;
  et0_mm: number | null;
  water_balance_mm: number | null;
  water_deficit_mm: number | null;
  valid_observations: number;
  expected_observations: number;
  completeness: number;
  source: string;
  calculated_at: string;
}

export interface CommodityPriceRecord {
  id: number;
  commodity: "cafe" | "cacao" | "granadilla";
  symbol: string;
  market: string;
  contract?: string | null;
  price: number | null;
  currency: string;
  unit: string;
  change?: number | null;
  change_percent?: number | null;
  is_forecast: boolean;
  is_cached: boolean;
  source: string;
  source_timestamp?: string | null;
  fetched_at: string;
}

export interface ClimaMensual {
  id: string;
  municipio_id: string;
  anio: number;
  mes: number;
  precipitacion_mm: number;
  temp_promedio: number;
  temp_max: number;
  temp_min: number;
  humedad_relativa: number;
  vel_viento: number;
}

export interface RendimientoHistorico {
  id: string;
  municipio_id: string;
  cultivo_id: string;
  anio: number;
  rendimiento_ton_ha: number;
  superficie_ha: number;
}

export interface RiesgoAgroclimatico {
  id: string;
  municipio_id: string;
  cultivo_id: string;
  anio: number;
  mes: number;
  nivel_riesgo: "Bajo" | "Medio" | "Alto";
  riesgo_sequia: number;
  riesgo_heladas: number;
  riesgo_plagas: number;
  factor_productividad: number;
  risk_score?: number | null;
  calculated_at?: string;
  climate_summary_id?: string | null;
}

export interface Prediccion {
  id: string;
  municipio_id: string;
  cultivo_id: string;
  anio: number;
  mes: number;
  rendimiento_estimado: number;
  confianza: number;
  modelo_version: string;
  created_at: string;
}

export interface AnalysisHistoryDB {
  id: string;
  municipio: string;
  departamento: string;
  cultivo: string;
  lat: number;
  lng: number;
  score: number;
  viable: boolean;
  recommendations: string[];
  created_at: string;
  confidence?: number;
  pest_risk_level?: string;
  municipio_id?: string | null;
  cultivo_id?: string | null;
}
