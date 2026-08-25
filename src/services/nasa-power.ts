import { getCachedNasaPower } from "./cache";
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
].join(",");

function safeValue(val: unknown, fallback = 0): number {
  if (val === -999 || val === "-999" || val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

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
    tempAvg: days.reduce((s, d) => s + d.tempAvg, 0) / Math.max(1, days.length),
    tempMax: Math.max(...days.map((d) => d.tempMax)),
    tempMin: Math.min(...days.map((d) => d.tempMin)),
    precipitation: days.reduce((s, d) => s + d.precipitation, 0),
    humidity: days.reduce((s, d) => s + d.humidity, 0) / Math.max(1, days.length),
    solarRadiation: days.reduce((s, d) => s + d.solarRadiation, 0) / Math.max(1, days.length),
    windSpeed: days.reduce((s, d) => s + d.windSpeed, 0) / Math.max(1, days.length),
    referenceEvapotranspiration:
      days.reduce((s, d) => s + d.referenceEvapotranspiration, 0) / Math.max(1, days.length),
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
    .filter((d) => {
      const v = props.T2M?.[d];
      return v !== -999 && v !== "-999" && v !== null && v !== undefined;
    })
    .map((d) => {
      const tAvg = safeValue(props.T2M?.[d], 0);
      const tMax = safeValue(props.T2M_MAX?.[d], tAvg);
      const tMin = safeValue(props.T2M_MIN?.[d], tAvg);
      const precip = Math.max(0, safeValue(props.PRECTOTCORR?.[d], 0));
      const hum = Math.max(0, Math.min(100, safeValue(props.RH2M?.[d], 0)));
      const evp = safeValue(props.EVPTRNS?.[d], 0);

      return {
        date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
        tempAvg: tAvg,
        tempMax: tMax,
        tempMin: tMin,
        precipitation: precip,
        humidity: hum,
        windSpeed: safeValue(props.WS2M?.[d], 0),
        solarRadiation: safeValue(props.ALLSKY_SFC_SW_DWN?.[d], 0),
        windDirection: safeValue(props.WD2M?.[d], 0),
        evapotranspiration: evp,
        wetBulbTemp: safeValue(props.T2MDEW?.[d], 0),
        earthSkinTemp: safeValue(props.TS?.[d], 0),
        clearnessIndex: safeValue(props.ALLSKY_KT?.[d], 0),
        cloudOpacity: safeValue(props.ALLSKY_SFC_LW_DWN?.[d], 0),
        referenceEvapotranspiration: evp,
      };
    });

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
