import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlternativeCrop } from "@/types/prediction-v2";

interface Props {
  recommendations: string[];
  alternatives: AlternativeCrop[];
}

export function RecommendationsSection({ recommendations, alternatives }: Props) {
  return (
    <>
      {/* Recommendations */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Alternative crops */}
      {alternatives.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Cultivos Alternativos</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Cultivos recomendados para esta zona
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {alternatives.map((alt, i) => (
              <div
                key={i}
                className="rounded-xl border border-border p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{alt.name}</p>
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {alt.bestSeason}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {alt.reason}
                </p>
                <p className="mt-1 text-[10px] font-medium text-foreground">
                  Rendimiento estimado: {alt.estimatedYield}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
