import { supabase, isSupabaseConfigured } from "./supabase";
import type { CropKey, SoilType } from "@/types/crops";
import {
  CROP_DATA,
  getOfficialAltitude,
  estimateTemperature,
  estimatePrecipitation,
} from "@/components/sembradata/data";
import { CROP_REQUIREMENTS } from "@/data/crop-requirements";
import { trapezoidalScore } from "./climate-calculator";
import type { MunicipalityClimateState } from "./climate-state";

export interface HistoricalPredictionPoint {
  date: string;
  year: number;
  month?: number;
  historicalValue: number | null;
  predictedValue: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  dataType: "historical" | "prediction";
  source: string;
  confidence: number | null;
  municipalityId: string;
  cropId: string;
  variable: "yield" | "temperature" | "precipitation" | "risk_score";
  unit: string;
  scores?: {
    temperatureScore: number;
    precipitationScore: number;
    humidityScore: number;
    altitudeScore: number;
    waterScore: number;
    climateScore: number;
    trendFactor: number;
  };
}

export interface ChartFilters {
  municipality: string;
  crop: CropKey;
  variable?: "yield" | "temperature" | "precipitation" | "risk_score";
  yearRange?: [number, number];
  altitudeRange?: [number, number];
  tempRange?: [number, number];
  precipRange?: [number, number];
  soilType?: SoilType;
}

export interface ClimateFeatures {
  municipalityId: string;
  municipalityName: string;
  altitude: number;
  temperatureMean: number;
  temperatureMin: number;
  temperatureMax: number;
  precipitationAnnual: number;
  humidityMean: number;
  et0Annual: number;
  waterBalance: number;
  dataQuality: number;
}

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
  points: HistoricalPredictionPoint[],
): HistoricalPredictionPoint[] {
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
    // 1. Try direct ID slug match
    const { data: byId } = await supabase
      .from("municipios")
      .select("id")
      .eq("id", slug)
      .maybeSingle();

    if (byId?.id) return byId.id;

    // 2. Try ILIKE with raw name
    const { data: byIlike } = await supabase
      .from("municipios")
      .select("id")
      .ilike("nombre", municipioName.trim())
      .maybeSingle();

    if (byIlike?.id) return byIlike.id;

    // 3. Try ILIKE with uppercase unaccented name
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
 * Extracts or computes zonal climate features for a municipality.
 */
export function extractClimateFeatures(
  municipalityName: string,
  muniId: string,
  climateState?: MunicipalityClimateState | null,
): ClimateFeatures {
  const altitude = climateState?.altitude ?? getOfficialAltitude(municipalityName);

  // If real observed climate is available in state, use it
  if (climateState?.climate && climateState.status === "ready") {
    const climate = climateState.climate;
    const tempMean = climate.temperature;
    const tempMin = climate.temperatureMin ?? tempMean - 5.5;
    const tempMax = climate.temperatureMax ?? tempMean + 6.0;
    const precipAnnual = climate.precipitation
      ? climate.precipitation * 12
      : estimatePrecipitation(altitude);
    const humidityMean =
      climate.humidity ?? Math.min(88, Math.max(60, 85 - (altitude / 1000) * 3.5));
    const et0Annual =
      (climate.metrics?.evapotranspiration ? climate.metrics.evapotranspiration * 12 : null) ??
      Math.max(800, 1650 - altitude * 0.35);

    return {
      municipalityId: muniId,
      municipalityName,
      altitude,
      temperatureMean: tempMean,
      temperatureMin: tempMin,
      temperatureMax: tempMax,
      precipitationAnnual: precipAnnual,
      humidityMean,
      et0Annual,
      waterBalance: precipAnnual - et0Annual,
      dataQuality: 0.95,
    };
  }

  // High-fidelity physical altitude-dependent estimation
  const tempMean = estimateTemperature(altitude);
  const tempMin = tempMean - 5.5;
  const tempMax = tempMean + 6.0;
  const precipAnnual = estimatePrecipitation(altitude);
  const humidityMean = Math.min(88, Math.max(60, 85 - (altitude / 1000) * 3.5));
  const et0Annual = Math.max(800, 1650 - altitude * 0.35);

  return {
    municipalityId: muniId,
    municipalityName,
    altitude,
    temperatureMean: tempMean,
    temperatureMin: tempMin,
    temperatureMax: tempMax,
    precipitationAnnual: precipAnnual,
    humidityMean,
    et0Annual,
    waterBalance: precipAnnual - et0Annual,
    dataQuality: 0.88,
  };
}

/**
 * Deterministic Agroclimatic Prediction Model:
 * Y_pred = Y_base * TrendFactor * ClimateFactor
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
  historicalRecords: { year: number; yield: number }[];
  features: ClimateFeatures;
  futureYears: number[];
}): HistoricalPredictionPoint[] {
  const req = CROP_REQUIREMENTS[crop] ?? CROP_REQUIREMENTS.cacao;
  const cropData = CROP_DATA[crop];

  // 1. Sanitize and Calculate Base Yield (Y_base)
  const validRecords = Array.isArray(historicalRecords)
    ? historicalRecords.filter(
        (r) => r && Number.isFinite(r.year) && Number.isFinite(r.yield) && r.yield > 0,
      )
    : [];

  let yBase = cropData?.baseYield ?? req.baseYield;
  if (validRecords.length > 0) {
    const sortedYields = validRecords.map((r) => r.yield).sort((a, b) => a - b);
    const mid = Math.floor(sortedYields.length / 2);
    // Median historical yield
    yBase =
      sortedYields.length % 2 !== 0
        ? sortedYields[mid]
        : (sortedYields[mid - 1] + sortedYields[mid]) / 2;
  }

  if (!Number.isFinite(yBase) || yBase <= 0) {
    yBase = req.baseYield;
  }

  // 2. Calculate Historical Trend Slope (beta_1)
  let trendSlope = 0;
  let rmse = 0.12 * yBase;
  const N = validRecords.length;

  if (N >= 2) {
    const meanYear = validRecords.reduce((s, r) => s + r.year, 0) / N;
    const meanYield = validRecords.reduce((s, r) => s + r.yield, 0) / N;

    let numerator = 0;
    let denominator = 0;

    for (const r of validRecords) {
      numerator += (r.year - meanYear) * (r.yield - meanYield);
      denominator += (r.year - meanYear) ** 2;
    }

    if (denominator > 0) {
      trendSlope = numerator / denominator;
    }

    // Residual standard deviation (RMSE)
    let sumSquaredResiduals = 0;
    for (const r of validRecords) {
      const predictedHist = meanYield + trendSlope * (r.year - meanYear);
      sumSquaredResiduals += (r.yield - predictedHist) ** 2;
    }
    const calcRmse = Math.sqrt(sumSquaredResiduals / Math.max(1, N - 1));
    if (Number.isFinite(calcRmse) && calcRmse > 0) {
      rmse = calcRmse;
    }
  }

  if (!Number.isFinite(trendSlope)) trendSlope = 0;
  if (!Number.isFinite(rmse) || rmse <= 0) rmse = 0.12 * yBase;

  // 3. Calculate Bioclimatic Scores
  const sTemp = trapezoidalScore(
    features.temperatureMean,
    req.tempOptima.min - 4,
    req.tempOptima.min,
    req.tempOptima.max,
    req.tempOptima.max + 5,
  );

  const sPrecip = trapezoidalScore(
    features.precipitationAnnual,
    req.precipitacionAnual.min - 350,
    req.precipitacionAnual.min,
    req.precipitacionAnual.max,
    req.precipitacionAnual.max + 650,
  );

  const sAltitude = trapezoidalScore(
    features.altitude,
    req.altitud.min - 350,
    req.altitud.min,
    req.altitud.max,
    req.altitud.max + 450,
  );

  const sHumidity = trapezoidalScore(features.humidityMean, 50, 68, 85, 96);
  const sWater = Math.min(
    1.0,
    Math.max(0.2, features.precipitationAnnual / Math.max(1, features.et0Annual)),
  );

  // Weights: Temp (0.30), Precip (0.25), Humidity (0.15), Altitude (0.10), Water (0.20)
  const climateScore = +(
    0.3 * sTemp +
    0.25 * sPrecip +
    0.15 * sHumidity +
    0.1 * sAltitude +
    0.2 * sWater
  ).toFixed(4);

  // Climate Factor adjustment in [0.60, 1.15]
  const climateFactor = Math.max(0.6, Math.min(1.15, 0.7 + 0.35 * climateScore));

  const lastObservedYear =
    historicalRecords.length > 0
      ? Math.max(...historicalRecords.map((r) => r.year))
      : new Date().getFullYear() - 1;

  const points: HistoricalPredictionPoint[] = [];

  for (const fYear of futureYears) {
    const k = Math.max(1, fYear - lastObservedYear);
    const trendFactor = Math.max(0.85, Math.min(1.15, 1.0 + (trendSlope * k) / yBase));

    const rawPrediction = yBase * trendFactor * climateFactor;
    const predictedYield = +rawPrediction.toFixed(2);

    // Uncertainty interval derived from RMSE + climate dispersion
    const uncertainty = Math.max(
      0.08 * predictedYield,
      1.2 * rmse + (1 - climateScore) * 0.22 * predictedYield,
    );

    const lowerBound = +Math.max(0, predictedYield - uncertainty).toFixed(2);
    const upperBound = +(predictedYield + uncertainty).toFixed(2);

    // Dynamic confidence score
    const historicalSupport = Math.min(1.0, Math.max(0.4, N / 5));
    const confidence = +Math.min(
      0.96,
      Math.max(0.42, features.dataQuality * historicalSupport * (0.5 + 0.5 * climateScore)),
    ).toFixed(2);

    points.push({
      date: String(fYear),
      year: fYear,
      historicalValue: null,
      predictedValue: predictedYield,
      lowerBound,
      upperBound,
      dataType: "prediction",
      source: "Modelo Agroclimático SembraData v2.5 (Zonal)",
      confidence,
      municipalityId,
      cropId: crop,
      variable: "yield",
      unit: "Ton/Ha",
      scores: {
        temperatureScore: +sTemp.toFixed(2),
        precipitationScore: +sPrecip.toFixed(2),
        humidityScore: +sHumidity.toFixed(2),
        altitudeScore: +sAltitude.toFixed(2),
        waterScore: +sWater.toFixed(2),
        climateScore: +climateScore.toFixed(2),
        trendFactor: +trendFactor.toFixed(2),
      },
    });
  }

  return points;
}

/**
 * Fetches historical yield observations from Supabase and projects future prediction
 * points based on real historical baseline and zonal agroclimatic parameters.
 */
export async function fetchHistoricalAndPredictionSeries(
  filters: ChartFilters,
  climateState?: MunicipalityClimateState | null,
): Promise<HistoricalPredictionPoint[]> {
  const { municipality, crop, yearRange } = filters;
  if (!municipality || !crop) return [];

  const muniId = await resolveMunicipalityId(municipality);
  if (!muniId) return [];

  const points: HistoricalPredictionPoint[] = [];
  const minYear = yearRange ? yearRange[0] : 2018;
  const maxYear = yearRange ? yearRange[1] : 2027;

  try {
    // 1. Fetch historical observations from Supabase
    let histQuery = supabase
      .from("rendimiento_historico")
      .select("anio, rendimiento_ton_ha, superficie_ha")
      .eq("municipio_id", muniId)
      .eq("cultivo_id", crop)
      .order("anio", { ascending: true });

    if (minYear) histQuery = histQuery.gte("anio", minYear);
    if (maxYear) histQuery = histQuery.lte("anio", maxYear);

    const { data: histData, error: histError } = await histQuery;
    if (histError) throw histError;

    const historicalRecords: { year: number; yield: number }[] = [];

    if (histData && histData.length > 0) {
      for (const row of histData) {
        if (Number.isFinite(row.rendimiento_ton_ha)) {
          historicalRecords.push({ year: row.anio, yield: row.rendimiento_ton_ha });
          points.push({
            date: String(row.anio),
            year: row.anio,
            historicalValue: row.rendimiento_ton_ha,
            predictedValue: null,
            lowerBound: null,
            upperBound: null,
            dataType: "historical",
            source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
            confidence: 0.95,
            municipalityId: muniId,
            cropId: crop,
            variable: "yield",
            unit: "Ton/Ha",
          });
        }
      }
    }

    // 2. Fetch stored predictions from Supabase if available
    const { data: predData } = await supabase
      .from("predicciones")
      .select("anio, mes, rendimiento_estimado, intervalo_confianza")
      .eq("municipio_id", muniId)
      .eq("cultivo_id", crop)
      .order("anio", { ascending: true });

    if (predData && predData.length > 0) {
      for (const row of predData) {
        if (Number.isFinite(row.rendimiento_estimado)) {
          const lower = (row.rendimiento_estimado as number) * 0.9;
          const upper = (row.rendimiento_estimado as number) * 1.1;
          points.push({
            date: String(row.anio),
            year: row.anio,
            month: row.mes ?? undefined,
            historicalValue: null,
            predictedValue: row.rendimiento_estimado,
            lowerBound: +lower.toFixed(2),
            upperBound: +upper.toFixed(2),
            dataType: "prediction",
            source: "Modelo Agroclimático SembraData (Supabase)",
            confidence: 0.85,
            municipalityId: muniId,
            cropId: crop,
            variable: "yield",
            unit: "Ton/Ha",
          });
        }
      }
    } else {
      // 3. Compute zonal agroclimatic predictions using local climate features
      const features = extractClimateFeatures(municipality, muniId, climateState);
      const lastObservedYear = points.length > 0 ? Math.max(...points.map((p) => p.year)) : 2024;

      const futureYears = [lastObservedYear + 1, lastObservedYear + 2].filter((y) => y <= maxYear);

      const predictionPoints = calculateAgroclimaticYieldPrediction({
        municipalityId: muniId,
        municipalityName: municipality,
        crop,
        historicalRecords,
        features,
        futureYears,
      });

      points.push(...predictionPoints);
    }

    return normalizeHistoricalPredictionData(points);
  } catch (err) {
    console.warn("[HistoricalPrediction] Query error:", err);
    return [];
  }
}
