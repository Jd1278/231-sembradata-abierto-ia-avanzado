import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RiskLevel = "Bajo" | "Medio" | "Alto";

export function RiskKpiCard({ risk }: { risk: RiskLevel }) {
  const map = {
    Bajo: { bg: "bg-risk-low/15", dot: "bg-risk-low", text: "text-risk-low" },
    Medio: { bg: "bg-risk-med/20", dot: "bg-risk-med", text: "text-risk-med" },
    Alto: { bg: "bg-risk-high/15", dot: "bg-risk-high", text: "text-risk-high" },
  }[risk];
  return (
    <Card className="rounded-2xl transition-all hover:shadow-md" data-testid="risk-kpi-card">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl", map.bg)}>
            <ShieldAlert className={cn("h-5 w-5", map.text)} />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold",
              map.bg,
              map.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", map.dot)} />
            {risk.toUpperCase()}
          </span>
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Riesgo agroclimático</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={cn("text-2xl font-bold tracking-tight", map.text)}>{risk}</span>
        </div>
      </CardContent>
    </Card>
  );
}
