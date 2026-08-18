import { CROP_REQUIREMENTS } from "@/data/crop-requirements";
import type { MunicipioDB } from "@/types/database";
import type { CropKey, Risk } from "@/types/crops";

export type { CropKey, Risk };

export interface Municipio {
  name: string;
  factor: number;
  risk: Record<CropKey, Risk>;
  departamento?: string;
  geolat: number;
  geolng: number;
}

export { MUNICIPIO_FEATURES as MUNICIPIOS_FULL } from "./municipios";
import { MUNICIPIO_FEATURES } from "./municipios";

export const MUNICIPIOS: Municipio[] = MUNICIPIO_FEATURES.map((m) => ({
  name: m.name,
  factor: m.factor,
  risk: m.risk,
  departamento: String(m.properties.dpt ?? ""),
  geolat: m.geolat,
  geolng: m.geolng,
}));

export const CROP_DATA: Record<
  CropKey,
  { label: string; baseYield: number; window: string; description: string }
> = {
  cacao: {
    label: CROP_REQUIREMENTS.cacao.nombre,
    baseYield: CROP_REQUIREMENTS.cacao.baseYield,
    window: CROP_REQUIREMENTS.cacao.window,
    description: CROP_REQUIREMENTS.cacao.descripcion,
  },
  cafe: {
    label: CROP_REQUIREMENTS.cafe.nombre,
    baseYield: CROP_REQUIREMENTS.cafe.baseYield,
    window: CROP_REQUIREMENTS.cafe.window,
    description: CROP_REQUIREMENTS.cafe.descripcion,
  },
  granadilla: {
    label: CROP_REQUIREMENTS.granadilla.nombre,
    baseYield: CROP_REQUIREMENTS.granadilla.baseYield,
    window: CROP_REQUIREMENTS.granadilla.window,
    description: CROP_REQUIREMENTS.granadilla.descripcion,
  },
};

export function computeAltitude(factor: number | undefined): number {
  return factor ? Math.round(500 + (factor - 0.72) * 2500) : 500;
}

export function estimateTemperature(altitude: number): number {
  return Math.round((28 - (altitude / 1000) * 6.5) * 10) / 10;
}

export function estimatePrecipitation(altitude: number): number {
  const base = 2200 - altitude * 0.3;
  return Math.round(Math.max(800, Math.min(3500, base)));
}

export function mapSupabaseMunicipio(m: MunicipioDB): Municipio {
  const factor = m.altitud_msnm ? 0.72 + Math.min(m.altitud_msnm / 3000, 0.5) : 1.0;
  const seed = m.nombre.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const riskPool: Risk[] = ["Bajo", "Bajo", "Medio", "Medio", "Alto"];
  return {
    name: m.nombre,
    factor: +factor.toFixed(2),
    risk: {
      cacao: riskPool[seed % riskPool.length],
      cafe: riskPool[(seed + 1) % riskPool.length],
      granadilla: riskPool[(seed + 2) % riskPool.length],
    },
    departamento: m.departamento,
    geolat: m.latitud ?? 0,
    geolng: m.longitud ?? 0,
  };
}
