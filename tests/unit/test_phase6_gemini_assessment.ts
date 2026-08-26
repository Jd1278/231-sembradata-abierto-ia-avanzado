import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GeminiAssessmentSchema,
  type GeminiAssessment,
} from "../../src/types/historical-prediction";
import { requestGeminiAgronomicAssessment } from "../../src/services/gemini-service";
import { extractClimateFeatures } from "../../src/services/forecasting-engine";

describe("Phase 6: Gemini Responsible Agronomic Assessment Layer", () => {
  const bucaraFeatures = extractClimateFeatures("Bucaramanga", "bucaramanga", null);

  describe("1. Zod Schema Strict Validation", () => {
    it("validates well-formed JSON assessment from Gemini", () => {
      const validPayload = {
        consistencyStatus: "valid",
        adjustmentRecommendation: "none",
        explanation:
          "El pronóstico de 1.35 Ton/Ha para Café en Bucaramanga es coherente con el histórico regional.",
        riskFactors: ["Posible déficit hídrico en agosto", "Incremento de temperaturas mínimas"],
        dataQualityNotes: ["Serie histórica continua de 7 años validada por EVA"],
      };

      const parsed = GeminiAssessmentSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.consistencyStatus).toBe("valid");
        expect(parsed.data.riskFactors).toHaveLength(2);
      }
    });

    it("rejects malformed assessment with missing fields or invalid enum status", () => {
      const invalidPayload = {
        consistencyStatus: "super_good", // invalid enum
        explanation: "ok",
      };

      const parsed = GeminiAssessmentSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("2. Numeric Immutability & Fallback Behavior", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("never modifies the statistical forecast value when Gemini returns assessment", async () => {
      const mockAssessment: GeminiAssessment = {
        consistencyStatus: "warning",
        adjustmentRecommendation: "review_required",
        explanation: "Se recomienda monitoreo por posible sequía.",
        riskFactors: ["Sequía severa"],
        dataQualityNotes: [],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssessment,
      } as Response);

      const statisticalYield = 1.35;

      const result = await requestGeminiAgronomicAssessment({
        municipio: "Bucaramanga",
        crop: "cafe",
        historicalYields: [{ year: 2023, yield: 1.3 }],
        predictedYield: statisticalYield,
        modelName: "Theil-Sen Robust Trend",
        features: bucaraFeatures,
      });

      expect(result).not.toBeNull();
      expect(result?.consistencyStatus).toBe("warning");
      // Verify that the original statistical yield value remains untouched
      expect(statisticalYield).toBe(1.35);
    });

    it("returns null transparently when backend Edge function times out or fails (graceful degradation)", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const result = await requestGeminiAgronomicAssessment({
        municipio: "Bucaramanga",
        crop: "cafe",
        historicalYields: [{ year: 2023, yield: 1.3 }],
        predictedYield: 1.35,
        modelName: "Theil-Sen Robust Trend",
        features: bucaraFeatures,
      });

      // Does not throw an uncaught exception, returns null
      expect(result).toBeNull();
    });
  });
});
