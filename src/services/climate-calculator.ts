import type { CropKey, Risk } from "@/types/crops";
import { CROP_REQUIREMENTS, type CropProfile } from "@/data/crop-requirements";
import type { CropClimateRequirements } from "@/types/database";

export interface RawDailyClimate {
  date: string;
  tempMax?: number | null;
  tempMin?: number | null;
  precip?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  solarRad?: number | null;
  uvIndex?: number | null;
  et0?: number | null;
}

export interface DataQuality {
  expectedObservations: number;
  validObservations: number;
  completeness: number; // 0.0 to 1.0
  source: string;
  periodStart: string;
  periodEnd: string;
}

export interface CalculatedClimateMetrics {
  meanTemperature: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  meanMaxTemperature: number | null;
  meanMinTemperature: number | null;
  thermalRange: number | null;
  temperatureStdDev: number | null;

  accumulatedPrecipitation: number | null;
  dailyMeanPrecipitation: number | null;
  precipitationStdDev: number | null;
  precipitationCv: number | null; // percentage: (stdDev / mean) * 100

  meanHumidity: number | null;
  evapotranspiration: number | null; // total ET0 in period (mm)
  effectivePrecipitation: number | null;
  waterBalance: number | null; // Peff - ET0
  waterDeficit: number | null; // max(ET0 - Peff, 0)
  waterDeficitIndex: number | null; // Deficit / ET0

  dataQuality: DataQuality;
  periodStart: string;
  periodEnd: string;
}

export interface MunicipalityClimate extends CalculatedClimateMetrics {
  municipalityId: string;
  municipalityName: string;
  latitude: number;
  longitude: number;
  elevation: number;
  fetchedAt: string;
  source: string;
}

export interface CompatibilityVariableScore {
  value: number | null;
  score: number; // 0.0 to 1.0
  compatible: boolean;
  min: number;
  optimalMin: number;
  optimalMax: number;
  max: number;
  weight: number;
}

export interface CompatibilityEvaluation {
  cropKey: CropKey;
  cropName: string;
  overallScore: number; // 0.0 to 1.0 (or 0 to 100 in UI)
  compatible: boolean;
  exclusionReason?: string;
  variables: {
    temperature: CompatibilityVariableScore;
    precipitation: CompatibilityVariableScore;
    altitude: CompatibilityVariableScore;
    humidity: CompatibilityVariableScore;
  };
}

export interface AgroclimaticRiskEvaluation {
  municipio: string;
  crop: CropKey;
  riskScore: number; // 0.0 (minimum risk) to 1.0 (extreme risk)
  riskLevel: Risk | "NoData";
  status: "ready" | "partial" | "error" | "no-data";
  compatibilityScore: number;
  penalties: {
    drought: number;
    frost: number;
    extremeTemp: number;
    dataCompleteness: number;
  };
  computedAt: string;
}

/**
 * Pure trapezoidal membership score function.
 * Given x and thresholds [min, optMin, optMax, max]:
 * - x < min: 0
 * - min <= x < optMin: (x - min) / (optMin - min)
 * - optMin <= x <= optMax: 1
 * - optMax < x <= max: (max - x) / (max - optMax)
 * - x > max: 0
 */
export function trapezoidalScore(
  x: number | null | undefined,
  min: number,
  optMin: number,
  optMax: number,
  max: number,
): number {
  if (x === null || x === undefined || !Number.isFinite(x)) return 0;
  if (x < min || x > max) return 0;
  if (x >= optMin && x <= optMax) return 1;
  if (x >= min && x < optMin) {
    const range = optMin - min;
    return range > 0 ? (x - min) / range : 1;
  }
  if (x > optMax && x <= max) {
    const range = max - optMax;
    return range > 0 ? (max - x) / range : 1;
  }
  return 0;
}

/**
 * Calculates central statistical and agronomic climate metrics from raw observations.
 * Excludes nulls/NaNs and never converts missing values to zero.
 */
export function calculateClimateMetrics(
  observations: RawDailyClimate[],
  options: {
    source?: string;
    expectedDays?: number;
    latitude?: number;
  } = {},
): CalculatedClimateMetrics {
  const source = options.source ?? "Open-Meteo";
  const expectedDays = options.expectedDays ?? observations.length;

  if (!observations || observations.length === 0) {
    const emptyQuality: DataQuality = {
      expectedObservations: expectedDays,
      validObservations: 0,
      completeness: 0,
      source,
      periodStart: "",
      periodEnd: "",
    };
    return {
      meanTemperature: null,
      minTemperature: null,
      maxTemperature: null,
      meanMaxTemperature: null,
      meanMinTemperature: null,
      thermalRange: null,
      temperatureStdDev: null,
      accumulatedPrecipitation: null,
      dailyMeanPrecipitation: null,
      precipitationStdDev: null,
      precipitationCv: null,
      meanHumidity: null,
      evapotranspiration: null,
      effectivePrecipitation: null,
      waterBalance: null,
      waterDeficit: null,
      waterDeficitIndex: null,
      dataQuality: emptyQuality,
      periodStart: "",
      periodEnd: "",
    };
  }

  const periodStart = observations[0]?.date ?? "";
  const periodEnd = observations[observations.length - 1]?.date ?? "";

  // 1. Filter valid temperatures
  const validDailyTemps: number[] = [];
  const validMaxTemps: number[] = [];
  const validMinTemps: number[] = [];
  const validPrecips: number[] = [];
  const validHumidities: number[] = [];
  const validEt0s: number[] = [];

  let overallValidCount = 0;

  for (const obs of observations) {
    const hasValidTemp =
      Number.isFinite(obs.tempMax) &&
      Number.isFinite(obs.tempMin) &&
      (obs.tempMax as number) >= -40 &&
      (obs.tempMax as number) <= 60 &&
      (obs.tempMin as number) >= -40 &&
      (obs.tempMin as number) <= 60 &&
      (obs.tempMax as number) >= (obs.tempMin as number);

    const hasValidPrecip =
      Number.isFinite(obs.precip) && (obs.precip as number) >= 0 && (obs.precip as number) <= 1000;

    const hasValidHumidity =
      Number.isFinite(obs.humidity) &&
      (obs.humidity as number) >= 0 &&
      (obs.humidity as number) <= 100;

    const hasValidEt0 =
      Number.isFinite(obs.et0) && (obs.et0 as number) >= 0 && (obs.et0 as number) <= 50;

    if (hasValidTemp) {
      const avg = ((obs.tempMax as number) + (obs.tempMin as number)) / 2;
      validDailyTemps.push(avg);
      validMaxTemps.push(obs.tempMax as number);
      validMinTemps.push(obs.tempMin as number);
    }
    if (hasValidPrecip) {
      validPrecips.push(obs.precip as number);
    }
    if (hasValidHumidity) {
      validHumidities.push(obs.humidity as number);
    }
    if (hasValidEt0) {
      validEt0s.push(obs.et0 as number);
    } else if (hasValidTemp) {
      const tMean = ((obs.tempMax as number) + (obs.tempMin as number)) / 2;
      const tRange = Math.max(0.1, (obs.tempMax as number) - (obs.tempMin as number));
      const hargreavesEt0 = Math.max(0, 0.0023 * 4.5 * (tMean + 17.8) * Math.sqrt(tRange));
      validEt0s.push(hargreavesEt0);
    }

    if (hasValidTemp && (hasValidPrecip || hasValidHumidity)) {
      overallValidCount++;
    }
  }

  const completeness = expectedDays > 0 ? +(overallValidCount / expectedDays).toFixed(3) : 0;
  const dataQuality: DataQuality = {
    expectedObservations: expectedDays,
    validObservations: overallValidCount,
    completeness: Math.min(1.0, completeness),
    source,
    periodStart,
    periodEnd,
  };

  // Temperature metrics
  const nTemp = validDailyTemps.length;
  const meanTemperature =
    nTemp > 0 ? +(validDailyTemps.reduce((s, v) => s + v, 0) / nTemp).toFixed(2) : null;
  const minTemperature = validMinTemps.length > 0 ? Math.min(...validMinTemps) : null;
  const maxTemperature = validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : null;
  const meanMaxTemperature =
    validMaxTemps.length > 0
      ? +(validMaxTemps.reduce((s, v) => s + v, 0) / validMaxTemps.length).toFixed(2)
      : null;
  const meanMinTemperature =
    validMinTemps.length > 0
      ? +(validMinTemps.reduce((s, v) => s + v, 0) / validMinTemps.length).toFixed(2)
      : null;
  const thermalRange =
    meanMaxTemperature !== null && meanMinTemperature !== null
      ? +(meanMaxTemperature - meanMinTemperature).toFixed(2)
      : null;

  let temperatureStdDev: number | null = null;
  if (nTemp >= 2 && meanTemperature !== null) {
    const variance =
      validDailyTemps.reduce((acc, t) => acc + Math.pow(t - meanTemperature, 2), 0) / (nTemp - 1);
    temperatureStdDev = +Math.sqrt(variance).toFixed(2);
  }

  // Precipitation metrics
  const nPrecip = validPrecips.length;
  const accumulatedPrecipitation =
    nPrecip > 0 ? +validPrecips.reduce((s, v) => s + v, 0).toFixed(1) : null;
  const dailyMeanPrecipitation =
    nPrecip > 0 && accumulatedPrecipitation !== null
      ? +(accumulatedPrecipitation / nPrecip).toFixed(2)
      : null;

  let precipitationStdDev: number | null = null;
  let precipitationCv: number | null = null;
  if (nPrecip >= 2 && dailyMeanPrecipitation !== null) {
    const variance =
      validPrecips.reduce((acc, p) => acc + Math.pow(p - dailyMeanPrecipitation, 2), 0) /
      (nPrecip - 1);
    precipitationStdDev = +Math.sqrt(variance).toFixed(2);
    if (dailyMeanPrecipitation > 0) {
      precipitationCv = +((precipitationStdDev / dailyMeanPrecipitation) * 100).toFixed(1);
    }
  }

  // Humidity metrics
  const nHum = validHumidities.length;
  const meanHumidity =
    nHum > 0
      ? +Math.min(100, Math.max(0, validHumidities.reduce((s, v) => s + v, 0) / nHum)).toFixed(1)
      : null;

  // Evapotranspiration & Water balance
  const nEt0 = validEt0s.length;
  const evapotranspiration = nEt0 > 0 ? +validEt0s.reduce((s, v) => s + v, 0).toFixed(1) : null;

  // Effective precipitation (FAO standard daily approximation: min(P, ET0 * 1.2))
  let effectivePrecipitation: number | null = null;
  if (accumulatedPrecipitation !== null && evapotranspiration !== null) {
    let effSum = 0;
    const count = Math.min(validPrecips.length, validEt0s.length);
    for (let i = 0; i < count; i++) {
      effSum += Math.min(validPrecips[i], validEt0s[i] * 1.2);
    }
    effectivePrecipitation = +effSum.toFixed(1);
  } else if (accumulatedPrecipitation !== null) {
    effectivePrecipitation = +(accumulatedPrecipitation * 0.8).toFixed(1);
  }

  let waterBalance: number | null = null;
  let waterDeficit: number | null = null;
  let waterDeficitIndex: number | null = null;

  if (effectivePrecipitation !== null && evapotranspiration !== null) {
    waterBalance = +(effectivePrecipitation - evapotranspiration).toFixed(1);
    waterDeficit = +Math.max(0, evapotranspiration - effectivePrecipitation).toFixed(1);
    if (evapotranspiration > 0) {
      waterDeficitIndex = +(waterDeficit / evapotranspiration).toFixed(3);
    }
  }

  return {
    meanTemperature,
    minTemperature,
    maxTemperature,
    meanMaxTemperature,
    meanMinTemperature,
    thermalRange,
    temperatureStdDev,
    accumulatedPrecipitation,
    dailyMeanPrecipitation,
    precipitationStdDev,
    precipitationCv,
    meanHumidity,
    evapotranspiration,
    effectivePrecipitation,
    waterBalance,
    waterDeficit,
    waterDeficitIndex,
    dataQuality,
    periodStart,
    periodEnd,
  };
}

/**
 * Normalizes crop profile requirements from database or fallback configuration.
 */
export function getCropProfileRequirements(
  crop: CropKey,
  dbReq?: CropClimateRequirements | null,
): {
  tempMin: number;
  tempOptMin: number;
  tempOptMax: number;
  tempMax: number;
  precipAnnualMin: number;
  precipAnnualOptMin: number;
  precipAnnualOptMax: number;
  precipAnnualMax: number;
  altMin: number;
  altOptMin: number;
  altOptMax: number;
  altMax: number;
  humMin: number;
  humOptMin: number;
  humOptMax: number;
  humMax: number;
  weightTemp: number;
  weightPrecip: number;
  weightAlt: number;
  weightHum: number;
} {
  if (dbReq && dbReq.crop_id === crop) {
    return {
      tempMin: Number(dbReq.temperature_min_c),
      tempOptMin: Number(dbReq.temperature_optimal_min_c),
      tempOptMax: Number(dbReq.temperature_optimal_max_c),
      tempMax: Number(dbReq.temperature_max_c),
      precipAnnualMin: Number(dbReq.precipitation_min_mm),
      precipAnnualOptMin: Number(dbReq.precipitation_optimal_min_mm),
      precipAnnualOptMax: Number(dbReq.precipitation_optimal_max_mm),
      precipAnnualMax: Number(dbReq.precipitation_max_mm),
      altMin: Number(dbReq.altitude_min_m),
      altOptMin: Number(dbReq.altitude_optimal_min_m),
      altOptMax: Number(dbReq.altitude_optimal_max_m),
      altMax: Number(dbReq.altitude_max_m),
      humMin: Number(dbReq.humidity_min_pct ?? 50),
      humOptMin: Number(dbReq.humidity_optimal_min_pct ?? 70),
      humOptMax: Number(dbReq.humidity_optimal_max_pct ?? 85),
      humMax: Number(dbReq.humidity_max_pct ?? 95),
      weightTemp: Number(dbReq.weight_temperature ?? 0.35),
      weightPrecip: Number(dbReq.weight_precipitation ?? 0.3),
      weightAlt: Number(dbReq.weight_altitude ?? 0.2),
      weightHum: Number(dbReq.weight_humidity ?? 0.15),
    };
  }

  const staticProfile: CropProfile = CROP_REQUIREMENTS[crop];
  return {
    tempMin: staticProfile.tempOptima.min - 3,
    tempOptMin: staticProfile.tempOptima.min,
    tempOptMax: staticProfile.tempOptima.max,
    tempMax: staticProfile.tempOptima.max + 4,
    precipAnnualMin: staticProfile.precipitacionAnual.min * 0.75,
    precipAnnualOptMin: staticProfile.precipitacionAnual.min,
    precipAnnualOptMax: staticProfile.precipitacionAnual.max,
    precipAnnualMax: staticProfile.precipitacionAnual.max * 1.35,
    altMin: Math.max(0, staticProfile.altitud.min - 300),
    altOptMin: staticProfile.altitud.min,
    altOptMax: staticProfile.altitud.max,
    altMax: staticProfile.altitud.max + 400,
    humMin: crop === "cacao" ? 65 : 55,
    humOptMin: crop === "cacao" ? 75 : 65,
    humOptMax: crop === "cacao" ? 88 : 85,
    humMax: 98,
    weightTemp: 0.35,
    weightPrecip: 0.3,
    weightAlt: 0.2,
    weightHum: 0.15,
  };
}

/**
 * Evaluates agronomic compatibility applying the mandatory HARD FILTERS
 * and trapezoidal membership scoring.
 */
export function evaluateCropCompatibility(
  metrics: CalculatedClimateMetrics,
  elevation: number,
  crop: CropKey,
  dbReq?: CropClimateRequirements | null,
): CompatibilityEvaluation {
  const req = getCropProfileRequirements(crop, dbReq);
  const cropName = CROP_REQUIREMENTS[crop]?.nombre ?? crop;

  const temp = metrics.meanTemperature;
  const humidity = metrics.meanHumidity;
  const altitude = elevation;

  // For precipitation comparison: if 90-day data, normalize to annual baseline scale
  // (365 / daysInSample) * accumulatedPrecipitation, but explicitly bounded
  const sampleDays = metrics.dataQuality.validObservations || 90;
  const scaledAnnualPrecip =
    metrics.accumulatedPrecipitation !== null
      ? (metrics.accumulatedPrecipitation / sampleDays) * 365
      : null;

  // HARD FILTER CHECKS:
  if (temp !== null && (temp < req.tempMin || temp > req.tempMax)) {
    return {
      cropKey: crop,
      cropName,
      overallScore: 0,
      compatible: false,
      exclusionReason: `Temperatura media (${temp}°C) fuera del rango admisible [${req.tempMin}°C - ${req.tempMax}°C].`,
      variables: {
        temperature: {
          value: temp,
          score: 0,
          compatible: false,
          min: req.tempMin,
          optimalMin: req.tempOptMin,
          optimalMax: req.tempOptMax,
          max: req.tempMax,
          weight: req.weightTemp,
        },
        precipitation: {
          value: scaledAnnualPrecip,
          score: trapezoidalScore(
            scaledAnnualPrecip,
            req.precipAnnualMin,
            req.precipAnnualOptMin,
            req.precipAnnualOptMax,
            req.precipAnnualMax,
          ),
          compatible: true,
          min: req.precipAnnualMin,
          optimalMin: req.precipAnnualOptMin,
          optimalMax: req.precipAnnualOptMax,
          max: req.precipAnnualMax,
          weight: req.weightPrecip,
        },
        altitude: {
          value: altitude,
          score: trapezoidalScore(altitude, req.altMin, req.altOptMin, req.altOptMax, req.altMax),
          compatible: true,
          min: req.altMin,
          optimalMin: req.altOptMin,
          optimalMax: req.altOptMax,
          max: req.altMax,
          weight: req.weightAlt,
        },
        humidity: {
          value: humidity,
          score: trapezoidalScore(humidity, req.humMin, req.humOptMin, req.humOptMax, req.humMax),
          compatible: true,
          min: req.humMin,
          optimalMin: req.humOptMin,
          optimalMax: req.humOptMax,
          max: req.humMax,
          weight: req.weightHum,
        },
      },
    };
  }

  if (altitude < req.altMin || altitude > req.altMax) {
    return {
      cropKey: crop,
      cropName,
      overallScore: 0,
      compatible: false,
      exclusionReason: `Altitud (${altitude} msnm) fuera del rango admisible [${req.altMin} - ${req.altMax} msnm].`,
      variables: {
        temperature: {
          value: temp,
          score: trapezoidalScore(temp, req.tempMin, req.tempOptMin, req.tempOptMax, req.tempMax),
          compatible: true,
          min: req.tempMin,
          optimalMin: req.tempOptMin,
          optimalMax: req.tempOptMax,
          max: req.tempMax,
          weight: req.weightTemp,
        },
        precipitation: {
          value: scaledAnnualPrecip,
          score: trapezoidalScore(
            scaledAnnualPrecip,
            req.precipAnnualMin,
            req.precipAnnualOptMin,
            req.precipAnnualOptMax,
            req.precipAnnualMax,
          ),
          compatible: true,
          min: req.precipAnnualMin,
          optimalMin: req.precipAnnualOptMin,
          optimalMax: req.precipAnnualOptMax,
          max: req.precipAnnualMax,
          weight: req.weightPrecip,
        },
        altitude: {
          value: altitude,
          score: 0,
          compatible: false,
          min: req.altMin,
          optimalMin: req.altOptMin,
          optimalMax: req.altOptMax,
          max: req.altMax,
          weight: req.weightAlt,
        },
        humidity: {
          value: humidity,
          score: trapezoidalScore(humidity, req.humMin, req.humOptMin, req.humOptMax, req.humMax),
          compatible: true,
          min: req.humMin,
          optimalMin: req.humOptMin,
          optimalMax: req.humOptMax,
          max: req.humMax,
          weight: req.weightHum,
        },
      },
    };
  }

  if (
    scaledAnnualPrecip !== null &&
    (scaledAnnualPrecip < req.precipAnnualMin || scaledAnnualPrecip > req.precipAnnualMax)
  ) {
    return {
      cropKey: crop,
      cropName,
      overallScore: 0,
      compatible: false,
      exclusionReason: `Precipitación anual estimada (${Math.round(scaledAnnualPrecip)} mm) fuera del rango admisible [${req.precipAnnualMin} - ${req.precipAnnualMax} mm].`,
      variables: {
        temperature: {
          value: temp,
          score: trapezoidalScore(temp, req.tempMin, req.tempOptMin, req.tempOptMax, req.tempMax),
          compatible: true,
          min: req.tempMin,
          optimalMin: req.tempOptMin,
          optimalMax: req.tempOptMax,
          max: req.tempMax,
          weight: req.weightTemp,
        },
        precipitation: {
          value: scaledAnnualPrecip,
          score: 0,
          compatible: false,
          min: req.precipAnnualMin,
          optimalMin: req.precipAnnualOptMin,
          optimalMax: req.precipAnnualOptMax,
          max: req.precipAnnualMax,
          weight: req.weightPrecip,
        },
        altitude: {
          value: altitude,
          score: trapezoidalScore(altitude, req.altMin, req.altOptMin, req.altOptMax, req.altMax),
          compatible: true,
          min: req.altMin,
          optimalMin: req.altOptMin,
          optimalMax: req.altOptMax,
          max: req.altMax,
          weight: req.weightAlt,
        },
        humidity: {
          value: humidity,
          score: trapezoidalScore(humidity, req.humMin, req.humOptMin, req.humOptMax, req.humMax),
          compatible: true,
          min: req.humMin,
          optimalMin: req.humOptMin,
          optimalMax: req.humOptMax,
          max: req.humMax,
          weight: req.weightHum,
        },
      },
    };
  }

  // Calculate scores for each variable
  const sTemp = trapezoidalScore(temp, req.tempMin, req.tempOptMin, req.tempOptMax, req.tempMax);
  const sPrecip = trapezoidalScore(
    scaledAnnualPrecip,
    req.precipAnnualMin,
    req.precipAnnualOptMin,
    req.precipAnnualOptMax,
    req.precipAnnualMax,
  );
  const sAlt = trapezoidalScore(altitude, req.altMin, req.altOptMin, req.altOptMax, req.altMax);
  const sHum = trapezoidalScore(humidity, req.humMin, req.humOptMin, req.humOptMax, req.humMax);

  // Centralized weighted score
  const totalWeight = req.weightTemp + req.weightPrecip + req.weightAlt + req.weightHum;
  const rawScore =
    (sTemp * req.weightTemp +
      sPrecip * req.weightPrecip +
      sAlt * req.weightAlt +
      sHum * req.weightHum) /
    (totalWeight || 1.0);

  const overallScore = +Math.min(1.0, Math.max(0.0, rawScore)).toFixed(3);

  return {
    cropKey: crop,
    cropName,
    overallScore,
    compatible: overallScore > 0.15,
    variables: {
      temperature: {
        value: temp,
        score: sTemp,
        compatible: sTemp > 0,
        min: req.tempMin,
        optimalMin: req.tempOptMin,
        optimalMax: req.tempOptMax,
        max: req.tempMax,
        weight: req.weightTemp,
      },
      precipitation: {
        value: scaledAnnualPrecip,
        score: sPrecip,
        compatible: sPrecip > 0,
        min: req.precipAnnualMin,
        optimalMin: req.precipAnnualOptMin,
        optimalMax: req.precipAnnualOptMax,
        max: req.precipAnnualMax,
        weight: req.weightPrecip,
      },
      altitude: {
        value: altitude,
        score: sAlt,
        compatible: sAlt > 0,
        min: req.altMin,
        optimalMin: req.altOptMin,
        optimalMax: req.altOptMax,
        max: req.altMax,
        weight: req.weightAlt,
      },
      humidity: {
        value: humidity,
        score: sHum,
        compatible: sHum > 0,
        min: req.humMin,
        optimalMin: req.humOptMin,
        optimalMax: req.humOptMax,
        max: req.humMax,
        weight: req.weightHum,
      },
    },
  };
}

/**
 * Computes the final agroclimatic risk evaluation and classification.
 * Risk = 1 - Compatibility + Penalties.
 * Maps to Bajo (<= 0.33), Medio (0.34 - 0.66), Alto (0.67 - 1.00), NoData.
 */
export function calculateAgroclimaticRisk(
  municipio: string,
  crop: CropKey,
  metrics: CalculatedClimateMetrics,
  elevation: number,
  dbReq?: CropClimateRequirements | null,
): AgroclimaticRiskEvaluation {
  // If data quality is too low or missing:
  if (!metrics || metrics.dataQuality.completeness < 0.3 || metrics.meanTemperature === null) {
    return {
      municipio,
      crop,
      riskScore: 1.0,
      riskLevel: "NoData",
      status: "no-data",
      compatibilityScore: 0,
      penalties: { drought: 0, frost: 0, extremeTemp: 0, dataCompleteness: 1.0 },
      computedAt: new Date().toISOString(),
    };
  }

  const compat = evaluateCropCompatibility(metrics, elevation, crop, dbReq);

  // Environmental stress penalties
  let droughtPenalty = 0;
  if (metrics.waterDeficitIndex !== null && metrics.waterDeficitIndex > 0.4) {
    droughtPenalty = +(metrics.waterDeficitIndex * 0.15).toFixed(2);
  }

  let frostPenalty = 0;
  if (metrics.minTemperature !== null && metrics.minTemperature < 3.0) {
    frostPenalty = 0.25;
  }

  let extremeTempPenalty = 0;
  if (metrics.maxTemperature !== null && metrics.maxTemperature > 36.0) {
    extremeTempPenalty = 0.15;
  }

  let dataCompletenessPenalty = 0;
  if (metrics.dataQuality.completeness < 0.7) {
    dataCompletenessPenalty = 0.1;
  }

  let baseRisk = 1.0 - compat.overallScore;
  if (!compat.compatible) {
    baseRisk = Math.max(0.85, baseRisk);
  }

  const totalRiskScore = Math.min(
    1.0,
    Math.max(
      0.0,
      +(
        baseRisk +
        droughtPenalty +
        frostPenalty +
        extremeTempPenalty +
        dataCompletenessPenalty
      ).toFixed(3),
    ),
  );

  let riskLevel: Risk | "NoData";
  if (totalRiskScore <= 0.33) {
    riskLevel = "Bajo";
  } else if (totalRiskScore <= 0.66) {
    riskLevel = "Medio";
  } else {
    riskLevel = "Alto";
  }

  const status = metrics.dataQuality.completeness >= 0.8 ? "ready" : "partial";

  return {
    municipio,
    crop,
    riskScore: totalRiskScore,
    riskLevel,
    status,
    compatibilityScore: compat.overallScore,
    penalties: {
      drought: droughtPenalty,
      frost: frostPenalty,
      extremeTemp: extremeTempPenalty,
      dataCompleteness: dataCompletenessPenalty,
    },
    computedAt: new Date().toISOString(),
  };
}
