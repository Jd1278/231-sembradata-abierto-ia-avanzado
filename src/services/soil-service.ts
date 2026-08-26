export interface SoilData {
  ph: number;
  organicMatter: number;
  texture: string;
  clay: number;
  sand: number;
  silt: number;
  depth: number;
  waterRetention: number;
  drainage: string;
  fertility: string;
  salinity: number;
  erosionRisk: string;
  landUse: string;
  carbonStock: number;
  sourceType: "measured" | "estimated" | "unavailable";
  sourceDescription?: string;
}

import { rateLimitedFetch } from "./rate-limiter";

const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";

function mapTexture(clay: number, sand: number, silt: number): string {
  if (clay > 40) return "Arcilla";
  if (clay > 25) return "Franco arcillosa";
  if (sand > 60) return "Arena";
  if (sand > 45) return "Franco arenosa";
  if (silt > 50) return "Limo";
  return "Franco";
}

function mapDrainage(clay: number, sand: number): string {
  if (clay > 40) return "Lento";
  if (clay > 25) return "Moderado";
  if (sand > 60) return "Muy rápido";
  if (sand > 45) return "Rápido";
  return "Moderado-bueno";
}

function mapFertility(ph: number, organicMatter: number): string {
  let score = 0;
  if (ph >= 5.5 && ph <= 7.0) score += 2;
  else if (ph >= 5.0 && ph <= 7.5) score += 1;
  if (organicMatter > 3) score += 2;
  else if (organicMatter > 2) score += 1;
  if (score >= 3) return "Alta";
  if (score >= 2) return "Media";
  return "Baja";
}

function mapLandUse(ph: number, texture: string): string {
  if (texture.includes("Arcilla") || ph < 4.5) return "Forestal";
  if (ph >= 5.5 && ph <= 7.0 && !texture.includes("Arena")) return "Agrícola";
  return "Pasto";
}

export interface SoilProfile {
  layers: SoilData[];
}

const DEPTH_OPTIONS = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"] as const;

export type SoilDepth = (typeof DEPTH_OPTIONS)[number];

export async function fetchSoilData(
  lat: number,
  lng: number,
  depth: SoilDepth = "0-5cm",
): Promise<SoilData> {
  try {
    const properties = ["clay", "sand", "silt", "phh2o", "soc", "cfvo"];
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      property: properties.join(","),
      depth,
      value: "mean",
    });

    const res = await rateLimitedFetch("soilgrids", `${SOILGRIDS_URL}?${params}`);
    if (!res.ok) throw new Error(`Soil API error: ${res.status}`);
    const data = await res.json();

    const extractProp = (name: string): number => {
      const layer = data?.properties?.layers?.find((l: { name: string }) => l.name === name);
      return (layer?.depths?.[0]?.values?.mean as number) ?? 0;
    };

    const clay = extractProp("clay") / 10;
    const sand = extractProp("sand") / 10;
    const silt = extractProp("silt") / 10;
    const ph = extractProp("phh2o") / 10;
    const soc = extractProp("soc") / 10;

    const organicMatter = soc * 1.72;
    const texture = mapTexture(clay, sand, silt);
    const drainage = mapDrainage(clay, sand);
    const fertility = mapFertility(ph, organicMatter);

    return {
      ph: +ph.toFixed(1),
      organicMatter: +organicMatter.toFixed(1),
      texture,
      clay: +clay.toFixed(1),
      sand: +sand.toFixed(1),
      silt: +silt.toFixed(1),
      depth: 30,
      waterRetention: clay > 30 ? 80 : clay > 15 ? 50 : 25,
      drainage,
      fertility,
      salinity: 0,
      erosionRisk: clay < 15 ? "Alta" : clay > 30 ? "Baja" : "Media",
      landUse: mapLandUse(ph, texture),
      carbonStock: +(soc * 10).toFixed(0),
      sourceType: "measured",
      sourceDescription: "Perfil edáfico medido en SoilGrids (ISRIC 250m)",
    };
  } catch (err) {
    console.warn("SoilGrids API fallback for", lat, lng, err);
    return generateFallbackSoil(lat, lng);
  }
}

export async function fetchSoilProfile(lat: number, lng: number): Promise<SoilProfile> {
  const layers = await Promise.all(DEPTH_OPTIONS.map((d) => fetchSoilData(lat, lng, d)));
  return { layers };
}

function generateFallbackSoil(lat: number, lng: number): SoilData {
  // Colombian soil zones based on OAT (Ordenamiento Agroclimático Territorial)
  type ZoneEstimate = { ph: number; om: number; clay: number; sand: number };
  const zones: { check: (lat: number, lng: number) => boolean; val: ZoneEstimate }[] = [
    // Amazonía: suelos muy ácidos, baja MO, alta arcilla
    { check: (lat, lng) => lat < 3 && lng < -70, val: { ph: 4.5, om: 2.0, clay: 45, sand: 20 } },
    // Orinoquía: suelos ácidos, baja MO, arenosos
    {
      check: (lat, lng) => lat >= 3 && lat < 7 && lng > -72 && lng < -68,
      val: { ph: 5.0, om: 2.2, clay: 20, sand: 50 },
    },
    // Costa Pacífica: muy húmedos, ácidos, alto MO
    { check: (lat, lng) => lng < -76 && lat < 7, val: { ph: 5.2, om: 4.0, clay: 35, sand: 25 } },
    // Costa Caribe: alcalinos, calcáreos
    { check: (lat, lng) => lat > 8 && lng < -74, val: { ph: 6.8, om: 2.5, clay: 30, sand: 30 } },
    // Sierra Nevada / alta montaña: ácidos
    { check: (lat, lng) => lat > 10 && lng < -73, val: { ph: 5.0, om: 4.5, clay: 25, sand: 25 } },
    // Región Andina (Santander, Boyacá, Cundinamarca, etc.)
    {
      check: (lat, lng) => lat >= 4 && lat <= 8 && lng >= -75 && lng <= -72,
      val: { ph: 5.8, om: 3.5, clay: 25, sand: 35 },
    },
  ];

  const match = zones.find((z) => z.check(lat, lng));
  const est: ZoneEstimate = match?.val ?? { ph: 5.5, om: 3.0, clay: 28, sand: 32 };
  const silt = 100 - est.clay - est.sand;

  return {
    ph: est.ph,
    organicMatter: est.om,
    texture: mapTexture(est.clay, est.sand, silt),
    clay: est.clay,
    sand: est.sand,
    silt,
    depth: 30,
    waterRetention: est.clay > 30 ? 80 : est.clay > 15 ? 50 : 25,
    drainage: mapDrainage(est.clay, est.sand),
    fertility: mapFertility(est.ph, est.om),
    salinity: 0,
    erosionRisk: est.clay < 15 ? "Alta" : est.clay > 30 ? "Baja" : "Media",
    landUse: mapLandUse(est.ph, mapTexture(est.clay, est.sand, silt)),
    carbonStock: +(est.om * 10).toFixed(0),
    sourceType: "estimated",
    sourceDescription:
      "Propiedades edáficas estimadas por zonificación agroecológica regional (OAT). No es una medición directa in-situ.",
  };
}
