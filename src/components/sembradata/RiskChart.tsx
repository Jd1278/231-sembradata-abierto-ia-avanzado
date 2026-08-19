import { memo, useMemo, useState } from "react";
import type { ClimateData } from "@/services/climate-api";
import type { ViabilityResult } from "@/types/prediction-v2";
import { MONTH_LABELS } from "@/services/temporal-optimizer";

interface Props {
  factor: number;
  climate?: ClimateData | null;
  viability?: ViabilityResult | null;
}

const W = 600;
const H = 480;
const PAD = { top: 16, right: 16, bottom: 36, left: 44 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;
const SERIES = ["Sequía", "Heladas", "Plagas"] as const;
const COLORS: Record<string, string> = {
  Sequía: "var(--risk-high)",
  Heladas: "var(--sky)",
  Plagas: "var(--risk-med)",
};

export const RiskChart = memo(function RiskChart({ factor, climate, viability }: Props) {
  const hasRealData = !!(climate && climate.dailyData.length > 0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    let result = MONTH_LABELS.map((m, i) => {
      if (hasRealData && climate) {
        const monthData = climate.dailyData.filter((d) => new Date(d.date).getMonth() === i);
        if (monthData.length > 0) {
          let avgPrecip = 0,
            avgTemp = 0,
            avgHum = 0,
            avgWind = 0;
          for (const d of monthData) {
            avgPrecip += d.precip;
            avgTemp += (d.tempMax + d.tempMin) / 2;
            avgHum += d.humidity;
            avgWind += d.windSpeed;
          }
          const n = monthData.length;
          avgPrecip /= n;
          avgTemp /= n;
          avgHum /= n;
          avgWind /= n;
          const droughtRisk = Math.round(
            Math.min(
              100,
              Math.max(
                5,
                (1 - avgPrecip / 60) * 40 +
                  (avgTemp > 28 ? 20 : avgTemp > 25 ? 10 : 0) +
                  (avgWind > 15 ? 10 : 0),
              ),
            ),
          );
          const frostRisk = Math.round(
            Math.min(
              100,
              Math.max(2, avgTemp < 5 ? 70 : avgTemp < 10 ? 45 : avgTemp < 15 ? 15 : 3),
            ),
          );
          const pestRisk = Math.round(
            Math.min(
              100,
              Math.max(
                5,
                (avgHum > 85 ? 35 : avgHum > 75 ? 25 : avgHum > 65 ? 12 : 0) +
                  (avgTemp >= 20 && avgTemp <= 28 ? 20 : avgTemp >= 15 && avgTemp <= 30 ? 10 : 0) +
                  (avgPrecip > 80 ? 15 : avgPrecip > 50 ? 8 : 0) +
                  (avgWind > 20 ? 10 : 0),
              ),
            ),
          );
          return { mes: m, Sequía: droughtRisk, Heladas: frostRisk, Plagas: pestRisk };
        }
      }
      const seasonal = Math.sin((i / 12) * Math.PI * 2);
      const f = factor ?? 1;
      return {
        mes: m,
        Sequía: Math.max(5, Math.round(40 + seasonal * 25 - f * 10)),
        Heladas: Math.max(2, Math.round(15 - seasonal * 10)),
        Plagas: Math.max(10, Math.round(35 + Math.cos((i / 12) * Math.PI * 2) * 20)),
      };
    });

    if (viability) {
      const score = viability.score;
      const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
      if (score >= 70) {
        result = result.map((d) => ({
          ...d,
          Sequía: clamp(d.Sequía * 0.7),
          Heladas: clamp(d.Heladas * 0.7),
          Plagas: clamp(d.Plagas * 0.7),
        }));
      } else if (score < 50) {
        result = result.map((d) => ({
          ...d,
          Sequía: clamp(d.Sequía * 1.3),
          Heladas: clamp(d.Heladas * 1.3),
          Plagas: clamp(d.Plagas * 1.3),
        }));
      }
    }
    return result;
  }, [hasRealData, climate, factor, viability]);

  const yMax = 100;
  const barGroupW = PW / data.length;
  const barW = Math.min(16, (barGroupW - 8) / SERIES.length);
  const gap = 2;

  const yScale = (v: number) => PAD.top + PH - (v / yMax) * PH;

  return (
    <div
      className="w-full"
      role="img"
      aria-label="Gráfico de riesgos climáticos por mes: sequía, heladas y plagas"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yScale(v);
          return (
            <g key={v}>
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
                fontSize={12}
                fill="var(--muted-foreground)"
              >
                {v}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const groupX = PAD.left + i * barGroupW + barGroupW / 2;
          return (
            <text
              key={i}
              x={groupX}
              y={H - 6}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {d.mes.slice(0, 3)}
            </text>
          );
        })}

        {hoverIdx != null && (
          <rect
            x={PAD.left + hoverIdx * barGroupW}
            y={PAD.top}
            width={barGroupW}
            height={PH}
            fill="var(--muted)"
            opacity={0.3}
          />
        )}

        {data.map((d, i) => {
          const groupX = PAD.left + i * barGroupW + barGroupW / 2;
          const totalW = SERIES.length * barW + (SERIES.length - 1) * gap;
          const startX = groupX - totalW / 2;
          return SERIES.map((s, j) => {
            const val = d[s];
            const barH = (val / yMax) * PH;
            const x = startX + j * (barW + gap);
            const y = yScale(val);
            return (
              <rect
                key={`${i}-${j}`}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={barW > 6 ? 3 : 1.5}
                fill={COLORS[s]}
                opacity={0.85}
              />
            );
          });
        })}

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
            const idx = Math.floor(((mouseX - PAD.left) / PW) * data.length);
            setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
          }}
        />

        {hoverIdx != null && (
          <g>
            <rect
              x={
                hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 115 > W
                  ? hoverIdx * barGroupW + PAD.left - 118
                  : hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 2
              }
              y={PAD.top - 2}
              width={110}
              height={56}
              rx={8}
              fill="var(--popover)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={
                hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 115 > W
                  ? hoverIdx * barGroupW + PAD.left - 112
                  : hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 8
              }
              y={PAD.top + 12}
              fontSize={12}
              fill="var(--foreground)"
              fontWeight={600}
            >
              {data[hoverIdx].mes}
            </text>
            {SERIES.map((s, j) => (
              <g key={s}>
                <circle
                  cx={
                    hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 115 > W
                      ? hoverIdx * barGroupW + PAD.left - 108
                      : hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 12
                  }
                  cy={PAD.top + 24 + j * 13}
                  r={3}
                  fill={COLORS[s]}
                />
                <text
                  x={
                    hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 115 > W
                      ? hoverIdx * barGroupW + PAD.left - 100
                      : hoverIdx * barGroupW + PAD.left + barGroupW / 2 + 20
                  }
                  y={PAD.top + 28 + j * 13}
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  {s}: {data[hoverIdx][s]}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[s] }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
});
