import { describe, it, expect } from "vitest";
import { TrendingUp, Droplets, Thermometer } from "lucide-react";
import { KpiCard } from "../../src/components/sembradata/dashboard/KpiCard";
import { setup } from "./test-utils";

describe("KpiCard", () => {
  it("renderiza label, valor y unidad", () => {
    const { getByText } = setup(
      <KpiCard
        label="Rendimiento estimado"
        value="1.85"
        unit="Ton/Ha"
        trend="Normal"
        icon={<TrendingUp className="h-5 w-5" />}
        tone="primary"
      />,
    );
    expect(getByText("Rendimiento estimado")).toBeInTheDocument();
    expect(getByText("1.85")).toBeInTheDocument();
    expect(getByText("Ton/Ha")).toBeInTheDocument();
  });

  it("renderiza el badge con trend", () => {
    const { getByText } = setup(
      <KpiCard
        label="Precipitación"
        value="120"
        unit="mm"
        trend="Alta"
        icon={<Droplets className="h-5 w-5" />}
        tone="sky"
      />,
    );
    expect(getByText("Alta")).toBeInTheDocument();
  });

  it("aplica la variante de color sky", () => {
    const { container } = setup(
      <KpiCard
        label="Precipitación"
        value="80"
        unit="mm"
        trend="Normal"
        icon={<Droplets className="h-5 w-5" />}
        tone="sky"
      />,
    );
    const iconContainer = container.querySelector(".grid.h-10.w-10");
    expect(iconContainer).toHaveClass("bg-sky/15");
  });

  it("aplica la variante de color earth", () => {
    const { container } = setup(
      <KpiCard
        label="Temperatura"
        value="22.5"
        unit="°C"
        trend="Real"
        icon={<Thermometer className="h-5 w-5" />}
        tone="earth"
      />,
    );
    const iconContainer = container.querySelector(".grid.h-10.w-10");
    expect(iconContainer).toHaveClass("bg-earth/20");
  });

  it("renderiza datos numéricos con decimales", () => {
    const { getByText } = setup(
      <KpiCard
        label="Rendimiento"
        value="0.00"
        unit="t/ha"
        trend="N/A"
        icon={<TrendingUp className="h-5 w-5" />}
        tone="primary"
      />,
    );
    expect(getByText("0.00")).toBeInTheDocument();
  });

  it("renderiza valores largos sin truncar", () => {
    const { getByText } = setup(
      <KpiCard
        label="Rendimiento acumulado histórico"
        value="12345.67"
        unit="kg/ha"
        trend="Máximo histórico"
        icon={<TrendingUp className="h-5 w-5" />}
        tone="primary"
      />,
    );
    expect(getByText("12345.67")).toBeInTheDocument();
    expect(getByText("Rendimiento acumulado histórico")).toBeInTheDocument();
  });
});
