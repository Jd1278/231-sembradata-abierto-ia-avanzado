import { describe, it, expect } from "vitest";
import {
  resolveMunicipalityId,
  fetchHistoricalAndPredictionDetails,
} from "@/services/historical-prediction-service";
import { CommodityService } from "@/services/commodity-service";

describe("Comprehensive Historical Yield & Commodity Pipeline Audit", () => {
  describe("1. Deterministic Municipality Resolution", () => {
    const cases = [
      { input: "San Vicente de Chucurí", expected: "san_vicente_de_chucuri" },
      { input: "SAN VICENTE DE CHUCURI", expected: "san_vicente_de_chucuri" },
      { input: "San Gil", expected: "san_gil" },
      { input: "Rionegro", expected: "rionegro" },
      { input: "El Carmen de Chucurí", expected: "el_carmen_de_chucuri" },
      { input: "Charalá", expected: "charala" },
      { input: "Málaga", expected: "malaga" },
      { input: "Vetas", expected: "vetas" },
    ];

    for (const { input, expected } of cases) {
      it(`resolves "${input}" to "${expected}" deterministically`, async () => {
        const id = await resolveMunicipalityId(input);
        expect(id).toBe(expected);
      });
    }
  });

  describe("2. Historical EVA & Theil-Sen Forecasting Pipeline", () => {
    it("processes San Vicente de Chucurí (Cacao) with real EVA series and statistical forecast", async () => {
      const res = await fetchHistoricalAndPredictionDetails({
        municipality: "San Vicente de Chucurí",
        crop: "cacao",
      });

      expect(res.municipalityId).toBe("san_vicente_de_chucuri");
      expect(res.cropId).toBe("cacao");
      expect(res.status).toBe("ready");
      expect(res.historicalObservations.length).toBeGreaterThanOrEqual(5);
      expect(res.predictions.length).toBeGreaterThanOrEqual(1);

      // Verify points have both historical and predictions
      const histPoints = res.points.filter((p) => p.historicalValue !== null);
      const predPoints = res.points.filter((p) => p.predictedValue !== null);
      expect(histPoints.length).toBeGreaterThanOrEqual(5);
      expect(predPoints.length).toBeGreaterThanOrEqual(1);
    });

    it("processes San Gil (Café) with real EVA series and statistical forecast", async () => {
      const res = await fetchHistoricalAndPredictionDetails({
        municipality: "San Gil",
        crop: "cafe",
      });

      expect(res.municipalityId).toBe("san_gil");
      expect(res.cropId).toBe("cafe");
      expect(res.status).toBe("ready");
      expect(res.historicalObservations.length).toBeGreaterThanOrEqual(5);
      expect(res.predictions.length).toBeGreaterThanOrEqual(1);
    });

    it("processes Málaga (Granadilla) with real EVA series and statistical forecast", async () => {
      const res = await fetchHistoricalAndPredictionDetails({
        municipality: "Málaga",
        crop: "granadilla",
      });

      expect(res.municipalityId).toBe("malaga");
      expect(res.cropId).toBe("granadilla");
      expect(res.status).toBe("ready");
      expect(res.historicalObservations.length).toBeGreaterThanOrEqual(5);
      expect(res.predictions.length).toBeGreaterThanOrEqual(1);
    });

    it("handles Vetas (Cacao) transparently with no_historical_data and 0 synthetic points", async () => {
      const res = await fetchHistoricalAndPredictionDetails({
        municipality: "Vetas",
        crop: "cacao",
      });

      expect(res.municipalityId).toBe("vetas");
      expect(res.status).toBe("no_historical_data");
      expect(res.historicalObservations.length).toBe(0);
      expect(res.predictions.length).toBe(0);
      expect(res.points.length).toBe(0);
      expect(res.errorMessage).toContain(
        "No existen registros históricos reportados en EVA para cacao en Vetas",
      );
    });
  });

  describe("3. International Commodity Service Resilience", () => {
    const service = new CommodityService();

    it("retrieves Coffee market data with real quote reference", async () => {
      const coffee = await service.getCommodityPrice("cafe");
      expect(coffee.crop).toBe("cafe");
      expect(["live", "cached", "unavailable"]).toContain(coffee.status);
      if (coffee.status !== "unavailable") {
        expect(coffee.price).toBeGreaterThan(0);
        expect(coffee.normalizedPricePerKg).toBeGreaterThan(0);
      }
    });

    it("retrieves Cocoa market data without crashing when live price is missing", async () => {
      const cocoa = await service.getCommodityPrice("cacao");
      expect(cocoa.crop).toBe("cacao");
      expect(["live", "cached", "unavailable"]).toContain(cocoa.status);
      expect(cocoa.disclaimer).toBeTruthy();
    });

    it("strictly preserves national market disclaimer for Granadilla", async () => {
      const granadilla = await service.getCommodityPrice("granadilla");
      expect(granadilla.crop).toBe("granadilla");
      expect(granadilla.status).toBe("unavailable");
      expect(granadilla.sources).toContain("DANE SIPSA (referencia nacional)");
      expect(granadilla.disclaimer).toContain("Centroabastos (Bucaramanga)");
    });
  });
});
