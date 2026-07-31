import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  lat: number;
  lng: number;
}

interface NdviData {
  date: string;
  ndvi: number;
  label: string;
  color: string;
}

function getNdviInfo(ndvi: number): { label: string; color: string; health: string } {
  if (ndvi >= 0.6) return { label: "Vegetación densa", color: "bg-green-500", health: "Saludable" };
  if (ndvi >= 0.4) return { label: "Vegetación moderada", color: "bg-green-300", health: "Normal" };
  if (ndvi >= 0.2) return { label: "Vegetación baja", color: "bg-yellow-400", health: "Estrés" };
  if (ndvi >= 0.1) return { label: "Suelo expuesto", color: "bg-orange-400", health: "Crítico" };
  return { label: "Sin vegetación", color: "bg-red-500", health: "Severo" };
}

export function NdviSection({ lat, lng }: Props) {
  const [data, setData] = useState<NdviData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - 30);

        const params = new URLSearchParams({
          latitude: lat.toString(),
          longitude: lng.toString(),
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
          daily: "NDVI",
          timezone: "America/Bogota",
        });

        const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);

        if (!res.ok) throw new Error("NDVI fetch failed");
        const raw = await res.json();

        if (cancelled) return;

        const times: string[] = raw.daily?.time ?? [];
        const ndviValues: number[] = raw.daily?.NDVI ?? [];

        const ndviData: NdviData[] = times
          .map((date, i) => {
            const val = ndviValues[i] ?? 0;
            const info = getNdviInfo(val);
            return { date, ndvi: val, label: info.label, color: info.color };
          })
          .filter((d) => d.ndvi > -999);

        setData(ndviData);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];
  const avg = data.reduce((s, d) => s + d.ndvi, 0) / data.length;
  const info = getNdviInfo(avg);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">NDVI — Vegetación</CardTitle>
          <Badge variant="secondary" className="text-[9px]">
            Últimos 30 días
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Índice de Vegetación de Diferencia Normalizada (satelital)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">NDVI actual</p>
            <p className="text-sm font-bold text-foreground">{latest.ndvi.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">{latest.label}</p>
          </div>
          <div className="rounded-xl border border-border p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">Promedio 30d</p>
            <p className="text-sm font-bold text-foreground">{avg.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">{info.health}</p>
          </div>
          <div className="rounded-xl border border-border p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">Tendencia</p>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span className={`h-2 w-2 rounded-full ${info.color}`} />
              <span className="text-[10px] font-medium text-foreground">{info.label}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Serie temporal NDVI
          </p>
          <div className="flex gap-0.5 overflow-x-auto pb-1">
            {data.map((d, i) => {
              const barHeight = Math.max(4, d.ndvi * 60);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center flex-shrink-0"
                  title={`${d.date}: ${d.ndvi.toFixed(2)}`}
                >
                  <div
                    className={`w-2 rounded-t ${getNdviInfo(d.ndvi).color}`}
                    style={{ height: `${barHeight}px`, minHeight: "4px" }}
                  />
                  {i % 5 === 0 && (
                    <p className="text-[7px] text-muted-foreground mt-0.5">
                      {new Date(d.date).toLocaleDateString("es-CO", { day: "numeric" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Denso
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300" /> Moderado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" /> Bajo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Expuesto
          </span>
        </div>

        <p className="text-[9px] text-muted-foreground">Fuente: Open-Meteo Archive (MODIS NDVI)</p>
      </CardContent>
    </Card>
  );
}
