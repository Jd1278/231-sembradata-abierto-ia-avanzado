import { getCachedCommodity, setCachedCommodity } from "./cache";
import { rateLimitedFetch } from "./rate-limiter";

export interface CommodityForecast {
  symbol: string;
  signal: string;
  recommendation: string;
  climateScore: number;
  confidence: number;
  currentPrice: { value: number; unit: string; source: string; date: string };
  reasoning: string;
  stressors: {
    factor: string;
    severity: string;
    region: string;
    priceImpact: string;
    probability: number;
    horizon: string;
  }[];
  regions: {
    name: string;
    tempAnomaly: number | null;
    drought: string;
    productionShare: number;
    climateScore: number;
  }[];
  sources: string[];
  forecastedAt: string;
}

export interface CommodityPrice {
  crop: "cacao" | "cafe" | "granadilla";
  label: string;
  price: number | null;
  unit: string;
  currency: string | null;
  normalizedPricePerKg: number | null;
  market: string;
  instrument: string | null;
  referenceType: "international_futures" | "local_wholesale" | "unavailable";
  disclaimer?: string;
  change: number;
  signal: string;
  recommendation: string;
  climateScore: number;
  confidence: number;
  reasoning: string;
  stressors: CommodityForecast["stressors"];
  regions: CommodityForecast["regions"];
  sources: string[];
  forecastedAt: string;
}

const BASE_URL = "https://forecast.untitledfinancial.com/forecast/commodity";
const KG_PER_LB = 0.45359237;
const GRANADILLA_UNAVAILABLE: CommodityPrice = {
  crop: "granadilla",
  label: "Granadilla",
  price: null,
  unit: "—",
  currency: null,
  normalizedPricePerKg: null,
  market: "Sin contrato internacional equivalente",
  instrument: null,
  referenceType: "unavailable",
  disclaimer:
    "La API no ofrece una cotización de granadilla. SIPSA/DANE publica referencias mayoristas colombianas por kg; no son precio internacional ni precio en finca.",
  change: 0,
  signal: "N/D",
  recommendation: "N/D",
  climateScore: 0,
  confidence: 0,
  reasoning: "No se inventa ni se aproxima un precio internacional para granadilla.",
  stressors: [],
  regions: [],
  sources: ["DANE SIPSA (referencia local opcional)"],
  forecastedAt: new Date().toISOString(),
};

async function fetchForecast(symbol: string): Promise<CommodityForecast> {
  const cached = await getCachedCommodity<CommodityForecast>(symbol);
  if (cached) return cached;
  const res = await rateLimitedFetch("commodity", `${BASE_URL}/${symbol}`, symbol);
  if (!res.ok) throw new Error(`Commodity API error: ${res.status}`);
  const data = (await res.json()) as CommodityForecast;
  if (!Number.isFinite(data?.currentPrice?.value) || !data.signal || !data.recommendation)
    throw new Error(`Invalid commodity API response shape for ${symbol}`);
  void setCachedCommodity(symbol, data);
  return data;
}

function normalizePerKg(value: number, unit: string): number | null {
  const normalized = unit.trim().toLowerCase();
  if (
    normalized === "mt" ||
    normalized.includes("/mt") ||
    normalized.includes("metric ton") ||
    normalized.includes("tonne")
  )
    return value / 1000;
  if (normalized === "cents/lb" || normalized === "¢/lb") return value / 100 / KG_PER_LB;
  if (normalized === "lb" || normalized.includes("/lb") || normalized.includes("pound"))
    return value / KG_PER_LB;
  if (normalized === "kg") return value;
  return null;
}

function mapToCommodityPrice(crop: "cacao" | "cafe", forecast: CommodityForecast): CommodityPrice {
  const cocoa = crop === "cacao";
  const quoteUnit = forecast.currentPrice.unit;
  return {
    crop,
    label: cocoa ? "Cacao (grano, referencia ICE)" : "Café arábica verde lavado (referencia ICE)",
    price: forecast.currentPrice.value,
    unit: quoteUnit || (cocoa ? "USD/t métrica" : "centavos USD/libra"),
    currency: "USD",
    normalizedPricePerKg: normalizePerKg(forecast.currentPrice.value, quoteUnit),
    market: "ICE Futures U.S.",
    instrument: cocoa ? "ICE US Cocoa (CC)" : "ICE US Coffee C (KC)",
    referenceType: "international_futures",
    disclaimer: cocoa
      ? "Futuros de cacao en grano de calidad de bolsa; no equivale al precio de compra local ni a cacao húmedo."
      : "Futuros de arábica verde lavado; no equivale a café pergamino, tostado ni al precio interno. La conversión no incorpora diferenciales ni transformación.",
    change: 0,
    signal: forecast.signal,
    recommendation: forecast.recommendation,
    climateScore: forecast.climateScore,
    confidence: forecast.confidence,
    reasoning: forecast.reasoning,
    stressors: forecast.stressors,
    regions: forecast.regions,
    sources: forecast.sources.length ? forecast.sources : [forecast.currentPrice.source],
    forecastedAt: forecast.forecastedAt,
  };
}

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const results = await Promise.allSettled([
    fetchForecast("COFFEE").then((f) => mapToCommodityPrice("cafe", f)),
    fetchForecast("COCOA").then((f) => mapToCommodityPrice("cacao", f)),
  ]);
  return [
    results[0].status === "fulfilled" ? results[0].value : null,
    results[1].status === "fulfilled" ? results[1].value : null,
    GRANADILLA_UNAVAILABLE,
  ].filter((p): p is CommodityPrice => p !== null);
}

export async function fetchSingleCommodity(crop: CommodityPrice["crop"]): Promise<CommodityPrice> {
  if (crop === "granadilla") return GRANADILLA_UNAVAILABLE;
  return mapToCommodityPrice(crop, await fetchForecast(crop === "cacao" ? "COCOA" : "COFFEE"));
}
