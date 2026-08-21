import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CropKey } from "@/types/crops";
import {
  fetchHistoricalAndPredictionSeries,
  type ChartFilters,
  type HistoricalPredictionPoint,
} from "@/services/historical-prediction-service";

import type { MunicipalityClimateState } from "@/services/climate-state";

interface Props {
  crop: CropKey;
  municipio: string;
  filters?: Partial<ChartFilters>;
  climateState?: MunicipalityClimateState | null;
}

const W = 500;
const H = 300;
const PAD = { top: 22, right: 24, bottom: 40, left: 50 };

export const YieldChart = memo(function YieldChart({
  crop,
  municipio,
  filters,
  climateState,
}: Props) {
  const chartFilters: ChartFilters = useMemo(
    () => ({
      crop,
      municipality: municipio,
      ...filters,
    }),
    [crop, municipio, filters],
  );

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<HistoricalPredictionPoint[]>({
    queryKey: ["historical-prediction-series", crop, municipio, filters, climateState?.computedAt],
    queryFn: () => fetchHistoricalAndPredictionSeries(chartFilters, climateState),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(municipio && crop),
  });

  const values = useMemo(
    () =>
      data
        .flatMap((p) => [p.historicalValue, p.predictedValue, p.lowerBound, p.upperBound])
        .filter((v): v is number => v !== null && Number.isFinite(v)),
    [data],
  );

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

  if (!data.length || !values.length) {
    return (
      <div className="grid h-[260px] place-items-center p-6 text-center text-xs leading-relaxed text-muted-foreground">
        No se encontraron series de rendimiento histórico ni proyecciones almacenadas para{" "}
        {municipio || "este municipio"} con los filtros seleccionados.
      </div>
    );
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = Math.max(0, Math.floor(rawMin * 0.85));
  const max = Math.ceil(rawMax * 1.15) || min + 1;

  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / Math.max(1, data.length - 1)) * pw;
  const y = (v: number) => PAD.top + ph - ((v - min) / Math.max(0.1, max - min)) * ph;

  // Build SVG path for historical observations
  const buildLinePath = (type: "historical" | "prediction") => {
    let started = false;
    let pathStr = "";

    data.forEach((p, i) => {
      const val = type === "historical" ? p.historicalValue : p.predictedValue;
      if (val !== null && Number.isFinite(val)) {
        pathStr += `${started ? "L" : "M"}${x(i)},${y(val)}`;
        started = true;
      }
    });

    return pathStr;
  };

  // Build confidence interval polygon for predictions
  const buildConfidenceArea = () => {
    const predPoints: { i: number; lower: number; upper: number }[] = [];
    data.forEach((p, i) => {
      if (
        p.dataType === "prediction" &&
        p.lowerBound !== null &&
        p.upperBound !== null &&
        Number.isFinite(p.lowerBound) &&
        Number.isFinite(p.upperBound)
      ) {
        predPoints.push({ i, lower: p.lowerBound, upper: p.upperBound });
      }
    });

    if (predPoints.length === 0) return "";

    const topPath = predPoints
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${x(p.i)},${y(p.upper)}`)
      .join(" ");
    const bottomPath = predPoints
      .slice()
      .reverse()
      .map((p) => `L${x(p.i)},${y(p.lower)}`)
      .join(" ");

    return `${topPath} ${bottomPath} Z`;
  };

  // Find index where historical data ends and prediction begins
  const lastHistoricalIndex = data.reduce(
    (lastIdx, p, idx) => (p.historicalValue !== null ? idx : lastIdx),
    -1,
  );

  const confidenceAreaD = buildConfidenceArea();
  const histPath = buildLinePath("historical");
  const predPath = buildLinePath("prediction");

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Rendimiento histórico observado y proyectado para ${municipio}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {/* Y-Axis Gridlines & Values */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = min + (max - min) * ratio;
          const yPos = y(value);
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                y1={yPos}
                x2={W - PAD.right}
                y2={yPos}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yPos + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted-foreground)"
                className="select-none font-mono"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Prediction Confidence Band */}
        {confidenceAreaD && (
          <path d={confidenceAreaD} fill="var(--sky)" fillOpacity="0.15" stroke="none" />
        )}

        {/* Transition Line Between Historical and Prediction */}
        {lastHistoricalIndex >= 0 && lastHistoricalIndex < data.length - 1 && (
          <g>
            <line
              x1={x(lastHistoricalIndex)}
              y1={PAD.top}
              x2={x(lastHistoricalIndex)}
              y2={PAD.top + ph}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <text
              x={x(lastHistoricalIndex)}
              y={PAD.top - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted-foreground)"
              className="select-none font-medium"
            >
              Transición
            </text>
          </g>
        )}

        {/* Observed / Historical Line */}
        {histPath && (
          <path
            d={histPath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Predicted / Forecast Line */}
        {predPath && (
          <path
            d={predPath}
            fill="none"
            stroke="var(--sky)"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data Point Nodes */}
        {data.map((p, i) => {
          const val = p.historicalValue ?? p.predictedValue;
          if (val === null || !Number.isFinite(val)) return null;
          const isPred = p.dataType === "prediction";
          return (
            <circle
              key={`${p.year}-${i}`}
              cx={x(i)}
              cy={y(val)}
              r={isPred ? "3.5" : "4"}
              fill={isPred ? "var(--sky)" : "var(--primary)"}
              stroke="var(--background)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* X-Axis Labels */}
        {data.map((p, i) => (
          <text
            key={p.year}
            x={x(i)}
            y={H - 12}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
            className="select-none font-medium"
          >
            {p.year}
          </text>
        ))}

        {/* Unit label */}
        <text
          x={PAD.left}
          y={PAD.top - 6}
          textAnchor="start"
          fontSize="9"
          fill="var(--muted-foreground)"
          className="select-none"
        >
          Ton/Ha
        </text>
      </svg>

      {/* Chart Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2 w-3.5 rounded bg-primary" />
          Histórico Observado (EVA)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2 w-3.5 rounded border border-dashed border-sky bg-sky/30" />
          Predicción Agroclimática
        </span>
        {confidenceAreaD && (
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2 w-3.5 rounded bg-sky/20" />
            Intervalo de Confianza (±10%)
          </span>
        )}
      </div>
    </div>
  );
});
