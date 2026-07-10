import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  factor: number;
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function RiskChart({ factor }: Props) {
  const data = MONTHS.map((m, i) => {
    const seasonal = Math.sin((i / 12) * Math.PI * 2);
    return {
      mes: m,
      Sequía: Math.max(5, Math.round(40 + seasonal * 25 - factor * 10)),
      Heladas: Math.max(2, Math.round(15 - seasonal * 10)),
      Plagas: Math.max(10, Math.round(35 + Math.cos((i / 12) * Math.PI * 2) * 20)),
    };
  });

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="Sequía" stackId="a" fill="var(--risk-high)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Heladas" stackId="a" fill="var(--sky)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Plagas" stackId="a" fill="var(--risk-med)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
