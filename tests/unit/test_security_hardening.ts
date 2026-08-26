import { describe, it, expect } from "vitest";
import { handler } from "../../deployments/serverless/handler";
import { ChatbotResponseSchema, verifyAndSanitizeResponse } from "../../src/types/chat-schema";

describe("FASE 1: Endurecimiento de Seguridad y Serverless Handler", () => {
  it("debe rechazar orígenes no autorizados con HTTP 403 Forbidden", async () => {
    const res = await handler({
      path: "/api/reports/generate",
      method: "POST",
      headers: { origin: "https://malicious-site.com" },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe("CORS_FORBIDDEN");
  });

  it("debe retornar HTTP 501 Not Implemented en /api/reports/generate para origen válido", async () => {
    const res = await handler({
      path: "/api/reports/generate",
      method: "POST",
      headers: { origin: "http://localhost:5173" },
      body: JSON.stringify({ municipio: "San Gil" }),
    });

    expect(res.statusCode).toBe(501);
    const body = JSON.parse(res.body);
    expect(body.code).toBe("NOT_IMPLEMENTED");
    expect(res.headers?.["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
  });

  it("debe responder HTTP 204 en preflight OPTIONS para orígenes permitidos", async () => {
    const res = await handler({
      path: "/api/reports/schedule",
      method: "OPTIONS",
      headers: { origin: "https://231-sembradata-abierto-ia-avanzado.vercel.app" },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers?.["Access-Control-Allow-Origin"]).toBe(
      "https://231-sembradata-abierto-ia-avanzado.vercel.app",
    );
  });
});

describe("FASE 5: Sanitización Profunda y Anti-Alucinaciones", () => {
  it("debe marcar como no disponible y degradar claims con números inventados", () => {
    const verifiedNumbers = new Set<number>([1160, 24.5, 65]);

    const mockResponse = ChatbotResponseSchema.parse({
      answer: "El rendimiento estimado en la zona es de 8.9 ton/ha.",
      summary: "Evaluación agroclimática",
      claims: [
        {
          text: "Altitud oficial: 1160 msnm",
          claimType: "observed",
          source: "Base oficial Santander",
          value: 1160,
          unit: "msnm",
          confidence: 95,
        },
        {
          text: "Rendimiento inventado: 8.9 ton/ha",
          claimType: "model_estimate",
          source: "Estimación inventada",
          value: 8.9,
          unit: "ton/ha",
          confidence: 90,
        },
      ],
      recommendations: [
        {
          action: "Fertilización foliar",
          basis: ["Manual Técnico ICA"],
          priority: "high",
        },
      ],
      uncertainties: [],
      insufficientData: false,
      needsHumanReview: false,
    });

    const sanitized = verifyAndSanitizeResponse(mockResponse, verifiedNumbers);

    expect(sanitized.claims[0].claimType).toBe("observed");
    expect(sanitized.claims[0].confidence).toBe(95);

    // Unverified claim must be sanitized to general_guidance without confidence
    expect(sanitized.claims[1].claimType).toBe("general_guidance");
    expect(sanitized.claims[1].confidence).toBeNull();
    expect(sanitized.claims[1].source).toContain("no verificado");
    expect(sanitized.insufficientData).toBe(true);
    expect(sanitized.needsHumanReview).toBe(true);
  });
});
