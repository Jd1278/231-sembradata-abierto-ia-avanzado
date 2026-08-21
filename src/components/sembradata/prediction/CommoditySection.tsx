import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCommodityPrices, type CommodityPrice } from "@/services/commodity-price";
import type { CropKey } from "@/types/crops";
import { CommoditySkeleton } from "../Skeletons";
import { saveOffline, getOffline } from "@/hooks/use-offline";

interface Props {
  activeCrop: CropKey;
}

const CACHE_KEY = "commodity_prices";

export function CommoditySection({ activeCrop }: Props) {
  const [prices, setPrices] = useState<CommodityPrice[]>(
    () => getOffline<CommodityPrice[]>(CACHE_KEY) ?? [],
  );
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async () => {
    const cached = getOffline<CommodityPrice[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
      setPrices(cached);
      setIsStale(true);
      setLoading(false);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchCommodityPrices();
      setPrices(data);
      setIsStale(false);
      saveOffline(CACHE_KEY, data);
    } catch (err) {
      console.warn("[CommoditySection] fetch error, preserving cached state:", err);
      if (!cached || cached.length === 0) setPrices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().then(() => {});
  }, [fetchData]);

  if (loading) return <CommoditySkeleton />;
  if (prices.length === 0) return null;

  const active = prices.find((p) => p.crop === activeCrop);
  if (!active) return null;

  const signalColor = getSignalColor(active.signal);
  const recColor = getRecommendationColor(active.recommendation);

  if (active.referenceType === "unavailable") {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Mercado de Referencia</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              Sin futuros internacionales
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Granadilla (Passiflora ligularis) · Comercialización local/nacional
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed text-muted-foreground">{active.disclaimer}</p>
          <div className="mt-3 rounded-xl border border-border p-2.5 bg-muted/20">
            <p className="text-[11px] font-medium text-foreground">
              Referencia de precios en Colombia:
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Consulte el boletín de precios mayoristas del DANE (SIPSA) para Central de Abastos de
              Bucaramanga (Centroabastos).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Precio de Futuros Internacionales</CardTitle>
          <div className="flex items-center gap-1.5">
            {(isStale || active.isCached) && (
              <Badge variant="secondary" className="text-[9px]">
                Dato en cache
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px] font-medium">
              ICE Futures U.S.
            </Badge>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {active.label} · Instrumento:{" "}
          <span className="font-semibold text-foreground">{active.instrument}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-border p-3 bg-muted/10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Cotización de Referencia
              </p>
              <p className="text-lg font-bold text-foreground">
                {formatPrice(active)}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  {active.unit}
                </span>
              </p>
              {active.normalizedPricePerKg !== null && (
                <p className="text-[10px] text-muted-foreground">
                  Equivalente:{" "}
                  <span className="font-semibold text-foreground">
                    ${active.normalizedPricePerKg.toFixed(2)} USD/kg
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-medium ${signalColor}`}
              >
                {formatSignal(active.signal)}
              </span>
              <p className="mt-1 text-[9px] text-muted-foreground">
                Confianza: {(active.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col justify-between rounded-xl border border-border px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Recomendación mercado</span>
            <span className={`text-[11px] font-bold ${recColor}`}>
              {formatRecommendation(active.recommendation)}
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Índice climático global</span>
            <span className="text-[11px] font-bold text-foreground">
              {active.climateScore.toFixed(0)}/100
            </span>
          </div>
        </div>

        {active.stressors && active.stressors.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Factores de estrés global
            </p>
            <div className="space-y-1.5">
              {active.stressors.slice(0, 3).map((s, i) => (
                <div key={i} className="rounded-lg border border-border px-2.5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-foreground">{s.factor}</span>
                    <span className={`text-[9px] font-medium ${getSeverityColor(s.severity)}`}>
                      {s.severity}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>{s.region}</span>
                    <span>
                      Impacto: {s.priceImpact} · {s.horizon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Otras cotizaciones de referencia
          </p>
          <div className="flex gap-1.5">
            {prices
              .filter((p) => p.crop !== activeCrop)
              .map((p) => (
                <div
                  key={p.crop}
                  className="flex-1 rounded-xl border border-border p-2 text-center bg-muted/5"
                >
                  <p className="text-[9px] text-muted-foreground">{p.label}</p>
                  <p className="text-[10px] font-bold text-foreground">{formatPrice(p)}</p>
                  <p className="text-[8px] text-muted-foreground">{p.unit}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-2 text-[9px] leading-relaxed text-muted-foreground space-y-1">
          <p>
            <span className="font-semibold text-foreground">Mercado:</span> {active.market} ·{" "}
            {active.instrument}
          </p>
          <p>
            <span className="font-semibold text-foreground">Fuente:</span>{" "}
            {active.sources.join(", ")} · {formatDateSafe(active.sourceTimestamp)}
          </p>
          {active.disclaimer && (
            <p className="border-t border-border/50 pt-1 text-[8.5px] italic">
              {active.disclaimer}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatPrice(price: CommodityPrice): string {
  if (price.price == null) return "No disponible";
  return price.currency === "COP"
    ? `$${price.price.toLocaleString("es-CO")}`
    : `$${price.price.toFixed(2)}`;
}

function getSignalColor(signal: string): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "BUY":
      return "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400";
    case "HOLD":
      return "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400";
    case "SELL":
      return "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400";
    case "STRONG_SELL":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRecommendationColor(rec: string): string {
  switch (rec) {
    case "BUY":
      return "text-green-600";
    case "HOLD":
      return "text-amber-600";
    case "SELL":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "HIGH":
      return "text-red-600";
    case "MEDIUM":
      return "text-amber-600";
    case "LOW":
      return "text-green-600";
    default:
      return "text-muted-foreground";
  }
}

function formatSignal(signal: string): string {
  return signal.replace(/_/g, " ");
}

function formatRecommendation(rec: string): string {
  switch (rec) {
    case "BUY":
      return "COMPRAR";
    case "HOLD":
      return "MANTENER";
    case "SELL":
      return "VENDER";
    default:
      return rec;
  }
}

function formatDateSafe(dateStr?: string): string {
  if (!dateStr) return "Reciente";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("es-CO");
}
