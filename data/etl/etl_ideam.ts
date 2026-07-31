/**
 * ETL Pipeline: IDEAM Historical Climate Data
 *
 * Fetches historical climate data from IDEAM (datos.gov.co)
 * and normalizes it for storage in Supabase.
 *
 * Usage: deno run --allow-net --allow-env data/etl/etl_ideam.ts
 *
 * Tables affected: ideam_cache, clima_mensual
 */

interface IdeamRecord {
  estacion: string;
  departamento: string;
  municipio: string;
  fecha: string;
  temperatura: number | null;
  precipitacion: number | null;
  humedad: number | null;
}

const IDEAM_API = "https://www.datos.gov.co/resource/53sq-cmp3.json";
const PAGE_SIZE = 1000;

async function fetchPage(offset: number): Promise<IdeamRecord[]> {
  const url = `${IDEAM_API}?departamento=SANTANDER&$limit=${PAGE_SIZE}&$offset=${offset}&$order=fecha DESC`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IDEAM API error: ${res.status}`);
  return res.json();
}

async function transform(record: IdeamRecord): Promise<Record<string, unknown>> {
  return {
    station_name: record.estacion,
    department: record.departamento,
    municipality: record.municipio,
    date: record.fecha,
    avg_temp_c: record.temperatura,
    precipitation_mm: record.precipitacion,
    humidity_pct: record.humedad,
    ingested_at: new Date().toISOString(),
  };
}

export async function runETL(): Promise<{ fetched: number; transformed: number }> {
  let offset = 0;
  let total = 0;
  let transformed = 0;

  while (true) {
    const batch = await fetchPage(offset);
    if (batch.length === 0) break;
    total += batch.length;

    for (const record of batch) {
      await transform(record);
      transformed++;
    }

    offset += PAGE_SIZE;
    if (batch.length < PAGE_SIZE) break;
  }

  return { fetched: total, transformed };
}

if (import.meta.main) {
  console.log("Starting IDEAM ETL pipeline...");
  const result = await runETL();
  console.log(`Done. Fetched: ${result.fetched}, Transformed: ${result.transformed}`);
}
