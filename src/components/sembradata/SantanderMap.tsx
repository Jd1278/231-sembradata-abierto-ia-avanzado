import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, MapPin } from "lucide-react";
import { CROP_DATA } from "./data";
import type { CropKey, Risk } from "@/types/crops";
import { getFeaturesForDepartment, VIEW_H, VIEW_W, type FeatureResult } from "./municipios";
import { cn } from "@/lib/utils";
import { SANTANDER } from "@/data/departamentos";

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
  dynamicRisk?: { level: Risk; score: number };
  filteredNames?: Set<string>;
}

export const SantanderMap = memo(function SantanderMap({
  crop,
  selected,
  onSelect,
  dynamicRisk,
  filteredNames,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const lastTipUpdate = useRef(0);

  const features = useMemo<FeatureResult[]>(() => {
    return getFeaturesForDepartment(SANTANDER.nombre);
  }, []);

  const selectedFeature = useMemo<FeatureResult | undefined>(
    () => features.find((m) => m.name === selected),
    [selected, features],
  );

  const activeFeature = useMemo(
    () => features.find((m) => m.id === hover) ?? selectedFeature,
    [hover, features, selectedFeature],
  );

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

  function handleMapKeyDown(e: React.KeyboardEvent) {
    if (features.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev + 1) % features.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev - 1 + features.length) % features.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIdx >= 0 && focusedIdx < features.length) {
        onSelect(features[focusedIdx].name);
      }
    } else if (e.key === "Escape") {
      setFocusedIdx(-1);
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = performance.now();
    if (now - lastTipUpdate.current < 50) return;
    lastTipUpdate.current = now;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Label top municipalities by area
  const labeledIds = useMemo(() => {
    const topN = Math.min(14, Math.max(5, Math.floor(features.length * 0.15)));
    return new Set(
      [...features]
        .sort((a, b) => b.area - a.area)
        .slice(0, topN)
        .map((m) => m.id),
    );
  }, [features]);

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-muted/30 to-sky/10">
        {features.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-sm text-muted-foreground">
              No hay datos disponibles para este departamento
            </p>
          </div>
        ) : (
          <svg
            viewBox={viewBox}
            className="h-full w-full transition-[all] duration-300 ease-out"
            tabIndex={0}
            role="application"
            aria-label="Mapa interactivo de Santander"
            onKeyDown={handleMapKeyDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setHover(null);
              setTip(null);
            }}
          >
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.4"
                  className="text-border"
                  opacity="0.5"
                />
              </pattern>
            </defs>

            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

            {features.map((m, idx) => {
              const isSelected = m.name === selected;
              const risk = isSelected && dynamicRisk ? dynamicRisk.level : m.risk[crop];
              const isHover = m.id === hover;
              const isFocused = idx === focusedIdx;
              const isFiltered = !filteredNames || filteredNames.has(m.name);
              return (
                <path
                  key={m.id}
                  d={m.path}
                  role="button"
                  tabIndex={-1}
                  aria-label={`${m.name}, riesgo ${risk}`}
                  className={cn(
                    RISK_FILL[risk],
                    "cursor-pointer stroke-background transition-all duration-200 ease-out",
                    "hover:[filter:brightness(1.1)]",
                    isHover || isFocused ? "opacity-100" : isFiltered ? "opacity-85" : "opacity-20",
                  )}
                  strokeWidth={isSelected ? 1.4 : isFocused ? 1.2 : 0.6}
                  stroke={isSelected || isFocused ? "currentColor" : undefined}
                  style={{
                    color: isSelected || isFocused ? "hsl(var(--foreground))" : undefined,
                  }}
                  onMouseEnter={() => setHover(m.id)}
                  onClick={() => onSelect(m.name)}
                />
              );
            })}

            {features
              .filter((m) => labeledIds.has(m.id))
              .map((m) => (
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

            <g transform="translate(475, 22)" className="pointer-events-none">
              <circle r="12" className="fill-background/85 stroke-border" strokeWidth="0.8" />
              <text y="-3" textAnchor="middle" className="fill-foreground text-[7px] font-bold">
                N
              </text>
              <path
                d="M 0 -8 L 2 0 L 0 -2 L -2 0 Z"
                className="fill-primary"
                transform="translate(0, 5)"
              />
            </g>
          </svg>
        )}

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
            {SANTANDER.nombre} · {features.length}{" "}
            {features.length === 1 ? "municipio" : "municipios"}
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
              {SANTANDER.nombre}
            </div>
            <p className="mt-0.5 text-sm font-bold text-foreground">{activeFeature.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground">Cultivo</p>
                <p className="font-semibold text-foreground">{CROP_DATA[crop].label}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Rendimiento</p>
                <p className="font-semibold text-foreground">
                  {(CROP_DATA[crop].baseYield * activeFeature.factor).toFixed(2)} t/ha
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground">Riesgo climático</p>
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    RISK_TEXT[
                      activeFeature.name === selected && dynamicRisk
                        ? dynamicRisk.level
                        : activeFeature.risk[crop]
                    ],
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      RISK_DOT[
                        activeFeature.name === selected && dynamicRisk
                          ? dynamicRisk.level
                          : activeFeature.risk[crop]
                      ],
                    )}
                  />
                  {activeFeature.name === selected && dynamicRisk
                    ? dynamicRisk.level
                    : activeFeature.risk[crop]}
                  {dynamicRisk && activeFeature.name === selected && (
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      ({dynamicRisk.score} pts)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
