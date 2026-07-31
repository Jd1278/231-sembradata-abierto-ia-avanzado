/**
 * ETL Pipeline: NASA POWER Climate Data
 *
 * Fetches climate data from NASA POWER API
 * for agricultural planning and analysis.
 *
 * Usage: deno run --allow-net --allow-env data/etl/etl_nasa_power.ts
 *
 * Tables affected: nasa_power_cache, clima_mensual
 */

interface NasaPowerRecord {
  station: string;
  latitude: number;
  longitude: number;
  year: number;
  month: number;
  avg_temp_c: number;
  min_temp_c: number;
  max_temp_c: number;
  precipitation_mm: number;
  solar_radiation: number;
  wind_speed: number;
}

const NASA_POWER_API = "https://power.larc.nasa.gov/api/temporal/daily/point";

async function fetchStationData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<NasaPowerRecord[]> {
  const params = new URLSearchParams({
    parameters: "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M",
    community: "AG",
    longitude: lon.toString(),
    latitude: lat.toString(),
    start: startDate,
    end: endDate,
    format: "JSON",
  });

  const res = await fetch(`${NASA_POWER_API}?${params}`);
  if (!res.ok) throw new Error(`NASA POWER API error: ${res.status}`);
  const _data = await res.json();

  // Transform NASA POWER response to our format
  const records: NasaPowerRecord[] = [];
  // TODO: Parse actual NASA POWER response structure
  return records;
}

export async function runETL(): Promise<{ fetched: number; transformed: number }> {
  // Representative coordinates for Santander agricultural regions
  const stations = [
    { name: "Santander", lat: 6.64, lon: -73.25 },
    { name: "San Vicente de Chucurí", lat: 6.82, lon: -73.41 },
    { name: "Bucaramanga", lat: 7.13, lon: -73.02 },
    { name: "Barrancabermeja", lat: 7.07, lon: -73.85 },
    { name: "Socorro", lat: 6.47, lon: -73.26 },
    { name: "Málaga", lat: 6.7, lon: -72.73 },
    { name: "Vélez", lat: 6.01, lon: -73.67 },
    { name: "San Gil", lat: 6.56, lon: -73.14 },
  ];

  let total = 0;
  let transformed = 0;

  for (const station of stations) {
    try {
      const data = await fetchStationData(station.lat, station.lon, "20230101", "20231231");
      total += data.length;
      transformed += data.length;
    } catch (err) {
      console.error(`Error fetching data for ${station.name}:`, err);
    }
  }

  return { fetched: total, transformed };
}

if (import.meta.main) {
  console.log("Starting NASA POWER ETL pipeline...");
  const result = await runETL();
  console.log(`Done. Fetched: ${result.fetched}, Transformed: ${result.transformed}`);
}
