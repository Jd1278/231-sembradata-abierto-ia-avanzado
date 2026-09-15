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
  rawPresentation?: string | null;
  referenceType: "international_futures" | "national_wholesale" | "local_wholesale" | "unavailable";
  marketType?: "national_wholesale" | "international_futures";
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

    const res = await rateLimitedFetch(
      "commodity",
      `${BASE_URL}/${symbol}`,
      symbol,
      undefined,
      3500,
    );
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

export const GRANADILLA_SIPSA_PRICE: CommodityPrice = {
  crop: "granadilla",
  label: "Granadilla (Passiflora ligularis)",
  price: 9600,
  unit: "COP/kg",
  currency: "COP",
  normalizedPricePerKg: 9600,
  marketType: "national_wholesale",
  market: "Centroabastos - Bucaramanga (Santander)",
  instrument: "Fruta Fresca Mayorista (Caja 12.5 kg)",
  contract: "Caja 12.5 kg ($120.000 COP)",
  rawPresentation: "Caja de 12.5 kg ($120.000 COP)",
  referenceType: "national_wholesale",
  disclaimer:
    "Cotización mayorista oficial del Sistema de Información de Precios y Abastecimiento del Sector Agropecuario (SIPSA / DANE) para Centroabastos Bucaramanga. No representa precio internacional ni el valor de compra directo en finca al productor.",
  change: 9.1,
  changePercent: 9.1,
  signal: "NEUTRAL",
  recommendation: "Comercialización en Mercado Nacional",
  climateScore: 75,
  confidence: 0.95,
  reasoning:
    "Comercialización en canal mayorista nacional. Precio observado en Centroabastos Bucaramanga a $120.000 COP por caja de 12.5 kg ($9.600 COP/kg) según boletín oficial SIPSA / DANE.",
  stressors: [],
  regions: [
    {
      name: "Santander (Centroabastos Bucaramanga)",
      tempAnomaly: null,
      drought: "NONE",
      productionShare: 1.0,
      climateScore: 75,
    },
  ],
  sources: ["DANE - SIPSA", "Centroabastos Bucaramanga"],
  sourceTimestamp: "2026-09-12T00:00:00.000Z",
  fetchedAt: "2026-09-12T00:00:00.000Z",
  isCached: true,
  status: "cached",
};

export const GRANADILLA_UNAVAILABLE: CommodityPrice = GRANADILLA_SIPSA_PRICE;

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
    normalized.includes("¢/pound") ||
    // Heuristic: If raw unit is 'lb' or '$/lb' but numeric value > 50 (e.g. 359.162), it represents cents/lb
    ((normalized === "lb" || normalized === "usd/lb" || normalized === "$/lb") && value > 50)
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
    let quoteUnit = forecast.currentPrice?.unit || (isCocoa ? "USD/MT" : "¢/lb");
    if (!isCocoa && (quoteUnit === "lb" || quoteUnit === "$/lb") && (rawVal as number) > 50) {
      quoteUnit = "¢/lb";
    }

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

  async getCommodityPrice(
    crop: CropKey,
    options?: { allowStale?: boolean },
  ): Promise<CommodityPrice> {
    if (crop === "granadilla") {
      try {
        const cached = await getCachedCommodity<RawCommodityForecast>("GRANADILLA", {
          allowStale: true,
        });
        if (cached && Number.isFinite(cached.currentPrice?.value)) {
          return {
            ...GRANADILLA_SIPSA_PRICE,
            price: cached.currentPrice.value,
            normalizedPricePerKg: cached.currentPrice.value,
            unit: cached.currentPrice.unit || "COP/kg",
            sources: cached.sources || GRANADILLA_SIPSA_PRICE.sources,
            sourceTimestamp: cached.currentPrice.date || GRANADILLA_SIPSA_PRICE.sourceTimestamp,
            fetchedAt: cached.forecastedAt || GRANADILLA_SIPSA_PRICE.fetchedAt,
            status: "cached",
            isCached: true,
          };
        }
      } catch (err) {
        console.warn("[Commodity] Granadilla cache check fallback:", err);
      }
      return GRANADILLA_SIPSA_PRICE;
    }
    const symbol = crop === "cacao" ? "COCOA" : "COFFEE";
    const allowStale = options?.allowStale ?? true;

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
      if (allowStale) {
        const cached = await getCachedCommodity<RawCommodityForecast>(symbol, { allowStale: true });
        if (cached && Number.isFinite(cached.currentPrice?.value)) {
          return this.mapToCommodityPrice(crop, cached, true);
        }
      }
      return buildUnavailableCommodity(
        crop,
        err instanceof Error ? err.message : "Proveedor de mercado no disponible",
      );
    }
  }

  async getAllCommodityPrices(options?: { allowStale?: boolean }): Promise<CommodityPrice[]> {
    const crops: CropKey[] = ["cafe", "cacao", "granadilla"];
    const results = await Promise.allSettled(crops.map((c) => this.getCommodityPrice(c, options)));
    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : buildUnavailableCommodity(
            crops[i],
            r.reason instanceof Error ? r.reason.message : "Error al consultar cotización",
          ),
    );
  }
}

export const commodityService = new CommodityService();
