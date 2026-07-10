import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/sembradata/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SembraData — Predicción agroclimática para Santander" },
      {
        name: "description",
        content:
          "Plataforma de predicción agroclimática para cultivos de cacao, café y granadilla en el departamento de Santander, Colombia.",
      },
      { property: "og:title", content: "SembraData — Predicción agroclimática" },
      {
        property: "og:description",
        content: "Rendimiento, riesgo y clima por municipio de Santander.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Dashboard />;
}
