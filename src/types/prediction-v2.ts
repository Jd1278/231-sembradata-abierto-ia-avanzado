import type { CropKey } from "@/types/crops";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PredictionDetail {
  municipio: string;
  departamento: string;
  cultivo: CropKey;
  viable: boolean;
  confidence: number;
  riskLevel: "Bajo" | "Medio" | "Alto";
  favorableFactors: FactorDetail[];
  unfavorableFactors: FactorDetail[];
  recommendations: string[];
  alternativeCrops: AlternativeCrop[];
  soilSummary: string;
  climateSummary: string;
}

export interface FactorDetail {
  variable: string;
  value: string;
  status: "favorable" | "unfavorable" | "neutral";
  impact: "alto" | "medio" | "bajo";
  explanation: string;
  weight: number;
  contribution: number;
}

export interface AlternativeCrop {
  name: string;
  reason: string;
  estimatedYield: string;
  bestSeason: string;
}

export interface ViabilityResult {
  score: number;
  viable: boolean;
  factors: FactorDetail[];
  recommendations: string[];
  alternatives: AlternativeCrop[];
  pestRisk: PestRisk;
  seasonalNote: string;
  confidence: number;
}

export interface PestRisk {
  level: "Bajo" | "Medio" | "Alto";
  factors: string[];
  recommendations: string[];
}

/* ------------------------------------------------------------------ */
/*  Crop-specific weights & ranges (v2)                                */
/* ------------------------------------------------------------------ */

interface CropProfile {
  label: string;
  phRange: [number, number];
  tempRange: [number, number];
  precipRange: [number, number];
  humRange: [number, number];
  altRange: [number, number];
  weights: {
    ph: number;
    temp: number;
    precip: number;
    humidity: number;
    altitude: number;
    wind: number;
    solar: number;
    soilTexture: number;
    organicMatter: number;
  };
  pestConditions: {
    fungalHumidityThreshold: number;
    fungalTempRange: [number, number];
    droughtPrecipThreshold: number;
    frostTempThreshold: number;
  };
  seasonalStages: {
    month: number;
    stage: string;
    sensitivity: number;
  }[];
}

const CROP_PROFILES: Record<CropKey, CropProfile> = {
  cacao: {
    label: "Cacao",
    phRange: [5.0, 7.0],
    tempRange: [20, 28],
    precipRange: [1500, 2500],
    humRange: [70, 90],
    altRange: [0, 1500],
    weights: {
      ph: 12,
      temp: 15,
      precip: 13,
      humidity: 6,
      altitude: 10,
      wind: 5,
      solar: 4,
      soilTexture: 8,
      organicMatter: 10,
    },
    pestConditions: {
      fungalHumidityThreshold: 80,
      fungalTempRange: [22, 28],
      droughtPrecipThreshold: 60,
      frostTempThreshold: 10,
    },
    seasonalStages: [
      { month: 1, stage: "Lluvias fuertes", sensitivity: 0.9 },
      { month: 2, stage: "Lluvias fuertes", sensitivity: 0.9 },
      { month: 3, stage: "Floración", sensitivity: 1.2 },
      { month: 4, stage: "Floración", sensitivity: 1.2 },
      { month: 5, stage: "Cuajado", sensitivity: 1.3 },
      { month: 6, stage: "Desarrollo fruto", sensitivity: 1.1 },
      { month: 7, stage: "Cosecha principal", sensitivity: 0.8 },
      { month: 8, stage: "Cosecha principal", sensitivity: 0.8 },
      { month: 9, stage: "Floración secundaria", sensitivity: 1.0 },
      { month: 10, stage: "Floración secundaria", sensitivity: 1.0 },
      { month: 11, stage: "Seca", sensitivity: 0.7 },
      { month: 12, stage: "Seca", sensitivity: 0.7 },
    ],
  },
  cafe: {
    label: "Café",
    phRange: [5.5, 6.5],
    tempRange: [17, 24],
    precipRange: [1500, 2200],
    humRange: [60, 80],
    altRange: [1200, 1800],
    weights: {
      ph: 10,
      temp: 14,
      precip: 12,
      humidity: 7,
      altitude: 15,
      wind: 4,
      solar: 5,
      soilTexture: 7,
      organicMatter: 11,
    },
    pestConditions: {
      fungalHumidityThreshold: 75,
      fungalTempRange: [18, 24],
      droughtPrecipThreshold: 80,
      frostTempThreshold: 5,
    },
    seasonalStages: [
      { month: 1, stage: "Maduración", sensitivity: 0.9 },
      { month: 2, stage: "Cosecha", sensitivity: 0.7 },
      { month: 3, stage: "Cosecha", sensitivity: 0.7 },
      { month: 4, stage: "Floración", sensitivity: 1.3 },
      { month: 5, stage: "Floración", sensitivity: 1.3 },
      { month: 6, stage: "Cuajado", sensitivity: 1.2 },
      { month: 7, stage: "Desarrollo fruto", sensitivity: 1.1 },
      { month: 8, stage: "Desarrollo fruto", sensitivity: 1.1 },
      { month: 9, stage: "Maduración", sensitivity: 1.0 },
      { month: 10, stage: "Maduración", sensitivity: 1.0 },
      { month: 11, stage: "Reposo", sensitivity: 0.8 },
      { month: 12, stage: "Reposo", sensitivity: 0.8 },
    ],
  },
  granadilla: {
    label: "Granadilla",
    phRange: [5.5, 6.5],
    tempRange: [18, 24],
    precipRange: [1200, 2000],
    humRange: [65, 85],
    altRange: [1200, 2000],
    weights: {
      ph: 10,
      temp: 13,
      precip: 11,
      humidity: 8,
      altitude: 14,
      wind: 6,
      solar: 5,
      soilTexture: 7,
      organicMatter: 10,
    },
    pestConditions: {
      fungalHumidityThreshold: 78,
      fungalTempRange: [20, 26],
      droughtPrecipThreshold: 70,
      frostTempThreshold: 8,
    },
    seasonalStages: [
      { month: 1, stage: "Floración", sensitivity: 1.2 },
      { month: 2, stage: "Floración", sensitivity: 1.2 },
      { month: 3, stage: "Cuajado", sensitivity: 1.1 },
      { month: 4, stage: "Desarrollo fruto", sensitivity: 1.0 },
      { month: 5, stage: "Cosecha", sensitivity: 0.8 },
      { month: 6, stage: "Cosecha", sensitivity: 0.8 },
      { month: 7, stage: "Floración", sensitivity: 1.2 },
      { month: 8, stage: "Floración", sensitivity: 1.2 },
      { month: 9, stage: "Desarrollo fruto", sensitivity: 1.0 },
      { month: 10, stage: "Cosecha", sensitivity: 0.8 },
      { month: 11, stage: "Cosecha", sensitivity: 0.8 },
      { month: 12, stage: "Reposo", sensitivity: 0.9 },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Soil texture scoring                                               */
/* ------------------------------------------------------------------ */

function getSoilTextureScore(
  texture: string,
  crop: CropKey,
): { score: number; status: "favorable" | "unfavorable" | "neutral"; explanation: string } {
  const textureScores: Record<string, Record<CropKey, number>> = {
    Franco: { cacao: 1.0, cafe: 1.0, granadilla: 1.0 },
    "Franco-arcilloso": { cacao: 0.9, cafe: 0.95, granadilla: 0.9 },
    "Franco arcillosa": { cacao: 0.9, cafe: 0.95, granadilla: 0.9 },
    "Franco-limoso": { cacao: 0.85, cafe: 0.9, granadilla: 0.85 },
    "Franco arenosa": { cacao: 0.8, cafe: 0.85, granadilla: 0.8 },
    Arcilla: { cacao: 0.7, cafe: 0.6, granadilla: 0.65 },
    Limo: { cacao: 0.75, cafe: 0.8, granadilla: 0.7 },
    Arena: { cacao: 0.5, cafe: 0.4, granadilla: 0.45 },
    Arcilloso: { cacao: 0.6, cafe: 0.5, granadilla: 0.55 },
    Limoso: { cacao: 0.7, cafe: 0.75, granadilla: 0.7 },
    Arenoso: { cacao: 0.4, cafe: 0.35, granadilla: 0.4 },
  };

  const normalized = textureScores[texture] ?? textureScores["Franco"];
  const score = normalized[crop] ?? 0.7;

  if (score >= 0.85) {
    return {
      score,
      status: "favorable",
      explanation: `Textura "${texture}" ideal para el cultivo.`,
    };
  }
  if (score >= 0.65) {
    return {
      score,
      status: "neutral",
      explanation: `Textura "${texture}" aceptable pero no óptima.`,
    };
  }
  return {
    score,
    status: "unfavorable",
    explanation: `Textura "${texture}" no es ideal. Considere mejoramientos.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Interaction effects                                                */
/* ------------------------------------------------------------------ */

function calculateInteractionEffects(
  temperature: number,
  humidity: number,
  precipitation: number,
  windSpeed: number,
  crop: CropKey,
): { adjustment: number; effects: string[] } {
  let adjustment = 0;
  const effects: string[] = [];
  const profile = CROP_PROFILES[crop];

  // High temp + low humidity = severe stress
  if (temperature > profile.tempRange[1] && humidity < profile.humRange[0]) {
    adjustment -= 8;
    effects.push("Estrés severo por alta temperatura y baja humedad combinadas");
  }

  // High precip + high humidity = fungal risk
  if (
    precipitation > profile.pestConditions.droughtPrecipThreshold &&
    humidity > profile.pestConditions.fungalHumidityThreshold
  ) {
    adjustment -= 6;
    effects.push("Alto riesgo de enfermedades fúngicas por exceso de humedad y precipitación");
  }

  // Strong wind + high temp = evapotranspiration stress
  if (windSpeed > 25 && temperature > profile.tempRange[1]) {
    adjustment -= 5;
    effects.push("Evapotranspiración acelerada por viento y temperatura elevada");
  }

  // Low precip + high wind = drought stress
  if (precipitation < profile.pestConditions.droughtPrecipThreshold * 0.5 && windSpeed > 15) {
    adjustment -= 4;
    effects.push("Estrés hídrico agravado por vientos secos");
  }

  // Favorable interactions
  if (
    temperature >= profile.tempRange[0] &&
    temperature <= profile.tempRange[1] &&
    humidity >= profile.humRange[0] &&
    humidity <= profile.humRange[1]
  ) {
    adjustment += 5;
    effects.push("Condiciones térmicas y de humedad sinérgicamente favorables");
  }

  return { adjustment, effects };
}

/* ------------------------------------------------------------------ */
/*  Pest & disease risk model                                          */
/* ------------------------------------------------------------------ */

function calculatePestRisk(
  temperature: number,
  humidity: number,
  precipitation: number,
  crop: CropKey,
): PestRisk {
  const profile = CROP_PROFILES[crop];
  const riskFactors: string[] = [];
  let riskScore = 0;

  // Fungal disease risk (moniliasis, black pod for cacao; rust for coffee)
  const inFungalTempRange =
    temperature >= profile.pestConditions.fungalTempRange[0] &&
    temperature <= profile.pestConditions.fungalTempRange[1];
  if (humidity > profile.pestConditions.fungalHumidityThreshold && inFungalTempRange) {
    riskScore += 40;
    riskFactors.push("Alta humedad y temperatura favorables para hongos (moniliasis, roya)");
  } else if (humidity > profile.pestConditions.fungalHumidityThreshold - 10) {
    riskScore += 20;
    riskFactors.push("Humedad moderada-alta, riesgo posible de enfermedades fúngicas");
  }

  // Drought stress (increases pest vulnerability)
  if (precipitation < profile.pestConditions.droughtPrecipThreshold) {
    riskScore += 25;
    riskFactors.push("Estrés hídrico incrementa vulnerabilidad a plagas");
  }

  // Frost risk
  if (temperature <= profile.pestConditions.frostTempThreshold) {
    riskScore += 35;
    riskFactors.push("Riesgo de heladas que debilitan el cultivo");
  }

  // Optimal conditions = lower pest pressure
  if (
    humidity < profile.pestConditions.fungalHumidityThreshold - 15 &&
    temperature < profile.pestConditions.fungalTempRange[0]
  ) {
    riskScore = Math.max(0, riskScore - 15);
  }

  let level: "Bajo" | "Medio" | "Alto";
  if (riskScore >= 50) level = "Alto";
  else if (riskScore >= 25) level = "Medio";
  else level = "Bajo";

  const recommendations: string[] = [];
  if (riskFactors.length > 0) {
    recommendations.push("Implementar monitoreo semanal de plagas y enfermedades");
    if (riskScore >= 40) {
      recommendations.push("Aplicar medidas preventivas de control biológico");
    }
    if (riskFactors.some((f) => f.includes("hongos"))) {
      recommendations.push("Considerar fungicidas preventivos en épocas de alta humedad");
    }
    if (riskFactors.some((f) => f.includes("heladas"))) {
      recommendations.push(
        "Instalar sistemas de protección contra heladas (aspersores, cubiertas)",
      );
    }
  } else {
    recommendations.push("Condiciones favorables, mantener monitoreo preventivo");
  }

  return { level, factors: riskFactors, recommendations };
}

/* ------------------------------------------------------------------ */
/*  Seasonal adjustment                                                */
/* ------------------------------------------------------------------ */

function getSeasonalAdjustment(
  month: number,
  crop: CropKey,
): {
  adjustment: number;
  stage: string;
  note: string;
} {
  const profile = CROP_PROFILES[crop];
  const stageInfo = profile.seasonalStages.find((s) => s.month === month);

  if (!stageInfo) {
    return { adjustment: 0, stage: "Desconocido", note: "" };
  }

  // High sensitivity stages get penalized more for unfavorable conditions
  // Low sensitivity stages are more forgiving
  const adjustment = (stageInfo.sensitivity - 1.0) * 10;

  let note = "";
  if (stageInfo.sensitivity >= 1.2) {
    note = `Mes crítico (${stageInfo.stage}). Las condiciones adversas tienen mayor impacto.`;
  } else if (stageInfo.sensitivity <= 0.8) {
    note = `Mes de baja sensibilidad (${stageInfo.stage}). El cultivo es más tolerante.`;
  }

  return { adjustment, stage: stageInfo.stage, note };
}

/* ------------------------------------------------------------------ */
/*  Confidence calculation                                             */
/* ------------------------------------------------------------------ */

function calculateConfidence(factors: FactorDetail[], hasRealData: boolean): number {
  let confidence = hasRealData ? 70 : 40;

  // More favorable/unfavorable factors with clear status = higher confidence
  const decisiveFactors = factors.filter((f) => f.status !== "neutral");
  confidence += decisiveFactors.length * 3;

  // High impact factors increase confidence
  const highImpact = factors.filter((f) => f.impact === "alto");
  confidence += highImpact.length * 2;

  return Math.min(95, Math.max(20, confidence));
}

/* ------------------------------------------------------------------ */
/*  MAIN: evaluateViability v2                                         */
/* ------------------------------------------------------------------ */

export function evaluateViability(
  crop: CropKey,
  soilPh: number,
  soilOrganicMatter: number,
  soilTexture: string,
  temperature: number,
  precipitation: number,
  humidity: number,
  windSpeed: number,
  solarRadiation: number,
  altitude: number,
  month: number = new Date().getMonth() + 1,
  hasRealData: boolean = true,
): ViabilityResult {
  const profile = CROP_PROFILES[crop];
  const factors: FactorDetail[] = [];
  let weightedScore = 0;
  let totalWeight = 0;

  // ---- pH ----
  const [phMin, phMax] = profile.phRange;
  const phOk = soilPh >= phMin && soilPh <= phMax;
  const phDeviation = Math.abs(soilPh - (phMin + phMax) / 2);
  const phScore = phOk ? 1.0 : Math.max(0, 1 - phDeviation / 3);
  factors.push({
    variable: "pH del suelo",
    value: soilPh.toFixed(1),
    status: phOk ? "favorable" : phScore > 0.5 ? "neutral" : "unfavorable",
    impact: phDeviation > 1.5 ? "alto" : "medio",
    explanation: phOk
      ? `pH ${soilPh} dentro del rango óptimo (${phMin}-${phMax}).`
      : `pH ${soilPh} fuera de rango óptimo (${phMin}-${phMax}). ${phDeviation > 1.5 ? "Requiere corrección urgente." : "Aceptable pero mejorable."}`,
    weight: profile.weights.ph,
    contribution: phScore * profile.weights.ph,
  });
  weightedScore += phScore * profile.weights.ph;
  totalWeight += profile.weights.ph;

  // ---- Organic matter ----
  const omOk = soilOrganicMatter >= 2.5;
  const omScore = omOk ? 1.0 : Math.min(1, soilOrganicMatter / 2.5);
  factors.push({
    variable: "Materia orgánica",
    value: `${soilOrganicMatter.toFixed(1)}%`,
    status: omOk ? "favorable" : soilOrganicMatter >= 1.5 ? "neutral" : "unfavorable",
    impact: soilOrganicMatter < 1.5 ? "alto" : "medio",
    explanation: omOk
      ? `Buena materia orgánica (${soilOrganicMatter}%). Favorece actividad microbiana.`
      : `Materia orgánica baja (${soilOrganicMatter}%). Aplicar compost o abono verde.`,
    weight: profile.weights.organicMatter,
    contribution: omScore * profile.weights.organicMatter,
  });
  weightedScore += omScore * profile.weights.organicMatter;
  totalWeight += profile.weights.organicMatter;

  // ---- Soil texture ----
  const textureResult = getSoilTextureScore(soilTexture, crop);
  factors.push({
    variable: "Textura del suelo",
    value: soilTexture,
    status: textureResult.status,
    impact: textureResult.status === "unfavorable" ? "alto" : "medio",
    explanation: textureResult.explanation,
    weight: profile.weights.soilTexture,
    contribution: textureResult.score * profile.weights.soilTexture,
  });
  weightedScore += textureResult.score * profile.weights.soilTexture;
  totalWeight += profile.weights.soilTexture;

  // ---- Temperature ----
  const [tMin, tMax] = profile.tempRange;
  const tempOk = temperature >= tMin && temperature <= tMax;
  const tempDeviation = Math.abs(temperature - (tMin + tMax) / 2);
  const tempScore = tempOk ? 1.0 : Math.max(0, 1 - tempDeviation / 10);
  factors.push({
    variable: "Temperatura",
    value: `${temperature.toFixed(1)}°C`,
    status: tempOk ? "favorable" : tempScore > 0.5 ? "neutral" : "unfavorable",
    impact: tempDeviation > 5 ? "alto" : "medio",
    explanation: tempOk
      ? `Temperatura ${temperature.toFixed(1)}°C dentro del rango óptimo (${tMin}-${tMax}°C).`
      : `Temperatura ${temperature.toFixed(1)}°C fuera de rango (${tMin}-${tMax}°C).`,
    weight: profile.weights.temp,
    contribution: tempScore * profile.weights.temp,
  });
  weightedScore += tempScore * profile.weights.temp;
  totalWeight += profile.weights.temp;

  // ---- Precipitation ----
  const [pMin, pMax] = profile.precipRange;
  const annualPrecip = precipitation * 365;
  const precipOk = annualPrecip >= pMin && annualPrecip <= pMax;
  const precipScore = precipOk
    ? 1.0
    : annualPrecip < pMin
      ? Math.max(0, annualPrecip / pMin)
      : Math.max(0, 1 - (annualPrecip - pMax) / (pMax * 0.5));
  factors.push({
    variable: "Precipitación",
    value: `${precipitation.toFixed(1)} mm/día (~${Math.round(annualPrecip)} mm/año)`,
    status: precipOk ? "favorable" : precipScore > 0.6 ? "neutral" : "unfavorable",
    impact: annualPrecip < pMin * 0.6 || annualPrecip > pMax * 1.3 ? "alto" : "medio",
    explanation: precipOk
      ? `Precipitación anual estimada ~${Math.round(annualPrecip)} mm, dentro del rango ideal.`
      : annualPrecip < pMin
        ? `Precipitación insuficiente (~${Math.round(annualPrecip)} mm/año). Se requiere riego.`
        : `Exceso de precipitación (~${Math.round(annualPrecip)} mm/año). Riesgo de encharcamiento.`,
    weight: profile.weights.precip,
    contribution: precipScore * profile.weights.precip,
  });
  weightedScore += precipScore * profile.weights.precip;
  totalWeight += profile.weights.precip;

  // ---- Humidity ----
  const [hMin, hMax] = profile.humRange;
  const humOk = humidity >= hMin && humidity <= hMax;
  const humScore = humOk ? 1.0 : Math.max(0, 1 - Math.abs(humidity - (hMin + hMax) / 2) / 20);
  factors.push({
    variable: "Humedad relativa",
    value: `${humidity.toFixed(0)}%`,
    status: humOk ? "favorable" : humScore > 0.6 ? "neutral" : "unfavorable",
    impact: "bajo",
    explanation: humOk
      ? `Humedad ${humidity.toFixed(0)}% adecuada para el cultivo.`
      : `Humedad ${humidity.toFixed(0)}% fuera del rango ideal (${hMin}-${hMax}%).`,
    weight: profile.weights.humidity,
    contribution: humScore * profile.weights.humidity,
  });
  weightedScore += humScore * profile.weights.humidity;
  totalWeight += profile.weights.humidity;

  // ---- Altitude ----
  const [aMin, aMax] = profile.altRange;
  const altOk = altitude >= aMin && altitude <= aMax;
  const altDeviation = Math.abs(altitude - (aMin + aMax) / 2);
  const altScore = altOk ? 1.0 : Math.max(0, 1 - altDeviation / 1000);
  factors.push({
    variable: "Altitud",
    value: `${altitude} msnm`,
    status: altOk ? "favorable" : altScore > 0.5 ? "neutral" : "unfavorable",
    impact: altDeviation > 500 ? "alto" : "medio",
    explanation: altOk
      ? `Altitud ${altitude} msnm dentro del rango óptimo (${aMin}-${aMax} msnm).`
      : `Altitud ${altitude} msnm fuera del rango ideal (${aMin}-${aMax} msnm).`,
    weight: profile.weights.altitude,
    contribution: altScore * profile.weights.altitude,
  });
  weightedScore += altScore * profile.weights.altitude;
  totalWeight += profile.weights.altitude;

  // ---- Wind ----
  const windOk = windSpeed < 20;
  const windScore = windOk ? 1.0 : Math.max(0, 1 - (windSpeed - 20) / 30);
  factors.push({
    variable: "Velocidad del viento",
    value: `${windSpeed.toFixed(0)} km/h`,
    status: windOk ? "favorable" : windScore > 0.5 ? "neutral" : "unfavorable",
    impact: windSpeed > 30 ? "alto" : "medio",
    explanation: windOk
      ? "Vientos moderados, sin riesgo significativo."
      : `Vientos fuertes (${windSpeed.toFixed(0)} km/h) pueden causar daño mecánico.`,
    weight: profile.weights.wind,
    contribution: windScore * profile.weights.wind,
  });
  weightedScore += windScore * profile.weights.wind;
  totalWeight += profile.weights.wind;

  // ---- Solar radiation (MJ/m²/day) ----
  const solarOk = solarRadiation > 12;
  const solarScore = solarOk ? 1.0 : Math.max(0, solarRadiation / 12);
  factors.push({
    variable: "Radiación solar",
    value: `${solarRadiation.toFixed(1)} MJ/m²/día`,
    status: solarOk ? "favorable" : solarScore > 0.5 ? "neutral" : "unfavorable",
    impact: solarRadiation < 8 ? "alto" : "bajo",
    explanation: solarOk
      ? "Radiación solar suficiente para fotosíntesis productiva."
      : "Radiación solar baja, puede limitar la productividad.",
    weight: profile.weights.solar,
    contribution: solarScore * profile.weights.solar,
  });
  weightedScore += solarScore * profile.weights.solar;
  totalWeight += profile.weights.solar;

  // ---- Interaction effects ----
  const interactions = calculateInteractionEffects(
    temperature,
    humidity,
    precipitation,
    windSpeed,
    crop,
  );
  weightedScore += interactions.adjustment;

  // ---- Seasonal adjustment ----
  const seasonal = getSeasonalAdjustment(month, crop);
  weightedScore += seasonal.adjustment;

  // ---- Final score ----
  const normalizedScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 50;
  const finalScore = Math.max(0, Math.min(100, Math.round(normalizedScore)));
  const viable = finalScore >= 50;

  // ---- Pest risk ----
  const pestRisk = calculatePestRisk(temperature, humidity, precipitation, crop);

  // ---- Confidence ----
  const confidence = calculateConfidence(factors, hasRealData);

  // ---- Recommendations ----
  const recommendations = generateRecommendations(crop, factors, pestRisk, seasonal);

  // ---- Alternatives ----
  const alternatives = generateAlternatives(crop);

  return {
    score: finalScore,
    viable,
    factors,
    recommendations,
    alternatives,
    pestRisk,
    seasonalNote: seasonal.note,
    confidence,
  };
}

/* ------------------------------------------------------------------ */
/*  Recommendations generator (v2)                                     */
/* ------------------------------------------------------------------ */

function generateRecommendations(
  crop: CropKey,
  factors: FactorDetail[],
  pestRisk: PestRisk,
  seasonal: { stage: string; note: string },
): string[] {
  const recs: string[] = [];
  const unfavorable = factors.filter((f) => f.status === "unfavorable");
  const profile = CROP_PROFILES[crop];

  if (unfavorable.length === 0) {
    recs.push("Condiciones favorables para el cultivo. Mantener buenas prácticas agrícolas.");
  }

  for (const f of unfavorable) {
    if (f.variable.includes("pH")) {
      const phValue = parseFloat(f.value);
      const remedy =
        phValue < profile.phRange[0]
          ? "aplicar cal dolomita para elevar el pH"
          : "aplicar azufre elemental o materia orgánica ácida para reducir el pH";
      recs.push(
        `Corregir pH del suelo (${f.value}). Se recomienda ${remedy}. Rango ideal: ${profile.phRange[0]}-${profile.phRange[1]}.`,
      );
    }
    if (f.variable.includes("Materia orgánica")) {
      recs.push(
        "Aplicar compost o abono orgánico para elevar la materia orgánica del suelo por encima del 2.5%.",
      );
    }
    if (f.variable.includes("Temperatura")) {
      recs.push(
        `Temperatura fuera de rango. Considerar sombra regulada, riego por aspersión o variedades tolerantes.`,
      );
    }
    if (f.variable.includes("Precipitación")) {
      recs.push(
        "Instalar sistema de riego por goteo o drenaje según sea déficit o exceso de precipitación.",
      );
    }
    if (f.variable.includes("Altitud")) {
      recs.push("Seleccionar variedades o cultivos adaptados a la altitud de la zona.");
    }
    if (f.variable.includes("viento")) {
      recs.push(
        "Establecer cortinas vegetales o barreras vivas para proteger el cultivo del viento.",
      );
    }
    if (f.variable.includes("Textura")) {
      recs.push(
        "Mejorar la textura del suelo con enmiendas orgánicas (compost, cascarilla de arroz).",
      );
    }
  }

  // Pest risk recommendations
  if (pestRisk.level === "Alto") {
    recs.push(
      "⚠️ Riesgo alto de plagas/enfermedades. Implementar programa de manejo integrado de plagas (MIP).",
    );
  } else if (pestRisk.level === "Medio") {
    recs.push(
      "Riesgo moderado de plagas. Realizar monitoreo semanal y aplicar controles preventivos.",
    );
  }

  // Seasonal note
  if (seasonal.note) {
    recs.push(`📅 ${seasonal.note}`);
  }

  recs.push("Consultar con un ingeniero agrónomo para un plan de manejo específico para su finca.");

  return recs;
}

/* ------------------------------------------------------------------ */
/*  Alternative crops (unchanged)                                      */
/* ------------------------------------------------------------------ */

const ALTERNATIVES: Record<CropKey, AlternativeCrop[]> = {
  cacao: [
    {
      name: "Café",
      reason: "Tolera mejor altitudes intermedias",
      estimatedYield: "1.2-1.8 Ton/Ha",
      bestSeason: "Marzo-Abril",
    },
    {
      name: "Plátano",
      reason: "Cultivo de rápido retorno, tolera diversas condiciones",
      estimatedYield: "15-25 Ton/Ha",
      bestSeason: "Todo el año",
    },
    {
      name: "Yuca",
      reason: "Resistente a sequía, bajo mantenimiento",
      estimatedYield: "10-15 Ton/Ha",
      bestSeason: "Todo el año",
    },
  ],
  cafe: [
    {
      name: "Cacao",
      reason: "Tolera zonas más bajas y cálidas",
      estimatedYield: "0.85-1.2 Ton/Ha",
      bestSeason: "Abril-Mayo",
    },
    {
      name: "Aguacate",
      reason: "Alto valor comercial, requerimientos similares",
      estimatedYield: "12-18 Ton/Ha",
      bestSeason: "Marzo-Junio",
    },
    {
      name: "Guayaba",
      reason: "Frutal tropical de baja altitud",
      estimatedYield: "15-20 Ton/Ha",
      bestSeason: "Todo el año",
    },
  ],
  granadilla: [
    {
      name: "Maracuyá",
      reason: "Misma familia, mayor resistencia a plagas",
      estimatedYield: "15-20 Ton/Ha",
      bestSeason: "Marzo-Junio",
    },
    {
      name: "Lulo",
      reason: "Frutal andino, buena adaptación",
      estimatedYield: "10-15 Ton/Ha",
      bestSeason: "Abril-Junio",
    },
    {
      name: "Tomate de árbol",
      reason: "Cultivo emergente, alto valor nutricional",
      estimatedYield: "8-12 Ton/Ha",
      bestSeason: "Todo el año",
    },
  ],
};

function generateAlternatives(crop: CropKey): AlternativeCrop[] {
  return ALTERNATIVES[crop] ?? [];
}
