import { supabase, isSupabaseConfigured } from "./supabase";
import type { CropKey } from "@/types/crops";
import type { MunicipalityClimateState } from "./climate-state";
import {
  extractClimateFeatures,
  generateStatisticalForecast,
  buildUnifiedSeriesPoints,
  type ClimateFeatures,
} from "./forecasting-engine";
import { requestGeminiAgronomicAssessment } from "./gemini-service";
import type {
  HistoricalPredictionUnifiedPoint,
  ValidatedHistoricalObservation,
  StatisticalForecastPoint,
  ChartFilters,
  SeriesQueryResult,
  SeriesQueryStatus,
  GeminiAssessment,
} from "@/types/historical-prediction";

export type {
  HistoricalPredictionUnifiedPoint as HistoricalPredictionPoint,
  ChartFilters,
  ClimateFeatures,
  SeriesQueryResult,
  SeriesQueryStatus,
  ValidatedHistoricalObservation,
  StatisticalForecastPoint,
  GeminiAssessment,
};

export { extractClimateFeatures };

export function normalizeMunicipalitySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normalizes, validates, and sorts historical and prediction series.
 * Guarantees chronological order (date ASC), strict null handling,
 * and clear data type segregation.
 */
export function normalizeHistoricalPredictionData(
  points: HistoricalPredictionUnifiedPoint[],
): HistoricalPredictionUnifiedPoint[] {
  if (!Array.isArray(points)) return [];

  // Filter out corrupted points
  const validPoints = points.filter(
    (p) =>
      p && Number.isFinite(p.year) && (p.historicalValue !== null || p.predictedValue !== null),
  );

  // Sort strictly by year and month ASC
  return validPoints.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (a.month ?? 0) - (b.month ?? 0);
  });
}

/**
 * Resolves a municipality name to its official UUID from Supabase.
 */
export async function resolveMunicipalityId(municipalityName: string): Promise<string | null> {
  if (!municipalityName || !isSupabaseConfigured()) return null;

  try {
    const raw = municipalityName.trim();

    // 1. Exact match
    const { data: exact } = await supabase
      .from("municipios")
      .select("id")
      .ilike("nombre", raw)
      .limit(1)
      .maybeSingle();

    if (exact?.id) return exact.id;

    // 2. Unaccented match
    const unaccented = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const { data: allMunis } = await supabase.from("municipios").select("id, nombre").limit(200);

    if (allMunis && Array.isArray(allMunis)) {
      const match = allMunis.find((m) => {
        const norm = m.nombre
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return norm === unaccented || norm.includes(unaccented) || unaccented.includes(norm);
      });
      if (match?.id) return match.id;
    }

    // 3. Fallback ILIKE pattern
    const upperUnaccented = raw
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const { data: byUpper } = await supabase
      .from("municipios")
      .select("id")
      .ilike("nombre", `%${upperUnaccented}%`)
      .limit(1)
      .maybeSingle();

    if (byUpper?.id) return byUpper.id;

    return null;
  } catch (err) {
    console.warn("[HistoricalPrediction] Municipality resolution error:", err);
    return null;
  }
}

/**
 * Compatibility wrapper for calculateAgroclimaticYieldPrediction
 */
export function calculateAgroclimaticYieldPrediction({
  municipalityId,
  municipalityName,
  crop,
  historicalRecords,
  features,
  futureYears,
}: {
  municipalityId: string;
  municipalityName: string;
  crop: CropKey;
  historicalRecords: { year: number; yield: number; harvestedAreaHa?: number | null }[];
  features: ClimateFeatures;
  futureYears: number[];
}): HistoricalPredictionUnifiedPoint[] {
  const valid = (historicalRecords || []).filter(
    (r) => r && Number.isFinite(r.year) && Number.isFinite(r.yield) && r.yield > 0,
  );

  // If fewer than 3 valid historical points are provided, return empty array (insufficient data).
  if (valid.length < 3) {
    return [];
  }

  const result = generateStatisticalForecast({
    municipalityId,
    municipalityName,
    crop,
    historicalRecords: valid,
    features,
    targetYears: futureYears,
  });

  return buildUnifiedSeriesPoints([], result.predictions);
}

/**
 * Main query function: fetches real verified historical observations and
 * executes the reproducible statistical forecasting engine immediately without blocking on Gemini.
 */
export async function fetchHistoricalAndPredictionDetails(
  filters: ChartFilters,
  climateState?: MunicipalityClimateState | null,
): Promise<SeriesQueryResult> {
  const { municipality, crop, yearRange } = filters;
  const currentYear = new Date().getFullYear();

  const emptyResult: SeriesQueryResult = {
    municipalityId: "",
    municipalityName: municipality,
    cropId: crop,
    lastObservedYear: null,
    status: "no_data",
    historicalObservations: [],
    predictions: [],
    points: [],
    geminiAssessment: null,
  };

  if (!municipality || !crop) return emptyResult;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      ...emptyResult,
      status: "network_error",
      errorMessage: "Se requiere conexión a internet para consultar registros históricos de EVA.",
    };
  }

  const muniId = await resolveMunicipalityId(municipality);
  if (!muniId) {
    return {
      ...emptyResult,
      status: "municipality_not_found",
      errorMessage: `El municipio "${municipality}" no fue encontrado en el catálogo oficial de Santander.`,
    };
  }

  const minYear = yearRange ? yearRange[0] : 2015;
  const maxYear = yearRange ? yearRange[1] : 2028;

  try {
    // 1. Fetch real historical observations from EVA (rendimiento_historico)
    let histQuery = supabase
      .from("rendimiento_historico")
      .select("id, anio, rendimiento_ton_ha, superficie_ha")
      .eq("municipio_id", muniId)
      .eq("cultivo_id", crop)
      .order("anio", { ascending: true });

    if (minYear) histQuery = histQuery.gte("anio", minYear);
    if (maxYear) histQuery = histQuery.lte("anio", Math.min(maxYear, currentYear));

    const { data: histData, error: histError } = await histQuery;
    if (histError) {
      console.warn("[HistoricalPrediction] Supabase query error:", histError);
      return {
        ...emptyResult,
        status: "database_error",
        errorMessage: "Error al consultar la base de datos de rendimiento histórico.",
      };
    }

    const obsByYear = new Map<number, ValidatedHistoricalObservation>();

    if (histData && Array.isArray(histData)) {
      for (const row of histData) {
        if (
          Number.isFinite(row.anio) &&
          row.anio >= 2000 &&
          row.anio <= currentYear &&
          Number.isFinite(row.rendimiento_ton_ha) &&
          row.rendimiento_ton_ha > 0
        ) {
          const year = row.anio;
          const currentYield = +row.rendimiento_ton_ha.toFixed(3);
          const existing = obsByYear.get(year);

          if (!existing) {
            obsByYear.set(year, {
              id: String(row.id ?? `eva-${muniId}-${crop}-${year}`),
              year,
              date: String(year),
              yieldTonHa: currentYield,
              harvestedAreaHa: row.superficie_ha ?? null,
              source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
              municipalityId: muniId,
              municipalityName: municipality,
              cropId: crop,
              qualityScore: 0.95,
              isHistorical: true,
            });
          } else {
            // Weighted average by harvested surface area if available
            const area1 = existing.harvestedAreaHa || 1;
            const area2 = row.superficie_ha || 1;
            const weightedYield = +(
              (existing.yieldTonHa * area1 + currentYield * area2) /
              (area1 + area2)
            ).toFixed(3);
            existing.yieldTonHa = weightedYield;
            if (row.superficie_ha) {
              existing.harvestedAreaHa = (existing.harvestedAreaHa || 0) + row.superficie_ha;
            }
          }
        }
      }
    }

    const validatedObservations = Array.from(obsByYear.values()).sort((a, b) => a.year - b.year);

    if (validatedObservations.length === 0) {
      return {
        ...emptyResult,
        municipalityId: muniId,
        status: "no_historical_data",
        errorMessage: `No existen registros históricos reportados en EVA para ${crop} en ${municipality}.`,
      };
    }

    const historicalForForecast = validatedObservations.map((o) => ({
      year: o.year,
      yield: o.yieldTonHa,
      harvestedAreaHa: o.harvestedAreaHa,
    }));

    const lastObservedYear = Math.max(...validatedObservations.map((o) => o.year));

    // 2. Extract zonal climate features
    const features = extractClimateFeatures(municipality, muniId, climateState);

    // Target forecast horizon: next 2 to 3 future years strictly after lastObservedYear
    const targetYears = [lastObservedYear + 1, lastObservedYear + 2, lastObservedYear + 3].filter(
      (y) => y <= maxYear,
    );

    // 3. Generate reproducible statistical forecast
    const forecastResult = generateStatisticalForecast({
      municipalityId: muniId,
      municipalityName: municipality,
      crop,
      historicalRecords: historicalForForecast,
      features,
      targetYears: targetYears.length > 0 ? targetYears : [lastObservedYear + 1],
    });

    // 4. Build unified points for chart rendering
    const points = buildUnifiedSeriesPoints(validatedObservations, forecastResult.predictions);

    let finalStatus: SeriesQueryStatus = "ready";
    if (forecastResult.status === "insufficient_data") {
      finalStatus = "insufficient_data";
    }

    return {
      municipalityId: muniId,
      municipalityName: municipality,
      cropId: crop,
      lastObservedYear,
      status: finalStatus,
      historicalObservations: validatedObservations,
      predictions: forecastResult.predictions,
      points: normalizeHistoricalPredictionData(points),
      geminiAssessment: null, // Loaded asynchronously by secondary query
      insufficientDataReason: forecastResult.insufficientReason,
    };
  } catch (err) {
    console.warn("[HistoricalPrediction] Query error:", err);
    return {
      ...emptyResult,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Error inesperado al procesar los datos.",
    };
  }
}

/**
 * Asynchronous secondary query for Gemini qualitative agronomic assessment
 */
export async function fetchGeminiAssessmentForSeries({
  municipality,
  crop,
  historicalRecords,
  predictedYield,
  modelName,
  features,
}: {
  municipality: string;
  crop: CropKey;
  historicalRecords: { year: number; yield: number }[];
  predictedYield: number;
  modelName: string;
  features: ClimateFeatures;
}): Promise<GeminiAssessment | null> {
  return requestGeminiAgronomicAssessment({
    municipio: municipality,
    crop,
    historicalYields: historicalRecords,
    predictedYield,
    modelName,
    features,
  });
}

/**
 * Standard fetch function returning the array of points expected by TanStack Query in YieldChart
 */
export async function fetchHistoricalAndPredictionSeries(
  filters: ChartFilters,
  climateState?: MunicipalityClimateState | null,
): Promise<HistoricalPredictionUnifiedPoint[]> {
  const result = await fetchHistoricalAndPredictionDetails(filters, climateState);
  return result.points;
}
