import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CropKey } from "@/types/crops";
import {
  fetchHistoricalAndPredictionDetails,
  type ChartFilters,
  type SeriesQueryResult,
  type HistoricalPredictionPoint,
} from "@/services/historical-prediction-service";
import type { MunicipalityClimateState } from "@/services/climate-state";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  crop: CropKey;
  municipio: string;
  filters?: Partial<ChartFilters>;
  climateState?: MunicipalityClimateState | null;
}

const W = 520;
const H = 310;
const PAD = { top: 28, right: 26, bottom: 42, left: 52 };

export const YieldChart = memo(function YieldChart({
  crop,
  municipio,
  filters,
  climateState,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartFilters: ChartFilters = useMemo(
    () => ({
      crop,
      municipality: municipio,
      ...filters,
    }),
    [crop, municipio, filters],
  );

  const {
    data: seriesResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SeriesQueryResult>({
    queryKey: ["historical-prediction-details", crop, municipio, filters, climateState?.computedAt],
    queryFn: () => fetchHistoricalAndPredictionDetails(chartFilters, climateState),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(municipio && crop),
  });

  const points: HistoricalPredictionPoint[] = useMemo(
    () => seriesResult?.points ?? [],
    [seriesResult],
  );

  const values = useMemo(
    () =>
      points
        .flatMap((p) => [
          p.historicalValue,
          p.predictedValue,
          p.lowerBound80,
          p.upperBound80,
          p.lowerBound95,
          p.upperBound95,
        ])
        .filter((v): v is number => v !== null && Number.isFinite(v)),
    [points],
  );

  const lastObservedYear = seriesResult?.lastObservedYear ?? null;
  const isInsufficientData = seriesResult?.status === "insufficient_data";
  const geminiAssessment = seriesResult?.geminiAssessment ?? null;

  if (isLoading) {
    return <div className="h-[260px] animate-pulse rounded-xl bg-muted/60" />;
  }

  if (isError) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center p-4 text-center">
        <p className="text-xs font-medium text-destructive">
          Error al cargar la serie de rendimiento:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted/80"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!points.length || !values.length) {
    return (
      <div className="grid h-[260px] place-items-center p-6 text-center text-xs leading-relaxed text-muted-foreground">
        No se encontraron series de rendimiento histórico de EVA ni proyecciones para{" "}
        <strong className="text-foreground">{municipio || "este municipio"}</strong>.
      </div>
    );
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = Math.max(0, Math.floor(rawMin * 0.8));
  const max = Math.ceil(rawMax * 1.2) || min + 1;

  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * pw;
  const y = (v: number) => PAD.top + ph - ((v - min) / Math.max(0.1, max - min)) * ph;

  // Split historical vs prediction indices
  const historicalPoints = points.filter((p) => p.dataType === "historical");
  const predictionPoints = points.filter((p) => p.dataType === "prediction");

  // Build SVG path for historical observations
  let histPath = "";
  let histStarted = false;
  points.forEach((p, i) => {
    if (p.dataType === "historical" && p.historicalValue !== null) {
      histPath += `${histStarted ? "L" : "M"}${x(i)},${y(p.historicalValue)}`;
      histStarted = true;
    }
  });

  // Build SVG path for statistical prediction (linking from last historical point if available)
  let predPath = "";
  let predStarted = false;

  // Include last historical point as starting anchor for smooth visual transition
  let lastHistIdx = -1;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].dataType === "historical") {
      lastHistIdx = i;
      break;
    }
  }

  if (lastHistIdx !== -1 && predictionPoints.length > 0) {
    const lastHist = points[lastHistIdx];
    if (lastHist.historicalValue !== null) {
      predPath += `M${x(lastHistIdx)},${y(lastHist.historicalValue)}`;
      predStarted = true;
    }
  }

  points.forEach((p, i) => {
    if (p.dataType === "prediction" && p.predictedValue !== null) {
      predPath += `${predStarted ? "L" : "M"}${x(i)},${y(p.predictedValue)}`;
      predStarted = true;
    }
  });

  // Build Confidence Polygon for 95% interval
  const buildConfidenceArea = (level: 80 | 95) => {
    const predCoords: { xVal: number; lowerVal: number; upperVal: number }[] = [];

    // If we have an anchor from the last historical point
    if (lastHistIdx !== -1 && predictionPoints.length > 0) {
      const lastHist = points[lastHistIdx];
      if (lastHist.historicalValue !== null) {
        predCoords.push({
          xVal: x(lastHistIdx),
          lowerVal: y(lastHist.historicalValue),
          upperVal: y(lastHist.historicalValue),
        });
      }
    }

    points.forEach((p, i) => {
      if (p.dataType === "prediction") {
        const lower =
          level === 80 ? (p.lowerBound80 ?? p.lowerBound) : (p.lowerBound95 ?? p.lowerBound);
        const upper =
          level === 80 ? (p.upperBound80 ?? p.upperBound) : (p.upperBound95 ?? p.upperBound);
        if (
          typeof lower === "number" &&
          typeof upper === "number" &&
          Number.isFinite(lower) &&
          Number.isFinite(upper)
        ) {
          predCoords.push({
            xVal: x(i),
            lowerVal: y(lower),
            upperVal: y(upper),
          });
        }
      }
    });

    if (predCoords.length < 2) return "";

    const topPath = predCoords
      .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.xVal},${c.upperVal}`)
      .join(" ");
    const bottomPath = predCoords
      .slice()
      .reverse()
      .map((c) => `L${c.xVal},${c.lowerVal}`)
      .join(" ");

    return `${topPath} ${bottomPath} Z`;
  };

  const area95Path = buildConfidenceArea(95);
  const area80Path = buildConfidenceArea(80);

  // Transition vertical line index
  const transitionX = lastHistIdx !== -1 ? x(lastHistIdx) : null;
  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="space-y-3">
      {/* Insufficient data notification banner */}
      {isInsufficientData && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Muestreo histórico insuficiente</p>
            <p className="text-[11px] opacity-90">
              {seriesResult?.insufficientDataReason ??
                "Se requieren al menos 3 años de registros históricos oficiales de EVA para formular una proyección estadística reproducible."}
            </p>
          </div>
        </div>
      )}

      {/* Main SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          role="img"
          aria-label={`Gráfico de rendimiento histórico vs predicción para ${crop} en ${municipio}`}
        >
          {/* Y-axis gridlines & labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const v = min + ratio * (max - min);
            const yPos = PAD.top + ph - ratio * ph;
            return (
              <g key={ratio}>
                <line
                  x1={PAD.left}
                  y1={yPos}
                  x2={W - PAD.right}
                  y2={yPos}
                  className="stroke-border/50"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={PAD.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Dual Confidence Interval Shaded Polygons */}
          {area95Path && (
            <path
              d={area95Path}
              className="fill-primary/10 transition-opacity duration-200 dark:fill-primary/15"
            />
          )}
          {area80Path && (
            <path
              d={area80Path}
              className="fill-primary/20 transition-opacity duration-200 dark:fill-primary/25"
            />
          )}

          {/* Historical Trend Line (Solid) */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              className="stroke-primary"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Statistical Prediction Line (Dashed) */}
          {predPath && (
            <path
              d={predPath}
              fill="none"
              className="stroke-primary"
              strokeWidth="2.2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Transition vertical line at last observed year */}
          {transitionX !== null && predictionPoints.length > 0 && (
            <g>
              <line
                x1={transitionX}
                y1={PAD.top}
                x2={transitionX}
                y2={PAD.top + ph}
                className="stroke-muted-foreground/60"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={transitionX + 4}
                y={PAD.top + 10}
                className="fill-muted-foreground text-[9px] font-medium"
              >
                Inicio Pronóstico ({lastObservedYear})
              </text>
            </g>
          )}

          {/* X-axis labels and points */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            const xPos = x(i);
            const isHist = p.dataType === "historical";
            const val = isHist ? p.historicalValue : p.predictedValue;
            if (val === null) return null;
            const yPos = y(val);

            return (
              <g key={p.date}>
                {/* Year Label */}
                <text
                  x={xPos}
                  y={PAD.top + ph + 16}
                  textAnchor="middle"
                  className={`text-[10px] transition-colors ${
                    isHovered ? "fill-foreground font-bold" : "fill-muted-foreground"
                  }`}
                >
                  {p.year}
                </text>

                {/* Point Marker */}
                {isHist ? (
                  // Historical Observation (Solid Circle)
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r={isHovered ? 5.5 : 4}
                    className="cursor-pointer fill-primary stroke-background transition-all"
                    strokeWidth={isHovered ? 2 : 1.5}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ) : (
                  // Statistical Prediction (Rhombus / Diamond)
                  <rect
                    x={xPos - (isHovered ? 5 : 3.8)}
                    y={yPos - (isHovered ? 5 : 3.8)}
                    width={isHovered ? 10 : 7.6}
                    height={isHovered ? 10 : 7.6}
                    transform={`rotate(45 ${xPos} ${yPos})`}
                    className="cursor-pointer fill-background stroke-primary transition-all"
                    strokeWidth={isHovered ? 2.2 : 1.8}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint !== null && hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-20 w-64 rounded-xl border border-border/80 bg-background/95 p-2.5 text-xs shadow-lg backdrop-blur"
            style={{
              left: `${Math.min(Math.max(10, (hoveredIdx / Math.max(1, points.length - 1)) * 100), 65)}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5 font-semibold">
              <span>Año {hoveredPoint.year}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  hoveredPoint.dataType === "historical"
                    ? "bg-primary/15 text-primary"
                    : "bg-chart-2/20 text-foreground"
                }`}
              >
                {hoveredPoint.dataType === "historical"
                  ? "Histórico Observado"
                  : "Predicción Estadística"}
              </span>
            </div>

            <div className="mt-1.5 space-y-1 text-[11px]">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Rendimiento:</span>
                <strong className="font-semibold text-foreground">
                  {(hoveredPoint.historicalValue ?? hoveredPoint.predictedValue)?.toFixed(2)} Ton/Ha
                </strong>
              </p>

              {hoveredPoint.dataType === "prediction" && (
                <>
                  <p className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Intervalo 80%:</span>
                    <span>
                      [{hoveredPoint.lowerBound80?.toFixed(2)} -{" "}
                      {hoveredPoint.upperBound80?.toFixed(2)}] Ton/Ha
                    </span>
                  </p>
                  <p className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Intervalo 95%:</span>
                    <span>
                      [{hoveredPoint.lowerBound95?.toFixed(2)} -{" "}
                      {hoveredPoint.upperBound95?.toFixed(2)}] Ton/Ha
                    </span>
                  </p>
                  {hoveredPoint.modelName && (
                    <p className="text-[10px] text-muted-foreground">
                      Modelo: <span className="text-foreground">{hoveredPoint.modelName}</span>
                    </p>
                  )}
                  {hoveredPoint.validationMetrics && (
                    <p className="text-[10px] text-muted-foreground">
                      Error sMAPE: {hoveredPoint.validationMetrics.smape}% · RMSE:{" "}
                      {hoveredPoint.validationMetrics.rmse}
                    </p>
                  )}
                </>
              )}

              <p className="text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                Fuente: {hoveredPoint.source}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend & Methodological Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Histórico EVA ({historicalPoints.length} años)</span>
          </div>
          {predictionPoints.length > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rotate-45 border border-primary bg-background" />
                <span>Predicción Estadística</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded bg-primary/20" />
                <span>Intervalo 80% / 95%</span>
              </div>
            </>
          )}
        </div>
        <span className="text-[10px]">Unidad: Toneladas / Hectárea</span>
      </div>

      {/* Gemini Agronomic Assessment Card */}
      {geminiAssessment && (
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Evaluación Agronómica IA (Gemini)</span>
            </div>
            <div className="flex items-center gap-1">
              {geminiAssessment.consistencyStatus === "valid" ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Coherente
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" /> Revisión sugerida
                </span>
              )}
            </div>
          </div>

          <p className="mt-1.5 text-muted-foreground leading-relaxed">
            {geminiAssessment.explanation}
          </p>

          {geminiAssessment.riskFactors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {geminiAssessment.riskFactors.map((rf, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border/60"
                >
                  ⚠ {rf}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
