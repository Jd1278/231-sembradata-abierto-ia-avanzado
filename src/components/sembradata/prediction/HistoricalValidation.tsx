import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchNasaPowerRecent, type NasaPowerDaily } from "@/services/nasa-power";
import { HistoricalSkeleton } from "../Skeletons";
import { getOptimalPastDays } from "@/services/temporal-optimizer";
import type { CropKey } from "@/types/crops";
import type { DailyClimate } from "@/services/climate-api";
import { WifiOff, RefreshCw, Satellite, AlertTriangle } from "lucide-react";

export interface HistoricalValidationPoint {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM
  type: "historical" | "forecast";
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  precipitation: number;
}

export type DataSourceStatus = "loading" | "success" | "stale" | "offline" | "error" | "empty";
export type DataOrigin = "live" | "supabase-cache" | "local-cache" | "fallback";

interface Props {
  lat: number;
  lng: number;
  forecastDaily?: DailyClimate[];
  forecastTemps?: { max: number; min: number }[];
  forecastPrecip?: number[];
  crop?: CropKey;
}

export function HistoricalValidation({
  lat,
  lng,
  forecastDaily,
  forecastTemps = [],
  forecastPrecip = [],
  crop,
}: Props) {
  const [historical, setHistorical] = useState<NasaPowerDaily[] | null>(null);
  const [status, setStatus] = useState<DataSourceStatus>("loading");
  const [origin, setOrigin] = useState<DataOrigin>("live");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalValidationPoint | null>(null);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");

      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

      try {
        const pastDays = crop ? getOptimalPastDays(crop) : 90;
        const data = await fetchNasaPowerRecent(lat, lng, pastDays);
        if (signal?.aborted) return;

        const daily = data.daily.slice(-Math.min(30, pastDays));
        if (daily.length === 0) {
          setStatus("empty");
          setHistorical([]);
          return;
        }

        setHistorical(daily);
        setOrigin(isOffline ? "local-cache" : "live");
        setStatus(isOffline ? "offline" : "success");
        setLastUpdated(new Date().toLocaleDateString("es-CO"));
      } catch {
        if (!signal?.aborted) {
          if (isOffline) {
            setStatus("offline");
          } else {
            setStatus("error");
          }
          setHistorical(null);
        }
      }
    },
    [lat, lng, crop],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Construct normalized time-series points
  const seriesPoints: HistoricalValidationPoint[] = useMemo(() => {
    const points: HistoricalValidationPoint[] = [];

    // 1. Historical NASA POWER observations
    if (historical && historical.length > 0) {
      for (const d of historical) {
        if (!Number.isFinite(d.tempMax) || !Number.isFinite(d.tempMin)) continue;
        const dateParts = d.date.split("-");
        const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : d.date;
        points.push({
          date: d.date,
          label,
          type: "historical",
          tempMax: Number(d.tempMax.toFixed(1)),
          tempMin: Number(d.tempMin.toFixed(1)),
          tempAvg: Number(d.tempAvg.toFixed(1)),
          precipitation: Number(Math.max(0, d.precipitation).toFixed(1)),
        });
      }
    }

    // 2. Open-Meteo forecast observations
    if (forecastDaily && forecastDaily.length > 0) {
      for (const f of forecastDaily) {
        if (!Number.isFinite(f.tempMax) || !Number.isFinite(f.tempMin)) continue;
        const dateParts = f.date.split("-");
        const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : f.date;
        points.push({
          date: f.date,
          label,
          type: "forecast",
          tempMax: Number(f.tempMax.toFixed(1)),
          tempMin: Number(f.tempMin.toFixed(1)),
          tempAvg: Number(((f.tempMax + f.tempMin) / 2).toFixed(1)),
          precipitation: Number(Math.max(0, f.precip).toFixed(1)),
        });
      }
    } else if (forecastTemps.length > 0) {
      // Legacy fallback when only raw numbers were passed
      const today = new Date();
      forecastTemps.forEach((t, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        const iso = d.toISOString().slice(0, 10);
        const p = forecastPrecip[i] ?? 0;
        points.push({
          date: iso,
          label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
          type: "forecast",
          tempMax: Number(t.max.toFixed(1)),
          tempMin: Number(t.min.toFixed(1)),
          tempAvg: Number(((t.max + t.min) / 2).toFixed(1)),
          precipitation: Number(Math.max(0, p).toFixed(1)),
        });
      });
    }

    return points;
  }, [historical, forecastDaily, forecastTemps, forecastPrecip]);

  if (status === "loading") return <HistoricalSkeleton />;

  // Controlled Error or Offline Empty State (never return null)
  if (
    (status === "error" || status === "offline" || status === "empty") &&
    (!historical || historical.length === 0)
  ) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-6 flex flex-col items-center justify-center text-center gap-2">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {status === "offline"
              ? "Sin conexión para validación histórica satelital"
              : "No se pudieron obtener datos satelitales (NASA POWER)"}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Las demás funciones de análisis de zona continúan disponibles.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fetchData()}
            className="mt-2 h-7 rounded-lg text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Summary Metrics calculations
  const histPoints = seriesPoints.filter((p) => p.type === "historical");
  const forecastPoints = seriesPoints.filter((p) => p.type === "forecast");

  const histAvgMax =
    histPoints.length > 0 ? histPoints.reduce((s, d) => s + d.tempMax, 0) / histPoints.length : 0;
  const histAvgMin =
    histPoints.length > 0 ? histPoints.reduce((s, d) => s + d.tempMin, 0) / histPoints.length : 0;
  const histTotalPrecip = histPoints.reduce((s, d) => s + d.precipitation, 0);

  const forecastAvgMax =
    forecastPoints.length > 0
      ? forecastPoints.reduce((s, t) => s + t.tempMax, 0) / forecastPoints.length
      : 0;
  const forecastAvgMin =
    forecastPoints.length > 0
      ? forecastPoints.reduce((s, t) => s + t.tempMin, 0) / forecastPoints.length
      : 0;
  const forecastTotalPrecip = forecastPoints.reduce((s, p) => s + p.precipitation, 0);

  const tempMaxDiff = forecastAvgMax - histAvgMax;
  const tempMinDiff = forecastAvgMin - histAvgMin;
  const precipRatio =
    histTotalPrecip > 0 ? ((forecastTotalPrecip / histTotalPrecip) * 100).toFixed(0) : "—";

  // SVG Chart Geometry
  const W = 560;
  const H = 160;
  const PAD = { top: 15, right: 15, bottom: 25, left: 35 };

  const allTemps = seriesPoints.flatMap((p) => [p.tempMax, p.tempMin]);
  const minTemp = allTemps.length > 0 ? Math.floor(Math.min(...allTemps) - 2) : 10;
  const maxTemp = allTemps.length > 0 ? Math.ceil(Math.max(...allTemps) + 2) : 35;
  const tempSpan = Math.max(maxTemp - minTemp, 1);

  const getX = (index: number) => {
    const count = Math.max(seriesPoints.length - 1, 1);
    return PAD.left + (index / count) * (W - PAD.left - PAD.right);
  };

  const getY = (val: number) => {
    const ratio = (val - minTemp) / tempSpan;
    return H - PAD.bottom - ratio * (H - PAD.top - PAD.bottom);
  };

  // Build SVG Path segments
  const histIndices = seriesPoints
    .map((p, i) => (p.type === "historical" ? i : -1))
    .filter((i) => i !== -1);
  const forecastIndices = seriesPoints
    .map((p, i) => (p.type === "forecast" ? i : -1))
    .filter((i) => i !== -1);

  const buildPath = (indices: number[], key: "tempMax" | "tempMin") => {
    if (indices.length === 0) return "";
    return indices
      .map(
        (idx, i) =>
          `${i === 0 ? "M" : "L"} ${getX(idx).toFixed(1)},${getY(seriesPoints[idx][key]).toFixed(1)}`,
      )
      .join(" ");
  };

  const histPathMax = buildPath(histIndices, "tempMax");
  const histPathMin = buildPath(histIndices, "tempMin");

  // Connect transition from last historical to first forecast
  const transitionIndices =
    histIndices.length > 0 && forecastIndices.length > 0
      ? [histIndices[histIndices.length - 1], ...forecastIndices]
      : forecastIndices;

  const forecastPathMax = buildPath(transitionIndices, "tempMax");
  const forecastPathMin = buildPath(transitionIndices, "tempMin");

  const transitionX =
    histIndices.length > 0 && forecastIndices.length > 0
      ? (getX(histIndices[histIndices.length - 1]) + getX(forecastIndices[0])) / 2
      : null;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Satellite className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">
              Validación Histórica vs. Pronóstico
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {origin === "live" ? (
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                ● Datos actualizados (NASA POWER)
              </Badge>
            ) : origin === "local-cache" || origin === "supabase-cache" ? (
              <Badge
                variant="outline"
                className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30"
              >
                Guardado ({lastUpdated ?? "reciente"})
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Serie temporal comparativa: últimos {histPoints.length} días observados vs.{" "}
          {forecastPoints.length} días pronosticados
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Interactive Time-Series SVG Chart */}
        <div className="relative rounded-xl border border-border/60 bg-muted/10 p-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full select-none overflow-visible"
            role="img"
            aria-label="Gráfica temporal de validación histórica satelital vs pronóstico"
          >
            {/* Grid lines */}
            {[0, 0.5, 1].map((r) => {
              const val = minTemp + r * tempSpan;
              const yPos = getY(val);
              return (
                <g key={r}>
                  <line
                    x1={PAD.left}
                    y1={yPos}
                    x2={W - PAD.right}
                    y2={yPos}
                    stroke="currentColor"
                    className="text-border/50"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={PAD.left - 6}
                    y={yPos + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[8px] font-mono"
                  >
                    {Math.round(val)}°C
                  </text>
                </g>
              );
            })}

            {/* Transition Separator Line */}
            {transitionX !== null && (
              <line
                x1={transitionX}
                y1={PAD.top}
                x2={transitionX}
                y2={H - PAD.bottom}
                stroke="currentColor"
                className="text-amber-500/50"
                strokeDasharray="4 4"
              />
            )}

            {/* Historical Series (Solid) */}
            {histPathMax && (
              <path
                d={histPathMax}
                fill="none"
                stroke="currentColor"
                className="text-primary stroke-2"
              />
            )}
            {histPathMin && (
              <path
                d={histPathMin}
                fill="none"
                stroke="currentColor"
                className="text-sky-500 stroke-2 opacity-80"
              />
            )}

            {/* Forecast Series (Dashed) */}
            {forecastPathMax && (
              <path
                d={forecastPathMax}
                fill="none"
                stroke="currentColor"
                className="text-primary stroke-2"
                strokeDasharray="4 3"
              />
            )}
            {forecastPathMin && (
              <path
                d={forecastPathMin}
                fill="none"
                stroke="currentColor"
                className="text-sky-500 stroke-2 opacity-80"
                strokeDasharray="4 3"
              />
            )}

            {/* Data Points */}
            {seriesPoints.map((p, idx) => {
              const cx = getX(idx);
              const cyMax = getY(p.tempMax);
              const isForecast = p.type === "forecast";
              return (
                <g
                  key={p.date}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={cx} cy={cyMax} r={10} fill="transparent" />
                  {isForecast ? (
                    <rect
                      x={cx - 3}
                      y={cyMax - 3}
                      width={6}
                      height={6}
                      transform={`rotate(45 ${cx} ${cyMax})`}
                      className="fill-background stroke-primary stroke-1.5"
                    />
                  ) : (
                    <circle
                      cx={cx}
                      cy={cyMax}
                      r={2.5}
                      className="fill-primary stroke-background stroke-1"
                    />
                  )}
                  {/* Selected label ticks */}
                  {(idx === 0 ||
                    idx === histIndices.length - 1 ||
                    idx === seriesPoints.length - 1 ||
                    idx % 5 === 0) && (
                    <text
                      x={cx}
                      y={H - 8}
                      textAnchor="middle"
                      className={`text-[8px] font-mono ${isForecast ? "fill-primary font-bold" : "fill-muted-foreground"}`}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="mt-1 flex items-center justify-between rounded-lg bg-background/95 border border-border px-2.5 py-1 text-[11px] shadow-sm">
              <span className="font-mono font-medium">
                {hoveredPoint.date} (
                {hoveredPoint.type === "historical"
                  ? "NASA POWER Satelital"
                  : "Pronóstico Open-Meteo"}
                )
              </span>
              <span className="text-muted-foreground">
                Máx: <b className="text-foreground">{hoveredPoint.tempMax}°C</b> · Mín:{" "}
                <b className="text-foreground">{hoveredPoint.tempMin}°C</b> · Lluvia:{" "}
                <b className="text-foreground">{hoveredPoint.precipitation} mm</b>
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Histórico NASA ({histPoints.length}d)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rotate-45 border border-primary bg-background" />
              <span>Pronóstico ({forecastPoints.length}d)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Temp. Mínima</span>
            </div>
          </div>
          <span className="text-[10px]">Unidades: °C y mm</span>
        </div>

        {/* Summary Comparison Metric Cards */}
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
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="leading-snug">
              {tempMaxDiff > 0
                ? "El pronóstico indica temperaturas más altas (+3°C) que el promedio satelital histórico de la zona."
                : "El pronóstico indica temperaturas más bajas (-3°C) que el promedio satelital histórico de la zona."}
            </p>
          </div>
        )}
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
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border p-2.5 bg-muted/10">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold text-foreground">{forecast}</p>
      <p className="text-[11px] text-muted-foreground">Hist: {historical}</p>
      {diff !== null ? (
        <p className={`mt-0.5 text-[11px] font-semibold ${diffColor}`}>
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)}
          {unit}
        </p>
      ) : (
        ratio && (
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
            {ratio}% histórico
          </p>
        )
      )}
    </div>
  );
}
