import { memo, useMemo, useState } from "react";
import { CROP_DATA, type CropKey } from "./data";

interface Props {
  crop: CropKey;
  factor: number;
  viabilityScore?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const W = 500;
const H = 400;
const PAD = { top: 16, right: 16, bottom: 30, left: 42 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

export const YieldChart = memo(function YieldChart({ crop, factor, viabilityScore = 50 }: Props) {
  const base = CROP_DATA[crop].baseYield * factor;
  const scoreAdjustment = (viabilityScore - 50) / 50;
  const currentYear = new Date().getFullYear();
  const lastHistoricalYear = currentYear - 1;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const futureYears = 2;

  const data = useMemo(() => {
    const years = Array.from({ length: 10 + futureYears }, (_, i) => lastHistoricalYear - 9 + i);
    const historicalVariation = [0.78, 1.05, 0.88, 1.12, 0.82, 1.08, 0.91, 0.97, 1.03, 0.86];
    return years.map((year, i) => {
      const variation = historicalVariation[i % historicalVariation.length];
      const noise = (seededRandom(year * 7 + i * 13) - 0.5) * 0.15;
      const histYield = +(base * (variation + noise)).toFixed(2);
      if (year <= lastHistoricalYear) {
        return {
          year: String(year),
          hist: histYield,
          pred: year === lastHistoricalYear ? histYield : null,
        };
      }
      const predNoise = (seededRandom(year * 11 + i * 3) - 0.5) * 0.1;
      const predYield = +(base * (0.95 + scoreAdjustment * 0.15 + predNoise)).toFixed(2);
      return { year: String(year), hist: null, pred: predYield };
    });
  }, [base, scoreAdjustment, lastHistoricalYear]);

  const allValues = data.flatMap((d) => [d.hist, d.pred]).filter((v): v is number => v != null);
  const yMin = Math.floor(Math.min(...allValues) * 0.9);
  const yMax = Math.ceil(Math.max(...allValues) * 1.1);
  const yTicks = 5;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * PW;
  const yScale = (v: number) => PAD.top + PH - ((v - yMin) / (yMax - yMin)) * PH;

  function makePath(key: "hist" | "pred") {
    const pts: string[] = [];
    data.forEach((d, i) => {
      const v = d[key];
      if (v != null) pts.push(`${xScale(i)},${yScale(v)}`);
    });
    return pts;
  }

  const histPts = makePath("hist");

  const overlapIdx = data.findIndex((d) => d.hist != null && d.pred != null);
  const predStartIdx = data.findIndex((d) => d.pred != null && d.hist == null);
  const predOnlyPts: string[] = [];
  data.forEach((d, i) => {
    if (d.pred != null && (d.hist == null || i === overlapIdx))
      predOnlyPts.push(`${xScale(i)},${yScale(d.pred)}`);
  });

  const histLine = histPts.length > 0 ? `M${histPts.join("L")}` : "";
  const predConnectPts: string[] = [];
  if (overlapIdx >= 0)
    predConnectPts.push(`${xScale(overlapIdx)},${yScale(data[overlapIdx].pred!)}`);
  predOnlyPts.forEach((p) => predConnectPts.push(p));
  const predLine = predConnectPts.length > 1 ? `M${predConnectPts.join("L")}` : "";

  const histArea =
    histPts.length > 0
      ? `M${histPts[0]}L${histPts.join("L")}L${xScale(data.findIndex((d) => d.hist != null) + histPts.length - 1)},${yScale(yMin)}L${xScale(data.findIndex((d) => d.hist != null))},${yScale(yMin)}Z`
      : "";

  const predArea =
    predOnlyPts.length > 1 && predStartIdx >= 0
      ? `M${predOnlyPts[0]}L${predOnlyPts.join("L")}L${xScale(data.length - 1)},${yScale(yMin)}L${xScale(overlapIdx >= 0 ? overlapIdx : predStartIdx)},${yScale(yMin)}Z`
      : "";

  const hover = hoverIdx != null ? data[hoverIdx] : null;
  const hoverX = hoverIdx != null ? xScale(hoverIdx) : 0;
  const tooltipFlip = hoverX + 115 > W;

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Gráfico de rendimiento histórico y predicción para ${CROP_DATA[crop].label}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="yf-hist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="yf-pred" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--sky)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = yMin + ((yMax - yMin) / yTicks) * i;
          const y = yScale(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {d.year.slice(2)}
          </text>
        ))}

        {histArea && <path d={histArea} fill="url(#yf-hist)" />}
        {predArea && <path d={predArea} fill="url(#yf-pred)" />}
        {histLine && (
          <path
            d={histLine}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        )}
        {predLine && (
          <path
            d={predLine}
            fill="none"
            stroke="var(--sky)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        )}

        {data.map((d, i) => {
          const pts: { v: number; color: string }[] = [];
          if (d.hist != null) pts.push({ v: d.hist, color: "var(--primary)" });
          if (d.pred != null) pts.push({ v: d.pred, color: "var(--sky)" });
          return pts.map((p, j) => (
            <circle
              key={`${i}-${j}`}
              cx={xScale(i)}
              cy={yScale(p.v)}
              r={3}
              fill={p.color}
              stroke="var(--background)"
              strokeWidth={1.5}
            />
          ));
        })}

        {hover && (
          <line
            x1={hoverX}
            y1={PAD.top}
            x2={hoverX}
            y2={PAD.top + PH}
            stroke="var(--muted-foreground)"
            strokeDasharray="2 2"
            opacity={0.5}
          />
        )}

        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="transparent"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * W;
            const idx = Math.round(((mouseX - PAD.left) / PW) * (data.length - 1));
            setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
          }}
        />

        {hover && hoverIdx != null && (
          <g>
            <rect
              x={tooltipFlip ? hoverX - 111 : hoverX + 6}
              y={PAD.top - 4}
              width={105}
              height={42}
              rx={8}
              fill="var(--popover)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={tooltipFlip ? hoverX - 105 : hoverX + 12}
              y={PAD.top + 12}
              fontSize={10}
              fill="var(--foreground)"
              fontWeight={600}
            >
              {data[hoverIdx].year}
            </text>
            {hover.hist != null && (
              <text
                x={tooltipFlip ? hoverX - 105 : hoverX + 12}
                y={PAD.top + 24}
                fontSize={9}
                fill="var(--primary)"
              >
                Hist: {hover.hist.toFixed(2)} t/ha
              </text>
            )}
            {hover.pred != null && (
              <text
                x={tooltipFlip ? hoverX - 105 : hoverX + 12}
                y={hover.hist != null ? PAD.top + 34 : PAD.top + 24}
                fontSize={9}
                fill="var(--sky)"
              >
                Pred: {hover.pred.toFixed(2)} t/ha
              </text>
            )}
          </g>
        )}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-primary" /> Histórico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-sky" /> Predicción
        </span>
      </div>
    </div>
  );
});
