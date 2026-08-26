import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// ------------------------------------------------------------
// 1. Zod Validation Schemas
// ------------------------------------------------------------
const AssessmentInputSchema = z.object({
  municipio: z.string().trim().min(2).max(100),
  cultivo: z.string().trim().min(2).max(50),
  historicalYields: z
    .array(
      z.object({
        year: z.number().int().min(2000).max(2035),
        yield: z.number().positive().max(50).finite(),
      }),
    )
    .max(50)
    .default([]),
  predictedYield: z.number().positive().max(50).finite(),
  modelName: z.string().trim().min(2).max(100),
  climateSummary: z.object({
    tempMean: z.number().min(-10).max(55).finite(),
    precipAnnual: z.number().min(0).max(10000).finite(),
    humidityMean: z.number().min(0).max(100).finite(),
    altitude: z.number().min(0).max(5000).finite(),
  }),
  cropRequirements: z.object({
    tempOptima: z.object({
      min: z.number().min(-10).max(55).finite(),
      max: z.number().min(-10).max(55).finite(),
    }),
    precipitacionAnual: z.object({
      min: z.number().min(0).max(10000).finite(),
      max: z.number().min(0).max(10000).finite(),
    }),
    altitud: z.object({
      min: z.number().min(0).max(5000).finite(),
      max: z.number().min(0).max(5000).finite(),
    }),
  }),
});

const AssessmentOutputSchema = z.object({
  consistencyStatus: z.enum(["valid", "warning", "invalid"]),
  adjustmentRecommendation: z.enum(["none", "review_required"]),
  explanation: z.string().min(5).max(1000),
  riskFactors: z.array(z.string().max(200)).default([]),
  dataQualityNotes: z.array(z.string().max(200)).default([]),
});

export type GeminiAssessment = z.infer<typeof AssessmentOutputSchema>;

// ------------------------------------------------------------
// 2. CORS Allowlist Validation
// ------------------------------------------------------------
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
  const envOrigins =
    Deno.env
      .get("ALLOWED_ORIGINS")
      ?.split(",")
      .map((s) => s.trim()) || [];
  if (DEFAULT_ALLOWED_ORIGINS.includes(origin) || envOrigins.includes(origin)) {
    return true;
  }
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function getCorsHeaders(origin: string | null): HeadersInit {
  if (!origin || !isOriginAllowed(origin)) {
    return { Vary: "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ------------------------------------------------------------
// 3. Main Server Handler
// ------------------------------------------------------------
serve(async (req) => {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const origin = req.headers.get("origin");
  const startTime = Date.now();

  // 1. Preflight OPTIONS
  if (req.method === "OPTIONS") {
    if (origin && !isOriginAllowed(origin)) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: Origin not allowed",
          code: "CORS_FORBIDDEN",
          requestId,
        }),
        { status: 403, headers: { "Content-Type": "application/json", Vary: "Origin" } },
      );
    }
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }

  // 2. Reject disallowed origins on POST
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Origin not allowed", code: "CORS_FORBIDDEN", requestId }),
      { status: 403, headers: { "Content-Type": "application/json", Vary: "Origin" } },
    );
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Servicio de evaluación cualitativa no configurado en el servidor",
          code: "GEMINI_NOT_CONFIGURED",
          fallback: true,
          requestId,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: "Cuerpo de solicitud inválido", code: "INVALID_BODY", requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Validate input payload strictly with Zod
    const inputValidation = AssessmentInputSchema.safeParse(rawBody);
    if (!inputValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Payload de evaluación inválido o valores fuera de rangos físicos permitidos",
          code: "VALIDATION_ERROR",
          details: inputValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      municipio,
      cultivo,
      historicalYields,
      predictedYield,
      modelName,
      climateSummary,
      cropRequirements,
    } = inputValidation.data;

    const systemInstruction = `Actúa como un agrónomo y climatólogo experto para Santander, Colombia.
Evalúa la coherencia agronómica y cualitativa del pronóstico estadístico generado para '${cultivo}' en '${municipio}'.
REGLAS ESTRICTAS:
1. NUNCA inventes nuevos valores numéricos ni sustituyas el pronóstico numérico del modelo.
2. Evalúa si el rendimiento predicho (${predictedYield} Ton/Ha) es biológicamente viable frente a las condiciones climáticas del municipio y los requisitos óptimos del cultivo.
3. Responde ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "consistencyStatus": "valid" | "warning" | "invalid",
  "adjustmentRecommendation": "none" | "review_required",
  "explanation": "breve análisis agronómico cualitativo de 2 a 3 oraciones",
  "riskFactors": ["factor 1", "factor 2"],
  "dataQualityNotes": ["nota sobre calidad de datos o clima"]
}`;

    const promptText = `Municipio: ${municipio}
Cultivo: ${cultivo}
Rendimientos históricos observados: ${JSON.stringify(historicalYields)}
Pronóstico estadístico del modelo (${modelName}): ${predictedYield} Ton/Ha
Clima del municipio: Temp Promedio ${climateSummary.tempMean}°C, Precipitación Anual ${climateSummary.precipAnnual}mm, Humedad ${climateSummary.humidityMean}%, Altitud ${climateSummary.altitude} msnm.
Requisitos fisiológicos del cultivo: Temp óptima [${cropRequirements.tempOptima.min}-${cropRequirements.tempOptima.max}]°C, Precipitación óptima [${cropRequirements.precipitacionAnual.min}-${cropRequirements.precipitacionAnual.max}] mm, Altitud [${cropRequirements.altitud.min}-${cropRequirements.altitud.max}] msnm.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetchWithTimeout(geminiUrl, 8000, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!geminiRes.ok) {
      console.warn(
        `[GeminiAssessment] Upstream error HTTP ${geminiRes.status}, duration: ${latencyMs}ms, req: ${requestId}`,
      );
      return new Response(
        JSON.stringify({
          error:
            "El servicio de evaluación cualitativa no pudo procesar la solicitud en este momento",
          code: "GEMINI_UPSTREAM_ERROR",
          fallback: true,
          requestId,
          latencyMs,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiData = await geminiRes.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return new Response(
        JSON.stringify({
          error: "Respuesta vacía del servicio de evaluación",
          code: "GEMINI_EMPTY_RESPONSE",
          fallback: true,
          requestId,
          latencyMs,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const cleanedText = rawContent
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    // 4. Validate output strictly against Zod
    const outputValidation = AssessmentOutputSchema.safeParse(parsed);
    if (!outputValidation.success) {
      console.warn("[GeminiAssessment] Response failed schema validation:", outputValidation.error);
      return new Response(
        JSON.stringify({
          error: "Estructura de respuesta cualitativa inválida",
          code: "SCHEMA_VALIDATION_FAILED",
          fallback: true,
          requestId,
          latencyMs,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ...outputValidation.data,
        requestId,
        latencyMs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error(
      `[GeminiAssessment] Server exception (${isTimeout ? "Timeout" : "Error"}):`,
      req.headers.get("x-request-id"),
    );

    return new Response(
      JSON.stringify({
        error: isTimeout
          ? "Tiempo de espera agotado al consultar la evaluación cualitativa"
          : "Error interno al evaluar el pronóstico",
        code: isTimeout ? "GATEWAY_TIMEOUT" : "INTERNAL_ERROR",
        fallback: true,
        requestId,
        latencyMs,
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
