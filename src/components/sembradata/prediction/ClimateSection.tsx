import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClimateData } from "@/services/climate-api";

interface Props {
  climate: ClimateData;
}

export function ClimateSection({ climate }: Props) {
  const windDir = getWindDirection(climate.windDirection);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Condiciones Climáticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <ClimateMetric
            label="Temperatura actual"
            value={`${climate.temperature.toFixed(1)}°C`}
            detail={`Max ${climate.temperatureMax.toFixed(0)}° / Min ${climate.temperatureMin.toFixed(0)}°`}
          />
          <ClimateMetric
            label="Humedad relativa"
            value={`${climate.humidity.toFixed(0)}%`}
            detail="Promedio"
          />
          <ClimateMetric
            label="Precipitación"
            value={`${(climate.precipitation * 30).toFixed(0)} mm/mes`}
            detail={`Promedio: ${climate.precipitation.toFixed(1)} mm/día`}
          />
          <ClimateMetric
            label="Viento"
            value={`${climate.windSpeed.toFixed(0)} km/h`}
            detail={windDir}
          />
          <ClimateMetric
            label="Radiación solar"
            value={`${climate.solarRadiation.toFixed(0)} W/m²`}
            detail="Promedio diario"
          />
          <ClimateMetric
            label="Índice UV"
            value={climate.uvIndex.toFixed(1)}
            detail={climate.uvIndex > 8 ? "Muy alto" : climate.uvIndex > 5 ? "Alto" : "Moderado"}
          />
          <ClimateMetric label="Nubosidad" value={`${climate.cloudCover.toFixed(0)}%`} detail="" />
          <ClimateMetric label="Presión" value={`${climate.pressure.toFixed(0)} hPa`} detail="" />
        </div>

        {/* Agricultural indices */}
        {climate.agriculturalIndex && (
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Índices Agroclimáticos
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AgroIndex
                label="Días-grado acumulados"
                value={climate.agriculturalIndex.GrowingDegreeDays.toFixed(0)}
                unit="°C·días"
              />
              <AgroIndex
                label="Índice de aridez"
                value={climate.agriculturalIndex.aridityIndex.toFixed(2)}
                unit=""
              />
              <AgroIndex
                label="Estrés hídrico"
                value={`${(climate.agriculturalIndex.moistureStressIndex * 100).toFixed(0)}%`}
                unit=""
              />
              <AgroIndex
                label="Riesgo de heladas"
                value={`${(climate.agriculturalIndex.frostRisk * 100).toFixed(0)}%`}
                unit=""
              />
            </div>
          </div>
        )}

        {/* Daily forecast */}
        {climate.dailyData.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pronóstico 7 días
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {climate.dailyData.slice(-7).map((d, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-xl border border-border p-2 text-center min-w-[60px]"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {new Date(d.date).toLocaleDateString("es-CO", {
                      weekday: "short",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {d.tempMax.toFixed(0)}°
                  </p>
                  <p className="text-xs text-muted-foreground">{d.tempMin.toFixed(0)}°</p>
                  <p className="mt-0.5 text-xs text-sky-600">
                    {d.precip > 0 ? `${d.precip.toFixed(0)}mm` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClimateMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function AgroIndex({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-bold text-foreground">
        {value} {unit}
      </span>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const i = Math.round(degrees / 45) % 8;
  return dirs[i];
}
