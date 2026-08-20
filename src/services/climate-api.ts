export interface MonthlyPrecipitation {
  year: number;
  month: number;
  precipitation: number;
}

export interface ClimateData {
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  solarRadiation: number;
  uvIndex: number;
  cloudCover: number;
  pressure: number;
  evapotranspiration: number;
  dailyData: DailyClimate[];
  monthlyPrecipitation: MonthlyPrecipitation[];
  agriculturalIndex: AgriculturalIndices;
}

export interface DailyClimate {
  date: string;
  tempMax: number;
  tempMin: number;
  precip: number;
  humidity: number;
  windSpeed: number;
  solarRad: number;
  uvIndex: number;
}

export interface HistoricalSummary {
  period: { start: string; end: string };
  avgTemp: number;
  totalPrecip: number;
  avgHumidity: number;
  daysAbove35: number;
  daysBelow5: number;
  frostDays: number;
  dryDays: number;
}

export interface AgriculturalIndices {
  GrowingDegreeDays: number;
  aridityIndex: number;
  moistureStressIndex: number;
  frostRisk: number;
  droughtRisk: number;
}

const BASE_URL = "https://api.open-meteo.com/v1";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const responseCache = new Map<string, { data: unknown; at: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(url: string): string {
  return url;
}

function getCached<T>(url: string): T | null {
  const entry = responseCache.get(cacheKey(url));
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    responseCache.delete(cacheKey(url));
    return null;
  }
  return entry.data as T;
}

function setCache(url: string, data: unknown): void {
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of responseCache) {
      if (now - entry.at > CACHE_TTL_MS) responseCache.delete(key);
    }
  }
  if (responseCache.size > 200) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(cacheKey(url), { data, at: Date.now() });
}

export function clearClimateCache(): void {
  responseCache.clear();
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error("Fetch failed after retries");
}

const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "relative_humidity_2m_mean",
  "wind_speed_10m_mean",
  "shortwave_radiation_sum",
  "uv_index_max",
].join(",");

/**
 * Rangos temporales óptimos para agricultura colombiana:
 *
 * | Horizonte   | Período     | Propósito                                  |
 * |-------------|-------------|--------------------------------------------|
 * | Corto       | 7–30 días   | Riego, cosecha, eventos extremos inmin.    |
 * | Estación    | 90 días     | Condición actual + ventana de siembra      |
 * | Semestral   | 180 días    | Ciclo cultivos transitorios (maíz, fríjol) |
 * | Anual       | 365 días    | Ciclo fenológico completo (café, cacao)    |
 * | Histórico   | 3–10 años   | Variabilidad ENSO, tendencias             |
 * | Climático   | 30 años     | Cambio de aptitud de zonas                |
 *
 * Para evaluateViability, se recomienda 90–365 días para capturar
 * las dos temporadas secas y lluviosas de la región Andina.
 */
export const OPTIMAL_TIME_RANGES = {
  immediate: { pastDays: 7, label: "Inmediato" },
  current: { pastDays: 90, label: "Estación actual" },
  semiAnnual: { pastDays: 180, label: "Semestral" },
  annual: { pastDays: 365, label: "Ciclo anual" },
  historical: { pastDays: 365 * 5, label: "Histórico (5 años)" },
  climate: { pastDays: 365 * 30, label: "Climático (30 años)" },
} as const;

function mapDailyData(raw: {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  relative_humidity_2m_mean: number[];
  wind_speed_10m_mean: number[];
  shortwave_radiation_sum: number[];
  uv_index_max: number[];
}): DailyClimate[] {
  const result: DailyClimate[] = [];
  for (let i = 0; i < raw.time.length; i++) {
    if (raw.temperature_2m_max?.[i] == null || raw.temperature_2m_min?.[i] == null) continue;
    result.push({
      date: raw.time[i],
      tempMax: raw.temperature_2m_max[i],
      tempMin: raw.temperature_2m_min[i],
      precip: raw.precipitation_sum?.[i] ?? 0,
      humidity: raw.relative_humidity_2m_mean?.[i] ?? 0,
      windSpeed: raw.wind_speed_10m_mean?.[i] ?? 0,
      solarRad: raw.shortwave_radiation_sum?.[i] ?? 0,
      uvIndex: raw.uv_index_max?.[i] ?? 0,
    });
  }
  return result;
}

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const parts = dateStr.split("-");
  return { year: Number(parts[0]), month: Number(parts[1]) };
}

export function aggregateMonthlyPrecipitation(dailyData: DailyClimate[]): MonthlyPrecipitation[] {
  const map = new Map<string, number>();
  for (const d of dailyData) {
    const { year, month } = parseYearMonth(d.date);
    const key = `${year}-${month}`;
    map.set(key, (map.get(key) ?? 0) + (d.precip ?? 0));
  }
  const result: MonthlyPrecipitation[] = [];
  for (const [key, precip] of map) {
    const [yearStr, monthStr] = key.split("-");
    result.push({
      year: Number(yearStr),
      month: Number(monthStr),
      precipitation: +precip.toFixed(1),
    });
  }
  result.sort((a, b) => a.year - b.year || a.month - b.month);
  return result;
}

function computeAgriculturalIndices(
  dailyData: DailyClimate[],
  avgTemp: number,
  avgPrecip: number,
  avgHumidity: number,
  monthlyPrecipitation: MonthlyPrecipitation[],
): AgriculturalIndices {
  const gdd = dailyData.reduce((sum, d) => {
    const avg = (d.tempMax + d.tempMin) / 2;
    return sum + Math.max(0, avg - 10);
  }, 0);

  // Hargreaves PET (mm/day)
  // Ra = extraterrestrial radiation in mm/day for the latitude.
  // For Santander, Colombia (~6.5°N): Ra ≈ 4.5 mm/day (annual avg)
  const Ra = 4.5;
  let totalPet = 0;
  for (const d of dailyData) {
    const tMean = (d.tempMax + d.tempMin) / 2;
    const tRange = Math.max(0.1, d.tempMax - d.tempMin);
    totalPet += 0.0023 * Math.sqrt(tRange) * (tMean + 17.8) * Ra;
  }
  const totalPrecip = dailyData.reduce((sum, d) => sum + d.precip, 0);

  // Use the most recent month's actual accumulated precipitation for drought risk
  const lastMonth =
    monthlyPrecipitation.length > 0 ? monthlyPrecipitation[monthlyPrecipitation.length - 1] : null;
  const recentMonthlyPrecip = lastMonth ? lastMonth.precipitation : 0;

  // Aridity index (De Martonne-inspired): P/PET
  // < 0.3 = árido, 0.3–0.5 = semi-árido, 0.5–0.75 = semi-húmedo, 0.75–1 = sub-húmedo, > 1 = húmedo
  const ratio = totalPet > 0 ? totalPrecip / totalPet : totalPrecip > 0 ? 2 : 0;

  // Moisture stress: fraction of days where PET > precip (dry days)
  let dryDays = 0;
  for (const d of dailyData) {
    const tMean = (d.tempMax + d.tempMin) / 2;
    const tRange = Math.max(0.1, d.tempMax - d.tempMin);
    const dailyPet = 0.0023 * Math.sqrt(tRange) * (tMean + 17.8) * Ra;
    if (d.precip < dailyPet * 0.5) dryDays++;
  }
  const moistureStress = dailyData.length > 0 ? dryDays / dailyData.length : 0;

  // Drought risk based on actual monthly precipitation (mm/month)
  // < 50 mm/month = severe drought risk, < 100 mm/month = moderate, else low
  return {
    GrowingDegreeDays: +gdd.toFixed(1),
    aridityIndex: +Math.min(8, ratio).toFixed(2),
    moistureStressIndex: +moistureStress.toFixed(2),
    frostRisk: +(dailyData.some((d) => d.tempMin < 2) ? 0.8 : 0).toFixed(2),
    droughtRisk: +(recentMonthlyPrecip < 50 ? 0.9 : recentMonthlyPrecip < 100 ? 0.5 : 0.1).toFixed(
      2,
    ),
  };
}

export async function fetchCurrentClimate(
  lat: number,
  lng: number,
  pastDays = 90,
): Promise<ClimateData> {
  const effectivePastDays = Math.min(pastDays, 93);
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "wind_speed_10m",
      "wind_direction_10m",
      "shortwave_radiation",
      "uv_index",
      "cloud_cover",
      "surface_pressure",
    ].join(","),
    daily: DAILY_FIELDS,
    timezone: "America/Bogota",
    forecast_days: "7",
    past_days: String(effectivePastDays),
  });

  const url = `${BASE_URL}/forecast?${params}`;
  let data: Record<string, unknown>;
  const cached = getCached<Record<string, unknown>>(url);
  if (cached) {
    data = cached;
  } else {
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    data = (await res.json()) as Record<string, unknown>;
    setCache(url, data);
  }
  const current = (data.current ?? {}) as Record<string, number>;
  const dailyRaw = data.daily as Record<string, unknown[]> | undefined;
  if (!dailyRaw?.time) throw new Error("Invalid climate API response: missing daily.time");
  const dailyData = mapDailyData(dailyRaw as Parameters<typeof mapDailyData>[0]);

  let tempSum = 0,
    precipSum = 0,
    humSum = 0,
    solarSum = 0;
  let maxTemp = -Infinity,
    minTemp = Infinity;
  for (const d of dailyData) {
    const avg = (d.tempMax + d.tempMin) / 2;
    tempSum += avg;
    precipSum += d.precip;
    humSum += d.humidity;
    solarSum += d.solarRad;
    if (d.tempMax > maxTemp) maxTemp = d.tempMax;
    if (d.tempMin < minTemp) minTemp = d.tempMin;
  }
  const len = dailyData.length;
  const avgTemp = len ? tempSum / len : 0;
  const avgPrecip = len ? precipSum / len : 0;
  const avgHumidity = len ? humSum / len : 0;
  const avgSolarRad = len ? solarSum / len : 0;
  const gdd = Math.max(0, avgTemp - 10);

  const monthlyPrecipitation = aggregateMonthlyPrecipitation(dailyData);

  return {
    temperature: current.temperature_2m ?? avgTemp,
    temperatureMax: len ? maxTemp : (current.temperature_2m ?? 0),
    temperatureMin: len ? minTemp : (current.temperature_2m ?? 0),
    humidity: current.relative_humidity_2m ?? avgHumidity,
    precipitation: avgPrecip || (current.precipitation ?? 0),
    windSpeed: current.wind_speed_10m ?? 0,
    windDirection: current.wind_direction_10m ?? 0,
    solarRadiation: avgSolarRad,
    uvIndex: current.uv_index ?? 0,
    cloudCover: current.cloud_cover ?? 0,
    pressure: current.surface_pressure ?? 1013,
    evapotranspiration: +(gdd * 0.15).toFixed(1),
    dailyData,
    monthlyPrecipitation,
    agriculturalIndex: computeAgriculturalIndices(
      dailyData,
      avgTemp,
      avgPrecip,
      avgHumidity,
      monthlyPrecipitation,
    ),
  };
}

export async function fetchHistoricalClimate(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<ClimateData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: DAILY_FIELDS,
    timezone: "America/Bogota",
  });

  const url = `${ARCHIVE_URL}?${params}`;
  let data: Record<string, unknown>;
  const cached = getCached<Record<string, unknown>>(url);
  if (cached) {
    data = cached;
  } else {
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Historical climate API error: ${res.status}`);
    data = (await res.json()) as Record<string, unknown>;
    setCache(url, data);
  }
  const dailyRaw = data.daily as Record<string, unknown[]> | undefined;
  if (!dailyRaw?.time)
    throw new Error("Invalid historical climate API response: missing daily.time");
  const dailyData = mapDailyData(dailyRaw as Parameters<typeof mapDailyData>[0]);

  let tempSum = 0,
    precipSum = 0,
    humSum = 0,
    solarSum = 0,
    windSum = 0,
    uvSum = 0;
  let maxTemp = -Infinity,
    minTemp = Infinity;
  for (const d of dailyData) {
    const avg = (d.tempMax + d.tempMin) / 2;
    tempSum += avg;
    precipSum += d.precip;
    humSum += d.humidity;
    solarSum += d.solarRad;
    windSum += d.windSpeed;
    uvSum += d.uvIndex;
    if (d.tempMax > maxTemp) maxTemp = d.tempMax;
    if (d.tempMin < minTemp) minTemp = d.tempMin;
  }
  const len = dailyData.length;
  const avgTemp = len ? tempSum / len : 0;
  const avgPrecip = len ? precipSum / len : 0;
  const avgHumidity = len ? humSum / len : 0;
  const avgSolarRad = len ? solarSum / len : 0;
  const avgWind = len ? windSum / len : 0;
  const avgUv = len ? uvSum / len : 0;
  const gdd = Math.max(0, avgTemp - 10);

  const monthlyPrecipitation = aggregateMonthlyPrecipitation(dailyData);

  return {
    temperature: avgTemp,
    temperatureMax: len ? maxTemp : 0,
    temperatureMin: len ? minTemp : 0,
    humidity: avgHumidity,
    precipitation: avgPrecip,
    windSpeed: avgWind,
    windDirection: 0,
    solarRadiation: avgSolarRad,
    uvIndex: avgUv,
    cloudCover: 0,
    pressure: 1013,
    evapotranspiration: +(gdd * 0.15).toFixed(1),
    dailyData,
    monthlyPrecipitation,
    agriculturalIndex: computeAgriculturalIndices(
      dailyData,
      avgTemp,
      avgPrecip,
      avgHumidity,
      monthlyPrecipitation,
    ),
  };
}

export async function fetchRecentHistory(lat: number, lng: number): Promise<HistoricalSummary> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: DAILY_FIELDS,
    timezone: "America/Bogota",
    past_days: "90",
    forecast_days: "0",
  });

  const url = `${BASE_URL}/forecast?${params}`;
  let data: Record<string, unknown>;
  const cached = getCached<Record<string, unknown>>(url);
  if (cached) {
    data = cached;
  } else {
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    data = (await res.json()) as Record<string, unknown>;
    setCache(url, data);
  }
  const dailyRaw = data.daily as Record<string, unknown[]> | undefined;
  if (!dailyRaw?.time) throw new Error("Invalid climate API response: missing daily.time");
  const dailyData = mapDailyData(dailyRaw as Parameters<typeof mapDailyData>[0]);

  let tempSum = 0,
    precipSum = 0,
    humSum = 0;
  let daysAbove35 = 0,
    daysBelow5 = 0,
    frostDays = 0,
    dryDays = 0;
  for (const d of dailyData) {
    tempSum += (d.tempMax + d.tempMin) / 2;
    precipSum += d.precip;
    humSum += d.humidity;
    if (d.tempMax > 35) daysAbove35++;
    if (d.tempMin < 5) daysBelow5++;
    if (d.tempMin < 0) frostDays++;
    if (d.precip < 1) dryDays++;
  }
  const len = dailyData.length;
  const avgTemp = len ? tempSum / len : 0;
  const totalPrecip = precipSum;
  const avgHumidity = len ? humSum / len : 0;

  const dates = dailyData.map((d) => d.date);

  return {
    period: { start: dates[0] ?? "", end: dates[dates.length - 1] ?? "" },
    avgTemp: +avgTemp.toFixed(1),
    totalPrecip: +totalPrecip.toFixed(1),
    avgHumidity: +avgHumidity.toFixed(1),
    daysAbove35,
    daysBelow5,
    frostDays,
    dryDays,
  };
}
