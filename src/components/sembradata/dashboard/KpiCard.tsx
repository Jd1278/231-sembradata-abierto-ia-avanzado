import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  trend,
  icon,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  trend: string;
  icon: ReactNode;
  tone: "primary" | "sky" | "earth";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky/15 text-sky-foreground",
    earth: "bg-earth/20 text-earth-foreground",
  };
  return (
    <Card className="rounded-2xl transition-all hover:shadow-md" data-testid="kpi-card">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl", toneMap[tone])}>
            {icon}
          </div>
          <Badge variant="secondary" className="rounded-lg text-[10px] font-medium">
            {trend}
          </Badge>
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
