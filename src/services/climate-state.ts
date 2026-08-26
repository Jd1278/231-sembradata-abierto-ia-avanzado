import type { CropKey, RiskLevel } from "@/types/crops";
import { fetchCurrentClimate, type ClimateData } from "./climate-api";
import {
  calculateAgroclimaticRisk,
  calculateClimateMetrics,
  type CalculatedClimateMetrics,
} from "./climate-calculator";
import type { CropClimateRequirements } from "@/types/database";

export type MunicipalityClimateStatus = "ready" | "partial" | "error" | "no-data";

export interface MunicipalityClimateState {
  municipio: string;
  climate: ClimateData | null;
  altitude: number;
  score: number; // 0-100 Compatibility score
  riskScore: number | null; // 0.00 - 1.00 Risk score
  level: RiskLevel; // "Bajo" | "Medio" | "Alto" | "NoData"
  status: MunicipalityClimateStatus;
  computedAt: string;
  error?: string;
}

export type Location = {
  name: string;
  geolat: number;
  geolng: number;
  altitude: number;
};

const climateByLocation = new Map<string, { data: ClimateData; at: number }>();
const inFlightRequests = new Map<string, Promise<ClimateData>>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 min TTL

/**
 * Deterministic climate suitability and agroclimatic risk classification
 * powered by the central ClimateCalculator.
 */
export function classifyMunicipalityClimate(
  municipio: string,
  crop: CropKey,
  climate: ClimateData | null,
  altitude: number,
  dbReq?: CropClimateRequirements | null,
): MunicipalityClimateState {
  if (!climate || !climate.dailyData || climate.dailyData.length === 0) {
    return {
      municipio,
      climate: null,
      altitude,
      score: 0,
      riskScore: null,
      level: "NoData",
      status: "no-data",
      computedAt: new Date().toISOString(),
    };
  }

  const metrics: CalculatedClimateMetrics =
    climate.metrics ??
    calculateClimateMetrics(
      climate.dailyData.map((d) => ({
        date: d.date,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        precip: d.precip,
        humidity: d.humidity,
        windSpeed: d.windSpeed,
        solarRad: d.solarRad,
        uvIndex: d.uvIndex,
        et0: d.et0,
      })),
      {
        source: "Open-Meteo",
        expectedDays: climate.dailyData.length,
        latitude: climate.temperature,
      },
    );

  const riskEval = calculateAgroclimaticRisk(municipio, crop, metrics, altitude, dbReq);

  return {
    municipio,
    climate,
    altitude,
    score: Math.round(riskEval.compatibilityScore * 100),
    riskScore: riskEval.riskScore,
    level: riskEval.riskLevel,
    status: riskEval.status,
    computedAt: riskEval.computedAt,
  };
}

async function climateFor(location: Location): Promise<ClimateData> {
  const key = `${location.geolat.toFixed(4)},${location.geolng.toFixed(4)}`;
  const now = Date.now();

  const cached = climateByLocation.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = inFlightRequests.get(key);
  if (inFlight) return inFlight;

  const request = fetchCurrentClimate(location.geolat, location.geolng, 90)
    .then((data) => {
      climateByLocation.set(key, { data, at: Date.now() });
      inFlightRequests.delete(key);
      return data;
    })
    .catch((error) => {
      inFlightRequests.delete(key);
      throw error;
    });

  inFlightRequests.set(key, request);
  return request;
}

/**
 * Concurrency limiter / pool runner for batching API requests.
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      try {
        const val = await fn(items[idx]);
        results[idx] = { status: "fulfilled", value: val };
      } catch (err) {
        results[idx] = { status: "rejected", reason: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Robustly builds climate states for all municipalities.
 * Uses controlled concurrency (8 simultaneous requests) and Promise.allSettled
 * so that single-municipality failures NEVER crash the entire map.
 */
export async function buildMunicipalityClimateStates(
  locations: Location[],
  crop: CropKey,
  dbReq?: CropClimateRequirements | null,
): Promise<Record<string, MunicipalityClimateState>> {
  const settledResults = await mapConcurrent(locations, 8, async (loc) => {
    const climate = await climateFor(loc);
    return { loc, climate };
  });

  const entries: [string, MunicipalityClimateState][] = [];

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const res = settledResults[i];

    if (res && res.status === "fulfilled" && res.value.climate) {
      const state = classifyMunicipalityClimate(
        loc.name,
        crop,
        res.value.climate,
        loc.altitude,
        dbReq,
      );
      entries.push([loc.name, state]);
    } else {
      // Graceful individual failure: classify as NoData without breaking the whole map
      const errorMsg =
        res && res.status === "rejected"
          ? String(res.reason?.message ?? res.reason)
          : "No data available";
      entries.push([
        loc.name,
        {
          municipio: loc.name,
          climate: null,
          altitude: loc.altitude,
          score: 0,
          riskScore: null,
          level: "NoData",
          status: "error",
          computedAt: new Date().toISOString(),
          error: errorMsg,
        },
      ]);
    }
  }

  return Object.fromEntries(entries);
}

export function clearMunicipalityClimateStateCache(): void {
  climateByLocation.clear();
  inFlightRequests.clear();
}
