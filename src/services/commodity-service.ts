import type { CropKey } from "@/types/crops";
import { getCachedCommodity } from "./cache";
import { rateLimitedFetch } from "./rate-limiter";

export interface CommodityPrice {
  crop: CropKey;
  label: string;
  price: number | null;
  unit: string;
  currency: string | null;
  normalizedPricePerKg: number | null;
  market: string;
  instrument: string | null;
  contract?: string | null;
  referenceType: "international_futures" | "local_wholesale" | "unavailable";
  disclaimer: string;
  change: number | null;
  changePercent: number | null;
  signal: string;
  recommendation: string;
  climateScore: number;
  confidence: number;
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
  sourceTimestamp: string;
  fetchedAt: string;
  isCached: boolean;
  status: "live" | "cached" | "unavailable";
  errorCode?: string;
  errorMessage?: string;
}

export interface RawCommodityForecast {
  symbol: string;
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

export interface CommodityPriceProvider {
  fetchPrice(symbol: "COFFEE" | "COCOA"): Promise<RawCommodityForecast>;
}

const BASE_URL = "https://forecast.untitledfinancial.com/forecast/commodity";
const KG_PER_LB = 0.45359237;

export class HttpCommodityPriceProvider implements CommodityPriceProvider {
  async fetchPrice(symbol: "COFFEE" | "COCOA"): Promise<RawCommodityForecast> {
    const cached = await getCachedCommodity<RawCommodityForecast>(symbol);
    if (cached) return cached;

    const res = await rateLimitedFetch("commodity", `${BASE_URL}/${symbol}`, symbol);
    if (!res.ok) {
      throw new Error(`Commodity API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as RawCommodityForecast;
    if (!data || !data.signal || !data.recommendation) {
      throw new Error(`Invalid commodity API payload for ${symbol}`);
    }

    return data;
  }
}

export const GRANADILLA_UNAVAILABLE: CommodityPrice = {
  crop: "granadilla",
  label: "Granadilla (Referencia SIPSA)",
  price: null,
  unit: "—",
  currency: "COP",
  normalizedPricePerKg: null,
  market: "Sin contrato internacional equivalente (Mercado Nacional)",
  instrument: null,
  contract: null,
  referenceType: "unavailable",
  disclaimer:
    "La granadilla no se cotiza en bolsas de futuros internacionales (ICE/NYBOT). Para precios de referencia en Colombia consulte el boletín diario SIPSA del DANE para Centroabastos (Bucaramanga).",
  change: null,
  changePercent: null,
  signal: "N/D",
  recommendation: "Comercialización en mercados locales / mayoristas",
  climateScore: 0,
  confidence: 0,
  reasoning:
    "No existe cotización internacional estandarizada de futuros para Passiflora ligularis. La referencia de precios es el boletín mayorista nacional.",
  stressors: [],
  regions: [],
  sources: ["DANE SIPSA (referencia nacional)"],
  sourceTimestamp: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  isCached: false,
  status: "unavailable",
};

export function buildUnavailableCommodity(
  crop: CropKey,
  errorMessage = "Cotización internacional no disponible temporalmente",
): CommodityPrice {
  const isCocoa = crop === "cacao";
  return {
    crop,
    label: isCocoa
      ? "Cacao en Grano (Referencia ICE)"
      : "Café Arábica Verde Lavado (Referencia ICE)",
    price: null,
    unit: isCocoa ? "USD/MT" : "¢/lb",
    currency: "USD",
    normalizedPricePerKg: null,
    market: "ICE Futures U.S. (Nueva York)",
    instrument: isCocoa ? "ICE US Cocoa (CC)" : "ICE US Coffee C (KC)",
    contract: null,
    referenceType: "international_futures",
    disclaimer:
      "Información de mercado de referencia no disponible en este momento. Intente más tarde.",
    change: null,
    changePercent: null,
    signal: "NO_DISPONIBLE",
    recommendation: "Sin datos de mercado",
    climateScore: 0,
    confidence: 0,
    reasoning: errorMessage,
    stressors: [],
    regions: [],
    sources: ["Proveedor de mercado externo"],
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    isCached: false,
    status: "unavailable",
    errorCode: "PROVIDER_UNAVAILABLE",
    errorMessage,
  };
}

export function normalizePerKg(value: number | null, unit: string): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, "");
  if (
    normalized === "mt" ||
    normalized.includes("/mt") ||
    normalized.includes("metricton") ||
    normalized.includes("tonne")
  ) {
    return +(value / 1000).toFixed(4);
  }
  if (
    normalized === "cents/lb" ||
    normalized === "¢/lb" ||
    normalized.includes("¢/lb") ||
    normalized.includes("cents/lb") ||
    normalized.includes("¢/pound")
  ) {
    return +(value / 100 / KG_PER_LB).toFixed(4);
  }
  if (
    normalized === "usd/lb" ||
    normalized === "$/lb" ||
    normalized === "lb" ||
    normalized === "usd/pound" ||
    normalized === "pound"
  ) {
    return +(value / KG_PER_LB).toFixed(4);
  }
  if (normalized === "kg" || normalized === "usd/kg" || normalized === "$/kg") {
    return +value.toFixed(4);
  }
  return null;
}

export class CommodityService {
  constructor(private provider: CommodityPriceProvider = new HttpCommodityPriceProvider()) {}

  private mapToCommodityPrice(
    crop: "cacao" | "cafe",
    forecast: RawCommodityForecast,
    isCached = false,
  ): CommodityPrice {
    const rawVal = forecast.currentPrice?.value;
    if (!Number.isFinite(rawVal)) {
      throw new Error(`Cotización no disponible para ${crop}`);
    }

    const isCocoa = crop === "cacao";
    const quoteUnit = forecast.currentPrice?.unit || (isCocoa ? "USD/MT" : "¢/lb");

    return {
      crop,
      label: isCocoa
        ? "Cacao en Grano (Referencia ICE)"
        : "Café Arábica Verde Lavado (Referencia ICE)",
      price: rawVal as number,
      unit: quoteUnit,
      currency: "USD",
      normalizedPricePerKg: normalizePerKg(rawVal as number, quoteUnit),
      market: "ICE Futures U.S. (Nueva York)",
      instrument: isCocoa ? "ICE US Cocoa (CC)" : "ICE US Coffee C (KC)",
      contract: isCocoa ? "Cacao Grano Grado 1" : "Café Arábica Lavado Suave",
      referenceType: "international_futures",
      disclaimer: isCocoa
        ? "Cotización de futuros internacionales en bolsa de Nueva York (ICE). No representa el precio de compra local en finca (cacao en baba/seco nacional). No constituye asesoría financiera."
        : "Cotización de futuros de café arábica lavado en bolsa (ICE Coffee C). No equivale al precio interno de compra de la FNC ni café pergamino en finca. No constituye asesoría financiera.",
      change: null,
      changePercent: null,
      signal: forecast.signal || "NEUTRAL",
      recommendation: forecast.recommendation || "HOLD",
      climateScore: Number.isFinite(forecast.climateScore) ? forecast.climateScore : 50,
      confidence: Number.isFinite(forecast.confidence) ? forecast.confidence : 0.8,
      reasoning: forecast.reasoning || "Condiciones de mercado de referencia.",
      stressors: Array.isArray(forecast.stressors)
        ? forecast.stressors.filter((s) => s && typeof s.factor === "string")
        : [],
      regions: Array.isArray(forecast.regions)
        ? forecast.regions.filter((r) => r && typeof r.name === "string")
        : [],
      sources:
        Array.isArray(forecast.sources) && forecast.sources.length > 0
          ? forecast.sources
          : [forecast.currentPrice?.source || "ICE Futures U.S."],
      sourceTimestamp:
        forecast.currentPrice?.date || forecast.forecastedAt || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      isCached,
      status: isCached ? "cached" : "live",
    };
  }

  async getCommodityPrice(crop: CropKey): Promise<CommodityPrice> {
    if (crop === "granadilla") return GRANADILLA_UNAVAILABLE;
    const symbol = crop === "cacao" ? "COCOA" : "COFFEE";

    try {
      const forecast = await this.provider.fetchPrice(symbol);
      const rawVal = forecast.currentPrice?.value;
      if (!Number.isFinite(rawVal)) {
        // If live price quote is missing, check persistent cache in Supabase
        const cached = await getCachedCommodity<RawCommodityForecast>(symbol, { allowStale: true });
        if (cached && Number.isFinite(cached.currentPrice?.value)) {
          // Merge live forecast signals with verified cached reference price
          const merged: RawCommodityForecast = {
            ...forecast,
            currentPrice: cached.currentPrice,
          };
          return this.mapToCommodityPrice(crop, merged, true);
        }
      }
      return this.mapToCommodityPrice(crop, forecast, false);
    } catch (err) {
      console.warn(`[Commodity] Failed to fetch ${symbol}, checking cache fallback:`, err);
      const cached = await getCachedCommodity<RawCommodityForecast>(symbol);
      if (cached && Number.isFinite(cached.currentPrice?.value)) {
        return this.mapToCommodityPrice(crop, cached, true);
      }
      return buildUnavailableCommodity(
        crop,
        err instanceof Error ? err.message : "Proveedor de mercado no disponible",
      );
    }
  }

  async getAllCommodityPrices(): Promise<CommodityPrice[]> {
    const [cafeRes, cacaoRes] = await Promise.allSettled([
      this.getCommodityPrice("cafe"),
      this.getCommodityPrice("cacao"),
    ]);

    const cafePrice =
      cafeRes.status === "fulfilled" ? cafeRes.value : buildUnavailableCommodity("cafe");
    const cacaoPrice =
      cacaoRes.status === "fulfilled" ? cacaoRes.value : buildUnavailableCommodity("cacao");

    return [cafePrice, cacaoPrice, GRANADILLA_UNAVAILABLE];
  }
}

export const commodityService = new CommodityService();
