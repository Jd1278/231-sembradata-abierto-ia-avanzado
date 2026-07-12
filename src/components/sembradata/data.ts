export type CropKey = "cacao" | "cafe" | "granadilla";
export type Risk = "Bajo" | "Medio" | "Alto";

export interface Municipio {
  name: string;
  factor: number;
  risk: Record<CropKey, Risk>;
}

// Real Santander municipalities are derived from the GeoJSON in
// src/data/santander.geo.json. See ./municipios.ts for the source of truth.
export { MUNICIPIO_FEATURES as MUNICIPIOS_FULL } from "./municipios";
import { MUNICIPIO_FEATURES } from "./municipios";

export const MUNICIPIOS: Municipio[] = MUNICIPIO_FEATURES.map((m) => ({
  name: m.name,
  factor: m.factor,
  risk: m.risk,
}));

export const CROP_DATA: Record<
  CropKey,
  { label: string; baseYield: number; window: string; description: string }
> = {
  cacao: {
    label: "Cacao",
    baseYield: 0.85,
    window: "abril – mayo",
    description:
      "Cultivo insignia de Santander. Sensible a exceso de humedad y monilia.",
  },
  cafe: {
    label: "Café",
    baseYield: 1.2,
    window: "marzo – abril",
    description:
      "Ideal en zonas de ladera entre 1.200–1.800 msnm con lluvias moderadas.",
  },
  granadilla: {
    label: "Granadilla",
    baseYield: 9.5,
    window: "septiembre – octubre",
    description:
      "Requiere clima templado, buen drenaje y control fitosanitario constante.",
  },
};
