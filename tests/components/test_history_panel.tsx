import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HistoryPanel } from "../../src/components/sembradata/HistoryPanel";
import { setup } from "./test-utils";

const { getAnalysisHistory, deleteAnalysis } = vi.hoisted(() => ({
  getAnalysisHistory: vi.fn<() => Promise<Record<string, unknown>[]>>(),
  deleteAnalysis: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("../../src/services/analysis-history", () => ({
  getAnalysisHistory,
  deleteAnalysis,
}));

const mockRecords = [
  {
    id: "1",
    municipio: "San Vicente de Chucurí",
    departamento: "Santander",
    cultivo: "cacao",
    lat: 6.82,
    lng: -73.41,
    score: 85,
    viable: true,
    recommendations: ["Buena época"],
    confidence: 0.9,
    pestRiskLevel: "bajo",
    created_at: "2026-07-30T00:00:00.000Z",
  },
];

describe("HistoryPanel", () => {
  beforeEach(() => {
    getAnalysisHistory.mockResolvedValue(mockRecords);
    deleteAnalysis.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tiene un botón de historial", () => {
    const { getByLabelText } = setup(<HistoryPanel />);
    expect(getByLabelText("Historial de Análisis")).toBeInTheDocument();
  });

  it("abre el diálogo al hacer clic", async () => {
    const { getByLabelText, getByText, user } = setup(<HistoryPanel />);
    await user.click(getByLabelText("Historial de Análisis"));
    expect(getByText("Historial de Análisis")).toBeInTheDocument();
  });

  it("muestra registros del mock", async () => {
    const { getByLabelText, getByText, user } = setup(<HistoryPanel />);
    await user.click(getByLabelText("Historial de Análisis"));
    expect(getByText("San Vicente de Chucurí")).toBeInTheDocument();
    expect(getByText("85/100")).toBeInTheDocument();
  });

  it("muestra mensaje vacío cuando no hay registros", async () => {
    getAnalysisHistory.mockResolvedValue([]);
    const { getByLabelText, getByText, user } = setup(<HistoryPanel />);
    await user.click(getByLabelText("Historial de Análisis"));
    expect(getByText("Aún no has realizado ningún análisis.")).toBeInTheDocument();
  });

  it("cierra el diálogo con Escape", async () => {
    const { getByLabelText, queryByText, user } = setup(<HistoryPanel />);
    await user.click(getByLabelText("Historial de Análisis"));
    expect(queryByText("Historial de Análisis")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(queryByText("Historial de Análisis")).not.toBeInTheDocument();
  });
});
