import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CROP_DATA, type CropKey } from "./data";

interface Props {
  crop: CropKey;
  factor: number;
}

export function YieldChart({ crop, factor }: Props) {
  const base = CROP_DATA[crop].baseYield * factor;
  const data = [
    { year: "2020", hist: base * 0.82, pred: null },
    { year: "2021", hist: base * 0.88, pred: null },
    { year: "2022", hist: base * 0.91, pred: null },
    { year: "2023", hist: base * 0.95, pred: null },
    { year: "2024", hist: base * 0.98, pred: base * 0.98 },
    { year: "2025", hist: null, pred: base * 1.02 },
    { year: "2026", hist: null, pred: base * 1.08 },
    { year: "2027", hist: null, pred: base * 1.12 },
  ];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--sky)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number) => (v == null ? "—" : `${v.toFixed(2)} t/ha`)}
          />
          <Area
            type="monotone"
            dataKey="hist"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#histFill)"
            name="Histórico"
          />
          <Area
            type="monotone"
            dataKey="pred"
            stroke="var(--sky)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            fill="url(#predFill)"
            name="Predicción"
          />
          <Line type="monotone" dataKey="pred" stroke="var(--sky)" dot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-primary" /> Histórico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-sky" /> Predicción
        </span>
      </div>
    </div>
  );
}
