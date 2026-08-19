import { getCachedNasaPower, setCachedNasaPower, type NasaPowerCacheRow } from "./cache";
import { rateLimitedFetch } from "./rate-limiter";

export interface NasaPowerDaily {
  date: string;
  tempAvg: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  windDirection: number;
  evapotranspiration: number;
  wetBulbTemp: number;
  earthSkinTemp: number;
  clearnessIndex: number;
  cloudOpacity: number;
  referenceEvapotranspiration: number;
}

export interface AgiClimatologyIndices {
  waterDemand: number;
  heatStressDays: number;
  coldStressDays: number;
  frostFreeDays: number;
  optimalGrowthDays: number;
  petAnnual: number;
}

export interface NasaPowerSummary {
  location: { lat: number; lng: number };
  period: { start: string; end: string };
  daily: NasaPowerDaily[];
  monthly: {
    month: string;
    tempAvg: number;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    humidity: number;
    solarRadiation: number;
    windSpeed: number;
    referenceEvapotranspiration: number;
  }[];
  annual: {
    tempAvg: number;
    precipitation: number;
    humidity: number;
    solarRadiation: number;
    referenceEvapotranspiration: number;
    gdd: number;
    cdd: number;
    hdd: number;
  };
  agroIndices?: AgiClimatologyIndices;
}

const BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

const AG_PARAMS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "PRECTOTCORR",
  "RH2M",
  "WS2M",
  "WS2M_MAX",
  "WS2M_MIN",
  "WD2M",
  "ALLSKY_SFC_SW_DWN",
  "EVPTRNS",
  "T2MDEW",
  "TS",
  "ALLSKY_KT",
  "ALLSKY_SFC_LW_DWN",
  "GDD0",
  "GDD10",
  "CDD0",
  "HDD0",
  "CDD10",
  "PET",
  "SNOWP",
].join(",");

function formatParam(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function buildSummary(
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date,
  daily: NasaPowerDaily[],
): NasaPowerSummary {
  const monthMap = new Map<string, NasaPowerDaily[]>();
  for (const d of daily) {
    const m = d.date.slice(0, 7);
    if (!monthMap.has(m)) monthMap.set(m, []);
    monthMap.get(m)!.push(d);
  }

  const monthly = [...monthMap.entries()].map(([month, days]) => ({
    month,
    tempAvg: days.reduce((s, d) => s + d.tempAvg, 0) / days.length,
    tempMax: Math.max(...days.map((d) => d.tempMax)),
    tempMin: Math.min(...days.map((d) => d.tempMin)),
    precipitation: days.reduce((s, d) => s + d.precipitation, 0),
    humidity: days.reduce((s, d) => s + d.humidity, 0) / days.length,
    solarRadiation: days.reduce((s, d) => s + d.solarRadiation, 0) / days.length,
    windSpeed: days.reduce((s, d) => s + d.windSpeed, 0) / days.length,
    referenceEvapotranspiration:
      days.reduce((s, d) => s + d.referenceEvapotranspiration, 0) / days.length,
  }));

  const totalDays = daily.length;
  const annual =
    totalDays > 0
      ? {
          tempAvg: daily.reduce((s, d) => s + d.tempAvg, 0) / totalDays,
          precipitation: daily.reduce((s, d) => s + d.precipitation, 0),
          humidity: daily.reduce((s, d) => s + d.humidity, 0) / totalDays,
          solarRadiation: daily.reduce((s, d) => s + d.solarRadiation, 0) / totalDays,
          referenceEvapotranspiration:
            daily.reduce((s, d) => s + d.referenceEvapotranspiration, 0) / totalDays,
          gdd: daily.reduce((s, d) => s + Math.max(0, d.tempAvg - 10), 0),
          cdd: daily.reduce((s, d) => s + Math.max(0, d.tempAvg - 18), 0),
          hdd: daily.reduce((s, d) => s + Math.max(0, 18 - d.tempAvg), 0),
        }
      : {
          tempAvg: 0,
          precipitation: 0,
          humidity: 0,
          solarRadiation: 0,
          referenceEvapotranspiration: 0,
          gdd: 0,
          cdd: 0,
          hdd: 0,
        };

  return {
    location: { lat, lng },
    period: {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    },
    daily,
    monthly,
    annual,
  };
}

export async function fetchNasaPowerData(
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date,
): Promise<NasaPowerSummary> {
  const fechaInicio = startDate.toISOString().slice(0, 10);
  const fechaFin = endDate.toISOString().slice(0, 10);

  const cached = await getCachedNasaPower(lat, lng, fechaInicio, fechaFin);
  if (cached && cached.length > 0) {
    const daily: NasaPowerDaily[] = cached.map((r) => ({
      date: r.fecha,
      tempAvg: r.temp_avg,
      tempMax: r.temp_max,
      tempMin: r.temp_min,
      precipitation: r.precipitacion,
      humidity: r.humedad,
      windSpeed: r.velocidad_viento,
      solarRadiation: r.radiacion_solar,
      windDirection: 0,
      evapotranspiration: r.evapotranspiracion,
      wetBulbTemp: 0,
      earthSkinTemp: 0,
      clearnessIndex: 0,
      cloudOpacity: 0,
      referenceEvapotranspiration: r.evapotranspiracion,
    }));
    return buildSummary(lat, lng, startDate, endDate, daily);
  }

  const params = new URLSearchParams({
    parameters: AG_PARAMS,
    community: "AG",
    longitude: lng.toString(),
    latitude: lat.toString(),
    start: formatParam(startDate),
    end: formatParam(endDate),
    format: "JSON",
  });

  const res = await rateLimitedFetch(
    "nasa_power",
    `${BASE_URL}?${params}`,
    `${lat.toFixed(2)},${lng.toFixed(2)}`,
  );
  if (!res.ok) throw new Error(`NASA POWER API error: ${res.status}`);
  const raw = await res.json();

  const props = raw?.properties?.parameter;
  if (!props) throw new Error("Invalid NASA POWER response structure");

  const dates = props.T2M
    ? Object.keys(props.T2M).filter(
        (k) => k !== "minimum" && k !== "maximum" && k !== "climatology",
      )
    : [];

  const daily: NasaPowerDaily[] = dates
    .filter((d) => props.T2M?.[d] !== -999 && props.T2M?.[d] !== undefined)
    .map((d) => ({
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      tempAvg: props.T2M?.[d] ?? 0,
      tempMax: props.T2M_MAX?.[d] ?? 0,
      tempMin: props.T2M_MIN?.[d] ?? 0,
      precipitation: props.PRECTOTCORR?.[d] ?? 0,
      humidity: props.RH2M?.[d] ?? 0,
      windSpeed: props.WS2M?.[d] ?? 0,
      solarRadiation: props.ALLSKY_SFC_SW_DWN?.[d] ?? 0,
      windDirection: props.WD2M?.[d] ?? 0,
      evapotranspiration: props.EVPTRNS?.[d] ?? 0,
      wetBulbTemp: props.T2MDEW?.[d] ?? 0,
      earthSkinTemp: props.TS?.[d] ?? 0,
      clearnessIndex: props.ALLSKY_KT?.[d] ?? 0,
      cloudOpacity: props.ALLSKY_SFC_LW_DWN?.[d] ?? 0,
      referenceEvapotranspiration: props.PET?.[d] ?? 0,
    }));

  const cacheRows: NasaPowerCacheRow[] = daily.map((d) => ({
    lat,
    lng,
    fecha: d.date,
    temp_avg: d.tempAvg,
    temp_max: d.tempMax,
    temp_min: d.tempMin,
    precipitacion: d.precipitation,
    humedad: d.humidity,
    velocidad_viento: d.windSpeed,
    radiacion_solar: d.solarRadiation,
    evapotranspiracion: d.evapotranspiration,
  }));
  setCachedNasaPower(cacheRows);

  return buildSummary(lat, lng, startDate, endDate, daily);
}

export async function fetchNasaPowerClimatology(
  lat: number,
  lng: number,
): Promise<NasaPowerSummary> {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 5);
  return fetchNasaPowerData(lat, lng, start, end);
}

export async function fetchAgroclimatologySummary(
  lat: number,
  lng: number,
  years: number,
): Promise<AgiClimatologyIndices> {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - years);
  const summary = await fetchNasaPowerData(lat, lng, start, end);
  const { daily } = summary;

  const _totalDays = daily.length || 1;
  const yearsCount = Math.max(1, years);

  const waterDemand = daily.reduce((s, d) => s + d.referenceEvapotranspiration, 0);
  const heatStressDays = daily.filter((d) => d.tempMax > 35).length / yearsCount;
  const coldStressDays = daily.filter((d) => d.tempMin < 5).length / yearsCount;
  const frostFreeDays = daily.filter((d) => d.tempMin >= 0).length / yearsCount;
  const optimalGrowthDays =
    daily.filter((d) => d.tempAvg >= 15 && d.tempAvg <= 28 && d.precipitation > 0).length /
    yearsCount;
  const petAnnual = waterDemand / yearsCount;

  return {
    waterDemand: +waterDemand.toFixed(1),
    heatStressDays: +heatStressDays.toFixed(1),
    coldStressDays: +coldStressDays.toFixed(1),
    frostFreeDays: +frostFreeDays.toFixed(1),
    optimalGrowthDays: +optimalGrowthDays.toFixed(1),
    petAnnual: +petAnnual.toFixed(1),
  };
}

export async function fetchNasaPowerRecent(
  lat: number,
  lng: number,
  days = 90,
): Promise<NasaPowerSummary> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return fetchNasaPowerData(lat, lng, start, end);
}
