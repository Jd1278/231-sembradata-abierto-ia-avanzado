import { describe, it, expect } from "vitest";
import { RiskKpiCard } from "../../src/components/sembradata/dashboard/RiskKpiCard";
import { setup } from "./test-utils";

describe("RiskKpiCard", () => {
  it("renderiza riesgo Bajo con clase bg-risk-low", () => {
    const { container } = setup(<RiskKpiCard risk="Bajo" />);
    expect(container.querySelector("[data-testid='risk-kpi-card']")).toBeInTheDocument();
    expect(container.querySelector(".bg-risk-low\\/15")).toBeInTheDocument();
  });

  it("renderiza riesgo Medio con clase bg-risk-med", () => {
    const { container } = setup(<RiskKpiCard risk="Medio" />);
    expect(container.querySelector(".bg-risk-med\\/20")).toBeInTheDocument();
  });

  it("renderiza riesgo Alto con clase bg-risk-high", () => {
    const { container } = setup(<RiskKpiCard risk="Alto" />);
    expect(container.querySelector(".bg-risk-high\\/15")).toBeInTheDocument();
  });

  it("renderiza el texto BAJO en mayúsculas", () => {
    const { getByText } = setup(<RiskKpiCard risk="Bajo" />);
    expect(getByText("BAJO")).toBeInTheDocument();
  });

  it("renderiza el texto MEDIO en mayúsculas", () => {
    const { getByText } = setup(<RiskKpiCard risk="Medio" />);
    expect(getByText("MEDIO")).toBeInTheDocument();
  });

  it("renderiza el texto ALTO en mayúsculas", () => {
    const { getByText } = setup(<RiskKpiCard risk="Alto" />);
    expect(getByText("ALTO")).toBeInTheDocument();
  });

  it("renderiza el label Riesgo agroclimático siempre", () => {
    const { getByText } = setup(<RiskKpiCard risk="Bajo" />);
    expect(getByText("Riesgo agroclimático")).toBeInTheDocument();
  });

  it("tiene un ShieldAlert icon en el contenedor", () => {
    const { container } = setup(<RiskKpiCard risk="Alto" />);
    const shieldIcon = container.querySelector(".lucide-shield-alert");
    expect(shieldIcon).toBeInTheDocument();
  });
});
