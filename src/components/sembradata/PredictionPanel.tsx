import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CROP_DATA } from "@/components/sembradata/data";
import type { CropKey } from "@/types/crops";
import { fetchCurrentClimate, type ClimateData } from "@/services/climate-api";
import type { MunicipalityClimateState } from "@/services/climate-state";
import { fetchSoilData, type SoilData } from "@/services/soil-service";
import { evaluateViability, type ViabilityResult } from "@/types/prediction-v2";
import { MONTH_LABELS, getOptimalPastDays } from "@/services/temporal-optimizer";
import { SoilSection } from "./prediction/SoilSection";
import { ClimateSection } from "./prediction/ClimateSection";
import { ViabilitySection } from "./prediction/ViabilitySection";
import { RecommendationsSection } from "./prediction/RecommendationsSection";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { saveAnalysis } from "@/services/analysis-history";

const HistoricalValidation = lazy(() =>
  import("./prediction/HistoricalValidation").then((m) => ({ default: m.HistoricalValidation })),
);
const IdeamStationSection = lazy(() =>
  import("./prediction/IdeamStationSection").then((m) => ({ default: m.IdeamStationSection })),
);
const CommoditySection = lazy(() =>
  import("./prediction/CommoditySection").then((m) => ({ default: m.CommoditySection })),
);
const NdviSection = lazy(() =>
  import("./prediction/NdviSection").then((m) => ({ default: m.NdviSection })),
);

function SectionLoader() {
  return (
    <div className="rounded-2xl border border-border p-4 animate-pulse">
      <div className="h-4 w-40 bg-muted rounded-xl" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-12 bg-muted rounded-xl" />
        <div className="h-12 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

interface Props {
  municipio: string;
  lat: number;
  lng: number;
  crop: CropKey;
  altitude?: number;
  departamento?: string;
  month?: string;
  sharedClimate?: ClimateData | null;
  climateState?: MunicipalityClimateState | null;
  onClose: () => void;
}

export function PredictionPanel({
  municipio,
  lat,
  lng,
  crop,
  altitude = 500,
  departamento,
  month,
  sharedClimate = null,
  climateState = null,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [viability, setViability] = useState<ViabilityResult | null>(null);
  const [climateError, setClimateError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    panel.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panel!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    panel.addEventListener("keydown", handleKeyDown);
    return () => panel.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setClimateError(null);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!cancelled) {
          setClimateError(
            "Se requiere conexión a internet para consultar datos de satélite, suelo y estaciones agroclimáticas.",
          );
          setLoading(false);
        }
        return;
      }

      try {
        const pastDays = getOptimalPastDays(crop);

        // 1. Fetch Elevation, Soil, and Climate in Parallel with Timeouts
        const elevController = new AbortController();
        const elevTimer = setTimeout(() => elevController.abort(), 6000);

        const [elevResSettled, soilResult, climateResult] = await Promise.allSettled([
          fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, {
            signal: elevController.signal,
          }).catch(() => null),
          fetchSoilData(lat, lng),
          sharedClimate ? Promise.resolve(sharedClimate) : fetchCurrentClimate(lat, lng, pastDays),
        ]);
        clearTimeout(elevTimer);

        if (cancelled) return;

        // Resolve Elevation Safely
        let resolvedElev = altitude;
        if (
          elevResSettled.status === "fulfilled" &&
          elevResSettled.value &&
          elevResSettled.value.ok
        ) {
          try {
            const elevJson = await elevResSettled.value.json();
            if (Array.isArray(elevJson?.elevation) && Number.isFinite(elevJson.elevation[0])) {
              resolvedElev = elevJson.elevation[0];
            }
          } catch {
            // fallback to municipal altitude
          }
        }

        const soilData = soilResult.status === "fulfilled" ? soilResult.value : null;
        const climateData = climateResult.status === "fulfilled" ? climateResult.value : null;

        setSoil(soilData);
        setClimate(climateData);

        if (!climateData) {
          if (!cancelled) {
            setClimateError("No se pudieron obtener datos climáticos en tiempo real.");
          }
        } else {
          const monthIndex = month ? MONTH_LABELS.indexOf(month) : -1;
          const currentMonth = monthIndex >= 0 ? monthIndex + 1 : new Date().getMonth() + 1;

          const isSoilMeasured = soilData?.sourceType === "measured";

          const v = evaluateViability(
            crop,
            soilData?.ph ?? 6.5,
            soilData?.organicMatter ?? 3.0,
            soilData?.texture ?? "Franco",
            climateData.temperature,
            climateData.precipitation,
            climateData.humidity,
            climateData.windSpeed,
            climateData.solarRadiation,
            resolvedElev,
            currentMonth,
            isSoilMeasured,
          );

          if (!cancelled) {
            setViability(v);
            saveAnalysis(municipio, departamento ?? "", crop, lat, lng, v).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("[PredictionPanel] Load error:", err);
        if (!cancelled) setClimateError("Error al cargar datos agroclimáticos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, crop, altitude, municipio, departamento, month, sharedClimate, retryCount]);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Panel de predicción"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] border-l border-border bg-background shadow-2xl transition-transform duration-300 sm:w-[420px]"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-sm font-bold text-foreground">Análisis de Viabilidad</h2>
          <p className="text-[11px] text-muted-foreground">
            {municipio} · {CROP_DATA[crop].label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-60px)] overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Analizando condiciones agroclimáticas...
            </p>
          </div>
        ) : (
          <div aria-live="polite" className="space-y-4">
            {/* Viability & Climate Section or Climate Error Card */}
            {climateError ? (
              <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
                <CardContent className="py-6 text-center flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <p className="text-xs font-semibold text-destructive">{climateError}</p>
                  <p className="text-[11px] text-muted-foreground">
                    El cálculo de viabilidad requiere clima en vivo. Las demás secciones continúan
                    disponibles.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setClimateError(null);
                      setRetryCount((c) => c + 1);
                    }}
                    className="mt-1 h-7 rounded-lg text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Reintentar clima
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {viability && (
                  <SectionErrorBoundary sectionName="Evaluación de viabilidad">
                    <ViabilitySection
                      viable={viability.viable}
                      score={viability.score}
                      factors={viability.factors}
                      pestRisk={viability.pestRisk}
                      seasonalNote={viability.seasonalNote}
                      confidence={viability.confidence}
                    />
                    {climateState && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Estado climático del mapa: {climateState.level} ({climateState.score}/100),
                        calculado con la misma serie climática.
                      </p>
                    )}
                  </SectionErrorBoundary>
                )}

                {climate && (
                  <SectionErrorBoundary sectionName="Clima en tiempo real">
                    <ClimateSection climate={climate} />
                  </SectionErrorBoundary>
                )}

                {climate && (
                  <SectionErrorBoundary sectionName="Validación histórica">
                    <Suspense fallback={<SectionLoader />}>
                      <HistoricalValidation
                        lat={lat}
                        lng={lng}
                        crop={crop}
                        forecastDaily={climate.dailyData}
                        forecastTemps={climate.dailyData.map((d) => ({
                          max: d.tempMax,
                          min: d.tempMin,
                        }))}
                        forecastPrecip={climate.dailyData.map((d) => d.precip)}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                )}
              </>
            )}

            {/* Independent Soil Section */}
            {soil && (
              <SectionErrorBoundary sectionName="Propiedades del suelo">
                <SoilSection soil={soil} crop={crop} />
              </SectionErrorBoundary>
            )}

            {/* Independent IDEAM Station Section */}
            <SectionErrorBoundary sectionName="Estación IDEAM">
              <Suspense fallback={<SectionLoader />}>
                <IdeamStationSection lat={lat} lng={lng} departamento={departamento} />
              </Suspense>
            </SectionErrorBoundary>

            {/* Independent NDVI Section */}
            <SectionErrorBoundary sectionName="NDVI — Vegetación">
              <Suspense fallback={<SectionLoader />}>
                <NdviSection lat={lat} lng={lng} />
              </Suspense>
            </SectionErrorBoundary>

            {/* Recommendations Section */}
            {viability && (
              <SectionErrorBoundary sectionName="Recomendaciones">
                <RecommendationsSection
                  recommendations={viability.recommendations}
                  alternatives={viability.alternatives}
                />
              </SectionErrorBoundary>
            )}

            {/* Independent International Commodity Market Section */}
            <SectionErrorBoundary sectionName="Precios internacionales">
              <Suspense fallback={<SectionLoader />}>
                <CommoditySection activeCrop={crop} />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
