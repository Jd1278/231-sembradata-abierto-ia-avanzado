import { lazy, Suspense, useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Sprout,
  MapPin,
  Droplets,
  Thermometer,
  TrendingUp,
  Leaf,
  Coffee,
  Cherry,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SantanderMap } from "./SantanderMap";
import { YieldChart } from "./YieldChart";
import { RiskChart } from "./RiskChart";
import {
  MUNICIPIOS,
  CROP_DATA,
  computeAltitude,
  estimateTemperature,
  estimatePrecipitation,
} from "./data";
import type { CropKey } from "@/types/crops";
import { OfflineIndicator } from "./OfflineIndicator";
import { AdvancedFilters, type AdvancedFilterValues } from "./AdvancedFilters";
import { FilterBlock } from "./dashboard/FilterBlock";
import { KpiCard } from "./dashboard/KpiCard";
import { RiskKpiCard } from "./dashboard/RiskKpiCard";
import { MapLegend } from "./dashboard/MapLegend";
import {
  getAvailableYears,
  getOptimalPastDays,
  getTemporalRangeDescription,
} from "../../services/temporal-optimizer";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { SANTANDER } from "@/data/departamentos";
import { fetchCurrentClimate, type ClimateData } from "@/services/climate-api";
import { fetchSoilData, type SoilData } from "@/services/soil-service";
import { evaluateViability, type ViabilityResult } from "@/types/prediction-v2";
import { MONTH_LABELS } from "@/services/temporal-optimizer";

const ClimateRadar = lazy(() =>
  import("./ClimateRadar").then((m) => ({ default: m.ClimateRadar })),
);
const ChatbotPanel = lazy(() =>
  import("./ChatbotPanel").then((m) => ({ default: m.ChatbotPanel })),
);
const PredictionPanel = lazy(() =>
  import("./PredictionPanel").then((m) => ({ default: m.PredictionPanel })),
);
const CROPS: { key: CropKey; label: string; icon: typeof Leaf }[] = [
  { key: "cacao", label: "Cacao", icon: Cherry },
  { key: "cafe", label: "Café", icon: Coffee },
  { key: "granadilla", label: "Granadilla", icon: Leaf },
];

interface RealtimeData {
  climate: ClimateData | null;
  soil: SoilData | null;
  viability: ViabilityResult | null;
  loading: boolean;
}

const santanderMunis = MUNICIPIOS.filter(
  (m) => m.departamento?.toLowerCase() === SANTANDER.nombre.toLowerCase(),
);

export function Dashboard() {
  const [crop, setCrop] = useState<CropKey>("cacao");
  const [municipio, setMunicipio] = useState<string>(() => {
    return (
      santanderMunis.find((m) => /vicente/i.test(m.name))?.name ?? santanderMunis[0]?.name ?? ""
    );
  });
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(MONTH_LABELS[new Date().getMonth()]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilterValues>({
    altitudeRange: [0, 4000],
    tempRange: [10, 35],
    precipRange: [0, 4000],
    soilType: "all",
  });
  const [realtime, setRealtime] = useState<RealtimeData>({
    climate: null,
    soil: null,
    viability: null,
    loading: true,
  });

  const filteredMunicipios = useMemo(() => {
    return santanderMunis.filter((m) => {
      const alt = computeAltitude(m.factor);
      if (alt < filters.altitudeRange[0] || alt > filters.altitudeRange[1]) return false;

      const estTemp = estimateTemperature(alt);
      if (estTemp < filters.tempRange[0] || estTemp > filters.tempRange[1]) return false;

      const estPrecip = estimatePrecipitation(alt);
      if (estPrecip < filters.precipRange[0] || estPrecip > filters.precipRange[1]) return false;

      if (filters.soilType !== "all") {
        const soilByAlt =
          alt < 800 ? "arcilla" : alt < 1500 ? "franco" : alt < 2200 ? "limo" : "arena";
        if (soilByAlt !== filters.soilType) return false;
      }

      return true;
    });
  }, [filters]);

  const filteredNames = useMemo(
    () => new Set(filteredMunicipios.map((m) => m.name)),
    [filteredMunicipios],
  );

  const cropInfo = CROP_DATA[crop];
  const muni = useMemo(
    () => filteredMunicipios.find((m) => m.name === municipio) ?? filteredMunicipios[0],
    [municipio, filteredMunicipios],
  );

  const lat = muni ? (muni.geolat ?? SANTANDER.lat) : SANTANDER.lat;
  const lng = muni ? (muni.geolng ?? SANTANDER.lng) : SANTANDER.lng;

  const fetchGen = useRef(0);

  const fetchRealtimeData = useCallback(async () => {
    if (!muni) {
      setRealtime({ climate: null, soil: null, viability: null, loading: false });
      return;
    }
    const gen = ++fetchGen.current;
    setRealtime({ climate: null, soil: null, viability: null, loading: true });
    try {
      const pastDays = getOptimalPastDays(crop);
      const [climateData, soilData] = await Promise.all([
        fetchCurrentClimate(lat, lng, pastDays),
        fetchSoilData(lat, lng),
      ]);

      if (gen !== fetchGen.current) return;

      const tempOk =
        climateData.temperature >= filters.tempRange[0] &&
        climateData.temperature <= filters.tempRange[1];
      const precipOk =
        climateData.precipitation >= filters.precipRange[0] &&
        climateData.precipitation <= filters.precipRange[1];

      const alt = computeAltitude(muni.factor);
      const altOk = alt >= filters.altitudeRange[0] && alt <= filters.altitudeRange[1];

      if (!tempOk || !precipOk || !altOk) {
        if (gen === fetchGen.current)
          setRealtime({ climate: null, soil: null, viability: null, loading: false });
        return;
      }

      const monthIndex = MONTH_LABELS.indexOf(month);
      const currentMonth = monthIndex >= 0 ? monthIndex + 1 : 1;
      const v = evaluateViability(
        crop,
        soilData.ph,
        soilData.organicMatter,
        soilData.texture,
        climateData.temperature,
        climateData.precipitation,
        climateData.humidity,
        climateData.windSpeed,
        climateData.solarRadiation,
        alt,
        currentMonth,
        true,
      );
      if (gen === fetchGen.current)
        setRealtime({ climate: climateData, soil: soilData, viability: v, loading: false });
    } catch (err) {
      console.warn("Dashboard fetchRealtimeData error:", err);
      if (gen === fetchGen.current)
        setRealtime({ climate: null, soil: null, viability: null, loading: false });
    }
  }, [muni, crop, month, filters, lat, lng]);

  useEffect(() => {
    fetchRealtimeData();
  }, [fetchRealtimeData]);

  useEffect(() => {
    if (muni && muni.name !== municipio) {
      setMunicipio(muni.name);
    }
  }, [muni, municipio]);

  const metrics = useMemo(() => {
    const v = realtime.viability;
    const c = realtime.climate;
    return {
      yield: v
        ? ((v.score / 100) * cropInfo.baseYield * 1.5).toFixed(2)
        : (cropInfo.baseYield * (muni?.factor ?? 1)).toFixed(2),
      risk: v
        ? v.score >= 70
          ? ("Bajo" as const)
          : v.score >= 50
            ? ("Medio" as const)
            : ("Alto" as const)
        : (muni?.risk[crop] ?? ("Bajo" as const)),
      precip: c ? Math.round(c.precipitation) : Math.round(80 + (muni?.factor ?? 1) * 90),
      temp: c ? c.temperature.toFixed(1) : (22 + (1 - (muni?.factor ?? 1)) * 4).toFixed(1),
      gdd: c?.agriculturalIndex?.GrowingDegreeDays ?? 0,
      aridez: c?.agriculturalIndex?.aridityIndex ?? 0,
      estresHidrico: c?.agriculturalIndex?.moistureStressIndex ?? 0,
    };
  }, [realtime, cropInfo, muni, crop]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <Sprout className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">SembraData</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Predicción agroclimática — Santander
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-2xl border border-border bg-card p-1 shadow-sm">
            {CROPS.map((c) => {
              const Icon = c.icon;
              const active = crop === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCrop(c.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5"></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FilterBlock label="Departamento" icon={<MapPin className="h-4 w-4" />}>
                  <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
                    {SANTANDER.nombre}
                  </div>
                </FilterBlock>

                <FilterBlock label="Municipio" icon={<MapPin className="h-4 w-4" />}>
                  <Select value={municipio} onValueChange={setMunicipio}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMunicipios.length > 0 ? (
                        filteredMunicipios.map((m) => (
                          <SelectItem key={m.name} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                          No hay municipios disponibles
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </FilterBlock>

                <div className="grid grid-cols-2 gap-3">
                  <FilterBlock label="Año">
                    <Select
                      value={year}
                      onValueChange={(v) => {
                        setYear(v);
                        if (Number(v) < Number(year)) setMonth("Ene");
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableYears().map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterBlock>
                  <FilterBlock label="Mes">
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_LABELS.slice(
                          0,
                          Number(year) === new Date().getFullYear()
                            ? new Date().getMonth() + 1
                            : 12,
                        ).map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterBlock>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {getTemporalRangeDescription(crop)}
                </p>

                <AdvancedFilters value={filters} onChange={setFilters} />

                <div className="rounded-xl border border-dashed border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Cultivo activo</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{cropInfo.label}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {cropInfo.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-sky/10">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Recomendación
                </p>
                {realtime.viability ? (
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {realtime.viability.score >= 70 ? (
                      <>
                        Condiciones favorables para <b>{cropInfo.label}</b> en <b>{muni?.name}</b>.
                        Ventana óptima de siembra: <b>{cropInfo.window}</b>.
                      </>
                    ) : realtime.viability.score >= 50 ? (
                      <>
                        Riesgo moderado para <b>{cropInfo.label}</b> en <b>{muni?.name}</b>. Revise
                        los factores antes de sembrar.
                      </>
                    ) : (
                      <>
                        Alto riesgo para <b>{cropInfo.label}</b> en <b>{muni?.name}</b>. Considere
                        cultivos alternativos.
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Seleccione un municipio y cultivo para ver recomendaciones.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <div className="space-y-6">
            {realtime.loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando datos climáticos en tiempo real...
                </span>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <KpiCard
                label="Rendimiento estimado"
                value={metrics.yield}
                unit="Ton/Ha"
                trend={realtime.viability ? `${realtime.viability.score} pts` : "Sin datos"}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="primary"
              />
              <RiskKpiCard risk={metrics.risk} />
              <KpiCard
                label="Precipitación esperada"
                value={String(metrics.precip)}
                unit="mm / mes"
                trend="Normal"
                icon={<Droplets className="h-5 w-5" />}
                tone="sky"
              />
              <KpiCard
                label="Temperatura promedio"
                value={metrics.temp}
                unit="°C"
                trend={realtime.climate ? "Tiempo real" : "Sin datos"}
                icon={<Thermometer className="h-5 w-5" />}
                tone="earth"
              />
            </div>

            {/* Índices agroclimáticos */}
            {realtime.climate && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5">
                  <span className="font-medium text-foreground">GDD</span>
                  <span className="text-muted-foreground">{metrics.gdd.toFixed(1)} °C·día</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5">
                  <span className="font-medium text-foreground">Índice de aridez</span>
                  <span className={metrics.aridez > 0.5 ? "text-risk-high" : "text-risk-low"}>
                    {metrics.aridez.toFixed(2)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5">
                  <span className="font-medium text-foreground">Estrés hídrico</span>
                  <span
                    className={metrics.estresHidrico > 0.5 ? "text-risk-high" : "text-risk-low"}
                  >
                    {metrics.estresHidrico.toFixed(2)}
                  </span>
                </span>
              </div>
            )}

            {/* Map */}
            <Card className="overflow-hidden rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Mapa — {SANTANDER.nombre}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Riesgo agroclimático para {cropInfo.label} · {month} {year}
                    {filteredMunicipios.length < santanderMunis.length && (
                      <span className="ml-2 text-primary font-medium">
                        {filteredMunicipios.length} de {santanderMunis.length} municipios
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MapLegend />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMunicipio(
                        santanderMunis.find((m) => /vicente/i.test(m.name))?.name ??
                          santanderMunis[0]?.name ??
                          "",
                      );
                      setCrop("cacao");
                      setYear(new Date().getFullYear().toString());
                      setMonth(MONTH_LABELS[new Date().getMonth()]);
                      setFilters({
                        altitudeRange: [0, 4000],
                        tempRange: [10, 35],
                        precipRange: [0, 4000],
                        soilType: "all",
                      });
                      setShowPrediction(false);
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => {
                      if (muni) setShowPrediction(true);
                    }}
                  >
                    Analizar zona
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SantanderMap
                  crop={crop}
                  selected={muni?.name ?? ""}
                  onSelect={setMunicipio}
                  dynamicRisk={
                    realtime.viability
                      ? {
                          level: metrics.risk,
                          score: realtime.viability.score,
                        }
                      : undefined
                  }
                  filteredNames={filteredNames}
                />
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-6">
              <Card className="rounded-2xl xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Histórico vs. Predicción
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Rendimiento (Ton/Ha) — {cropInfo.label} {muni ? `en ${muni.name}` : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  <Suspense
                    fallback={<div className="h-[280px] animate-pulse rounded-2xl bg-muted" />}
                  >
                    <YieldChart
                      crop={crop}
                      factor={muni?.factor ?? 1}
                      viabilityScore={realtime.viability?.score ?? 50}
                    />
                  </Suspense>
                </CardContent>
              </Card>

              <Card className="rounded-2xl xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Riesgo climático por mes
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Sequía, heladas y plagas</p>
                </CardHeader>
                <CardContent>
                  <Suspense
                    fallback={<div className="h-[280px] animate-pulse rounded-2xl bg-muted" />}
                  >
                    <RiskChart
                      factor={muni?.factor ?? 1}
                      climate={realtime.climate}
                      viability={realtime.viability}
                    />
                  </Suspense>
                </CardContent>
              </Card>

              <Card className="rounded-2xl xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Perfil Climático</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Variables climáticas normalizadas — {muni ? `${muni.name}` : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  <SectionErrorBoundary sectionName="Radar climático">
                    <Suspense
                      fallback={<div className="h-[300px] animate-pulse rounded-2xl bg-muted" />}
                    >
                      <ClimateRadar
                        temperature={
                          realtime.climate ? realtime.climate.temperature : Number(metrics.temp)
                        }
                        humidity={realtime.climate?.humidity ?? 75}
                        precipitation={realtime.climate?.precipitation ?? metrics.precip}
                        windSpeed={realtime.climate?.windSpeed ?? 12}
                        solarRadiation={realtime.climate?.solarRadiation ?? 18}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {showPrediction && (
        <SectionErrorBoundary sectionName="Panel de predicción">
          <Suspense fallback={null}>
            <PredictionPanel
              municipio={muni?.name ?? ""}
              lat={lat}
              lng={lng}
              crop={crop}
              altitude={computeAltitude(muni?.factor)}
              departamento={SANTANDER.nombre}
              month={month}
              onClose={() => setShowPrediction(false)}
            />
          </Suspense>
        </SectionErrorBoundary>
      )}

      <SectionErrorBoundary sectionName="Chatbot">
        <Suspense fallback={null}>
          <ChatbotPanel municipio={muni?.name ?? ""} crop={cropInfo.label} />
        </Suspense>
      </SectionErrorBoundary>
      <OfflineIndicator />
    </div>
  );
}
