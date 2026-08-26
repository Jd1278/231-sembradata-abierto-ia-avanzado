import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAnalysis,
  getAnalysisHistory,
  deleteAnalysis,
} from "../../src/services/analysis-history";

describe("FASE 4: Eliminación Total del Modo Offline", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("no debe almacenar ni consultar registros en localStorage bajo nenhuma circunstancia", async () => {
    const mockViability = {
      score: 85,
      viable: true,
      recommendations: ["Control de sombra"],
      confidence: 0.9,
      pestRisk: { level: "Bajo" },
    };

    // Attempt save
    await saveAnalysis(
      "San Gil",
      "Santander",
      "cacao",
      6.55,
      -73.13,
      mockViability as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    // Verify localStorage has zero keys
    expect(localStorage.getItem("sembraData:analysisHistory")).toBeNull();
    expect(localStorage.length).toBe(0);

    // Attempt fetch
    const history = await getAnalysisHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(localStorage.getItem("sembraData:analysisHistory")).toBeNull();

    // Attempt delete
    await deleteAnalysis("test-id");
    expect(localStorage.getItem("sembraData:analysisHistory")).toBeNull();
  });
});
