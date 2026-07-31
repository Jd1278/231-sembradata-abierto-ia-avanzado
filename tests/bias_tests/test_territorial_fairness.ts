import { describe, it, expect } from "vitest";
import { MUNICIPIO_FEATURES } from "../../src/components/sembradata/municipios";

describe("Territorial Fairness", () => {
  it("should not systematically assign high risk to small municipalities", () => {
    if (MUNICIPIO_FEATURES.length === 0) return;

    const sorted = [...MUNICIPIO_FEATURES].sort((a, b) => a.area - b.area);
    const mid = Math.floor(sorted.length / 2);
    const small = sorted.slice(0, mid);
    const large = sorted.slice(mid);

    const smallHighRisk = small.filter((m) => m.risk.cacao === "Alto").length / small.length;
    const largeHighRisk = large.filter((m) => m.risk.cacao === "Alto").length / large.length;

    expect(Math.abs(smallHighRisk - largeHighRisk)).toBeLessThan(0.5);
  });

  it("should not systematically assign low risk to large municipalities", () => {
    if (MUNICIPIO_FEATURES.length === 0) return;

    const sorted = [...MUNICIPIO_FEATURES].sort((a, b) => b.area - a.area);
    const large = sorted.slice(0, Math.ceil(sorted.length / 3));

    const lowRiskRatio = large.filter((m) => m.risk.cafe === "Bajo").length / large.length;

    expect(lowRiskRatio).toBeLessThan(0.9);
  });

  it("risk distribution should be balanced across all municipalities", () => {
    const risks = { Bajo: 0, Medio: 0, Alto: 0 };
    for (const m of MUNICIPIO_FEATURES) {
      risks[m.risk.cacao]++;
    }
    const total = MUNICIPIO_FEATURES.length;
    expect(risks.Bajo / total).toBeGreaterThan(0.1);
    expect(risks.Medio / total).toBeGreaterThan(0.1);
    expect(risks.Alto / total).toBeGreaterThan(0.05);
  });
});
