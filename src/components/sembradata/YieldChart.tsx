import { memo, useEffect, useMemo, useState } from "react";
import type { CropKey } from "@/types/crops";
import { getYieldSeriesByNames } from "@/services/supabase";

interface Props {
  crop: CropKey;
  municipio: string;
}
type Point = { year: number; historical?: number; prediction?: number };
const W = 500,
  H = 300,
  PAD = { top: 18, right: 18, bottom: 34, left: 44 };

export const YieldChart = memo(function YieldChart({ crop, municipio }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setData([]);
    getYieldSeriesByNames(municipio, crop).then(({ historical, predictions }) => {
      if (!current) return;
      const points = new Map<number, Point>();
      historical.forEach((row) =>
        points.set(row.anio, {
          ...(points.get(row.anio) ?? { year: row.anio }),
          historical: row.rendimiento_ton_ha,
        }),
      );
      predictions.forEach((row) =>
        points.set(row.anio, {
          ...(points.get(row.anio) ?? { year: row.anio }),
          prediction: row.rendimiento_estimado,
        }),
      );
      setData([...points.values()].sort((a, b) => a.year - b.year));
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [municipio, crop]);

  const values = useMemo(
    () =>
      data
        .flatMap((p) => [p.historical, p.prediction])
        .filter((v): v is number => Number.isFinite(v)),
    [data],
  );
  if (loading) return <div className="h-[260px] animate-pulse rounded-xl bg-muted" />;
  if (!data.length || !values.length)
    return (
      <div className="grid h-[260px] place-items-center text-center text-xs text-muted-foreground">
        No hay series de rendimiento histórico ni predicciones almacenadas para {municipio}. No se
        generan datos sintéticos.
      </div>
    );
  const min = Math.floor(Math.min(...values) * 0.9),
    max = Math.ceil(Math.max(...values) * 1.1) || min + 1;
  const pw = W - PAD.left - PAD.right,
    ph = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / Math.max(1, data.length - 1)) * pw;
  const y = (v: number) => PAD.top + ph - ((v - min) / Math.max(0.1, max - min)) * ph;
  const path = (key: "historical" | "prediction") => {
    let started = false;
    let output = "";
    data.forEach((point, i) => {
      const value = point[key];
      if (value == null) {
        started = false;
        return;
      }
      output += `${started ? "L" : "M"}${x(i)},${y(value)}`;
      started = true;
    });
    return output;
  };
  const actualEnd = data.reduce(
    (last, point, index) => (point.historical != null ? index : last),
    -1,
  );
  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Rendimiento observado y predicho de ${municipio}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = min + (max - min) * ratio;
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                y1={y(value)}
                x2={W - PAD.right}
                y2={y(value)}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 5}
                y={y(value) + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        {actualEnd >= 0 && (
          <line
            x1={x(actualEnd)}
            y1={PAD.top}
            x2={x(actualEnd)}
            y2={PAD.top + ph}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 3"
          />
        )}
        <path d={path("historical")} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        <path
          d={path("prediction")}
          fill="none"
          stroke="var(--sky)"
          strokeWidth="2.5"
          strokeDasharray="5 4"
        />
        {data.map((p, i) => (
          <text
            key={p.year}
            x={x(i)}
            y={H - 7}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {String(p.year).slice(2)}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>
          <i className="mr-1 inline-block h-2 w-4 rounded bg-primary" />
          Observado
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-4 rounded bg-sky" />
          Predicción almacenada
        </span>
      </div>
    </div>
  );
});
