import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCommodityPrices, type CommodityPrice } from "@/services/commodity-price";
import type { CropKey } from "@/types/crops";
import { CommoditySkeleton } from "../Skeletons";
import {
  WifiOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

interface Props {
  activeCrop: CropKey;
}

function getSignalBadge(signal: string) {
  const norm = (signal || "").toUpperCase();
  if (norm.includes("BULLISH") || norm.includes("ALCISTA") || norm.includes("BUY")) {
    return {
      label: "Tendencia Alcista (Bullish)",
      variant: "default" as const,
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
  }
  if (norm.includes("BEARISH") || norm.includes("BAJISTA") || norm.includes("SELL")) {
    return {
      label: "Tendencia Bajista (Bearish)",
      variant: "destructive" as const,
      icon: TrendingDown,
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    };
  }
  return {
    label: "Tendencia Neutral",
    variant: "secondary" as const,
    icon: Minus,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
}

export function CommoditySection({ activeCrop }: Props) {
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Se requiere conexión a internet para consultar cotizaciones y precios de mercado.");
      setLoading(false);
      return;
    }

    try {
      const data = await fetchCommodityPrices();
      setPrices(data);
    } catch (err) {
      console.warn("[CommoditySection] fetch error:", err);
      setError("No se pudieron cargar las cotizaciones de commodities en este momento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().then(() => {});
  }, [fetchData]);

  if (loading) return <CommoditySkeleton />;

  if (error && prices.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-6 flex flex-col items-center justify-center text-center gap-2">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fetchData()}
            className="mt-1 h-7 rounded-lg text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const active = prices.find((p) => p.crop === activeCrop);

  // Fallback if not found in list (should not happen with default prices)
  if (!active) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-5 text-center flex flex-col items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Cotización de mercado no disponible para el cultivo seleccionado.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fetchData()}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle Granadilla (No International Futures)
  if (active.referenceType === "unavailable" || activeCrop === "granadilla") {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Precio de Referencia Nacional</CardTitle>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              Referencia Nacional (DANE / SIPSA)
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Granadilla (Passiflora ligularis) · Comercialización Nacional (Sin futuros
            internacionales ICE)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">{active.disclaimer}</p>
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-[11px] font-medium text-foreground">
              Referencia de precios en Colombia:
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Consulte el boletín de precios mayoristas del DANE (SIPSA) para la Central de Abastos
              de Bucaramanga (Centroabastos) y plazas mayoristas de Santander.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle Unavailable Live Provider (With Clear Retry Card)
  if (active.status === "unavailable") {
    return (
      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Mercado Internacional ({active.label})
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700">
              Temporalmente no disponible
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {active.errorMessage ||
              "El proveedor de cotizaciones internacionales no respondió en este momento."}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">Bolsa: {active.market}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fetchData()}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Reintentar cotización
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const signalBadge = getSignalBadge(active.signal);
  const SignalIcon = signalBadge.icon;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Mercado Internacional
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {active.status === "cached" && (
              <Badge
                variant="outline"
                className="text-[10px] gap-1 text-amber-700 dark:text-amber-300 border-amber-500/30"
              >
                <Clock className="h-2.5 w-2.5" />
                Fuente: caché (
                {active.fetchedAt
                  ? new Date(active.fetchedAt).toLocaleDateString("es-CO")
                  : "reciente"}
                )
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 font-medium ${signalBadge.color}`}
            >
              <SignalIcon className="h-3 w-3" />
              {signalBadge.label}
            </Badge>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {active.label} · {active.market}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Price Display */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 bg-muted/20">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cotización Bolsa
            </span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {active.price !== null ? active.price.toLocaleString("es-CO") : "—"}{" "}
              <span className="text-xs font-normal text-muted-foreground">{active.unit}</span>
            </p>
            {active.instrument && (
              <span className="text-[10px] text-muted-foreground">{active.instrument}</span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Equivalente Internacional
            </span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {active.normalizedPricePerKg !== null
                ? `$${active.normalizedPricePerKg.toFixed(2)}`
                : "—"}{" "}
              <span className="text-xs font-normal text-muted-foreground">USD/kg</span>
            </p>
            <span className="text-[10px] text-muted-foreground">Normalizado por kg</span>
          </div>
        </div>

        {/* Market Reasoning and Factors */}
        {active.reasoning && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-foreground">Análisis de Mercado:</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{active.reasoning}</p>
          </div>
        )}

        {/* Stressors */}
        {active.stressors && active.stressors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-foreground">
              Factores Climáticos de Presión:
            </span>
            <div className="space-y-1">
              {active.stressors.slice(0, 2).map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs rounded-lg border border-border/60 px-2.5 py-1 bg-background/50"
                >
                  <span className="text-muted-foreground">
                    {s.factor} ({s.region})
                  </span>
                  <span className="font-medium text-[11px] text-foreground">{s.priceImpact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Regulatory Disclaimer */}
        <div className="rounded-xl border border-border/80 p-2.5 bg-muted/10 flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-muted-foreground">{active.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
