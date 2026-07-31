export function MapLegend() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-[11px]"
      data-testid="map-legend"
    >
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-low" /> Bajo
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-med" /> Medio
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-high" /> Alto
      </span>
    </div>
  );
}
