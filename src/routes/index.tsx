import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Dashboard = lazy(() =>
  import("@/components/sembradata/Dashboard").then((m) => ({ default: m.Dashboard })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SembraData — Predicción Agroclimática para Santander" },
      {
        name: "description",
        content:
          "Plataforma de predicción agroclimática para el departamento de Santander, Colombia. Analiza rendimiento, riesgo y clima para cacao, café y granadilla.",
      },
      { property: "og:title", content: "SembraData — Predicción Agroclimática para Santander" },
      {
        property: "og:description",
        content:
          "Analiza rendimiento, riesgo y clima para cacao, café y granadilla en Santander, Colombia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Cargando SembraData...</p>
          </div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
