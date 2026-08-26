import { z } from "zod";
import type { CropKey, SoilType } from "@/types/crops";

// ============================================================
// 1. Zod Schemas
// ============================================================

export const GeminiAssessmentSchema = z.object({
  consistencyStatus: z.enum(["valid", "warning", "invalid"]),
  adjustmentRecommendation: z.enum(["none", "review_required"]),
  explanation: z.string().min(5),
  riskFactors: z.array(z.string()),
  dataQualityNotes: z.array(z.string()),
});

export type GeminiAssessment = z.infer<typeof GeminiAssessmentSchema>;

export const HistoricalRecordSchema = z.object({
  anio: z.number().int().min(2000).max(new Date().getFullYear()),
  rendimiento_ton_ha: z.number().positive().finite(),
  superficie_ha: z.number().nonnegative().finite().nullable().optional(),
});

// ============================================================
// 2. Core Domain Types
// ============================================================

export interface ValidatedHistoricalObservation {
  id: string;
  year: number;
  date: string;
  yieldTonHa: number;
  harvestedAreaHa?: number | null;
  source: string;
  municipalityId: string;
  municipalityName: string;
  cropId: CropKey;
  qualityScore: number;
  isHistorical: true;
}

export interface ValidationMetrics {
  mae: number;
  rmse: number;
  smape: number; // Symmetric Mean Absolute Percentage Error (0-100%)
  sampleSize: number;
  selectedModel: string;
}

export interface StatisticalForecastPoint {
  year: number;
  date: string;
  predictedYield: number;
  lowerBound80: number;
  upperBound80: number;
  lowerBound95: number;
  upperBound95: number;
  modelName: string;
  modelVersion: string;
  municipalityId?: string;
  cropId?: CropKey;
  sampleSize: number;
  validationMetrics: ValidationMetrics;
  bioclimaticScore: number;
  featuresSnapshot: {
    altitude: number;
    temperatureMean: number;
    precipitationAnnual: number;
    humidityMean: number;
    et0Annual: number;
    waterBalance: number;
    historicalMedian: number;
    trendSlope: number;
  };
  scores?: {
    temperatureScore: number;
    precipitationScore: number;
    humidityScore: number;
    altitudeScore: number;
    waterScore: number;
    climateScore: number;
    trendFactor: number;
  };
  isHistorical: false;
}

export interface HistoricalPredictionUnifiedPoint {
  date: string;
  year: number;
  month?: number;
  historicalValue: number | null;
  predictedValue: number | null;
  lowerBound80?: number | null;
  upperBound80?: number | null;
  lowerBound95?: number | null;
  upperBound95?: number | null;
  // Legacy aliases for backward compatibility
  lowerBound?: number | null;
  upperBound?: number | null;
  dataType: "historical" | "prediction";
  source: string;
  confidence: number | null;
  municipalityId: string;
  cropId: CropKey;
  variable: "yield" | "temperature" | "precipitation" | "risk_score";
  unit: string;
  modelName?: string;
  modelVersion?: string;
  validationMetrics?: ValidationMetrics;
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

export type SeriesQueryStatus =
  | "ready"
  | "insufficient_data"
  | "municipality_not_found"
  | "no_historical_data"
  | "network_error"
  | "database_error"
  | "permission_error"
  | "error"
  | "no_data";

export interface SeriesQueryResult {
  municipalityId: string;
  municipalityName: string;
  cropId: CropKey;
  lastObservedYear: number | null;
  status: SeriesQueryStatus;
  historicalObservations: ValidatedHistoricalObservation[];
  predictions: StatisticalForecastPoint[];
  points: HistoricalPredictionUnifiedPoint[];
  geminiAssessment: GeminiAssessment | null;
  insufficientDataReason?: string;
  errorMessage?: string;
}
