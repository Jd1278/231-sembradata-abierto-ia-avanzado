import { describe, it, expect } from "vitest";
import {
  generateStatisticalForecast,
  buildUnifiedSeriesPoints,
  extractClimateFeatures,
} from "../../src/services/forecasting-engine";
import { calculateAgroclimaticYieldPrediction } from "../../src/services/historical-prediction-service";

describe("FASE 3: Integridad de Series Históricas y Pronósticos", () => {
  const mockFeatures = extractClimateFeatures("San Gil", "san_gil", null);

  it("debe retornar 0 puntos de predicción cuando hay menos de 3 observaciones históricas reales", () => {
    // Solo 2 observaciones históricas
    const sparseRecords = [
      { year: 2021, yield: 1.2 },
      { year: 2022, yield: 1.3 },
    ];

    const result = calculateAgroclimaticYieldPrediction({
      municipalityId: "san_gil",
      municipalityName: "San Gil",
      crop: "cacao",
      historicalRecords: sparseRecords,
      features: mockFeatures,
      futureYears: [2025, 2026, 2027],
    });

    // Absolutamente ninguna predicción generada ni observaciones sintéticas agregadas
    expect(result).toHaveLength(0);
  });

  it("debe generar predicciones estadísticas cuando existen 3 o más observaciones reales", () => {
    const validRecords = [
      { year: 2019, yield: 1.1 },
      { year: 2020, yield: 1.25 },
      { year: 2021, yield: 1.3 },
      { year: 2022, yield: 1.35 },
    ];

    const forecast = generateStatisticalForecast({
      municipalityId: "rionegro",
      municipalityName: "Rionegro",
      crop: "cacao",
      historicalRecords: validRecords,
      features: mockFeatures,
      targetYears: [2024, 2025, 2026],
    });

    expect(forecast.status).toBe("ready");
    expect(forecast.predictions.length).toBeGreaterThan(0);

    for (const p of forecast.predictions) {
      // Verificación de intervalo: L80 <= Pred <= U80
      expect(p.lowerBound80).toBeLessThanOrEqual(p.predictedYield);
      expect(p.predictedYield).toBeLessThanOrEqual(p.upperBound80);

      // Verificación de cobertura: 95% contiene a 80%
      expect(p.lowerBound95).toBeLessThanOrEqual(p.lowerBound80);
      expect(p.upperBound95).toBeGreaterThanOrEqual(p.upperBound80);

      // Metadatos reales preservados
      expect(p.municipalityId).toBe("rionegro");
      expect(p.cropId).toBe("cacao");
    }
  });

  it("debe preservar el municipio y cultivo correctos en buildUnifiedSeriesPoints para café, cacao y granadilla", () => {
    const crops = ["cafe", "cacao", "granadilla"] as const;

    for (const crop of crops) {
      const forecast = generateStatisticalForecast({
        municipalityId: "socorro",
        municipalityName: "Socorro",
        crop,
        historicalRecords: [
          { year: 2018, yield: 1.0 },
          { year: 2019, yield: 1.1 },
          { year: 2020, yield: 1.2 },
        ],
        features: mockFeatures,
        targetYears: [2025, 2026],
      });

      const unified = buildUnifiedSeriesPoints([], forecast.predictions);
      expect(unified.length).toBe(2);

      for (const pt of unified) {
        expect(pt.municipalityId).toBe("socorro");
        expect(pt.cropId).toBe(crop);
        expect(pt.municipalityId).not.toBe("muni");
      }
    }
  });
});
