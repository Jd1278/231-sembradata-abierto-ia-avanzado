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

const normalize = (value: number, min: number, max: number) =>
  Math.round(((value - min) / (max - min)) * 100);

export function ClimateRadar({
  temperature,
  humidity,
  precipitation,
  windSpeed,
  solarRadiation,
}: Props) {
  const data = [
    {
      variable: "Temp",
      value: normalize(temperature, -10, 45),
    },
    {
      variable: "Humedad",
      value: normalize(humidity, 0, 100),
    },
    {
      variable: "Precipitación",
      value: normalize(precipitation, 0, 400),
    },
    {
      variable: "Viento",
      value: normalize(windSpeed, 0, 60),
    },
    {
      variable: "Radiación",
      value: normalize(solarRadiation, 0, 40),
    },
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
