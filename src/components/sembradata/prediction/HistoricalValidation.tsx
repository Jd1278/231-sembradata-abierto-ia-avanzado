import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchNasaPowerRecent, type NasaPowerDaily } from "@/services/nasa-power";
import { HistoricalSkeleton } from "../Skeletons";
import { getOptimalPastDays } from "@/services/temporal-optimizer";
import type { CropKey } from "@/types/crops";
import { WifiOff, RefreshCw } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  forecastTemps: { max: number; min: number }[];
  forecastPrecip: number[];
  crop?: CropKey;
}

export function HistoricalValidation({ lat, lng, forecastTemps, forecastPrecip, crop }: Props) {
  const [historical, setHistorical] = useState<NasaPowerDaily[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError(
          "Se requiere conexión a internet para consultar la validación satelital (NASA POWER).",
        );
        setLoading(false);
        return;
      }

      try {
        const pastDays = crop ? getOptimalPastDays(crop) : 90;
        const data = await fetchNasaPowerRecent(lat, lng, pastDays);
        if (signal?.aborted) return;
        const daily = data.daily.slice(-Math.min(30, pastDays));
        setHistorical(daily);
      } catch {
        if (!signal?.aborted) {
          setError("No se pudieron obtener los datos satelitales en este momento.");
          setHistorical(null);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [lat, lng, crop],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  if (loading) return <HistoricalSkeleton />;

  if (error && (!historical || historical.length === 0)) {
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

  if (!historical || historical.length === 0) return null;

  const histAvgMax = historical.reduce((s, d) => s + d.tempMax, 0) / historical.length;
  const histAvgMin = historical.reduce((s, d) => s + d.tempMin, 0) / historical.length;
  const histTotalPrecip = historical.reduce((s, d) => s + d.precipitation, 0);

  const forecastAvgMax =
    forecastTemps.length > 0
      ? forecastTemps.reduce((s, t) => s + t.max, 0) / forecastTemps.length
      : 0;
  const forecastAvgMin =
    forecastTemps.length > 0
      ? forecastTemps.reduce((s, t) => s + t.min, 0) / forecastTemps.length
      : 0;
  const forecastTotalPrecip = forecastPrecip.reduce((s, p) => s + p, 0);

  const tempMaxDiff = forecastAvgMax - histAvgMax;
  const tempMinDiff = forecastAvgMin - histAvgMin;
  const precipRatio =
    histTotalPrecip > 0 ? ((forecastTotalPrecip / histTotalPrecip) * 100).toFixed(0) : "—";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Validación Histórica (NASA POWER)
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Comparación pronóstico vs últimos 30 días reales
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <CompareMetric
            label="Temp. máxima"
            forecast={`${forecastAvgMax.toFixed(1)}°`}
            historical={`${histAvgMax.toFixed(1)}°`}
            diff={tempMaxDiff}
            unit="°C"
          />
          <CompareMetric
            label="Temp. mínima"
            forecast={`${forecastAvgMin.toFixed(1)}°`}
            historical={`${histAvgMin.toFixed(1)}°`}
            diff={tempMinDiff}
            unit="°C"
          />
          <CompareMetric
            label="Precipitación"
            forecast={`${forecastTotalPrecip.toFixed(0)}mm`}
            historical={`${histTotalPrecip.toFixed(0)}mm`}
            diff={null}
            ratio={precipRatio}
          />
        </div>

        {Math.abs(tempMaxDiff) > 3 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {tempMaxDiff > 0
                ? "El pronóstico indica temperaturas más altas de lo histórico."
                : "El pronóstico indica temperaturas más bajas de lo histórico."}
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Fuente: NASA POWER (datos satelitales diarios) · {historical.length} días analizados
        </p>
      </CardContent>
    </Card>
  );
}

function CompareMetric({
  label,
  forecast,
  historical,
  diff,
  unit,
  ratio,
}: {
  label: string;
  forecast: string;
  historical: string;
  diff: number | null;
  unit?: string;
  ratio?: string;
}) {
  const diffColor =
    diff !== null
      ? Math.abs(diff) > 3
        ? "text-amber-600"
        : "text-green-600"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{forecast}</p>
      <p className="text-sm text-muted-foreground">Hist: {historical}</p>
      {diff !== null ? (
        <p className={`mt-0.5 text-sm font-medium ${diffColor}`}>
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)}
          {unit}
        </p>
      ) : (
        ratio && (
          <p className="mt-0.5 text-sm font-medium text-muted-foreground">{ratio}% histórico</p>
        )
      )}
    </div>
  );
}
