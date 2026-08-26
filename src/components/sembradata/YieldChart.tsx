import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CropKey } from "@/types/crops";
import {
  fetchHistoricalAndPredictionDetails,
  fetchGeminiAssessmentForSeries,
  extractClimateFeatures,
  type ChartFilters,
  type SeriesQueryResult,
  type HistoricalPredictionPoint,
  type GeminiAssessment,
} from "@/services/historical-prediction-service";
import type { MunicipalityClimateState } from "@/services/climate-state";
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  WifiOff,
  RefreshCw,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // 1. Primary Query: Fetches real EVA historical observations & Theil-Sen statistical forecast immediately
  const {
    data: seriesResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SeriesQueryResult>({
    queryKey: ["historical-prediction-details", crop, municipio, filters, climateState?.computedAt],
    queryFn: () => fetchHistoricalAndPredictionDetails(chartFilters, climateState),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    enabled: Boolean(municipio && crop),
  });

  // 2. Secondary Query: Asynchronously fetches Gemini qualitative agronomic assessment without blocking chart
  const { data: asyncGeminiAssessment, isLoading: isGeminiLoading } =
    useQuery<GeminiAssessment | null>({
      queryKey: [
        "gemini-assessment",
        crop,
        municipio,
        seriesResult?.predictions[0]?.predictedYield,
        seriesResult?.predictions[0]?.modelName,
      ],
      queryFn: () => {
        if (!seriesResult || seriesResult.predictions.length === 0) return null;
        const first = seriesResult.predictions[0];
        const features = extractClimateFeatures(
          municipio,
          seriesResult.municipalityId,
          climateState,
        );
        return fetchGeminiAssessmentForSeries({
          municipality: municipio,
          crop,
          historicalRecords: seriesResult.historicalObservations.map((h) => ({
            year: h.year,
            yield: h.yieldTonHa,
          })),
          predictedYield: first.predictedYield,
          modelName: first.modelName,
          features,
        });
      },
      enabled: Boolean(
        seriesResult &&
        seriesResult.status === "ready" &&
        seriesResult.predictions.length > 0 &&
        !seriesResult.geminiAssessment,
      ),
      staleTime: 1000 * 60 * 30,
    });

  const activeGeminiAssessment = seriesResult?.geminiAssessment ?? asyncGeminiAssessment ?? null;

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

  const isInsufficientData = seriesResult?.status === "insufficient_data";

  if (isLoading) {
    return <div className="h-[260px] animate-pulse rounded-xl bg-muted/60" />;
  }

  if (seriesResult?.status === "network_error") {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center p-6 text-center">
        <WifiOff className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">Sin conexión a internet</p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
          {seriesResult.errorMessage ||
            "Se requiere conexión para consultar la serie histórica de EVA."}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="mt-3 h-7 text-xs rounded-lg"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" /> Reintentar
        </Button>
      </div>
    );
  }

  if (seriesResult?.status === "municipality_not_found") {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-6 w-6 text-amber-500 mb-2" />
        <p className="text-xs font-medium text-foreground">Municipio no reconocido</p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
          {seriesResult.errorMessage ||
            `El municipio "${municipio}" no se encuentra en el catálogo oficial de Santander.`}
        </p>
      </div>
    );
  }

  if (seriesResult?.status === "no_historical_data") {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center p-6 text-center">
        <Info className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">Sin registros de producción histórica</p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
          {seriesResult.errorMessage ||
            `No se registran datos oficiales de EVA para ${crop} en ${municipio}.`}
        </p>
      </div>
    );
  }

  if (isError || seriesResult?.status === "error" || seriesResult?.status === "database_error") {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center p-4 text-center">
        <p className="text-xs font-medium text-destructive">
          {seriesResult?.errorMessage ||
            (error instanceof Error ? error.message : "Error al cargar la serie de rendimiento")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="mt-3 h-7 text-xs rounded-lg"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!points.length || !values.length) {
    return (
      <div className="grid h-[260px] place-items-center p-6 text-center text-xs leading-relaxed text-muted-foreground">
        No se encontraron observaciones de rendimiento histórico para{" "}
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

  // Split historical vs prediction points
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

  // Build SVG path for statistical prediction
  let predPath = "";
  let predStarted = false;

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

  // Build Confidence Area Polygon (80% and 95%)
  const buildConfidenceArea = (level: 80 | 95) => {
    const predCoords: { xVal: number; lowerVal: number; upperVal: number }[] = [];

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
          level === 80
            ? (p.lowerBound80 ?? p.lowerBound ?? p.predictedValue ?? 0)
            : (p.lowerBound95 ?? p.lowerBound ?? p.predictedValue ?? 0);
        const upper =
          level === 80
            ? (p.upperBound80 ?? p.upperBound ?? p.predictedValue ?? 0)
            : (p.upperBound95 ?? p.upperBound ?? p.predictedValue ?? 0);

        predCoords.push({
          xVal: x(i),
          lowerVal: y(lower),
          upperVal: y(upper),
        });
      }
    });

    if (predCoords.length < 2) return "";

    const topPath = predCoords
      .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.xVal},${c.upperVal}`)
      .join(" ");
    const bottomPath = [...predCoords]
      .reverse()
      .map((c) => `L${c.xVal},${c.lowerVal}`)
      .join(" ");

    return `${topPath} ${bottomPath} Z`;
  };

  const confidencePath95 = buildConfidenceArea(95);
  const confidencePath80 = buildConfidenceArea(80);

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="space-y-3">
      {/* Insufficient Data Warning Banner */}
      {isInsufficientData && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Muestreo histórico insuficiente</p>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              {seriesResult?.insufficientDataReason ||
                "Se requieren al menos 3 años de datos observados por MinAgricultura / EVA para generar una proyección estadística validada. Se muestran únicamente las observaciones reales registradas."}
            </p>
          </div>
        </div>
      )}

      {/* Chart Sub-Header with Forecast Start */}
      {lastHistIdx !== -1 && predictionPoints.length > 0 && (
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
          <span>Inicio Pronóstico ({points[lastHistIdx].year})</span>
          <span>{predictionPoints.length} años proyectados</span>
        </div>
      )}

      {/* Main SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible select-none"
          role="img"
          aria-label={`Gráfico de rendimiento histórico y predicción para ${crop} en ${municipio}`}
        >
          {/* Y-Axis Grid Lines & Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = min + ratio * (max - min);
            const yPos = y(val);
            return (
              <g key={ratio}>
                <line
                  x1={PAD.left}
                  y1={yPos}
                  x2={W - PAD.right}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-border/60"
                  strokeDasharray="3 3"
                />
                <text
                  x={PAD.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[9px] font-mono"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Division Line for Last Observed Year */}
          {lastHistIdx !== -1 && predictionPoints.length > 0 && (
            <line
              x1={x(lastHistIdx)}
              y1={PAD.top}
              x2={x(lastHistIdx)}
              y2={H - PAD.bottom}
              stroke="currentColor"
              className="text-muted-foreground/40"
              strokeDasharray="4 4"
            />
          )}

          {/* Confidence Intervals */}
          {confidencePath95 && (
            <path
              d={confidencePath95}
              fill="currentColor"
              className="text-primary/10 transition-opacity"
            />
          )}
          {confidencePath80 && (
            <path
              d={confidencePath80}
              fill="currentColor"
              className="text-primary/20 transition-opacity"
            />
          )}

          {/* Historical Path (Solid Line) */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              stroke="currentColor"
              className="text-primary stroke-2"
            />
          )}

          {/* Prediction Path (Dashed Line) */}
          {predPath && (
            <path
              d={predPath}
              fill="none"
              stroke="currentColor"
              className="text-primary stroke-2"
              strokeDasharray="4 4"
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => {
            const cx = x(i);
            const cy = y(p.historicalValue ?? p.predictedValue ?? 0);
            const isHovered = hoveredIdx === i;
            const isHist = p.dataType === "historical";

            return (
              <g
                key={`${p.date}-${i}`}
                tabIndex={0}
                role="button"
                aria-label={`${p.year}: ${p.historicalValue ?? p.predictedValue} ton/ha`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(i)}
                onBlur={() => setHoveredIdx(null)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Invisible hover target */}
                <circle cx={cx} cy={cy} r={14} fill="transparent" />

                {isHist ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    className="fill-primary stroke-background stroke-2 transition-all duration-150"
                  />
                ) : (
                  <rect
                    x={cx - (isHovered ? 5 : 3.5)}
                    y={cy - (isHovered ? 5 : 3.5)}
                    width={isHovered ? 10 : 7}
                    height={isHovered ? 10 : 7}
                    transform={`rotate(45 ${cx} ${cy})`}
                    className="fill-background stroke-primary stroke-2 transition-all duration-150"
                  />
                )}

                {/* X-Axis Year Labels */}
                <text
                  x={cx}
                  y={H - PAD.bottom + 14}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    isHist ? "fill-foreground font-medium" : "fill-primary font-bold"
                  }`}
                >
                  {p.year}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 rounded-xl border border-border bg-popover/95 p-2.5 shadow-lg backdrop-blur text-xs min-w-[210px] pointer-events-none"
            style={{
              left: `${Math.min(W - 220, Math.max(10, x(hoveredIdx ?? 0) - 100))}px`,
              top: "4px",
            }}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="font-bold text-foreground">Año {hoveredPoint.year}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
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

      {/* Asynchronous Gemini Agronomic Assessment Card */}
      {isGeminiLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Consultando evaluación cualitativa con IA agronómica (Gemini)...</span>
        </div>
      )}

      {activeGeminiAssessment && (
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Evaluación Agronómica IA (Gemini)</span>
            </div>
            <div className="flex items-center gap-1">
              {activeGeminiAssessment.consistencyStatus === "valid" ? (
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
            {activeGeminiAssessment.explanation}
          </p>

          {activeGeminiAssessment.riskFactors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeGeminiAssessment.riskFactors.map((rf, idx) => (
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
