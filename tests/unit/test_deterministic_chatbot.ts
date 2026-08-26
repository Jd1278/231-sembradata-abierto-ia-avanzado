import { describe, it, expect } from "vitest";
import { ChatbotResponseSchema, verifyClaimsAgainstContext } from "../../src/types/chat-schema.ts";
import {
  searchKnowledgeBase,
  formatRagContext,
  MIN_RAG_RELEVANCE_SCORE,
} from "../../supabase/functions/chat/rag.ts";
import {
  extractVerifiedNumbers,
  type MunicipalityProfile,
  type ObservedYieldSummary,
  type PredictionSummary,
  type CropRequirementsSummary,
  type ExternalClimateSummary,
  type ExternalSoilSummary,
} from "../../supabase/functions/chat/deterministic.ts";
import { computeContextHash } from "../../src/services/chatbot.ts";

describe("Deterministic Anti-Hallucination Chatbot Unit Tests", () => {
  describe("1. Zod Schema Integrity & Claim Contracts", () => {
    it("validates valid structured response", () => {
      const payload = {
        answer:
          "El cultivo de cacao en **San Gil** presenta condiciones óptimas con temperatura de 24°C y rendimiento histórico promedio de 0.85 ton/ha.",
        summary: "San Gil cuenta con clima propicio para cacao según datos oficiales.",
        claims: [
          {
            text: "Temperatura actual de 24°C en San Gil.",
            claimType: "forecast",
            source: "Open-Meteo",
            observedAt: "2026-08-24T12:00:00Z",
            value: 24.0,
            unit: "°C",
            confidence: 95,
          },
          {
            text: "Rendimiento promedio histórico observado de 0.85 ton/ha.",
            claimType: "observed",
            source: "EVA / MinAgricultura",
            observedAt: "2024",
            value: 0.85,
            unit: "ton/ha",
            confidence: 100,
          },
        ],
        recommendations: [
          {
            action: "Mantener densidad de 1,100 árboles/ha y sistema de riego por goteo.",
            basis: ["Manual Técnico Fedecacao (v2.0)"],
            priority: "high",
          },
        ],
        uncertainties: [],
        insufficientData: false,
        needsHumanReview: false,
      };

      const result = ChatbotResponseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects responses missing required fields or having invalid claim types", () => {
      const invalidPayload = {
        answer: "Faltan claims y summary",
      };
      const result = ChatbotResponseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("2. Claim Verification & Anti-Hallucination Sanitizer", () => {
    it("preserves claims whose numerical values match verified ground-truth facts", () => {
      const verifiedNumbers = new Set([24.0, 0.85, 1100]);
      const claims = [
        {
          text: "Temperatura de 24°C observada",
          claimType: "forecast" as const,
          source: "Open-Meteo",
          value: 24.0,
          unit: "°C",
        },
        {
          text: "Rendimiento de 0.85 ton/ha",
          claimType: "observed" as const,
          source: "EVA / MinAgricultura",
          value: 0.85,
          unit: "ton/ha",
        },
      ];

      const { sanitizedClaims, hasUnverifiedNumericClaims } = verifyClaimsAgainstContext(
        claims,
        verifiedNumbers,
      );
      expect(hasUnverifiedNumericClaims).toBe(false);
      expect(sanitizedClaims[0].claimType).toBe("forecast");
      expect(sanitizedClaims[1].claimType).toBe("observed");
    });

    it("sanitizes hallucinated numbers not present in verified facts", () => {
      const verifiedNumbers = new Set([24.0, 0.85]);
      const claims = [
        {
          text: "Rendimiento proyectado de 9.5 ton/ha (número inventado)",
          claimType: "model_estimate" as const,
          source: "Fuente no verificada",
          value: 9.5, // Not in verifiedNumbers
          unit: "ton/ha",
        },
      ];

      const { sanitizedClaims, hasUnverifiedNumericClaims } = verifyClaimsAgainstContext(
        claims,
        verifiedNumbers,
      );
      expect(hasUnverifiedNumericClaims).toBe(true);
      expect(sanitizedClaims[0].claimType).toBe("general_guidance");
      expect(sanitizedClaims[0].source).toContain("no verificado");
    });
  });

  describe("3. RAG Relevance Threshold & Quality Filter", () => {
    it("returns empty results for completely irrelevant queries", () => {
      const results = searchKnowledgeBase("receta de cocina de espagueti a la boloñesa", 2);
      expect(results.length).toBe(0);
      expect(formatRagContext(results)).toBe("");
    });

    it("returns relevant agronomic entries when searching for crop requirements", () => {
      const results = searchKnowledgeBase("siembra de cacao en santander distancia hoyos", 2);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThanOrEqual(MIN_RAG_RELEVANCE_SCORE);
      expect(results[0].entry.crop).toBe("cacao");
    });
  });

  describe("4. Deterministic Fact Extraction", () => {
    it("extracts all verified numbers from context", () => {
      const muni: MunicipalityProfile = {
        id: "san-gil",
        nombre: "San Gil",
        subregion: "Guanentá",
        latitud: 6.55,
        longitud: -73.13,
        altitud_msnm: 1114,
        departamento: "Santander",
        isValidSantander: true,
      };

      const historicalYield: ObservedYieldSummary = {
        series: [{ anio: 2023, rendimiento_ton_ha: 0.82, fuente: "EVA" }],
        nObservations: 1,
        minYear: 2023,
        lastObservedYear: 2023,
        averageYieldTonHa: 0.82,
        source: "EVA / MinAgricultura",
      };

      const prediction: PredictionSummary = {
        anioObjetivo: 2025,
        rendimientoEstimadoTonHa: 0.88,
        limiteInferior80: 0.75,
        limiteSuperior80: 0.99,
        limiteInferior95: 0.68,
        limiteSuperior95: 1.05,
        modeloUsado: "Theil-Sen",
        r2Score: 0.78,
        isPrediction: true,
        source: "Modelo Estadístico",
      };

      const cropReqs: CropRequirementsSummary = {
        cropId: "cacao",
        cropName: "Cacao",
        scientificName: "Theobroma cacao",
        tempOptMin: 20,
        tempOptMax: 30,
        precipOptMin: 1500,
        precipOptMax: 2500,
        altOptMin: 0,
        altOptMax: 1200,
        humidityOptMin: 70,
        humidityOptMax: 85,
        phOptMin: 6.0,
        phOptMax: 7.5,
        source: "Fedecacao",
      };

      const climate: ExternalClimateSummary = {
        currentTempC: 25.2,
        minTempC: 18.0,
        maxTempC: 28.5,
        humidityPct: 72,
        precip7dDaysMm: 45.0,
        windSpeedKmh: 8,
        observedAt: "2026-08-24T12:00:00Z",
        source: "Open-Meteo",
        status: "available",
      };

      const soil: ExternalSoilSummary = {
        ph: 6.4,
        organicMatterPct: 3.2,
        texture: "Franco",
        source: "SoilGrids",
        status: "available",
      };

      const { verifiedNumbers, verifiedFacts } = extractVerifiedNumbers({
        municipality: muni,
        historicalYield,
        prediction,
        cropRequirements: cropReqs,
        climate,
        soil,
      });

      expect(verifiedNumbers.has(1114)).toBe(true);
      expect(verifiedNumbers.has(0.82)).toBe(true);
      expect(verifiedNumbers.has(0.88)).toBe(true);
      expect(verifiedNumbers.has(25.2)).toBe(true);
      expect(verifiedNumbers.has(6.4)).toBe(true);
      expect(verifiedFacts.length).toBeGreaterThan(4);
    });
  });

  describe("5. Recommendation Cache Hashing", () => {
    it("generates deterministic and differentiated context hashes", () => {
      const ctx1 = {
        municipio: "San Gil",
        cultivo: "cacao",
        score: 82,
        temp: 24.3,
        precip: 120,
        humidity: 70,
        ph: 6.2,
        organicMatter: 3,
        texture: "Franco",
        altitude: 1114,
        month: "Agosto",
      };

      const hash1 = computeContextHash(ctx1);
      expect(hash1).toContain("san gil:cacao:80:24c:120mm:ph6");

      const ctxDifferentTemp = { ...ctx1, temp: 32.0 };
      const hash2 = computeContextHash(ctxDifferentTemp);
      expect(hash1).not.toBe(hash2);
    });
  });
});
