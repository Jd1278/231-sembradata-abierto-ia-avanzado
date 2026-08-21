import type { AlternativeCrop } from "@/types/prediction-v2";
import { trapezoidalScore } from "./climate-calculator";

export interface CropRecommendationContext {
  temperature: number;
  precipitationDaily: number;
  humidity: number;
  altitude: number;
  precipitationAnnual?: number;
}

export interface CandidateCropProfile {
  key: string;
  name: string;
  scientificName: string;
  estimatedYield: string;
  bestSeason: string;
  // Bioclimatic thresholds [min, optMin, optMax, max]
  temp: [number, number, number, number];
  precipAnnual: [number, number, number, number];
  altitude: [number, number, number, number];
  humidity: [number, number, number, number];
}

export const CANDIDATE_CROPS: CandidateCropProfile[] = [
  {
    key: "cacao",
    name: "Cacao",
    scientificName: "Theobroma cacao",
    estimatedYield: "0.85–1.2 t/ha",
    bestSeason: "Abril–mayo",
    temp: [18, 22, 28, 32],
    precipAnnual: [1200, 1500, 2500, 3000],
    altitude: [0, 100, 800, 1000],
    humidity: [65, 75, 88, 98],
  },
  {
    key: "cafe",
    name: "Café",
    scientificName: "Coffea arabica",
    estimatedYield: "1.2–1.8 t/ha",
    bestSeason: "Marzo–abril",
    temp: [16, 18, 22, 26],
    precipAnnual: [1200, 1500, 2200, 2800],
    altitude: [1000, 1200, 1800, 2100],
    humidity: [55, 65, 85, 95],
  },
  {
    key: "granadilla",
    name: "Granadilla",
    scientificName: "Passiflora ligularis",
    estimatedYield: "9–12 t/ha",
    bestSeason: "Septiembre–octubre",
    temp: [12, 15, 18, 22],
    precipAnnual: [900, 1200, 2000, 2600],
    altitude: [1500, 1800, 2600, 2900],
    humidity: [55, 65, 80, 90],
  },
  {
    key: "aguacate",
    name: "Aguacate Hass",
    scientificName: "Persea americana",
    estimatedYield: "8–15 t/ha",
    bestSeason: "Según calendario local",
    temp: [14, 16, 22, 26],
    precipAnnual: [1000, 1200, 2000, 2600],
    altitude: [1200, 1500, 2400, 2700],
    humidity: [55, 65, 85, 92],
  },
  {
    key: "platano",
    name: "Plátano",
    scientificName: "Musa paradisiaca",
    estimatedYield: "15–25 t/ha",
    bestSeason: "Todo el año",
    temp: [18, 22, 28, 34],
    precipAnnual: [1100, 1500, 2500, 3200],
    altitude: [0, 200, 1500, 1800],
    humidity: [60, 70, 90, 98],
  },
  {
    key: "yuca",
    name: "Yuca",
    scientificName: "Manihot esculenta",
    estimatedYield: "10–20 t/ha",
    bestSeason: "Inicio de lluvias",
    temp: [20, 24, 30, 36],
    precipAnnual: [600, 900, 1800, 2500],
    altitude: [0, 100, 1200, 1500],
    humidity: [45, 60, 80, 90],
  },
  {
    key: "lulo",
    name: "Lulo",
    scientificName: "Solanum quitoense",
    estimatedYield: "10–15 t/ha",
    bestSeason: "Inicio de lluvias",
    temp: [14, 16, 20, 24],
    precipAnnual: [1300, 1600, 2500, 3200],
    altitude: [1400, 1700, 2400, 2700],
    humidity: [65, 75, 90, 98],
  },
  {
    key: "tomate_arbol",
    name: "Tomate de árbol",
    scientificName: "Solanum betaceum",
    estimatedYield: "12–20 t/ha",
    bestSeason: "Según calendario local",
    temp: [12, 14, 18, 22],
    precipAnnual: [1000, 1300, 2000, 2600],
    altitude: [1600, 1800, 2600, 2900],
    humidity: [55, 65, 85, 95],
  },
  {
    key: "citricos",
    name: "Cítricos (Naranja/Limón)",
    scientificName: "Citrus spp.",
    estimatedYield: "15–30 t/ha",
    bestSeason: "Marzo–mayo",
    temp: [18, 22, 28, 34],
    precipAnnual: [900, 1200, 2000, 2800],
    altitude: [0, 200, 1200, 1600],
    humidity: [50, 65, 85, 95],
  },
];

function normalizeCropKey(str?: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Recommends strictly compatible alternative crops based on real agroclimatic data.
 * Applies mandatory Hard Constraint filtering before scoring and ranking.
 */
export function recommendAlternativeCrops(
  context: CropRecommendationContext,
  excludeCrop?: string,
): AlternativeCrop[] {
  // If climate parameters are not finite numbers, return empty array immediately
  if (
    !Number.isFinite(context.temperature) ||
    !Number.isFinite(context.altitude) ||
    !Number.isFinite(context.humidity) ||
    !Number.isFinite(context.precipitationDaily)
  ) {
    return [];
  }

  const annualPrecip = context.precipitationAnnual ?? Math.round(context.precipitationDaily * 365);
  const normalizedExclude = normalizeCropKey(excludeCrop);

  // 1. Filter out the currently analyzed crop
  const nonExcluded = CANDIDATE_CROPS.filter((candidate) => {
    const keyNorm = normalizeCropKey(candidate.key);
    const nameNorm = normalizeCropKey(candidate.name);
    return keyNorm !== normalizedExclude && nameNorm !== normalizedExclude;
  });

  const compatibleCandidates: (AlternativeCrop & { finalScore: number })[] = [];

  for (const candidate of nonExcluded) {
    const [tMin, tOptMin, tOptMax, tMax] = candidate.temp;
    const [pMin, pOptMin, pOptMax, pMax] = candidate.precipAnnual;
    const [altMin, altOptMin, altOptMax, altMax] = candidate.altitude;
    const [hMin, hOptMin, hOptMax, hMax] = candidate.humidity;

    // 2. HARD FILTER EXCLUSIONS (MANDATORY):
    // If any single variable is outside the physiological minimum or maximum,
    // the crop is completely disqualified and CANNOT be recommended.
    if (context.temperature < tMin || context.temperature > tMax) continue;
    if (context.altitude < altMin || context.altitude > altMax) continue;
    if (annualPrecip < pMin || annualPrecip > pMax) continue;
    if (context.humidity < hMin || context.humidity > hMax) continue;

    // 3. Trapezoidal membership score for each variable
    const sTemp = trapezoidalScore(context.temperature, tMin, tOptMin, tOptMax, tMax);
    const sPrecip = trapezoidalScore(annualPrecip, pMin, pOptMin, pOptMax, pMax);
    const sAlt = trapezoidalScore(context.altitude, altMin, altOptMin, altOptMax, altMax);
    const sHum = trapezoidalScore(context.humidity, hMin, hOptMin, hOptMax, hMax);

    // 4. Central weighted compatibility score
    const totalScore = Math.round((sTemp * 0.35 + sPrecip * 0.3 + sAlt * 0.2 + sHum * 0.15) * 100);

    // Reject candidates with negligible compatibility
    if (totalScore < 30) continue;

    // 5. Generate descriptive agronomic explanation
    const favorableVariables: string[] = [];
    if (sTemp >= 0.8)
      favorableVariables.push(`Temperatura óptima (${context.temperature.toFixed(1)}°C)`);
    else if (sTemp > 0)
      favorableVariables.push(`Temperatura adecuada (${context.temperature.toFixed(1)}°C)`);

    if (sAlt >= 0.8)
      favorableVariables.push(`Altitud ideal (${Math.round(context.altitude)} msnm)`);
    else if (sAlt > 0)
      favorableVariables.push(`Altitud adecuada (${Math.round(context.altitude)} msnm)`);

    if (sPrecip >= 0.8)
      favorableVariables.push(`Régimen hídrico óptimo (${Math.round(annualPrecip)} mm/año)`);
    if (sHum >= 0.8)
      favorableVariables.push(`Humedad favorable (${Math.round(context.humidity)}%)`);

    const reason = `Compatibilidad agroclimática: ${totalScore}%. ${favorableVariables.join(", ")}.`;

    compatibleCandidates.push({
      name: candidate.name,
      reason,
      estimatedYield: candidate.estimatedYield,
      bestSeason: candidate.bestSeason,
      score: totalScore,
      compatibility: {
        temperature: Math.round(sTemp * 100),
        precipitation: Math.round(sPrecip * 100),
        humidity: Math.round(sHum * 100),
        altitude: Math.round(sAlt * 100),
      },
      finalScore: totalScore,
    });
  }

  // 6. Sort descending by score, then alphabetically, and take max top 3
  return compatibleCandidates
    .sort((a, b) => b.finalScore - a.finalScore || a.name.localeCompare(b.name, "es"))
    .slice(0, 3)
    .map(({ finalScore: _f, ...crop }) => crop);
}
