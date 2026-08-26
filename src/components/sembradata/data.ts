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
  altitude?: number;
}

export { MUNICIPIO_FEATURES as MUNICIPIOS_FULL } from "./municipios";
import { MUNICIPIO_FEATURES } from "./municipios";

/**
 * Official altitude (msnm) lookup for the 87 Santander municipalities.
 * Sourced from official IGAC / Supabase catalog.
 */
export const OFFICIAL_SANTANDER_ALTITUDES: Record<string, number> = {
  aguada: 1400,
  albania: 1100,
  aratoca: 1800,
  barbosa: 1550,
  barichara: 1280,
  barrancabermeja: 112,
  betulia: 1100,
  bolivar: 800,
  cabrera: 1100,
  california: 1650,
  capitanejo: 1200,
  carcasi: 2100,
  cepita: 2300,
  cerrito: 1300,
  charala: 1350,
  charta: 1900,
  chima: 1050,
  chipata: 1700,
  cimitarra: 120,
  concepcion: 1300,
  confines: 1200,
  contratacion: 1400,
  coromoro: 1600,
  curiti: 1750,
  el_carmen_de_chucuri: 450,
  el_guacamayo: 1350,
  el_penon: 900,
  el_playon: 800,
  encino: 1850,
  enciso: 1400,
  florian: 1000,
  floridablanca: 925,
  galan: 1350,
  gambita: 1500,
  giron: 1080,
  guaca: 1600,
  guadalupe: 1250,
  guapota: 1400,
  guavata: 1600,
  guepsa: 1400,
  hato: 1100,
  jesus_maria: 1200,
  jordan: 1300,
  la_belleza: 950,
  landazuri: 250,
  la_paz: 1550,
  lebrija: 1000,
  los_santos: 1750,
  macaravita: 2000,
  malaga: 1400,
  matanza: 2000,
  mogotes: 1850,
  molagavita: 1700,
  ocamonte: 1200,
  oiba: 1150,
  onzaga: 1800,
  palmar: 1100,
  palmas_del_socorro: 1200,
  paramo: 1300,
  piedecuesta: 970,
  pinchote: 1150,
  puente_nacional: 800,
  puerto_parra: 80,
  puerto_wilches: 75,
  rionegro: 1200,
  sabana_de_torres: 130,
  san_andres: 1500,
  san_benito: 1200,
  san_gil: 1160,
  san_joaquin: 1450,
  san_jose_de_miranda: 1900,
  san_miguel: 1300,
  san_vicente_de_chucuri: 200,
  santa_barbara: 1500,
  santa_helena_del_opon: 350,
  simacota: 300,
  socorro: 1250,
  suaita: 1350,
  sucre: 950,
  surata: 1400,
  tona: 1300,
  valle_de_san_jose: 1250,
  velez: 1500,
  vetas: 2500,
  villanueva: 1200,
  zapatoca: 1400,
  bucaramanga: 950,
};

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function getOfficialAltitude(municipioName: string): number {
  const key = normalizeKey(municipioName);
  return OFFICIAL_SANTANDER_ALTITUDES[key] ?? 1000;
}

export const MUNICIPIOS: Municipio[] = MUNICIPIO_FEATURES.map((m) => {
  const alt = getOfficialAltitude(m.name);
  return {
    name: m.name,
    factor: +(alt / 3000).toFixed(2),
    risk: m.risk,
    departamento: String(m.properties.dpt ?? "Santander"),
    geolat: m.geolat,
    geolng: m.geolng,
    altitude: alt,
  };
});

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

/**
 * Returns the official elevation (msnm) for a municipality.
 * Preserves the function signature for backwards compatibility.
 */
export function computeAltitude(factorOrMuni: number | string | undefined): number {
  if (factorOrMuni === undefined) return 500;
  if (typeof factorOrMuni === "string") {
    return getOfficialAltitude(factorOrMuni);
  }
  if (typeof factorOrMuni === "number" && Number.isFinite(factorOrMuni)) {
    if (factorOrMuni >= 50) return Math.round(factorOrMuni);
    return Math.round(Math.min(3000, Math.max(500, 500 + (factorOrMuni - 0.72) * 2500)));
  }
  return 500;
}

export function estimateTemperature(altitude: number): number {
  return Math.round((28 - (altitude / 1000) * 6.5) * 10) / 10;
}

export function estimatePrecipitation(altitude: number): number {
  const base = 2200 - altitude * 0.3;
  return Math.round(Math.max(800, Math.min(3500, base)));
}

export function mapSupabaseMunicipio(m: MunicipioDB): Municipio {
  const alt = m.altitud_msnm || getOfficialAltitude(m.nombre);
  return {
    name: m.nombre,
    factor: +(alt / 3000).toFixed(2),
    risk: {
      cacao: "Medio",
      cafe: "Medio",
      granadilla: "Medio",
    },
    departamento: m.departamento,
    geolat: m.latitud ?? 0,
    geolng: m.longitud ?? 0,
    altitude: alt,
  };
}
