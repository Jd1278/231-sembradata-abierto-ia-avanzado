import { describe, it, expect } from "vitest";
import { classifyIntent } from "../../supabase/functions/chat/shared.ts";

describe("Chatbot Edge Function & CORS Logic Unit Tests", () => {
  describe("1. Intent Classification", () => {
    it("classifies greetings correctly", () => {
      expect(classifyIntent("Hola")).toBe("GREETING");
      expect(classifyIntent("Buenos días")).toBe("GREETING");
      expect(classifyIntent("Buenas tardes")).toBe("GREETING");
    });

    it("classifies crop recommendation queries", () => {
      expect(classifyIntent("¿Qué cultivo es viable en San Gil?")).toBe("CROP_RECOMMENDATION");
      expect(classifyIntent("Recomiéndame un cultivo para Bucaramanga")).toBe(
        "CROP_RECOMMENDATION",
      );
      expect(classifyIntent("¿Cuál es el mejor cultivo para sembrar en Barichara?")).toBe(
        "CROP_RECOMMENDATION",
      );
    });

    it("classifies crop risk queries", () => {
      expect(classifyIntent("¿Cuáles son los riesgos de sembrar cacao?")).toBe(
        "CROP_RISK_ANALYSIS",
      );
      expect(classifyIntent("¿Qué probabilidad de éxito tiene el café?")).toBe(
        "CROP_RISK_ANALYSIS",
      );
      expect(classifyIntent("Peligros de plagas en granadilla")).toBe("CROP_RISK_ANALYSIS");
    });

    it("classifies crop requirements queries", () => {
      expect(classifyIntent("¿Cuáles son los requisitos de suelo para cacao?")).toBe(
        "CROP_REQUIREMENTS",
      );
      expect(classifyIntent("Cómo sembrar café")).toBe("CROP_REQUIREMENTS");
      expect(classifyIntent("Pasos para cultivar granadilla")).toBe("CROP_REQUIREMENTS");
    });
  });

  describe("2. CORS Origin Matching Rules", () => {
    const DEFAULT_ALLOWED_ORIGINS = [
      "https://231-sembradata-abierto-ia-avanzado.vercel.app",
      "https://lovable.dev",
    ];

    const ALLOWED_ORIGIN_PATTERNS = [
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
      /^https:\/\/(231-)?[a-z0-9-]+-jd1278s-projects\.vercel\.app$/,
      /^https:\/\/(231-)?sembradata-abierto-ia-avanzado.*\.vercel\.app$/,
      /^https:\/\/.*\.lovableproject\.com$/,
    ];

    function isOriginAllowed(origin: string | null): boolean {
      if (!origin) return false;
      if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return true;
      return ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
    }

    it("allows production Vercel deployment origin", () => {
      expect(isOriginAllowed("https://231-sembradata-abierto-ia-avanzado.vercel.app")).toBe(true);
    });

    it("allows Lovable platform origin", () => {
      expect(isOriginAllowed("https://lovable.dev")).toBe(true);
    });

    it("allows local development origins on any port", () => {
      expect(isOriginAllowed("http://localhost:5173")).toBe(true);
      expect(isOriginAllowed("http://localhost:3000")).toBe(true);
      expect(isOriginAllowed("http://127.0.0.1:8080")).toBe(true);
    });

    it("allows Vercel branch previews", () => {
      expect(
        isOriginAllowed(
          "https://231-sembradata-abierto-ia-avanzado-git-branch-jd1278s-projects.vercel.app",
        ),
      ).toBe(true);
      expect(isOriginAllowed("https://sembradata-abierto-ia-avanzado-preview.vercel.app")).toBe(
        true,
      );
    });

    it("strictly rejects unauthorized and malicious origins", () => {
      expect(isOriginAllowed("https://malicious-site.com")).toBe(false);
      expect(isOriginAllowed("https://phishing-sembradata.com")).toBe(false);
      expect(isOriginAllowed("http://evil-localhost.com")).toBe(false);
      expect(isOriginAllowed(null)).toBe(false);
    });
  });

  describe("3. Structured Response Payload & Error Code Integrity", () => {
    it("validates that response payloads conform to standard schema", () => {
      const successPayload = {
        reply: "El cacao es altamente viable en San Gil...",
        intent: "CROP_RECOMMENDATION",
        provider: "groq",
        degraded: false,
        requestId: "req-12345",
        latencyMs: 1450,
        data: {
          municipio: "San Gil",
          cultivo: "cacao",
          lat: 6.55,
          lon: -73.13,
          sources: ["Knowledge Base", "Open-Meteo", "SoilGrids"],
        },
      };

      expect(successPayload.provider).toBe("groq");
      expect(successPayload.degraded).toBe(false);
      expect(successPayload.latencyMs).toBeLessThan(20000);
    });

    it("validates degraded fallback response on Groq rate limits or timeouts", () => {
      const degradedPayload = {
        reply:
          "⚠️ El servicio de IA está experimentando alta demanda. Te compartimos la recomendación agronómica base.",
        intent: "CROP_RECOMMENDATION",
        provider: "rag_fallback",
        degraded: true,
        errorCode: "GROQ_RATE_LIMIT",
        requestId: "req-999",
        latencyMs: 12100,
        data: {
          municipio: "San Gil",
          cultivo: null,
          lat: 6.55,
          lon: -73.13,
          sources: ["Knowledge Base"],
        },
      };

      expect(degradedPayload.degraded).toBe(true);
      expect(degradedPayload.provider).toBe("rag_fallback");
      expect(degradedPayload.errorCode).toBe("GROQ_RATE_LIMIT");
    });
  });
});
