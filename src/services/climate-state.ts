import type { CropKey, Risk } from "@/types/crops";
import { CROP_REQUIREMENTS } from "@/data/crop-requirements";
import { fetchCurrentClimate, type ClimateData } from "./climate-api";

export interface MunicipalityClimateState {
  municipio: string;
  climate: ClimateData;
  altitude: number;
  score: number;
  level: Risk;
  computedAt: string;
}

type Location = { name: string; geolat: number; geolng: number; altitude: number };

const climateByLocation = new Map<string, Promise<ClimateData>>();

function rangeScore(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 1;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 1 - distance / tolerance);
}

/** Deterministic climate-only suitability used by both the map and zone summary. */
export function classifyMunicipalityClimate(
  municipio: string,
  crop: CropKey,
  climate: ClimateData,
  altitude: number,
): MunicipalityClimateState {
  const req = CROP_REQUIREMENTS[crop];
  const annualPrecipitation = climate.precipitation * 365;
  const temperature = rangeScore(climate.temperature, req.tempOptima.min, req.tempOptima.max, 8);
  const precipitation = rangeScore(
    annualPrecipitation,
    req.precipitacionAnual.min,
    req.precipitacionAnual.max,
    req.precipitacionAnual.max * 0.6,
  );
  const altitudeScore = rangeScore(altitude, req.altitud.min, req.altitud.max, 1000);
  const humidity = crop === "cacao" ? rangeScore(climate.humidity, 70, 90, 25) : 1;
  const score = Math.round(
    (temperature * 0.35 + precipitation * 0.3 + altitudeScore * 0.25 + humidity * 0.1) * 100,
  );
  const level: Risk = score >= 70 ? "Bajo" : score >= 45 ? "Medio" : "Alto";
  return { municipio, climate, altitude, score, level, computedAt: new Date().toISOString() };
}

function climateFor(location: Location): Promise<ClimateData> {
  const key = `${location.geolat.toFixed(4)},${location.geolng.toFixed(4)}`;
  const existing = climateByLocation.get(key);
  if (existing) return existing;
  const request = fetchCurrentClimate(location.geolat, location.geolng, 90).catch((error) => {
    climateByLocation.delete(key);
    throw error;
  });
  climateByLocation.set(key, request);
  return request;
}

/** Fetch once per coordinate and only expose a completed, all-municipality snapshot. */
export async function buildMunicipalityClimateStates(
  locations: Location[],
  crop: CropKey,
): Promise<Record<string, MunicipalityClimateState>> {
  const entries = await Promise.all(
    locations.map(async (location) => {
      const climate = await climateFor(location);
      return [
        location.name,
        classifyMunicipalityClimate(location.name, crop, climate, location.altitude),
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function clearMunicipalityClimateStateCache(): void {
  climateByLocation.clear();
}
