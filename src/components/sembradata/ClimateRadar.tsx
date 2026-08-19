import { memo, useMemo, useState } from "react";

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

const AGRO_RANGES: Record<string, [number, number]> = {
  temperature: [0, 40],
  humidity: [0, 100],
  precipitation: [0, 500],
  windSpeed: [0, 40],
  solarRadiation: [0, 30],
};

const CX = 250;
const CY = 180;
const R = 130;
const RINGS = 5;

export const ClimateRadar = memo(function ClimateRadar({
  temperature,
  humidity,
  precipitation,
  windSpeed,
  solarRadiation,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(
    () => [
      { variable: "Temp", value: normalize(temperature, ...AGRO_RANGES.temperature) },
      { variable: "Humedad", value: normalize(humidity, ...AGRO_RANGES.humidity) },
      { variable: "Precipitación", value: normalize(precipitation, ...AGRO_RANGES.precipitation) },
      { variable: "Viento", value: normalize(windSpeed, ...AGRO_RANGES.windSpeed) },
      { variable: "Radiación", value: normalize(solarRadiation, ...AGRO_RANGES.solarRadiation) },
    ],
    [temperature, humidity, precipitation, windSpeed, solarRadiation],
  );

  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (idx: number, radius: number) => {
    const angle = startAngle + idx * angleStep;
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  };

  const dataPoints = data.map((d, i) => getPoint(i, (d.value / 100) * R));

  return (
    <div
      className="w-full"
      role="img"
      aria-label="Radar de variables climáticas: temperatura, humedad, precipitación, viento y radiación"
    >
      <svg viewBox="0 0 500 360" className="w-full h-auto">
        <defs>
          <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {Array.from({ length: RINGS + 1 }, (_, r) => {
          const radius = (r / RINGS) * R;
          const pts = Array.from({ length: n }, (_, i) => getPoint(i, radius));
          return (
            <polygon
              key={r}
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--border)"
              strokeWidth={r === RINGS ? 1 : 0.5}
              strokeDasharray={r === RINGS ? "none" : "2 2"}
            />
          );
        })}

        {data.map((_, i) => {
          const outer = getPoint(i, R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          );
        })}

        <polygon
          points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="url(#radar-fill)"
          stroke="var(--primary)"
          strokeWidth={2}
        />

        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="var(--primary)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}

        {data.map((d, i) => {
          const labelPt = getPoint(i, R + 22);
          const anchor = labelPt.x < CX - 10 ? "end" : labelPt.x > CX + 10 ? "start" : "middle";
          return (
            <text
              key={i}
              x={labelPt.x}
              y={labelPt.y + 5}
              textAnchor={anchor}
              fontSize={16}
              fill="var(--muted-foreground)"
              fontWeight={600}
            >
              {d.variable}
            </text>
          );
        })}

        {Array.from({ length: RINGS }, (_, r) => {
          const v = ((r + 1) / RINGS) * 100;
          const pt = getPoint(0, (v / 100) * R);
          return (
            <text
              key={r}
              x={pt.x + 4}
              y={pt.y - 4}
              fontSize={13}
              fill="var(--muted-foreground)"
              opacity={0.6}
            >
              {v}
            </text>
          );
        })}

        <rect
          x={0}
          y={0}
          width={500}
          height={360}
          fill="transparent"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 500;
            const my = ((e.clientY - rect.top) / rect.height) * 360;
            let closest = 0;
            let minDist = Infinity;
            dataPoints.forEach((p, i) => {
              const dist = Math.hypot(mx - p.x, my - p.y);
              if (dist < minDist) {
                minDist = dist;
                closest = i;
              }
            });
            if (minDist < 30) setHoverIdx(closest);
            else setHoverIdx(null);
          }}
        />

        {hoverIdx != null && (
          <g>
            <rect
              x={CX - 65}
              y={4}
              width={130}
              height={28}
              rx={8}
              fill="var(--popover)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={CX}
              y={22}
              textAnchor="middle"
              fontSize={15}
              fill="var(--foreground)"
              fontWeight={600}
            >
              {data[hoverIdx].variable}: {data[hoverIdx].value}%
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <span className="inline-block h-2 w-4 rounded bg-primary opacity-30" /> Valores normalizados
        (0–100%)
      </div>
    </div>
  );
});
