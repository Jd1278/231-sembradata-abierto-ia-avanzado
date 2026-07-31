import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CROP_DATA } from "@/components/sembradata/data";
import type { CropKey } from "@/types/crops";
import { fetchCurrentClimate, type ClimateData } from "@/services/climate-api";
import { fetchSoilData, type SoilData } from "@/services/soil-service";
import { evaluateViability, type ViabilityResult } from "@/types/prediction-v2";
import { MONTH_LABELS } from "@/services/temporal-optimizer";
import { SoilSection } from "./prediction/SoilSection";
import { ClimateSection } from "./prediction/ClimateSection";
import { ViabilitySection } from "./prediction/ViabilitySection";
import { RecommendationsSection } from "./prediction/RecommendationsSection";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { saveAnalysis } from "@/services/analysis-history";

import { getOptimalPastDays } from "../../services/temporal-optimizer";

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
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [viability, setViability] = useState<ViabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      try {
        // Fetch elevation from Open-Meteo
        const elevRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        ).catch(() => null);
        const elevData = elevRes ? await elevRes.json() : null;
        const elev = elevData?.elevation?.[0] ?? altitude;

        // Fetch soil and climate data in parallel
        const pastDays = getOptimalPastDays(crop);
        const [soilData, climateData] = await Promise.all([
          fetchSoilData(lat, lng),
          fetchCurrentClimate(lat, lng, pastDays),
        ]);

        if (cancelled) return;

        setSoil(soilData);
        setClimate(climateData);

        const monthIndex = month ? MONTH_LABELS.indexOf(month) : -1;
        const currentMonth = monthIndex >= 0 ? monthIndex + 1 : new Date().getMonth() + 1;

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
          elev,
          currentMonth,
          !!climateData && !!soilData,
        );

        if (!cancelled) setViability(v);

        saveAnalysis(municipio, departamento ?? "", crop, lat, lng, v).catch(() => {});
      } catch (err) {
        console.warn("PredictionPanel load error:", err);
        if (!cancelled) setError("Error al cargar datos de predicción");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, crop, altitude, municipio, departamento, month]);

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
        ) : error ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Verifica tu conexión a internet e intenta de nuevo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div aria-live="polite">
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
                      forecastTemps={climate.dailyData.map((d) => ({
                        max: d.tempMax,
                        min: d.tempMin,
                      }))}
                      forecastPrecip={climate.dailyData.map((d) => d.precip)}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              )}
              {soil && (
                <SectionErrorBoundary sectionName="Propiedades del suelo">
                  <SoilSection soil={soil} crop={crop} />
                </SectionErrorBoundary>
              )}
              <SectionErrorBoundary sectionName="Estación IDEAM">
                <Suspense fallback={<SectionLoader />}>
                  <IdeamStationSection lat={lat} lng={lng} departamento={departamento} />
                </Suspense>
              </SectionErrorBoundary>
              <SectionErrorBoundary sectionName="NDVI — Vegetación">
                <Suspense fallback={<SectionLoader />}>
                  <NdviSection lat={lat} lng={lng} />
                </Suspense>
              </SectionErrorBoundary>
              {viability && (
                <SectionErrorBoundary sectionName="Recomendaciones">
                  <RecommendationsSection
                    recommendations={viability.recommendations}
                    alternatives={viability.alternatives}
                  />
                </SectionErrorBoundary>
              )}
              <SectionErrorBoundary sectionName="Precios internacionales">
                <Suspense fallback={<SectionLoader />}>
                  <CommoditySection activeCrop={crop} />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
