import { getCachedCommodity, setCachedCommodity } from "./cache";
import { rateLimitedFetch } from "./rate-limiter";

export interface CommodityForecast {
  symbol: string;
  name: string;
  category: string;
  signal: string;
  recommendation: string;
  climateScore: number;
  confidence: number;
  currentPrice: {
    value: number;
    unit: string;
    source: string;
    date: string;
  };
  inGrowingSeason: boolean;
  seasonalAmplifier: number;
  reasoning: string;
  horizons: {
    "30d": { signal: string; confidence: number; basis: string };
    "60d": { signal: string; confidence: number; basis: string };
    "90d": { signal: string; confidence: number; basis: string };
  };
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
  price: number;
  unit: string;
  currency: string;
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

const GRANADILLA_REF: CommodityPrice = {
  crop: "granadilla",
  label: "Granadilla",
  price: 8500,
  unit: "kg",
  currency: "COP",
  change: 0,
  signal: "STABLE",
  recommendation: "HOLD",
  climateScore: 50,
  confidence: 0.5,
  reasoning:
    "La granadilla no se cotiza en mercados internacionales. Precio de referencia basado en promedio DANE/Federación Nacional de Cafeteros (Colombia).",
  stressors: [],
  regions: [],
  sources: ["DANE", "Federación Nacional de Cafeteros"],
  forecastedAt: new Date().toISOString(),
};

async function fetchForecast(symbol: string): Promise<CommodityForecast> {
  const cached = await getCachedCommodity<CommodityForecast>(symbol);
  if (cached) return cached;

  const res = await rateLimitedFetch("commodity", `${BASE_URL}/${symbol}`, symbol);
  if (!res.ok) throw new Error(`Commodity API error: ${res.status}`);
  const data = await res.json();

  setCachedCommodity(symbol, data);

  return data;
}

function mapToCommodityPrice(crop: "cacao" | "cafe", forecast: CommodityForecast): CommodityPrice {
  const price = forecast.currentPrice.value;
  const unit = forecast.currentPrice.unit;
  const isUSD = unit === "lb" || unit === "MT";

  return {
    crop,
    label: crop === "cacao" ? "Cacao" : "Café (Arabica)",
    price,
    unit,
    currency: isUSD ? "USD" : "COP",
    change: 0,
    signal: forecast.signal,
    recommendation: forecast.recommendation,
    climateScore: forecast.climateScore,
    confidence: forecast.confidence,
    reasoning: forecast.reasoning,
    stressors: forecast.stressors,
    regions: forecast.regions,
    sources: forecast.sources,
    forecastedAt: forecast.forecastedAt,
  };
}

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const results = await Promise.allSettled([
    fetchForecast("COFFEE").then((f) => mapToCommodityPrice("cafe", f)),
    fetchForecast("COCOA").then((f) => mapToCommodityPrice("cacao", f)),
  ]);

  const prices: CommodityPrice[] = [];
  if (results[0].status === "fulfilled") prices.push(results[0].value);
  if (results[1].status === "fulfilled") prices.push(results[1].value);
  prices.push(GRANADILLA_REF);
  return prices;
}

export async function fetchSingleCommodity(
  crop: "cacao" | "cafe" | "granadilla",
): Promise<CommodityPrice> {
  if (crop === "granadilla") return GRANADILLA_REF;
  const symbol = crop === "cacao" ? "COCOA" : "COFFEE";
  const forecast = await fetchForecast(symbol);
  return mapToCommodityPrice(crop, forecast);
}
