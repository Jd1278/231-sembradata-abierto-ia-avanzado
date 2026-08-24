export interface SupabaseClientLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
}

export interface MunicipalityProfile {
  id: string;
  nombre: string;
  subregion: string;
  latitud: number;
  longitud: number;
  altitud_msnm: number;
  departamento: "Santander";
  isValidSantander: boolean;
}

export interface ObservedYieldRecord {
  anio: number;
  rendimiento_ton_ha: number;
  area_cosechada_ha?: number;
  fuente: string;
}

export interface ObservedYieldSummary {
  series: ObservedYieldRecord[];
  nObservations: number;
  minYear: number | null;
  lastObservedYear: number | null;
  averageYieldTonHa: number | null;
  source: string;
}

export interface PredictionSummary {
  anioObjetivo: number;
  rendimientoEstimadoTonHa: number;
  limiteInferior80: number | null;
  limiteSuperior80: number | null;
  limiteInferior95: number | null;
  limiteSuperior95: number | null;
  modeloUsado: string;
  r2Score: number | null;
  isPrediction: true;
  source: string;
}

export interface CropRequirementsSummary {
  cropId: string;
  cropName: string;
  scientificName: string;
  tempOptMin: number;
  tempOptMax: number;
  precipOptMin: number;
  precipOptMax: number;
  altOptMin: number;
  altOptMax: number;
  humidityOptMin: number;
  humidityOptMax: number;
  phOptMin: number;
  phOptMax: number;
  source: string;
}

export interface ExternalClimateSummary {
  currentTempC: number | null;
  minTempC: number | null;
  maxTempC: number | null;
  humidityPct: number | null;
  precip7dDaysMm: number | null;
  windSpeedKmh: number | null;
  observedAt: string;
  source: "Open-Meteo";
  status: "available" | "unavailable";
}

export interface ExternalSoilSummary {
  ph: number | null;
  organicMatterPct: number | null;
  texture: string | null;
  source: "SoilGrids";
  status: "available" | "unavailable";
}

export interface DeterministicContext {
  municipality: MunicipalityProfile | null;
  crop: { id: string; label: string } | null;
  historicalYield: ObservedYieldSummary | null;
  prediction: PredictionSummary | null;
  cropRequirements: CropRequirementsSummary | null;
  climate: ExternalClimateSummary;
  soil: ExternalSoilSummary;
  verifiedNumbers: Set<number>;
  verifiedFacts: string[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves a municipality strictly against Supabase's `municipios` master catalog.
 */
export async function getMunicipalityProfile(
  rawName: string,
  supabase: SupabaseClientLike,
): Promise<MunicipalityProfile | null> {
  const q = normalize(rawName);
  if (!q || q.length < 3) return null;

  try {
    const { data: rows, error } = await supabase
      .from("municipios")
      .select("id, nombre, departamento, latitud, longitud, altitud_msnm, zone_agroecologica");

    if (error || !rows) {
      console.warn("Error fetching municipios from Supabase:", error?.message);
      return null;
    }

    // Match by exact normalized string or word boundary match
    const matched = rows.find((m: { id: string; nombre: string; departamento?: string }) => {
      const normNombre = normalize(m.nombre);
      const normId = normalize(m.id.replace(/_/g, " "));
      return (
        normNombre === q ||
        normId === q ||
        q.includes(normNombre) ||
        normNombre.includes(q) ||
        q.includes(normId) ||
        normId.includes(q)
      );
    });

    if (!matched) return null;

    return {
      id: matched.id,
      nombre: matched.nombre.charAt(0).toUpperCase() + matched.nombre.slice(1).toLowerCase(),
      subregion: matched.zone_agroecologica || "Santander",
      latitud: Number(matched.latitud),
      longitud: Number(matched.longitud),
      altitud_msnm: Number(matched.altitud_msnm),
      departamento: "Santander",
      isValidSantander: true,
    };
  } catch (err) {
    console.warn("Exception in getMunicipalityProfile:", err);
    return null;
  }
}

/**
 * Retrieves official historical yields from EVA / MinAgricultura without extrapolation.
 */
export async function getObservedYield(
  municipioId: string,
  cultivoId: string,
  supabase: SupabaseClientLike,
): Promise<ObservedYieldSummary | null> {
  try {
    const normCrop = cultivoId.toLowerCase().trim();
    const { data, error } = await supabase
      .from("rendimiento_historico")
      .select("anio, rendimiento_ton_ha, superficie_ha")
      .eq("municipio_id", municipioId)
      .eq("cultivo_id", normCrop)
      .order("anio", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    const series: ObservedYieldRecord[] = data.map(
      (r: {
        anio: number | string;
        rendimiento_ton_ha: number | string;
        superficie_ha?: number | string;
      }) => ({
        anio: Number(r.anio),
        rendimiento_ton_ha: Number(r.rendimiento_ton_ha),
        area_cosechada_ha: r.superficie_ha ? Number(r.superficie_ha) : undefined,
        fuente: "EVA / MinAgricultura",
      }),
    );

    const avg =
      series.reduce((sum, item) => sum + item.rendimiento_ton_ha, 0) / (series.length || 1);

    return {
      series,
      nObservations: series.length,
      minYear: series[0]?.anio ?? null,
      lastObservedYear: series[series.length - 1]?.anio ?? null,
      averageYieldTonHa: Number(avg.toFixed(3)),
      source: "EVA / MinAgricultura (Evaluaciones Agropecuarias Municipales)",
    };
  } catch (err) {
    console.warn("Exception in getObservedYield:", err);
    return null;
  }
}

/**
 * Retrieves statistical predictions generated by SembraData's forecasting engine.
 */
export async function getPrediction(
  municipioId: string,
  cultivoId: string,
  supabase: SupabaseClientLike,
): Promise<PredictionSummary | null> {
  try {
    const normCrop = cultivoId.toLowerCase().trim();
    const { data, error } = await supabase
      .from("predicciones_agroclimaticas")
      .select(
        "anio_objetivo, rendimiento_estimado, limite_inferior_80, limite_superior_80, limite_inferior_95, limite_superior_95, modelo_nombre, modelo_version, status, expires_at",
      )
      .eq("municipio_id", municipioId)
      .eq("cultivo_id", normCrop)
      .eq("status", "active")
      .order("generated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const p = data[0];
    return {
      anioObjetivo: Number(p.anio_objetivo),
      rendimientoEstimadoTonHa: Number(p.rendimiento_estimado),
      limiteInferior80: p.limite_inferior_80 !== null ? Number(p.limite_inferior_80) : null,
      limiteSuperior80: p.limite_superior_80 !== null ? Number(p.limite_superior_80) : null,
      limiteInferior95: p.limite_inferior_95 !== null ? Number(p.limite_inferior_95) : null,
      limiteSuperior95: p.limite_superior_95 !== null ? Number(p.limite_superior_95) : null,
      modeloUsado: `${p.modelo_nombre || "Theil-Sen"} (${p.modelo_version || "v2"})`,
      r2Score: null,
      isPrediction: true,
      source: "Modelo Estadístico SembraData (Theil-Sen / Rolling Origin Backtest)",
    };
  } catch (err) {
    console.warn("Exception in getPrediction:", err);
    return null;
  }
}

/**
 * Retrieves institutional agronomic requirements (Cenicafé / Fedecacao / AGROSAVIA).
 */
export async function getCropRequirements(
  cultivoId: string,
  supabase: SupabaseClientLike,
): Promise<CropRequirementsSummary | null> {
  try {
    const normCrop = cultivoId.toLowerCase().trim();
    const { data, error } = await supabase
      .from("crop_climate_requirements")
      .select("*")
      .eq("crop_id", normCrop)
      .eq("active", true)
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const r = data[0];
    const cropName = normCrop === "cacao" ? "Cacao" : normCrop === "cafe" ? "Café" : "Granadilla";
    const scientificName =
      normCrop === "cacao"
        ? "Theobroma cacao"
        : normCrop === "cafe"
          ? "Coffea arabica"
          : "Passiflora ligularis";

    return {
      cropId: normCrop,
      cropName,
      scientificName,
      tempOptMin: Number(r.temperature_optimal_min_c),
      tempOptMax: Number(r.temperature_optimal_max_c),
      precipOptMin: Number(r.precipitation_optimal_min_mm),
      precipOptMax: Number(r.precipitation_optimal_max_mm),
      altOptMin: Number(r.altitude_optimal_min_m),
      altOptMax: Number(r.altitude_optimal_max_m),
      humidityOptMin: Number(r.humidity_optimal_min_pct),
      humidityOptMax: Number(r.humidity_optimal_max_pct),
      phOptMin: Number(r.ph_optimal_min),
      phOptMax: Number(r.ph_optimal_max),
      source: r.source || "Cenicafé / Fedecacao / AGROSAVIA",
    };
  } catch (err) {
    console.warn("Exception in getCropRequirements:", err);
    return null;
  }
}

function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Fetches Open-Meteo & SoilGrids external live context with explicit availability status.
 */
export async function getCurrentExternalContext(
  lat: number,
  lon: number,
): Promise<{ climate: ExternalClimateSummary; soil: ExternalSoilSummary }> {
  const [climateResult, soilResult] = await Promise.allSettled([
    fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=7`,
      3500,
    ).then((r) => (r.ok ? r.json() : null)),
    fetchWithTimeout(
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&depth=0-5cm&value=mean&properties=phh2o,clay,sand,silt,ocd`,
      3500,
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  let climateSummary: ExternalClimateSummary = {
    currentTempC: null,
    minTempC: null,
    maxTempC: null,
    humidityPct: null,
    precip7dDaysMm: null,
    windSpeedKmh: null,
    observedAt: new Date().toISOString(),
    source: "Open-Meteo",
    status: "unavailable",
  };

  if (climateResult.status === "fulfilled" && climateResult.value) {
    const d = climateResult.value;
    const precipSum = (d.daily?.precipitation_sum ?? []).reduce(
      (a: number, b: number) => a + Number(b),
      0,
    );
    climateSummary = {
      currentTempC:
        d.current?.temperature_2m !== undefined ? Number(d.current.temperature_2m) : null,
      minTempC:
        d.daily?.temperature_2m_min?.[0] !== undefined
          ? Number(d.daily.temperature_2m_min[0])
          : null,
      maxTempC:
        d.daily?.temperature_2m_max?.[0] !== undefined
          ? Number(d.daily.temperature_2m_max[0])
          : null,
      humidityPct:
        d.current?.relative_humidity_2m !== undefined
          ? Number(d.current.relative_humidity_2m)
          : null,
      precip7dDaysMm: Number(precipSum.toFixed(1)),
      windSpeedKmh:
        d.current?.wind_speed_10m !== undefined ? Number(d.current.wind_speed_10m) : null,
      observedAt: new Date().toISOString(),
      source: "Open-Meteo",
      status: "available",
    };
  }

  let soilSummary: ExternalSoilSummary = {
    ph: null,
    organicMatterPct: null,
    texture: null,
    source: "SoilGrids",
    status: "unavailable",
  };

  if (soilResult.status === "fulfilled" && soilResult.value) {
    const s = soilResult.value;
    const get = (p: string) =>
      s.properties?.layers?.find(
        (l: { name: string; depths?: { values?: { mean?: number } }[] }) => l.name === p,
      )?.depths?.[0]?.values?.mean ?? 0;

    const rawPh = get("phh2o");
    const rawOcd = get("ocd");
    const clay = get("clay");
    const sand = get("sand");

    let textura = "Franco";
    if (clay > 40) textura = "Arcilloso";
    else if (sand > 50) textura = "Arenoso";

    soilSummary = {
      ph: rawPh > 0 ? Number((rawPh / 10).toFixed(1)) : null,
      organicMatterPct: rawOcd > 0 ? Number((rawOcd / 10).toFixed(1)) : null,
      texture: textura,
      source: "SoilGrids",
      status: "available",
    };
  }

  return { climate: climateSummary, soil: soilSummary };
}

/**
 * Aggregates all deterministic ground-truth numbers into a Set for anti-hallucination validation.
 */
export function extractVerifiedNumbers(ctx: {
  municipality: MunicipalityProfile | null;
  historicalYield: ObservedYieldSummary | null;
  prediction: PredictionSummary | null;
  cropRequirements: CropRequirementsSummary | null;
  climate: ExternalClimateSummary;
  soil: ExternalSoilSummary;
}): { verifiedNumbers: Set<number>; verifiedFacts: string[] } {
  const verifiedNumbers = new Set<number>();
  const verifiedFacts: string[] = [];

  if (ctx.municipality) {
    verifiedNumbers.add(ctx.municipality.altitud_msnm);
    verifiedFacts.push(
      `Altitud oficial de ${ctx.municipality.nombre}: ${ctx.municipality.altitud_msnm} msnm (Fuente: Base oficial de Santander).`,
    );
  }

  if (ctx.climate.status === "available") {
    if (ctx.climate.currentTempC !== null) {
      verifiedNumbers.add(ctx.climate.currentTempC);
      verifiedFacts.push(`Temperatura actual: ${ctx.climate.currentTempC}°C (Fuente: Open-Meteo).`);
    }
    if (ctx.climate.minTempC !== null) verifiedNumbers.add(ctx.climate.minTempC);
    if (ctx.climate.maxTempC !== null) verifiedNumbers.add(ctx.climate.maxTempC);
    if (ctx.climate.humidityPct !== null) {
      verifiedNumbers.add(ctx.climate.humidityPct);
      verifiedFacts.push(`Humedad relativa: ${ctx.climate.humidityPct}% (Fuente: Open-Meteo).`);
    }
    if (ctx.climate.precip7dDaysMm !== null) {
      verifiedNumbers.add(ctx.climate.precip7dDaysMm);
      verifiedFacts.push(
        `Precipitación acumulada 7 días: ${ctx.climate.precip7dDaysMm} mm (Fuente: Open-Meteo).`,
      );
    }
  }

  if (ctx.soil.status === "available") {
    if (ctx.soil.ph !== null) {
      verifiedNumbers.add(ctx.soil.ph);
      verifiedFacts.push(`pH de suelo: ${ctx.soil.ph} (Fuente: SoilGrids ISRIC).`);
    }
    if (ctx.soil.organicMatterPct !== null) verifiedNumbers.add(ctx.soil.organicMatterPct);
    if (ctx.soil.texture) {
      verifiedFacts.push(`Textura de suelo: ${ctx.soil.texture} (Fuente: SoilGrids ISRIC).`);
    }
  }

  if (ctx.historicalYield) {
    if (ctx.historicalYield.averageYieldTonHa !== null) {
      verifiedNumbers.add(ctx.historicalYield.averageYieldTonHa);
    }
    for (const h of ctx.historicalYield.series) {
      verifiedNumbers.add(h.anio);
      verifiedNumbers.add(h.rendimiento_ton_ha);
    }
    verifiedFacts.push(
      `Rendimiento histórico observado: ${ctx.historicalYield.nObservations} registros observados entre ${ctx.historicalYield.minYear} y ${ctx.historicalYield.lastObservedYear} con promedio de ${ctx.historicalYield.averageYieldTonHa} ton/ha (Fuente: EVA / MinAgricultura).`,
    );
  }

  if (ctx.prediction) {
    verifiedNumbers.add(ctx.prediction.anioObjetivo);
    verifiedNumbers.add(ctx.prediction.rendimientoEstimadoTonHa);
    if (ctx.prediction.limiteInferior80 !== null)
      verifiedNumbers.add(ctx.prediction.limiteInferior80);
    if (ctx.prediction.limiteSuperior80 !== null)
      verifiedNumbers.add(ctx.prediction.limiteSuperior80);
    if (ctx.prediction.limiteInferior95 !== null)
      verifiedNumbers.add(ctx.prediction.limiteInferior95);
    if (ctx.prediction.limiteSuperior95 !== null)
      verifiedNumbers.add(ctx.prediction.limiteSuperior95);
    verifiedFacts.push(
      `Predicción para ${ctx.prediction.anioObjetivo}: ${ctx.prediction.rendimientoEstimadoTonHa} ton/ha [80% CI: ${ctx.prediction.limiteInferior80} - ${ctx.prediction.limiteSuperior80}] (Fuente: Modelo Estadístico SembraData).`,
    );
  }

  if (ctx.cropRequirements) {
    verifiedNumbers.add(ctx.cropRequirements.tempOptMin);
    verifiedNumbers.add(ctx.cropRequirements.tempOptMax);
    verifiedNumbers.add(ctx.cropRequirements.precipOptMin);
    verifiedNumbers.add(ctx.cropRequirements.precipOptMax);
    verifiedNumbers.add(ctx.cropRequirements.altOptMin);
    verifiedNumbers.add(ctx.cropRequirements.altOptMax);
    verifiedNumbers.add(ctx.cropRequirements.phOptMin);
    verifiedNumbers.add(ctx.cropRequirements.phOptMax);
    verifiedFacts.push(
      `Requerimientos óptimos para ${ctx.cropRequirements.cropName}: Temp (${ctx.cropRequirements.tempOptMin}-${ctx.cropRequirements.tempOptMax}°C), Altitud (${ctx.cropRequirements.altOptMin}-${ctx.cropRequirements.altOptMax} msnm), pH (${ctx.cropRequirements.phOptMin}-${ctx.cropRequirements.phOptMax}) (Fuente: ${ctx.cropRequirements.source}).`,
    );
  }

  return { verifiedNumbers, verifiedFacts };
}
