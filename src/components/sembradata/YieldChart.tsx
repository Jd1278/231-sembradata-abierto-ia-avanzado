import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

export const YieldChart = memo(function YieldChart({ crop, factor, viabilityScore = 50 }: Props) {
  const base = CROP_DATA[crop].baseYield * factor;
  const scoreAdjustment = (viabilityScore - 50) / 50;

  const historicalVariation = [0.78, 1.05, 0.88, 1.12, 0.82, 1.08, 0.91, 0.97, 1.03, 0.86];
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  const data = years.map((year, i) => {
    const variation = historicalVariation[i % historicalVariation.length];
    const noise = (seededRandom(year * 7 + i * 13) - 0.5) * 0.15;
    const histYield = +(base * (variation + noise)).toFixed(2);

    if (year <= 2024) {
      return { year: String(year), hist: histYield, pred: year === 2024 ? histYield : null };
    }
    const predNoise = (seededRandom(year * 11 + i * 3) - 0.5) * 0.1;
    const predYield = +(base * (0.95 + scoreAdjustment * 0.15 + predNoise)).toFixed(2);
    return { year: String(year), hist: null, pred: predYield };
  });

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--sky)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number) => (v == null ? "—" : `${v.toFixed(2)} t/ha`)}
          />
          <Area
            type="monotone"
            dataKey="hist"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#histFill)"
            name="Histórico"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="pred"
            stroke="var(--sky)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            fill="url(#predFill)"
            name="Predicción"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="pred"
            stroke="var(--sky)"
            dot={{ r: 3 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
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
