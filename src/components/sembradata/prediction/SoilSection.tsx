import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SoilData } from "@/services/soil-service";
import type { CropKey } from "@/types/crops";

const PH_RANGES: Record<CropKey, [number, number]> = {
  cacao: [5.5, 7.0],
  cafe: [5.0, 6.5],
  granadilla: [5.5, 6.5],
};

interface Props {
  soil: SoilData;
  crop?: CropKey;
}

export function SoilSection({ soil, crop }: Props) {
  const phRange = crop ? PH_RANGES[crop] : [5.5, 7.0];
  const phStatus = soil.ph >= phRange[0] && soil.ph <= phRange[1] ? "favorable" : "unfavorable";
  const omStatus = soil.organicMatter >= 2.5 ? "favorable" : "unfavorable";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Condiciones del Suelo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <SoilMetric
            label="pH"
            value={soil.ph.toFixed(1)}
            status={phStatus}
            detail={soil.ph >= 5.5 && soil.ph <= 7.0 ? "Óptimo" : "Requiere corrección"}
          />
          <SoilMetric
            label="Materia orgánica"
            value={`${soil.organicMatter}%`}
            status={omStatus}
            detail={soil.organicMatter >= 3 ? "Alta" : soil.organicMatter >= 2 ? "Media" : "Baja"}
          />
          <SoilMetric
            label="Textura"
            value={soil.texture}
            status="neutral"
            detail={`${soil.clay}% arcilla`}
          />
          <SoilMetric label="Drenaje" value={soil.drainage} status="neutral" detail="" />
          <SoilMetric
            label="Fertilidad"
            value={soil.fertility}
            status={
              soil.fertility === "Alta"
                ? "favorable"
                : soil.fertility === "Baja"
                  ? "unfavorable"
                  : "neutral"
            }
            detail=""
          />
          <SoilMetric
            label="Riesgo de erosión"
            value={soil.erosionRisk}
            status={
              soil.erosionRisk === "Baja"
                ? "favorable"
                : soil.erosionRisk === "Alta"
                  ? "unfavorable"
                  : "neutral"
            }
            detail=""
          />
        </div>

        {/* Soil composition bar */}
        <div>
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Composición del suelo
          </p>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted text-[8px] font-bold text-white">
            <div
              className="bg-amber-600 flex items-center justify-center"
              style={{ width: `${soil.sand}%` }}
              title={`Arena: ${soil.sand}%`}
            >
              {soil.sand > 20 ? `A ${soil.sand.toFixed(0)}%` : ""}
            </div>
            <div
              className="bg-amber-800 flex items-center justify-center"
              style={{ width: `${soil.silt}%` }}
              title={`Limo: ${soil.silt}%`}
            >
              {soil.silt > 20 ? `L ${soil.silt.toFixed(0)}%` : ""}
            </div>
            <div
              className="bg-red-800 flex items-center justify-center"
              style={{ width: `${soil.clay}%` }}
              title={`Arcilla: ${soil.clay}%`}
            >
              {soil.clay > 15 ? `Ar ${soil.clay.toFixed(0)}%` : ""}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
            <span>Arena</span>
            <span>Limo</span>
            <span>Arcilla</span>
          </div>
        </div>

        {phStatus === "unfavorable" && (
          <div className="rounded-xl bg-risk-high/10 border border-risk-high/20 p-3">
            <p className="text-[10px] font-semibold text-risk-high">Recomendación de pH</p>
            <p className="mt-1 text-xs text-foreground">
              {soil.ph < phRange[0]
                ? `El pH actual (${soil.ph.toFixed(1)}) está por debajo del rango óptimo (${phRange[0]}-${phRange[1]}). Se recomienda aplicar cal dolomita para elevar el pH del suelo.`
                : `El pH actual (${soil.ph.toFixed(1)}) está por encima del rango óptimo (${phRange[0]}-${phRange[1]}). Se recomienda aplicar azufre elemental o materia orgánica ácida para reducir el pH.`}
            </p>
          </div>
        )}

        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-[10px] font-medium text-muted-foreground">
            Carbono orgánico del suelo
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{soil.carbonStock} t C/ha</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SoilMetric({
  label,
  value,
  status,
  detail,
}: {
  label: string;
  value: string;
  status: "favorable" | "unfavorable" | "neutral";
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "favorable"
              ? "bg-risk-low"
              : status === "unfavorable"
                ? "bg-risk-high"
                : "bg-muted-foreground",
          )}
        />
        <span className="text-xs font-bold text-foreground">{value}</span>
      </div>
      {detail && <p className="mt-0.5 text-[9px] text-muted-foreground">{detail}</p>}
    </div>
  );
}
