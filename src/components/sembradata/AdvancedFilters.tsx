import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdvancedFilterValues {
  altitudeRange: [number, number];
  tempRange: [number, number];
  precipRange: [number, number];
  soilType: string;
}

const DEFAULT_FILTERS: AdvancedFilterValues = {
  altitudeRange: [0, 4000],
  tempRange: [10, 35],
  precipRange: [0, 4000],
  soilType: "all",
};

const SOIL_TYPES = [
  { value: "all", label: "Todos" },
  { value: "arcilla", label: "Arcilla" },
  { value: "limo", label: "Limo" },
  { value: "arena", label: "Arena" },
  { value: "franco", label: "Franco" },
];

function RangeSlider({
  min,
  max,
  value,
  onChange,
  unit,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  unit: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          {value[0]}
          {unit}
        </span>
        <span className="font-medium text-muted-foreground">
          {value[1]}
          {unit}
        </span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-muted" />
        <div
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
          className="h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
          className="h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
}

export function AdvancedFilters({
  value,
  onChange,
}: {
  value: AdvancedFilterValues;
  onChange: (v: AdvancedFilterValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdvancedFilterValues>(value);
  const hasChanges =
    draft.altitudeRange[0] !== value.altitudeRange[0] ||
    draft.altitudeRange[1] !== value.altitudeRange[1] ||
    draft.tempRange[0] !== value.tempRange[0] ||
    draft.tempRange[1] !== value.tempRange[1] ||
    draft.precipRange[0] !== value.precipRange[0] ||
    draft.precipRange[1] !== value.precipRange[1] ||
    draft.soilType !== value.soilType;
  const isDirty =
    value.altitudeRange[0] !== DEFAULT_FILTERS.altitudeRange[0] ||
    value.altitudeRange[1] !== DEFAULT_FILTERS.altitudeRange[1] ||
    value.tempRange[0] !== DEFAULT_FILTERS.tempRange[0] ||
    value.tempRange[1] !== DEFAULT_FILTERS.tempRange[1] ||
    value.precipRange[0] !== DEFAULT_FILTERS.precipRange[0] ||
    value.precipRange[1] !== DEFAULT_FILTERS.precipRange[1] ||
    value.soilType !== DEFAULT_FILTERS.soilType;

  return (
    <div className="rounded-xl border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros avanzados
          {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-3 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Altitud</label>
            <RangeSlider
              min={0}
              max={4000}
              value={draft.altitudeRange}
              onChange={(v) => setDraft({ ...draft, altitudeRange: v })}
              unit=" m"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Temperatura promedio
            </label>
            <RangeSlider
              min={0}
              max={45}
              value={draft.tempRange}
              onChange={(v) => setDraft({ ...draft, tempRange: v })}
              unit="°C"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Precipitación anual
            </label>
            <RangeSlider
              min={0}
              max={4000}
              value={draft.precipRange}
              onChange={(v) => setDraft({ ...draft, precipRange: v })}
              unit=" mm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tipo de suelo preferido
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SOIL_TYPES.map((soil) => (
                <button
                  key={soil.value}
                  onClick={() => setDraft({ ...draft, soilType: soil.value })}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                    draft.soilType === soil.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {soil.label}
                </button>
              ))}
            </div>
          </div>

          {hasChanges && (
            <button
              onClick={() => {
                onChange(draft);
              }}
              className="w-full rounded-lg bg-primary py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Aplicar Filtros
            </button>
          )}

          {isDirty && (
            <button
              onClick={() => {
                setDraft(DEFAULT_FILTERS);
                onChange(DEFAULT_FILTERS);
              }}
              className="w-full rounded-lg border border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
