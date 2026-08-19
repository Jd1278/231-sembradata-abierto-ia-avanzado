import {
  getCachedIdeamObservations,
  setCachedIdeamObservations,
  type IdeamCacheRow,
} from "./cache";
import { rateLimitedFetch } from "./rate-limiter";

const SOCRATA_BASE = "https://www.datos.gov.co/resource";
const STATIONS_DATASET = "57sv-p2fu";
const OBSERVATIONS_DATASET = "uext-mhny";

function getToken(): string {
  try {
    return import.meta.env.VITE_IDEAM_APP_TOKEN ?? "";
  } catch {
    return "";
  }
}

function headers(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h["X-App-Token"] = token;
  return h;
}

export interface IdeamStation {
  id: string;
  nombre: string;
  departamento: string;
  municipio: string;
  latitud: number;
  longitud: number;
  altitud: number;
  tipo: string;
  estado: string;
}

export interface IdeamObservation {
  fecha: string;
  temperatura: number | null;
  humedad: number | null;
  precipitacion: number | null;
  velocidadViento: number | null;
  direccionViento: number | null;
  presion: number | null;
  radiacionSolar: number | null;
  estacionId: string;
}

const PAGE_SIZE = 1000;

async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await rateLimitedFetch("ideam", url, "retry", options);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      return res;
    } catch {
      if (attempt === maxRetries - 1)
        throw new Error(`IDEAM API failed after ${maxRetries} retries`);
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("IDEAM API failed");
}

async function fetchAllSocrata(
  dataset: string,
  query: URLSearchParams,
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let offset = 0;
  const MAX_RECORDS = 5000;
  while (offset < MAX_RECORDS) {
    query.set("$limit", String(PAGE_SIZE));
    query.set("$offset", String(offset));

    const res = await fetchWithBackoff(`${SOCRATA_BASE}/${dataset}?${query}`, {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`IDEAM Socrata API error: ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

let stationsCache: IdeamStation[] | null = null;

export async function fetchIdeamStations(departamento?: string): Promise<IdeamStation[]> {
  if (!departamento && stationsCache) return stationsCache;

  const query = new URLSearchParams({
    $select: "codigo,nombre,departamento,municipio,latitud,longitud,altitud,tipo,estado",
  });
  if (departamento) query.set("departamento", departamento);

  const data = await fetchAllSocrata(STATIONS_DATASET, query);

  const stations = data.map((r: Record<string, unknown>) => ({
    id: String(r.codigo ?? r.id ?? ""),
    nombre: String(r.nombre ?? r.estacion ?? ""),
    departamento: String(r.departamento ?? ""),
    municipio: String(r.municipio ?? ""),
    latitud: Number(r.latitud ?? r.lat ?? 0),
    longitud: Number(r.longitud ?? r.lon ?? r.lng ?? 0),
    altitud: Number(r.altitud ?? r.alt_elev ?? 0),
    tipo: String(r.tipo ?? ""),
    estado: String(r.estado ?? r.estado_ ?? ""),
  }));

  if (!departamento) stationsCache = stations;
  return stations;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function fetchIdeamObservations(
  estacionId: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<IdeamObservation[]> {
  if (!DATE_RE.test(fechaInicio) || !DATE_RE.test(fechaFin)) {
    console.warn("IDEAM: invalid date format", { fechaInicio, fechaFin });
    return [];
  }
  const cached = await getCachedIdeamObservations(estacionId, fechaInicio, fechaFin);
  if (cached) {
    return cached.map((r) => ({
      fecha: r.fecha,
      temperatura: r.temperatura,
      humedad: r.humedad,
      precipitacion: r.precipitacion,
      velocidadViento: r.velocidad_viento,
      direccionViento: r.direccion_viento,
      presion: r.presion,
      radiacionSolar: r.radiacion_solar,
      estacionId: r.estacion_id,
    }));
  }

  const token = getToken();
  const query = new URLSearchParams({
    $where: `fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'`,
    estacion_id: estacionId,
    $order: "fecha ASC",
  });
  if (token) query.set("$$app_token", token);

  const data = await fetchAllSocrata(OBSERVATIONS_DATASET, query);

  const observations: IdeamObservation[] = data.map((r: Record<string, unknown>) => ({
    fecha: String(r.fecha ?? ""),
    temperatura: r.temperatura != null ? Number(r.temperatura) : null,
    humedad: r.humedad != null ? Number(r.humedad) : null,
    precipitacion: r.precipitacion != null ? Number(r.precipitacion) : null,
    velocidadViento: r.velocidad_viento != null ? Number(r.velocidad_viento) : null,
    direccionViento: r.direccion_viento != null ? Number(r.direccion_viento) : null,
    presion: r.presion != null ? Number(r.presion) : null,
    radiacionSolar: r.radiacion_solar != null ? Number(r.radiacion_solar) : null,
    estacionId: String(r.estacion_id ?? estacionId),
  }));

  const cacheRows: IdeamCacheRow[] = observations.map((o) => ({
    estacion_id: o.estacionId,
    fecha: o.fecha,
    temperatura: o.temperatura,
    humedad: o.humedad,
    precipitacion: o.precipitacion,
    velocidad_viento: o.velocidadViento,
    direccion_viento: o.direccionViento,
    presion: o.presion,
    radiacion_solar: o.radiacionSolar,
  }));
  setCachedIdeamObservations(cacheRows);

  return observations;
}

export function findNearestStation(
  lat: number,
  lng: number,
  stations: IdeamStation[],
): IdeamStation | null {
  if (stations.length === 0) return null;

  let nearest = stations[0];
  let minDist = Infinity;

  for (const s of stations) {
    const dlat = s.latitud - lat;
    const dlng = s.longitud - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }

  return nearest;
}

export async function fetchIdeamForLocation(
  lat: number,
  lng: number,
  departamento?: string,
  days = 90,
): Promise<{ station: IdeamStation; observations: IdeamObservation[] } | null> {
  try {
    const stations = await fetchIdeamStations(departamento);
    const station = findNearestStation(lat, lng, stations);
    if (!station) return null;

    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const observations = await fetchIdeamObservations(
      station.id,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
    );

    return { station, observations };
  } catch {
    return null;
  }
}
