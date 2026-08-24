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
} from "@/types/historical-prediction";

export type {
  HistoricalPredictionUnifiedPoint as HistoricalPredictionPoint,
  ChartFilters,
  ClimateFeatures,
  SeriesQueryResult,
  ValidatedHistoricalObservation,
  StatisticalForecastPoint,
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
 * Resolves municipality ID from Supabase using multiple fallback strategies:
 * 1. Direct ID slug match (e.g. "bucaramanga", "san_gil")
 * 2. Unaccented case-insensitive ILIKE match on "nombre"
 */
export async function resolveMunicipalityId(municipioName: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !municipioName) return null;

  const slug = normalizeMunicipalitySlug(municipioName);

  try {
    const { data: byId } = await supabase
      .from("municipios")
      .select("id")
      .eq("id", slug)
      .maybeSingle();

    if (byId?.id) return byId.id;

    const { data: byIlike } = await supabase
      .from("municipios")
      .select("id")
      .ilike("nombre", municipioName.trim())
      .maybeSingle();

    if (byIlike?.id) return byIlike.id;

    const upperUnaccented = municipioName
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
  // Never create synthetic observations or substitute real data with base constants.
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
 * Main query function: fetches real verified historical observations, executes
 * the reproducible statistical forecasting engine, and asynchronously queries Gemini.
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

  const muniId = await resolveMunicipalityId(municipality);
  if (!muniId) return { ...emptyResult, status: "error" };

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
    if (histError) throw histError;

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
            // Formal deduplication: weighted average by harvested surface area if available
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
    const historicalForForecast = validatedObservations.map((o) => ({
      year: o.year,
      yield: o.yieldTonHa,
      harvestedAreaHa: o.harvestedAreaHa,
    }));

    const lastObservedYear =
      validatedObservations.length > 0
        ? Math.max(...validatedObservations.map((o) => o.year))
        : null;

    // 2. Extract zonal climate features
    const features = extractClimateFeatures(municipality, muniId, climateState);

    // Target forecast horizon: next 2 to 3 future years strictly after lastObservedYear
    const targetYears = lastObservedYear
      ? [lastObservedYear + 1, lastObservedYear + 2, lastObservedYear + 3].filter(
          (y) => y <= maxYear,
        )
      : [currentYear, currentYear + 1];

    // 3. Generate reproducible statistical forecast
    const forecastResult = generateStatisticalForecast({
      municipalityId: muniId,
      municipalityName: municipality,
      crop,
      historicalRecords: historicalForForecast,
      features,
      targetYears,
    });

    // 4. Request Gemini agronomic assessment (responsible reasoning layer)
    let geminiAssessment = null;
    if (forecastResult.status === "ready" && forecastResult.predictions.length > 0) {
      const firstPrediction = forecastResult.predictions[0];
      geminiAssessment = await requestGeminiAgronomicAssessment({
        municipio: municipality,
        crop,
        historicalYields: historicalForForecast.map((h) => ({ year: h.year, yield: h.yield })),
        predictedYield: firstPrediction.predictedYield,
        modelName: firstPrediction.modelName,
        features,
      });
    }

    // 5. Build unified points for chart rendering
    const points = buildUnifiedSeriesPoints(validatedObservations, forecastResult.predictions);

    return {
      municipalityId: muniId,
      municipalityName: municipality,
      cropId: crop,
      lastObservedYear,
      status: forecastResult.status === "insufficient_data" ? "insufficient_data" : "ready",
      historicalObservations: validatedObservations,
      predictions: forecastResult.predictions,
      points: normalizeHistoricalPredictionData(points),
      geminiAssessment,
      insufficientDataReason: forecastResult.insufficientReason,
    };
  } catch (err) {
    console.warn("[HistoricalPrediction] Query error:", err);
    return {
      ...emptyResult,
      status: "error",
    };
  }
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
