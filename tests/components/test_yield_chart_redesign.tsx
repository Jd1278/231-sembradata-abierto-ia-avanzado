import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { YieldChart } from "../../src/components/sembradata/YieldChart";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as histService from "../../src/services/historical-prediction-service";
import type { SeriesQueryResult } from "../../src/types/historical-prediction";

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
}

describe("YieldChart Redesign Component Integration Tests", () => {
  it("renders solid historical points, dashed prediction line and transition marker", async () => {
    const mockResult: SeriesQueryResult = {
      municipalityId: "bucaramanga",
      municipalityName: "Bucaramanga",
      cropId: "cafe",
      lastObservedYear: 2023,
      status: "ready",
      historicalObservations: [
        {
          id: "1",
          year: 2020,
          date: "2020",
          yieldTonHa: 1.2,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
        {
          id: "2",
          year: 2021,
          date: "2021",
          yieldTonHa: 1.25,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
        {
          id: "3",
          year: 2022,
          date: "2022",
          yieldTonHa: 1.28,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
        {
          id: "4",
          year: 2023,
          date: "2023",
          yieldTonHa: 1.32,
          source: "Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura)",
          municipalityId: "bucaramanga",
          municipalityName: "Bucaramanga",
          cropId: "cafe",
          qualityScore: 0.95,
          isHistorical: true,
        },
      ],
      predictions: [
        {
          year: 2024,
          date: "2024",
          predictedYield: 1.35,
          lowerBound80: 1.22,
          upperBound80: 1.48,
          lowerBound95: 1.15,
          upperBound95: 1.55,
          modelName: "Theil-Sen Robust Trend",
          modelVersion: "2.6.0-stat",
          sampleSize: 4,
          validationMetrics: {
            mae: 0.02,
            rmse: 0.03,
            smape: 2.1,
            sampleSize: 4,
            selectedModel: "Theil-Sen",
          },
          bioclimaticScore: 0.85,
          featuresSnapshot: {
            altitude: 959,
            temperatureMean: 22,
            precipitationAnnual: 1700,
            humidityMean: 78,
            et0Annual: 1250,
            waterBalance: 450,
            historicalMedian: 1.26,
            trendSlope: 0.04,
          },
          isHistorical: false,
        },
      ],
      points: [
        {
          date: "2020",
          year: 2020,
          historicalValue: 1.2,
          predictedValue: null,
          lowerBound80: null,
          upperBound80: null,
          lowerBound95: null,
          upperBound95: null,
          lowerBound: null,
          upperBound: null,
          dataType: "historical",
          source: "EVA",
          confidence: 0.95,
          municipalityId: "bucaramanga",
          cropId: "cafe",
          variable: "yield",
          unit: "Ton/Ha",
        },
        {
          date: "2023",
          year: 2023,
          historicalValue: 1.32,
          predictedValue: null,
          lowerBound80: null,
          upperBound80: null,
          lowerBound95: null,
          upperBound95: null,
          lowerBound: null,
          upperBound: null,
          dataType: "historical",
          source: "EVA",
          confidence: 0.95,
          municipalityId: "bucaramanga",
          cropId: "cafe",
          variable: "yield",
          unit: "Ton/Ha",
        },
        {
          date: "2024",
          year: 2024,
          historicalValue: null,
          predictedValue: 1.35,
          lowerBound80: 1.22,
          upperBound80: 1.48,
          lowerBound95: 1.15,
          upperBound95: 1.55,
          lowerBound: 1.22,
          upperBound: 1.48,
          dataType: "prediction",
          source: "Modelo Estadístico",
          confidence: 0.92,
          municipalityId: "bucaramanga",
          cropId: "cafe",
          variable: "yield",
          unit: "Ton/Ha",
          modelName: "Theil-Sen Robust Trend",
        },
      ],
      geminiAssessment: {
        consistencyStatus: "valid",
        adjustmentRecommendation: "none",
        explanation:
          "El pronóstico es plenamente coherente con la aptitud agroclimática de la zona.",
        riskFactors: ["Posible ola de calor leve"],
        dataQualityNotes: [],
      },
    };

    vi.spyOn(histService, "fetchHistoricalAndPredictionDetails").mockResolvedValue(mockResult);

    renderWithClient(<YieldChart crop="cafe" municipio="Bucaramanga" />);

    await waitFor(() => {
      expect(screen.getByText("Inicio Pronóstico (2023)")).toBeInTheDocument();
      expect(screen.getByText("Histórico EVA (2 años)")).toBeInTheDocument();
      expect(screen.getByText("Predicción Estadística")).toBeInTheDocument();
      expect(screen.getByText(/Evaluación Agronómica IA/i)).toBeInTheDocument();
      expect(screen.getByText(/El pronóstico es plenamente coherente/i)).toBeInTheDocument();
    });
  });

  it("displays explicit insufficient data alert when N < 3 without fabricating forecast points", async () => {
    const insufficientResult: SeriesQueryResult = {
      municipalityId: "curiti",
      municipalityName: "Curití",
      cropId: "granadilla",
      lastObservedYear: 2024,
      status: "insufficient_data",
      historicalObservations: [
        {
          id: "1",
          year: 2024,
          date: "2024",
          yieldTonHa: 8.5,
          source: "EVA",
          municipalityId: "curiti",
          municipalityName: "Curití",
          cropId: "granadilla",
          qualityScore: 0.95,
          isHistorical: true,
        },
      ],
      predictions: [],
      points: [
        {
          date: "2024",
          year: 2024,
          historicalValue: 8.5,
          predictedValue: null,
          lowerBound80: null,
          upperBound80: null,
          lowerBound95: null,
          upperBound95: null,
          lowerBound: null,
          upperBound: null,
          dataType: "historical",
          source: "EVA",
          confidence: 0.95,
          municipalityId: "curiti",
          cropId: "granadilla",
          variable: "yield",
          unit: "Ton/Ha",
        },
      ],
      geminiAssessment: null,
      insufficientDataReason:
        "Se identificaron solo 1 observaciones históricas validadas de EVA. Se requiere un mínimo de 3 años.",
    };

    vi.spyOn(histService, "fetchHistoricalAndPredictionDetails").mockResolvedValue(
      insufficientResult,
    );

    renderWithClient(<YieldChart crop="granadilla" municipio="Curití" />);

    await waitFor(() => {
      expect(screen.getByText("Muestreo histórico insuficiente")).toBeInTheDocument();
      expect(screen.getByText(/Se identificaron solo 1 observaciones/i)).toBeInTheDocument();
      // Prediction legend should NOT be shown
      expect(screen.queryByText("Predicción Estadística")).not.toBeInTheDocument();
    });
  });
});
