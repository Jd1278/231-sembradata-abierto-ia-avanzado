import { OPTIMAL_TIME_RANGES } from "./climate-api";

export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Determina el rango histórico óptimo para predicción según:
 * - Calidad de datos (Open-Meteo: 90d, NASA POWER: 1981-presente)
 * - Relevancia estadística (ventana mínima: 90 días)
 * - Estacionalidad colombiana (dos temporadas secas/lluviosas)
 * - Tipo de cultivo (perenne vs transitorio)
 *
 | Cultivo     | Ciclo         | Rango mínimo | Rango óptimo |
 |-------------|---------------|--------------|--------------|
 | Cacao       | Perenne       | 90 días      | 365 días     |
 | Café        | Anual         | 90 días      | 365 días     |
 | Granadilla  | Semestral     | 90 días      | 180 días     |
 | Plátano     | Perenne       | 90 días      | 365 días     |
 | Yuca        | 9-12 meses    | 90 días      | 365 días     |
 | Arroz       | 4-6 meses     | 90 días      | 180 días     |
 | Maíz        | 4-5 meses     | 90 días      | 180 días     |
 *
 * Para Colombia, datos anteriores a 5 años aún son relevantes
 * por variabilidad ENSO. El límite inferior depende de la fuente:
 * - Open-Meteo: 90d históricos
 * - NASA POWER: datos desde 1981
 */
export type CropCycle = "perenne" | "anual" | "semestral" | "transitorio";

export const CROP_CYCLES: Record<string, CropCycle> = {
  cacao: "perenne",
  cafe: "anual",
  granadilla: "semestral",
  platano: "perenne",
  yuca: "anual",
  arroz: "transitorio",
  maiz: "transitorio",
};

export function getOptimalPastDays(crop: string): number {
  const cycle = CROP_CYCLES[crop] ?? "anual";
  switch (cycle) {
    case "perenne":
      return OPTIMAL_TIME_RANGES.annual.pastDays;
    case "anual":
      return OPTIMAL_TIME_RANGES.annual.pastDays;
    case "semestral":
      return OPTIMAL_TIME_RANGES.semiAnnual.pastDays;
    case "transitorio":
      return OPTIMAL_TIME_RANGES.semiAnnual.pastDays;
    default:
      return OPTIMAL_TIME_RANGES.current.pastDays;
  }
}

export function getMinRelevantYear(): number {
  return 2021;
}

export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const minYear = getMinRelevantYear();
  const years: number[] = [];
  for (let y = currentYear; y >= minYear; y--) {
    years.push(y);
  }
  return years;
}

export function getAvailableMonths(year: number): { value: number; label: string }[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const maxMonth = year === currentYear ? currentMonth : 12;
  const result: { value: number; label: string }[] = [];
  for (let m = 1; m <= maxMonth; m++) {
    result.push({ value: m, label: MONTH_LABELS[m - 1] });
  }
  return result;
}

export function getTemporalRangeDescription(crop: string): string {
  const days = getOptimalPastDays(crop);
  const years = Math.round((days / 365) * 10) / 10;
  const cycle = CROP_CYCLES[crop] ?? "anual";
  const rangeKey = cycle === "semestral" || cycle === "transitorio" ? "semiAnnual" : "annual";
  const label = OPTIMAL_TIME_RANGES[rangeKey].label;
  return `Rango óptimo: ~${days} días (${years} año(s)) — ${label}`;
}
