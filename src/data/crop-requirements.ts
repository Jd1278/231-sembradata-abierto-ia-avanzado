import type { CropKey } from "@/types/crops";

export interface CropProfile {
  nombre: string;
  tempOptima: { min: number; max: number; unidad: string };
  precipitacionAnual: { min: number; max: number; unidad: string };
  phOptimo: { min: number; max: number };
  altitud: { min: number; max: number; unidad: string };
  cicloDias: number;
  sueloPreferido: string;
  descripcion: string;
  baseYield: number;
  window: string;
}

export const CROP_REQUIREMENTS: Record<CropKey, CropProfile> = {
  cafe: {
    nombre: "Café",
    tempOptima: { min: 18, max: 22, unidad: "°C" },
    precipitacionAnual: { min: 1500, max: 2000, unidad: "mm/año" },
    phOptimo: { min: 5.5, max: 6.5 },
    altitud: { min: 1200, max: 1800, unidad: "msnm" },
    cicloDias: 365,
    sueloPreferido: "Franco-arcilloso, bien drenado",
    descripcion:
      "Cultivo de clima templado. Requiere sombra parcial y suelos volcánicos ricos en materia orgánica.",
    baseYield: 1.2,
    window: "marzo – abril",
  },
  cacao: {
    nombre: "Cacao",
    tempOptima: { min: 21, max: 32, unidad: "°C" },
    precipitacionAnual: { min: 1500, max: 2500, unidad: "mm/año" },
    phOptimo: { min: 6.0, max: 7.5 },
    altitud: { min: 0, max: 800, unidad: "msnm" },
    cicloDias: 1095,
    sueloPreferido: "Franco-arenoso a franco-arcilloso",
    descripcion: "Cultivo tropical de bajura. Necesita alta humedad relativa (>70%).",
    baseYield: 0.85,
    window: "abril – mayo",
  },
  granadilla: {
    nombre: "Granadilla",
    tempOptima: { min: 15, max: 20, unidad: "°C" },
    precipitacionAnual: { min: 1000, max: 2000, unidad: "mm/año" },
    phOptimo: { min: 5.5, max: 6.8 },
    altitud: { min: 1800, max: 2800, unidad: "msnm" },
    cicloDias: 270,
    sueloPreferido: "Franco-arenoso, profundo",
    descripcion: "Cultivo andino de clima frío. Sensible a heladas y exceso de humedad.",
    baseYield: 9.5,
    window: "septiembre – octubre",
  },
};

export const CULTIVOS_SOPORTADOS = Object.keys(CROP_REQUIREMENTS) as CropKey[];
