import { useState } from "react";
import { MUNICIPIOS, type CropKey, type Risk } from "./data";
import { cn } from "@/lib/utils";

const RISK_FILL: Record<Risk, string> = {
  Bajo: "var(--risk-low)",
  Medio: "var(--risk-med)",
  Alto: "var(--risk-high)",
};

interface Props {
  crop: CropKey;
  selected: string;
  onSelect: (name: string) => void;
}

export function SantanderMap({ crop, selected, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const activeName = hover ?? selected;
  const active = MUNICIPIOS.find((m) => m.name === activeName);

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-muted/40 to-sky/10">
        <svg viewBox="0 0 500 400" className="h-full w-full">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="500" height="400" fill="url(#grid)" />

          {/* Stylized Santander outline */}
          <path
            d="M 60 90 Q 90 60 140 65 L 210 55 Q 260 50 300 70 L 380 90 Q 430 110 445 160
               L 460 220 Q 455 280 420 320 L 370 355 Q 320 375 260 370 L 190 360
               Q 140 350 100 320 L 65 270 Q 45 210 55 150 Z"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <path
            d="M 60 90 Q 90 60 140 65 L 210 55 Q 260 50 300 70 L 380 90 Q 430 110 445 160
               L 460 220 Q 455 280 420 320 L 370 355 Q 320 375 260 370 L 190 360
               Q 140 350 100 320 L 65 270 Q 45 210 55 150 Z"
            fill="var(--primary)"
            opacity="0.04"
          />

          {/* Rivers */}
          <path
            d="M 90 130 Q 150 180 200 220 T 320 320"
            fill="none"
            stroke="var(--sky)"
            strokeWidth="2"
            opacity="0.5"
            strokeLinecap="round"
          />

          {/* Municipios */}
          {MUNICIPIOS.map((m) => {
            const risk = m.risk[crop];
            const isSelected = m.name === selected;
            const isHover = m.name === hover;
            const r = isSelected || isHover ? 14 : 10;
            return (
              <g
                key={m.name}
                className="cursor-pointer"
                onMouseEnter={() => setHover(m.name)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(m.name)}
              >
                {(isSelected || isHover) && (
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={r + 8}
                    fill={RISK_FILL[risk]}
                    opacity="0.25"
                  />
                )}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={r}
                  fill={RISK_FILL[risk]}
                  stroke="white"
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all"
                />
                <text
                  x={m.x}
                  y={m.y + r + 14}
                  textAnchor="middle"
                  className={cn(
                    "pointer-events-none fill-foreground text-[10px] font-medium transition-opacity",
                    isSelected || isHover ? "opacity-100" : "opacity-70",
                  )}
                >
                  {m.name.length > 14 ? m.name.split(" ")[0] : m.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {active && (
          <div className="pointer-events-none absolute left-4 top-4 max-w-[240px] rounded-xl border border-border bg-popover/95 p-3 shadow-lg backdrop-blur">
            <p className="text-xs font-medium text-muted-foreground">Municipio</p>
            <p className="text-sm font-semibold text-foreground">{active.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Rendimiento</p>
                <p className="font-semibold text-foreground">
                  {(active.factor * 1.05).toFixed(2)} t/ha
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Riesgo</p>
                <p
                  className="font-semibold"
                  style={{ color: RISK_FILL[active.risk[crop]] }}
                >
                  {active.risk[crop]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
