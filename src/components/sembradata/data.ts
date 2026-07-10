export type CropKey = "cacao" | "cafe" | "granadilla";
export type Risk = "Bajo" | "Medio" | "Alto";

export interface Municipio {
  name: string;
  factor: number; // 0.6 - 1.2
  x: number; // svg
  y: number;
  risk: Record<CropKey, Risk>;
}

export const MUNICIPIOS: Municipio[] = [
  {
    name: "San Vicente de Chucurí",
    factor: 1.15,
    x: 180,
    y: 210,
    risk: { cacao: "Bajo", cafe: "Medio", granadilla: "Medio" },
  },
  {
    name: "Socorro",
    factor: 0.95,
    x: 320,
    y: 260,
    risk: { cacao: "Medio", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    name: "Lebrija",
    factor: 1.05,
    x: 245,
    y: 165,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Medio" },
  },
  {
    name: "Barrancabermeja",
    factor: 0.85,
    x: 105,
    y: 165,
    risk: { cacao: "Medio", cafe: "Alto", granadilla: "Alto" },
  },
  {
    name: "Bucaramanga",
    factor: 1.0,
    x: 290,
    y: 145,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    name: "Málaga",
    factor: 0.75,
    x: 405,
    y: 175,
    risk: { cacao: "Alto", cafe: "Medio", granadilla: "Medio" },
  },
  {
    name: "Vélez",
    factor: 0.9,
    x: 265,
    y: 335,
    risk: { cacao: "Medio", cafe: "Bajo", granadilla: "Medio" },
  },
  {
    name: "San Gil",
    factor: 1.02,
    x: 355,
    y: 245,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    name: "Piedecuesta",
    factor: 0.98,
    x: 320,
    y: 170,
    risk: { cacao: "Bajo", cafe: "Medio", granadilla: "Bajo" },
  },
  {
    name: "Rionegro",
    factor: 1.08,
    x: 225,
    y: 120,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Medio" },
  },
];

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
