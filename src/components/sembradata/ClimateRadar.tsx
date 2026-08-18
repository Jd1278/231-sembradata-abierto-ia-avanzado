import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface Props {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  solarRadiation: number;
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, Math.round(((value - min) / (max - min)) * 100)));
}

function dynamicRange(values: number[], pad = 0.1): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const margin = Math.max((max - min) * pad, 1);
  return [Math.floor(min - margin), Math.ceil(max + margin)];
}

export function ClimateRadar({
  temperature,
  humidity,
  precipitation,
  windSpeed,
  solarRadiation,
}: Props) {
  const tempRange = dynamicRange([temperature], 0.2);
  const humRange = dynamicRange([humidity], 0.15);
  const precRange = dynamicRange([precipitation], 0.2);
  const windRange = dynamicRange([windSpeed], 0.2);
  const solarRange = dynamicRange([solarRadiation], 0.2);

  const data = [
    { variable: "Temp", value: normalize(temperature, tempRange[0], tempRange[1]) },
    { variable: "Humedad", value: normalize(humidity, humRange[0], humRange[1]) },
    { variable: "Precipitación", value: normalize(precipitation, precRange[0], precRange[1]) },
    { variable: "Viento", value: normalize(windSpeed, windRange[0], windRange[1]) },
    { variable: "Radiación", value: normalize(solarRadiation, solarRange[0], solarRange[1]) },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="variable"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={6}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
          />
          <Radar
            name="Clima"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`, "Valor"]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
