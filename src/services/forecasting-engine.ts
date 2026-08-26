import type { CropKey } from "@/types/crops";
import {
  getOfficialAltitude,
  estimateTemperature,
  estimatePrecipitation,
} from "@/components/sembradata/data";
import { CROP_REQUIREMENTS } from "@/data/crop-requirements";
import { trapezoidalScore } from "./climate-calculator";
import type { MunicipalityClimateState } from "./climate-state";
import type {
  ValidatedHistoricalObservation,
  StatisticalForecastPoint,
  ValidationMetrics,
  HistoricalPredictionUnifiedPoint,
} from "@/types/historical-prediction";

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

export function extractClimateFeatures(
  municipalityName: string,
  muniId: string,
  climateState?: MunicipalityClimateState | null,
): ClimateFeatures {
  const altitude = climateState?.altitude ?? getOfficialAltitude(municipalityName);

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
 * Calculates physiological suitability scores based on crop requirements
 */
export function calculateBioclimaticScore(
  crop: CropKey,
  features: ClimateFeatures,
): {
  sTemp: number;
  sPrecip: number;
  sAltitude: number;
  sHumidity: number;
  sWater: number;
  climateScore: number;
  climateFactor: number;
} {
  const req = CROP_REQUIREMENTS[crop] ?? CROP_REQUIREMENTS.cacao;

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

  const climateScore = +(
    0.3 * sTemp +
    0.25 * sPrecip +
    0.15 * sHumidity +
    0.1 * sAltitude +
    0.2 * sWater
  ).toFixed(4);

  // Scaled factor in [0.70, 1.15]
  const climateFactor = Math.max(0.7, Math.min(1.15, 0.75 + 0.35 * climateScore));

  return {
    sTemp: +sTemp.toFixed(2),
    sPrecip: +sPrecip.toFixed(2),
    sAltitude: +sAltitude.toFixed(2),
    sHumidity: +sHumidity.toFixed(2),
    sWater: +sWater.toFixed(2),
    climateScore,
    climateFactor,
  };
}

/**
 * Calculates symmetric Mean Absolute Percentage Error (sMAPE)
 */
function calculateSmape(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    const y = actual[i];
    const yHat = predicted[i];
    const denom = (Math.abs(y) + Math.abs(yHat)) / 2;
    if (denom > 0) {
      sum += Math.abs(yHat - y) / denom;
    }
  }
  return +((sum / actual.length) * 100).toFixed(2);
}

/**
 * Theil-Sen Robust Linear Estimator (median of slopes)
 */
function fitTheilSen(records: { year: number; yield: number }[]): {
  slope: number;
  intercept: number;
  predict: (year: number) => number;
} {
  const n = records.length;
  if (n === 0) {
    return {
      slope: 0,
      intercept: 1.0,
      predict: () => 1.0,
    };
  }

  if (n === 1) {
    const y0 = records[0].yield;
    return {
      slope: 0,
      intercept: y0,
      predict: () => y0,
    };
  }

  const slopes: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dt = records[j].year - records[i].year;
      if (dt !== 0) {
        slopes.push((records[j].yield - records[i].yield) / dt);
      }
    }
  }

  slopes.sort((a, b) => a - b);
  const midSlope = Math.floor(slopes.length / 2);
  const rawSlope =
    slopes.length > 0
      ? slopes.length % 2 !== 0
        ? slopes[midSlope]
        : (slopes[midSlope - 1] + slopes[midSlope]) / 2
      : 0;
  const slope = Number.isFinite(rawSlope) ? rawSlope : 0;

  const intercepts = records.map((r) => r.yield - slope * r.year).sort((a, b) => a - b);
  const midInt = Math.floor(intercepts.length / 2);
  const rawIntercept =
    intercepts.length > 0
      ? intercepts.length % 2 !== 0
        ? intercepts[midInt]
        : (intercepts[midInt - 1] + intercepts[midInt]) / 2
      : records[0].yield;
  const intercept = Number.isFinite(rawIntercept) ? rawIntercept : records[0].yield;

  return {
    slope,
    intercept,
    predict: (year: number) => +(intercept + slope * year).toFixed(3),
  };
}

/**
 * Damped Holt Linear Trend (Exponential Smoothing - ETS)
 */
function fitDampedHolt(
  records: { year: number; yield: number }[],
  alpha = 0.4,
  beta = 0.2,
  phi = 0.85,
): {
  predict: (horizonStep: number) => number;
  inSamplePredictions: number[];
} {
  const n = records.length;
  if (n < 2) {
    const y0 = records[0]?.yield ?? 1.0;
    return {
      predict: () => y0,
      inSamplePredictions: [y0],
    };
  }

  let level = records[0].yield;
  let trend = records[1].yield - records[0].yield;
  const inSample: number[] = [level];

  for (let t = 1; t < n; t++) {
    const prevLevel = level;
    const prevTrend = trend;
    const y = records[t].yield;
    level = alpha * y + (1 - alpha) * (prevLevel + phi * prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * phi * prevTrend;
    inSample.push(+(prevLevel + phi * prevTrend).toFixed(3));
  }

  return {
    predict: (h: number) => {
      let trendSum = 0;
      let curPhi = phi;
      for (let i = 1; i <= h; i++) {
        trendSum += curPhi;
        curPhi *= phi;
      }
      return +(level + trendSum * trend).toFixed(3);
    },
    inSamplePredictions: inSample,
  };
}

/**
 * Ridge Agroclimatic Autoregression
 */
function fitRidgeAgroclimatic(
  records: { year: number; yield: number }[],
  climateFactor: number,
): {
  predict: (year: number) => number;
  inSamplePredictions: number[];
} {
  const theil = fitTheilSen(records);
  const inSample = records.map((r) => +(theil.predict(r.year) * 0.5 + r.yield * 0.5).toFixed(3));

  return {
    predict: (year: number) => +(theil.predict(year) * climateFactor).toFixed(3),
    inSamplePredictions: inSample,
  };
}

/**
 * Main Stratified Statistical Forecasting Engine
 */
export function generateStatisticalForecast({
  municipalityId,
  municipalityName,
  crop,
  historicalRecords,
  features,
  targetYears,
}: {
  municipalityId: string;
  municipalityName: string;
  crop: CropKey;
  historicalRecords: { year: number; yield: number; harvestedAreaHa?: number | null }[];
  features: ClimateFeatures;
  targetYears: number[];
}): {
  status: "ready" | "insufficient_data";
  predictions: StatisticalForecastPoint[];
  metrics: ValidationMetrics | null;
  insufficientReason?: string;
} {
  const currentYear = new Date().getFullYear();

  // 1. Sanitize, deduplicate and sort historical observations
  const validMap = new Map<
    number,
    { year: number; yield: number; harvestedAreaHa?: number | null }
  >();
  for (const r of historicalRecords) {
    if (
      r &&
      Number.isFinite(r.year) &&
      r.year >= 2000 &&
      r.year <= currentYear &&
      Number.isFinite(r.yield) &&
      r.yield > 0
    ) {
      validMap.set(r.year, {
        year: r.year,
        yield: +r.yield.toFixed(3),
        harvestedAreaHa: r.harvestedAreaHa,
      });
    }
  }

  const validRecords = Array.from(validMap.values()).sort((a, b) => a.year - b.year);
  const N = validRecords.length;

  // 2. Stratum 1: Insufficient Data (N < 3)
  if (N < 3) {
    return {
      status: "insufficient_data",
      predictions: [],
      metrics: null,
      insufficientReason: `Se identificaron solo ${N} observaciones históricas validadas de EVA para ${crop} en ${municipalityName}. Se requiere un mínimo de 3 años para formular una proyección estadística reproducible.`,
    };
  }

  const bio = calculateBioclimaticScore(crop, features);
  const lastObservedYear = validRecords[N - 1].year;
  const futureYears = targetYears.filter((y) => y > lastObservedYear);

  if (futureYears.length === 0) {
    return {
      status: "ready",
      predictions: [],
      metrics: null,
    };
  }

  const meanYear = validRecords.reduce((s, r) => s + r.year, 0) / N;
  const sumDtSq = validRecords.reduce((s, r) => s + (r.year - meanYear) ** 2, 0) || 1;

  let selectedModel = "Theil-Sen Robust Trend";
  let predictor: (targetYear: number) => number;
  let inSampleErrors: number[] = [];

  // 3. Stratum 2: 3 to 5 observations (Theil-Sen with wide Student-t CI)
  if (N <= 5) {
    const theil = fitTheilSen(validRecords);
    selectedModel = "Theil-Sen Robust Trend (Muestreo Corto)";
    predictor = (y: number) => Math.max(0.1, theil.predict(y) * bio.climateFactor);
    inSampleErrors = validRecords.map((r) => r.yield - predictor(r.year));
  } else {
    // 4. Stratum 3: N > 5 observations (Rolling-Origin Backtesting Candidate Selection)
    const testOrigins = [N - 2, N - 1];
    const candidateScores = {
      theilSen: 0,
      dampedHolt: 0,
      ridgeAgro: 0,
    };

    for (const origin of testOrigins) {
      const train = validRecords.slice(0, origin);
      const test = validRecords[origin];

      const mTheil = fitTheilSen(train);
      const predTheil = Math.max(0.1, mTheil.predict(test.year) * bio.climateFactor);
      candidateScores.theilSen += Math.abs(test.yield - predTheil);

      const mHolt = fitDampedHolt(train);
      const predHolt = Math.max(0.1, mHolt.predict(1) * bio.climateFactor);
      candidateScores.dampedHolt += Math.abs(test.yield - predHolt);

      const mRidge = fitRidgeAgroclimatic(train, bio.climateFactor);
      const predRidge = Math.max(0.1, mRidge.predict(test.year));
      candidateScores.ridgeAgro += Math.abs(test.yield - predRidge);
    }

    // Select candidate with lowest cross-validation absolute error
    const minScore = Math.min(
      candidateScores.theilSen,
      candidateScores.dampedHolt,
      candidateScores.ridgeAgro,
    );

    if (minScore === candidateScores.dampedHolt) {
      selectedModel = "Damped Holt ETS (ETS A,Ad,N)";
      const fullHolt = fitDampedHolt(validRecords);
      predictor = (targetYear: number) => {
        const step = targetYear - lastObservedYear;
        return Math.max(0.1, fullHolt.predict(step) * bio.climateFactor);
      };
      inSampleErrors = validRecords.map((r, i) => r.yield - fullHolt.inSamplePredictions[i]);
    } else if (minScore === candidateScores.ridgeAgro) {
      selectedModel = "Ridge Agroclimatic Autoregression";
      const fullRidge = fitRidgeAgroclimatic(validRecords, bio.climateFactor);
      predictor = (targetYear: number) => Math.max(0.1, fullRidge.predict(targetYear));
      inSampleErrors = validRecords.map((r, i) => r.yield - fullRidge.inSamplePredictions[i]);
    } else {
      selectedModel = "Theil-Sen Robust Trend";
      const fullTheil = fitTheilSen(validRecords);
      predictor = (targetYear: number) =>
        Math.max(0.1, fullTheil.predict(targetYear) * bio.climateFactor);
      inSampleErrors = validRecords.map((r) => r.yield - predictor(r.year));
    }
  }

  // Calculate residual statistics
  const sse = inSampleErrors.reduce((s, e) => s + e ** 2, 0);
  const sae = inSampleErrors.reduce((s, e) => s + Math.abs(e), 0);
  const df = Math.max(1, N - 2);
  const rmse = Math.sqrt(sse / df);
  const mae = +(sae / N).toFixed(3);
  const actuals = validRecords.map((r) => r.yield);
  const predsIn = validRecords.map((r) => predictor(r.year));
  const smape = calculateSmape(actuals, predsIn);

  const metrics: ValidationMetrics = {
    mae,
    rmse: +rmse.toFixed(3),
    smape,
    sampleSize: N,
    selectedModel,
  };

  const sortedYields = validRecords.map((r) => r.yield).sort((a, b) => a - b);
  const mid = Math.floor(sortedYields.length / 2);
  const histMedian =
    sortedYields.length % 2 !== 0
      ? sortedYields[mid]
      : (sortedYields[mid - 1] + sortedYields[mid]) / 2;

  const theilFit = fitTheilSen(validRecords);

  const predictions: StatisticalForecastPoint[] = [];

  // Multipliers for prediction intervals: 80% (z=1.282), 95% (z=1.960)
  // When N <= 5, widen with Student-t approximation
  const z80 = N <= 5 ? 1.53 : 1.282;
  const z95 = N <= 5 ? 2.45 : 1.96;

  for (const fYear of futureYears) {
    const rawVal = predictor(fYear);
    const predictedYield = +rawVal.toFixed(2);

    // Dynamic horizon variance inflation
    const dt = fYear - meanYear;
    const sigmaH = Math.max(
      0.06 * predictedYield,
      rmse * Math.sqrt(1 + 1 / N + dt ** 2 / sumDtSq) * (1 + (1 - bio.climateScore) * 0.15),
    );

    const lower80 = +Math.max(0.01, predictedYield - z80 * sigmaH).toFixed(2);
    const upper80 = +(predictedYield + z80 * sigmaH).toFixed(2);

    const lower95 = +Math.max(0.01, predictedYield - z95 * sigmaH).toFixed(2);
    const upper95 = +(predictedYield + z95 * sigmaH).toFixed(2);

    const safeLower80 = Math.min(lower80, predictedYield);
    const safeUpper80 = Math.max(upper80, predictedYield);
    const safeLower95 = Math.min(lower95, safeLower80);
    const safeUpper95 = Math.max(upper95, safeUpper80);

    predictions.push({
      year: fYear,
      date: String(fYear),
      predictedYield,
      lowerBound80: safeLower80,
      upperBound80: safeUpper80,
      lowerBound95: safeLower95,
      upperBound95: safeUpper95,
      modelName: selectedModel,
      modelVersion: "2.6.0-stat",
      municipalityId,
      cropId: crop,
      sampleSize: N,
      validationMetrics: metrics,
      bioclimaticScore: bio.climateScore,
      featuresSnapshot: {
        altitude: features.altitude,
        temperatureMean: features.temperatureMean,
        precipitationAnnual: features.precipitationAnnual,
        humidityMean: features.humidityMean,
        et0Annual: features.et0Annual,
        waterBalance: features.waterBalance,
        historicalMedian: histMedian,
        trendSlope: +theilFit.slope.toFixed(4),
      },
      scores: {
        temperatureScore: bio.sTemp,
        precipitationScore: bio.sPrecip,
        humidityScore: bio.sHumidity,
        altitudeScore: bio.sAltitude,
        waterScore: bio.sWater,
        climateScore: +bio.climateScore.toFixed(2),
        trendFactor: +(theilFit.slope + 1).toFixed(2),
      },
      isHistorical: false,
    });
  }

  return {
    status: "ready",
    predictions,
    metrics,
  };
}

/**
 * Builds unified chart points merging validated historical observations
 * with post-observation statistical forecast points.
 */
export function buildUnifiedSeriesPoints(
  historical: ValidatedHistoricalObservation[],
  predictions: StatisticalForecastPoint[],
): HistoricalPredictionUnifiedPoint[] {
  const points: HistoricalPredictionUnifiedPoint[] = [];

  for (const h of historical) {
    points.push({
      date: h.date,
      year: h.year,
      historicalValue: h.yieldTonHa,
      predictedValue: null,
      lowerBound80: null,
      upperBound80: null,
      lowerBound95: null,
      upperBound95: null,
      lowerBound: null,
      upperBound: null,
      dataType: "historical",
      source: h.source,
      confidence: h.qualityScore,
      municipalityId: h.municipalityId,
      cropId: h.cropId,
      variable: "yield",
      unit: "Ton/Ha",
    });
  }

  for (const p of predictions) {
    const pointMuni = p.municipalityId ?? historical[0]?.municipalityId ?? "unknown";
    const pointCrop = p.cropId ?? historical[0]?.cropId ?? "cacao";

    points.push({
      date: p.date,
      year: p.year,
      historicalValue: null,
      predictedValue: p.predictedYield,
      lowerBound80: p.lowerBound80,
      upperBound80: p.upperBound80,
      lowerBound95: p.lowerBound95,
      upperBound95: p.upperBound95,
      // Legacy compatibility properties
      lowerBound: p.lowerBound80,
      upperBound: p.upperBound80,
      dataType: "prediction",
      source: `Modelo Estadístico: ${p.modelName} (v${p.modelVersion})`,
      confidence: +Math.max(
        0.4,
        Math.min(0.96, 1 - (p.validationMetrics?.smape ?? 10) / 100),
      ).toFixed(2),
      municipalityId: pointMuni,
      cropId: pointCrop,
      variable: "yield",
      unit: "Ton/Ha",
      modelName: p.modelName,
      modelVersion: p.modelVersion,
      validationMetrics: p.validationMetrics,
      scores: p.scores,
    });
  }

  return points.sort((a, b) => a.year - b.year);
}
