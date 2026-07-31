import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClimateData } from "@/services/climate-api";
import type { ViabilityResult } from "@/types/prediction-v2";
import { MONTH_LABELS } from "@/services/temporal-optimizer";

interface Props {
  factor: number;
  climate?: ClimateData | null;
  viability?: ViabilityResult | null;
}

export const RiskChart = memo(function RiskChart({ factor, climate, viability }: Props) {
  const hasRealData = !!(climate && climate.dailyData.length > 0);

  const data = MONTH_LABELS.map((m, i) => {
    if (hasRealData && climate) {
      const monthData = climate.dailyData.filter((d) => {
        const dateMonth = new Date(d.date).getMonth();
        return dateMonth === i;
      });

      if (monthData.length > 0) {
        const avgPrecip = monthData.reduce((s, d) => s + d.precip, 0) / monthData.length;
        const avgTemp =
          monthData.reduce((s, d) => s + (d.tempMax + d.tempMin) / 2, 0) / monthData.length;
        const avgHum = monthData.reduce((s, d) => s + d.humidity, 0) / monthData.length;

        const droughtRisk = Math.round(
          Math.min(100, Math.max(5, (1 - avgPrecip / 60) * 50 + (avgTemp > 28 ? 20 : 0))),
        );
        const frostRisk = Math.round(
          Math.min(100, Math.max(2, avgTemp < 10 ? 60 : avgTemp < 15 ? 30 : 5)),
        );
        const pestRisk = Math.round(
          Math.min(
            100,
            Math.max(10, (avgHum > 75 ? 40 : 0) + (avgTemp > 22 && avgTemp < 28 ? 20 : 0)),
          ),
        );

        return { mes: m, Sequía: droughtRisk, Heladas: frostRisk, Plagas: pestRisk };
      }
    }

    const seasonal = Math.sin((i / 12) * Math.PI * 2);
    return {
      mes: m,
      Sequía: Math.max(5, Math.round(40 + seasonal * 25 - factor * 10)),
      Heladas: Math.max(2, Math.round(15 - seasonal * 10)),
      Plagas: Math.max(10, Math.round(35 + Math.cos((i / 12) * Math.PI * 2) * 20)),
    };
  });

  if (viability) {
    const score = viability.score;
    if (score >= 70)
      data.forEach((d) => {
        d.Sequía = Math.round(d.Sequía * 0.7);
        d.Heladas = Math.round(d.Heladas * 0.7);
        d.Plagas = Math.round(d.Plagas * 0.7);
      });
    else if (score < 50)
      data.forEach((d) => {
        d.Sequía = Math.round(d.Sequía * 1.3);
        d.Heladas = Math.round(d.Heladas * 1.3);
        d.Plagas = Math.round(d.Plagas * 1.3);
      });
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar
            dataKey="Sequía"
            fill="var(--risk-high)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="Heladas"
            fill="var(--sky)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="Plagas"
            fill="var(--risk-med)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
