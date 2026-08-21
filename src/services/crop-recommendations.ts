import type { AlternativeCrop } from "@/types/prediction-v2";

export interface CropRecommendationContext {
  temperature: number;
  precipitationDaily: number;
  humidity: number;
  altitude: number;
}

type Candidate = AlternativeCrop & {
  temp: [number, number];
  precipitationAnnual: [number, number];
  humidity: [number, number];
  altitude: [number, number];
};

const CANDIDATES: Candidate[] = [
  {
    name: "Cacao",
    reason: "",
    estimatedYield: "0.85–1.2 t/ha",
    bestSeason: "Abril–mayo",
    temp: [21, 32],
    precipitationAnnual: [1500, 2500],
    humidity: [70, 90],
    altitude: [0, 800],
  },
  {
    name: "Café",
    reason: "",
    estimatedYield: "1.2–1.8 t/ha",
    bestSeason: "Marzo–abril",
    temp: [18, 22],
    precipitationAnnual: [1500, 2000],
    humidity: [60, 85],
    altitude: [1200, 1800],
  },
  {
    name: "Granadilla",
    reason: "",
    estimatedYield: "9–12 t/ha",
    bestSeason: "Septiembre–octubre",
    temp: [15, 20],
    precipitationAnnual: [1000, 2000],
    humidity: [60, 80],
    altitude: [1800, 2800],
  },
  {
    name: "Aguacate",
    reason: "",
    estimatedYield: "8–15 t/ha",
    bestSeason: "Según calendario local",
    temp: [14, 24],
    precipitationAnnual: [1200, 2200],
    humidity: [55, 85],
    altitude: [1000, 2500],
  },
  {
    name: "Plátano",
    reason: "",
    estimatedYield: "15–25 t/ha",
    bestSeason: "Todo el año",
    temp: [20, 30],
    precipitationAnnual: [1200, 2500],
    humidity: [60, 90],
    altitude: [0, 1800],
  },
  {
    name: "Yuca",
    reason: "",
    estimatedYield: "10–20 t/ha",
    bestSeason: "Inicio de lluvias",
    temp: [22, 30],
    precipitationAnnual: [800, 1800],
    humidity: [45, 80],
    altitude: [0, 1500],
  },
  {
    name: "Lulo",
    reason: "",
    estimatedYield: "10–15 t/ha",
    bestSeason: "Inicio de lluvias",
    temp: [16, 22],
    precipitationAnnual: [1500, 2500],
    humidity: [65, 90],
    altitude: [1600, 2600],
  },
  {
    name: "Tomate de árbol",
    reason: "",
    estimatedYield: "12–20 t/ha",
    bestSeason: "Según calendario local",
    temp: [13, 19],
    precipitationAnnual: [1200, 2000],
    humidity: [55, 85],
    altitude: [1800, 2800],
  },
];

function score(value: number, [min, max]: [number, number], tolerance: number): number {
  if (value >= min && value <= max) return 1;
  return Math.max(0, 1 - (value < min ? min - value : value - max) / tolerance);
}

export function recommendAlternativeCrops(
  context: CropRecommendationContext,
  exclude?: string,
): AlternativeCrop[] {
  const annualPrecip = context.precipitationDaily * 365;
  return CANDIDATES.filter((candidate) => candidate.name.toLowerCase() !== exclude?.toLowerCase())
    .map((candidate) => {
      const temp = score(context.temperature, candidate.temp, 8);
      const precip = score(annualPrecip, candidate.precipitationAnnual, 1200);
      const humidity = score(context.humidity, candidate.humidity, 30);
      const altitude = score(context.altitude, candidate.altitude, 1200);
      const total = Math.round(
        (temp * 0.35 + precip * 0.3 + humidity * 0.15 + altitude * 0.2) * 100,
      );
      const matches = [
        temp >= 0.8 && "temperatura",
        precip >= 0.8 && "precipitación",
        humidity >= 0.8 && "humedad",
        altitude >= 0.8 && "altitud",
      ]
        .filter(Boolean)
        .join(", ");
      return {
        ...candidate,
        score: total,
        compatibility: {
          temperature: Math.round(temp * 100),
          precipitation: Math.round(precip * 100),
          humidity: Math.round(humidity * 100),
          altitude: Math.round(altitude * 100),
        },
        reason: `Compatibilidad ${total}/100; variables favorables: ${matches || "compatibilidad parcial"}.`,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(
      ({
        temp: _temp,
        precipitationAnnual: _precip,
        humidity: _humidity,
        altitude: _altitude,
        ...crop
      }) => crop,
    );
}
