import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchIdeamForLocation, type IdeamStation, type IdeamObservation } from "@/services/ideam";
import { IdeamSkeleton } from "../Skeletons";
import { saveOffline, getOffline } from "@/hooks/use-offline";

interface Props {
  lat: number;
  lng: number;
  departamento?: string;
}

const CACHE_KEY = (lat: number, lng: number) => `ideam_${lat.toFixed(2)}_${lng.toFixed(2)}`;

interface IdeamCache {
  station: IdeamStation;
  observations: IdeamObservation[];
}

export function IdeamStationSection({ lat, lng, departamento }: Props) {
  const [station, setStation] = useState<IdeamStation | null>(null);
  const [observations, setObservations] = useState<IdeamObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      const cached = getOffline<IdeamCache>(CACHE_KEY(lat, lng));
      if (cached) {
        setStation(cached.station);
        setObservations(cached.observations);
        setIsStale(true);
        setLoading(false);
      }

      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      try {
        const result = await fetchIdeamForLocation(lat, lng, departamento, 30);
        if (result && !signal?.aborted) {
          setStation(result.station);
          setObservations(result.observations);
          setIsStale(false);
          saveOffline(CACHE_KEY(lat, lng), result);
        }
      } catch {
        if (!cached && !signal?.aborted) setStation(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [lat, lng, departamento],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  if (loading) return <IdeamSkeleton />;
  if (!station) return null;

  const recentObs = observations.slice(-7);
  const avgTemp =
    recentObs.length > 0
      ? recentObs.reduce((s, o) => s + (o.temperatura ?? 0), 0) / recentObs.length
      : null;
  const avgHumidity =
    recentObs.length > 0
      ? recentObs.reduce((s, o) => s + (o.humedad ?? 0), 0) / recentObs.length
      : null;
  const totalPrecip = recentObs.reduce((s, o) => s + (o.precipitacion ?? 0), 0);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Estación IDEAM Más Cercana</CardTitle>
          {isStale && (
            <Badge variant="secondary" className="text-[9px]">
              Datos guardados
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Datos reales de estaciones meteorológicas de Santander
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-border p-3 space-y-1.5">
          <p className="text-xs font-bold text-foreground">{station.nombre}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <span className="text-muted-foreground">Departamento</span>
            <span className="text-foreground text-right">{station.departamento}</span>
            <span className="text-muted-foreground">Municipio</span>
            <span className="text-foreground text-right">{station.municipio}</span>
            <span className="text-muted-foreground">Tipo</span>
            <span className="text-foreground text-right">{station.tipo || "—"}</span>
            <span className="text-muted-foreground">Estado</span>
            <span className="text-foreground text-right">{station.estado || "—"}</span>
            <span className="text-muted-foreground">Altitud</span>
            <span className="text-foreground text-right">{station.altitud} m</span>
            <span className="text-muted-foreground">Coordenadas</span>
            <span className="text-foreground text-right">
              {station.latitud.toFixed(4)}, {station.longitud.toFixed(4)}
            </span>
          </div>
        </div>

        {recentObs.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Últimos {recentObs.length} días registrados
            </p>
            <div className="grid grid-cols-3 gap-2">
              {avgTemp !== null && (
                <StationMetric label="Temp. promedio" value={`${avgTemp.toFixed(1)}°C`} />
              )}
              {avgHumidity !== null && (
                <StationMetric label="Humedad promedio" value={`${avgHumidity.toFixed(0)}%`} />
              )}
              <StationMetric label="Precipitación" value={`${totalPrecip.toFixed(1)} mm`} />
            </div>

            <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
              {recentObs.map((obs, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-lg border border-border px-2 py-1.5 text-center min-w-[55px]"
                >
                  <p className="text-[8px] text-muted-foreground">
                    {new Date(obs.fecha).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-[9px] font-bold text-foreground">
                    {obs.temperatura != null ? `${obs.temperatura.toFixed(0)}°` : "—"}
                  </p>
                  <p className="text-[8px] text-sky-600">
                    {obs.precipitacion != null && obs.precipitacion > 0
                      ? `${obs.precipitacion.toFixed(0)}mm`
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentObs.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Sin datos recientes disponibles para esta estación
          </p>
        )}

        <p className="text-[9px] text-muted-foreground">
          Fuente: IDEAM vía datos.gov.co · {observations.length} registros
        </p>
      </CardContent>
    </Card>
  );
}

function StationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-2 text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className="text-[11px] font-bold text-foreground">{value}</p>
    </div>
  );
}
