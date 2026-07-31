import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FactorDetail, PestRisk } from "@/types/prediction-v2";

interface Props {
  viable: boolean;
  score: number;
  factors: FactorDetail[];
  pestRisk?: PestRisk;
  seasonalNote?: string;
  confidence?: number;
}

export function ViabilitySection({
  viable,
  score,
  factors,
  pestRisk,
  seasonalNote,
  confidence,
}: Props) {
  const favorable = factors.filter((f) => f.status === "favorable");
  const unfavorable = factors.filter((f) => f.status === "unfavorable");
  const neutral = factors.filter((f) => f.status === "neutral");

  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Resultado de Viabilidad</CardTitle>
          <div className="flex items-center gap-2">
            {confidence !== undefined && (
              <Badge variant="secondary" className="text-[10px]">
                Confianza: {confidence}%
              </Badge>
            )}
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold",
                viable ? "bg-risk-low/15 text-risk-low" : "bg-risk-high/15 text-risk-high",
              )}
            >
              <span
                className={cn("h-2 w-2 rounded-full", viable ? "bg-risk-low" : "bg-risk-high")}
              />
              {viable ? "VIABLE" : "NO VIABLE"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Puntuación compuesta</span>
            <span className="font-bold text-foreground">{score}/100</span>
          </div>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                score >= 70 ? "bg-risk-low" : score >= 40 ? "bg-risk-med" : "bg-risk-high",
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-risk-low/10 p-2 text-center">
            <p className="text-lg font-bold text-risk-low">{favorable.length}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Favorables</p>
          </div>
          <div className="rounded-xl bg-risk-med/10 p-2 text-center">
            <p className="text-lg font-bold text-risk-med">{neutral.length}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Neutros</p>
          </div>
          <div className="rounded-xl bg-risk-high/10 p-2 text-center">
            <p className="text-lg font-bold text-risk-high">{unfavorable.length}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Desfavorables</p>
          </div>
        </div>

        {/* Seasonal note */}
        {seasonalNote && (
          <div className="rounded-xl border border-sky/30 bg-sky/5 p-3 text-xs text-foreground">
            📅 {seasonalNote}
          </div>
        )}

        {/* Pest risk */}
        {pestRisk && pestRisk.factors.length > 0 && (
          <div
            className={cn(
              "rounded-xl border p-3 text-xs",
              pestRisk.level === "Alto"
                ? "border-risk-high/30 bg-risk-high/5"
                : pestRisk.level === "Medio"
                  ? "border-risk-med/30 bg-risk-med/5"
                  : "border-risk-low/30 bg-risk-low/5",
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              🐛 Riesgo de plagas:{" "}
              <Badge
                variant={pestRisk.level === "Alto" ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {pestRisk.level}
              </Badge>
            </div>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {pestRisk.factors.map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Factor details */}
        <div className="space-y-2">
          {factors.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-xs",
                f.status === "favorable"
                  ? "border-risk-low/30 bg-risk-low/5"
                  : f.status === "unfavorable"
                    ? "border-risk-high/30 bg-risk-high/5"
                    : "border-border bg-muted/30",
              )}
            >
              <div className="mt-0.5">
                <span
                  className={cn(
                    "block h-2 w-2 rounded-full",
                    f.status === "favorable"
                      ? "bg-risk-low"
                      : f.status === "unfavorable"
                        ? "bg-risk-high"
                        : "bg-muted-foreground",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{f.variable}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{f.value}</span>
                    <Badge variant="outline" className="text-[9px] px-1">
                      ×{f.weight}
                    </Badge>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                  {f.explanation}
                </p>
                {/* Contribution bar */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      f.status === "favorable"
                        ? "bg-risk-low"
                        : f.status === "unfavorable"
                          ? "bg-risk-high"
                          : "bg-muted-foreground/50",
                    )}
                    style={{ width: `${Math.min(100, (f.contribution / f.weight) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
