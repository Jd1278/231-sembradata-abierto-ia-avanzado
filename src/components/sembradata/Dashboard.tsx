import { useMemo, useState } from "react";
import {
  Sprout,
  MapPin,
  Droplets,
  Thermometer,
  TrendingUp,
  ShieldAlert,
  Leaf,
  Coffee,
  Cherry,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ChatbotPanel } from "./ChatbotPanel";
import { MUNICIPIOS, CROP_DATA, type CropKey } from "./data";

const CROPS: { key: CropKey; label: string; icon: typeof Leaf }[] = [
  { key: "cacao", label: "Cacao", icon: Cherry },
  { key: "cafe", label: "Café", icon: Coffee },
  { key: "granadilla", label: "Granadilla", icon: Leaf },
];

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function Dashboard() {
  const [crop, setCrop] = useState<CropKey>("cacao");
  const [municipio, setMunicipio] = useState<string>(
    MUNICIPIOS.find((m) => /vicente/i.test(m.name))?.name ?? MUNICIPIOS[0].name,
  );
  const [year, setYear] = useState<string>("2026");
  const [month, setMonth] = useState<string>("Mar");

  const cropInfo = CROP_DATA[crop];
  const muni = useMemo(
    () => MUNICIPIOS.find((m) => m.name === municipio) ?? MUNICIPIOS[0],
    [municipio],
  );

  const metrics = useMemo(() => {
    const base = cropInfo.baseYield * muni.factor;
    return {
      yield: base.toFixed(2),
      risk: muni.risk[crop],
      precip: Math.round(80 + muni.factor * 90),
      temp: (22 + (1 - muni.factor) * 4).toFixed(1),
    };
  }, [cropInfo, muni, crop]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <Sprout className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">SembraData</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Predicción agroclimática para Santander
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
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FilterBlock label="Municipio" icon={<MapPin className="h-4 w-4" />}>
                  <Select value={municipio} onValueChange={setMunicipio}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUNICIPIOS.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterBlock>

                <div className="grid grid-cols-2 gap-3">
                  <FilterBlock label="Año">
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["2024", "2025", "2026", "2027"].map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
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
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterBlock>
                </div>

                <div className="rounded-xl border border-dashed border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Cultivo activo</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {cropInfo.label}
                  </p>
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
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Ventana óptima de siembra para <b>{cropInfo.label}</b> en {muni.name}:{" "}
                  <b>{cropInfo.window}</b>.
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Rendimiento estimado"
                value={metrics.yield}
                unit="Ton/Ha"
                trend="+8.4%"
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
                trend="+0.6°C"
                icon={<Thermometer className="h-5 w-5" />}
                tone="earth"
              />
            </div>

            {/* Map */}
            <Card className="overflow-hidden rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Mapa de Santander
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Riesgo agroclimático para {cropInfo.label} · {month} {year}
                  </p>
                </div>
                <MapLegend />
              </CardHeader>
              <CardContent>
                <SantanderMap
                  crop={crop}
                  selected={muni.name}
                  onSelect={setMunicipio}
                />
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className="rounded-2xl xl:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Histórico vs. Predicción
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Rendimiento (Ton/Ha) — {cropInfo.label} en {muni.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <YieldChart crop={crop} factor={muni.factor} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Riesgo climático por mes
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Sequía, heladas y plagas
                  </p>
                </CardHeader>
                <CardContent>
                  <RiskChart factor={muni.factor} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ChatbotPanel municipio={muni.name} crop={cropInfo.label} />
    </div>
  );
}

function FilterBlock({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function KpiCard({
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
  icon: React.ReactNode;
  tone: "primary" | "sky" | "earth";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky/15 text-sky-foreground",
    earth: "bg-earth/20 text-earth-foreground",
  };
  return (
    <Card className="rounded-2xl transition-all hover:shadow-md">
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

function RiskKpiCard({ risk }: { risk: "Bajo" | "Medio" | "Alto" }) {
  const map = {
    Bajo: { bg: "bg-risk-low/15", dot: "bg-risk-low", text: "text-risk-low" },
    Medio: { bg: "bg-risk-med/20", dot: "bg-risk-med", text: "text-risk-med" },
    Alto: { bg: "bg-risk-high/15", dot: "bg-risk-high", text: "text-risk-high" },
  }[risk];
  return (
    <Card className="rounded-2xl transition-all hover:shadow-md">
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
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          Riesgo agroclimático
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={cn("text-2xl font-bold tracking-tight", map.text)}>{risk}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MapLegend() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-[11px]">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-low" /> Bajo
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-med" /> Medio
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-risk-high" /> Alto
      </span>
    </div>
  );
}
