import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, MapPin } from "lucide-react";
import { CROP_DATA, type CropKey, type Risk } from "./data";
import {
  MUNICIPIO_FEATURES,
  VIEW_H,
  VIEW_W,
  type MunicipioFeature,
} from "./municipios";
import { cn } from "@/lib/utils";

const RISK_FILL: Record<Risk, string> = {
  Bajo: "fill-risk-low",
  Medio: "fill-risk-med",
  Alto: "fill-risk-high",
};
const RISK_TEXT: Record<Risk, string> = {
  Bajo: "text-risk-low",
  Medio: "text-risk-med",
  Alto: "text-risk-high",
};
const RISK_DOT: Record<Risk, string> = {
  Bajo: "bg-risk-low",
  Medio: "bg-risk-med",
  Alto: "bg-risk-high",
};

// Label only the biggest municipalities so the map stays readable.
const LABEL_TOP_N = 14;
const LABELED_IDS = new Set(
  [...MUNICIPIO_FEATURES]
    .sort((a, b) => b.area - a.area)
    .slice(0, LABEL_TOP_N)
    .map((m) => m.id),
);

interface Props {
  crop: CropKey;
  selected: string;
  onSelect: (name: string) => void;
}

export function SantanderMap({ crop, selected, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const selectedFeature = useMemo<MunicipioFeature | undefined>(
    () => MUNICIPIO_FEATURES.find((m) => m.name === selected),
    [selected],
  );

  const activeFeature =
    MUNICIPIO_FEATURES.find((m) => m.id === hover) ?? selectedFeature;

  const viewBox = useMemo(() => {
    const w = VIEW_W / zoom;
    const h = VIEW_H / zoom;
    const cx = VIEW_W / 2 - w / 2 + pan.x;
    const cy = VIEW_H / 2 - h / 2 + pan.y;
    return `${cx} ${cy} ${w} ${h}`;
  }, [zoom, pan]);

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-muted/30 to-sky/10">
        <svg
          viewBox={viewBox}
          className="h-full w-full transition-[all] duration-300 ease-out"
          onMouseLeave={() => {
            setHover(null);
            setTip(null);
          }}
        >
          <defs>
            <pattern
              id="grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.4"
                className="text-border"
                opacity="0.5"
              />
            </pattern>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

          {/* Soft outer glow silhouette of the whole department */}
          <g filter="url(#soft)" opacity="0.35">
            {MUNICIPIO_FEATURES.map((m) => (
              <path
                key={`glow-${m.id}`}
                d={m.path}
                className="fill-primary/20"
              />
            ))}
          </g>

          {/* Municipality choropleth */}
          {MUNICIPIO_FEATURES.map((m) => {
            const risk = m.risk[crop];
            const isSelected = m.name === selected;
            const isHover = m.id === hover;
            return (
              <path
                key={m.id}
                d={m.path}
                className={cn(
                  RISK_FILL[risk],
                  "cursor-pointer stroke-background transition-all duration-200 ease-out",
                  "hover:[filter:brightness(1.1)]",
                  isHover ? "opacity-100" : "opacity-85",
                )}
                strokeWidth={isSelected ? 1.4 : 0.6}
                stroke={isSelected ? "currentColor" : undefined}
                style={{
                  color: isSelected ? "hsl(var(--foreground))" : undefined,
                }}
                onMouseEnter={(e) => {
                  setHover(m.id);
                  const rect = (
                    e.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = (
                    e.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onClick={() => onSelect(m.name)}
              />
            );
          })}

          {/* Labels for the largest municipalities */}
          {MUNICIPIO_FEATURES.filter((m) => LABELED_IDS.has(m.id)).map((m) => (
            <text
              key={`lbl-${m.id}`}
              x={m.cx}
              y={m.cy}
              textAnchor="middle"
              className={cn(
                "pointer-events-none select-none text-[6px] font-semibold",
                "fill-white [paint-order:stroke] [stroke:rgba(0,0,0,0.5)] [stroke-width:1.2px]",
              )}
            >
              {m.name}
            </text>
          ))}

          {/* Compass */}
          <g transform="translate(475, 22)" className="pointer-events-none">
            <circle
              r="12"
              className="fill-background/85 stroke-border"
              strokeWidth="0.8"
            />
            <text
              y="-3"
              textAnchor="middle"
              className="fill-foreground text-[7px] font-bold"
            >
              N
            </text>
            <path
              d="M 0 -8 L 2 0 L 0 -2 L -2 0 Z"
              className="fill-primary"
              transform="translate(0, 5)"
            />
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-border bg-background/90 shadow-sm backdrop-blur">
          <button
            onClick={zoomIn}
            className="grid h-8 w-8 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Acercar"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={zoomOut}
            className="grid h-8 w-8 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Alejar"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={reset}
            className="grid h-8 w-8 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Restablecer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Pan pad */}
        <div className="absolute right-3 top-32 grid grid-cols-3 gap-0.5 rounded-xl border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
          <div />
          <button
            onClick={() => setPan((p) => ({ ...p, y: p.y - 20 }))}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"
            aria-label="Norte"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => setPan((p) => ({ ...p, x: p.x - 20 }))}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"
            aria-label="Oeste"
          >
            ◀
          </button>
          <div className="grid h-6 w-6 place-items-center text-[9px] font-semibold text-muted-foreground">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setPan((p) => ({ ...p, x: p.x + 20 }))}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"
            aria-label="Este"
          >
            ▶
          </button>
          <div />
          <button
            onClick={() => setPan((p) => ({ ...p, y: p.y + 20 }))}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"
            aria-label="Sur"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl border border-border bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Riesgo climático · {MUNICIPIO_FEATURES.length} municipios
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            {(["Bajo", "Medio", "Alto"] as Risk[]).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm", RISK_DOT[r])} />
                <span className="font-medium text-foreground">{r}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Scale bar */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span>0</span>
          <span className="h-1 w-10 rounded-full bg-foreground/60" />
          <span className="h-1 w-10 rounded-full bg-foreground/30" />
          <span>50 km</span>
        </div>

        {/* Floating tooltip */}
        {hover && tip && activeFeature && (
          <div
            className="pointer-events-none absolute z-20 min-w-[240px] -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
            style={{
              left: Math.max(130, Math.min(tip.x, 9999)),
              top: Math.max(90, tip.y - 12),
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Santander
            </div>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {activeFeature.name}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground">Cultivo</p>
                <p className="font-semibold text-foreground">
                  {CROP_DATA[crop].label}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Rendimiento</p>
                <p className="font-semibold text-foreground">
                  {(CROP_DATA[crop].baseYield * activeFeature.factor).toFixed(
                    2,
                  )}{" "}
                  t/ha
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground">
                  Riesgo climático
                </p>
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    RISK_TEXT[activeFeature.risk[crop]],
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      RISK_DOT[activeFeature.risk[crop]],
                    )}
                  />
                  {activeFeature.risk[crop]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
