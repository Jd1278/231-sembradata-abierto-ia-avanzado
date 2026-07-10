import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, MapPin } from "lucide-react";
import { CROP_DATA, type CropKey, type Risk } from "./data";
import { cn } from "@/lib/utils";

interface Region {
  id: string;
  province: string;
  capital: string;
  points: string;
  labelX: number;
  labelY: number;
  factor: number;
  risk: Record<CropKey, Risk>;
}

// Stylized polygonal representation of Santander's producing provinces.
// Coordinates are hand-tuned within a 500x400 viewBox to loosely approximate
// the real geography while keeping crisp, tileable regions.
const REGIONS: Region[] = [
  {
    id: "mares",
    province: "Mares",
    capital: "Barrancabermeja",
    points: "55,150 140,110 175,180 150,255 70,235",
    labelX: 110,
    labelY: 190,
    factor: 0.85,
    risk: { cacao: "Medio", cafe: "Alto", granadilla: "Alto" },
  },
  {
    id: "yariguies",
    province: "Yariguíes",
    capital: "San Vicente de Chucurí",
    points: "150,255 175,180 240,205 230,295 155,295",
    labelX: 195,
    labelY: 250,
    factor: 1.15,
    risk: { cacao: "Bajo", cafe: "Medio", granadilla: "Medio" },
  },
  {
    id: "soto",
    province: "Soto",
    capital: "Bucaramanga",
    points: "140,110 265,80 320,145 240,205 175,180",
    labelX: 225,
    labelY: 145,
    factor: 1.0,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    id: "guanenta",
    province: "Guanentá",
    capital: "San Gil",
    points: "320,145 395,150 380,230 300,240 240,205",
    labelX: 325,
    labelY: 195,
    factor: 1.02,
    risk: { cacao: "Bajo", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    id: "garcia-rovira",
    province: "García Rovira",
    capital: "Málaga",
    points: "395,150 460,175 448,255 380,230",
    labelX: 425,
    labelY: 205,
    factor: 0.75,
    risk: { cacao: "Alto", cafe: "Medio", granadilla: "Medio" },
  },
  {
    id: "comunera",
    province: "Comunera",
    capital: "Socorro",
    points: "230,295 300,240 380,230 360,320 260,340",
    labelX: 310,
    labelY: 290,
    factor: 0.95,
    risk: { cacao: "Medio", cafe: "Bajo", granadilla: "Bajo" },
  },
  {
    id: "velez",
    province: "Vélez",
    capital: "Vélez",
    points: "155,295 230,295 260,340 235,370 160,360",
    labelX: 205,
    labelY: 335,
    factor: 0.9,
    risk: { cacao: "Medio", cafe: "Bajo", granadilla: "Medio" },
  },
];

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

  const selectedRegion = useMemo(
    () =>
      REGIONS.find((r) => r.capital === selected) ??
      REGIONS.find((r) => r.id === "yariguies")!,
    [selected],
  );

  const activeRegion =
    REGIONS.find((r) => r.id === hover) ?? selectedRegion;

  const viewBox = useMemo(() => {
    const w = 500 / zoom;
    const h = 400 / zoom;
    const cx = 250 - w / 2 + pan.x;
    const cy = 200 - h / 2 + pan.y;
    return `${cx} ${cy} ${w} ${h}`;
  }, [zoom, pan]);

  const zoomIn = () => setZoom((z) => Math.min(2.4, +(z + 0.25).toFixed(2)));
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
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          <rect x="0" y="0" width="500" height="400" fill="url(#grid)" />

          {/* Soft outer glow silhouette */}
          <g filter="url(#soft)" opacity="0.35">
            {REGIONS.map((r) => (
              <polygon
                key={`glow-${r.id}`}
                points={r.points}
                className="fill-primary/20"
              />
            ))}
          </g>

          {/* Region polygons */}
          {REGIONS.map((r) => {
            const risk = r.risk[crop];
            const isSelected = r.capital === selected;
            const isHover = r.id === hover;
            return (
              <g
                key={r.id}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHover(r.id);
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
                onClick={() => onSelect(r.capital)}
              >
                <polygon
                  points={r.points}
                  className={cn(
                    RISK_FILL[risk],
                    "stroke-background transition-all duration-200 ease-out",
                    "hover:opacity-95 hover:[filter:brightness(1.08)]",
                    isHover ? "opacity-100" : "opacity-80",
                  )}
                  strokeWidth={isSelected ? 2.5 : 1.4}
                  style={{
                    transformOrigin: `${r.labelX}px ${r.labelY}px`,
                    transform: isHover ? "scale(1.015)" : "scale(1)",
                    transition: "transform 200ms ease-out",
                  }}
                />
                {isSelected && (
                  <polygon
                    points={r.points}
                    fill="none"
                    className="stroke-foreground"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    opacity="0.7"
                  />
                )}
                <text
                  x={r.labelX}
                  y={r.labelY}
                  textAnchor="middle"
                  className={cn(
                    "pointer-events-none select-none text-[11px] font-semibold",
                    "fill-white [paint-order:stroke] [stroke:rgba(0,0,0,0.35)] [stroke-width:2px]",
                  )}
                >
                  {r.province}
                </text>
                <text
                  x={r.labelX}
                  y={r.labelY + 12}
                  textAnchor="middle"
                  className="pointer-events-none select-none fill-white/85 text-[8.5px] font-medium"
                >
                  {r.capital.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Compass */}
          <g transform="translate(455, 40)" className="pointer-events-none">
            <circle
              r="14"
              className="fill-background/80 stroke-border"
              strokeWidth="1"
            />
            <text
              y="-4"
              textAnchor="middle"
              className="fill-foreground text-[8px] font-bold"
            >
              N
            </text>
            <path
              d="M 0 -10 L 3 0 L 0 -3 L -3 0 Z"
              className="fill-primary"
              transform="translate(0, 6)"
            />
          </g>
        </svg>

        {/* Zoom / pan controls */}
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
            Riesgo climático
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            {(["Bajo", "Medio", "Alto"] as Risk[]).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span
                  className={cn("h-2.5 w-2.5 rounded-sm", RISK_DOT[r])}
                />
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

        {/* Floating tooltip (shadcn-styled) */}
        {hover && tip && activeRegion && (
          <div
            className="pointer-events-none absolute z-20 min-w-[220px] -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
            style={{
              left: Math.max(120, Math.min(tip.x, 9999)),
              top: Math.max(80, tip.y - 12),
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Provincia de {activeRegion.province}
            </div>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {activeRegion.capital}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground">Cultivo</p>
                <p className="font-semibold text-foreground">
                  {CROP_DATA[crop].label}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Rendimiento
                </p>
                <p className="font-semibold text-foreground">
                  {(CROP_DATA[crop].baseYield * activeRegion.factor).toFixed(
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
                    RISK_TEXT[activeRegion.risk[crop]],
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      RISK_DOT[activeRegion.risk[crop]],
                    )}
                  />
                  {activeRegion.risk[crop]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
