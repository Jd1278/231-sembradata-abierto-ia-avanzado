import { GeminiAssessmentSchema, type GeminiAssessment } from "@/types/historical-prediction";
import type { CropKey } from "@/types/crops";
import { CROP_REQUIREMENTS } from "@/data/crop-requirements";
import type { ClimateFeatures } from "./forecasting-engine";

const EDGE_FUNCTION_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-assessment`;
const HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export async function requestGeminiAgronomicAssessment({
  municipio,
  crop,
  historicalYields,
  predictedYield,
  modelName,
  features,
}: {
  municipio: string;
  crop: CropKey;
  historicalYields: { year: number; yield: number }[];
  predictedYield: number;
  modelName: string;
  features: ClimateFeatures;
}): Promise<GeminiAssessment | null> {
  const req = CROP_REQUIREMENTS[crop] ?? CROP_REQUIREMENTS.cacao;

  const payload = {
    municipio,
    cultivo: req.nombre,
    historicalYields,
    predictedYield,
    modelName,
    climateSummary: {
      tempMean: +features.temperatureMean.toFixed(1),
      precipAnnual: Math.round(features.precipitationAnnual),
      humidityMean: Math.round(features.humidityMean),
      altitude: Math.round(features.altitude),
    },
    cropRequirements: {
      tempOptima: req.tempOptima,
      precipitacionAnual: req.precipitacionAnual,
      altitud: req.altitud,
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

    const res = await fetch(EDGE_FUNCTION_ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      console.info(
        "[GeminiService] Edge function returned status:",
        res.status,
        "- using transparent fallback.",
      );
      return null;
    }

    const json = await res.json();
    const validation = GeminiAssessmentSchema.safeParse(json);

    if (validation.success) {
      return validation.data;
    } else {
      console.warn("[GeminiService] Schema validation warning:", validation.error.format());
      return null;
    }
  } catch (err) {
    console.info("[GeminiService] Agronomic assessment unavailable (offline/timeout):", err);
    return null;
  }
}
