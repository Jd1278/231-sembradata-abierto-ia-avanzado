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
