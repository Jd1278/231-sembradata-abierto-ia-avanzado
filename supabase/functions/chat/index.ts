import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyIntent, buildSystemPrompt, type Intent } from "./shared.ts";
import { searchKnowledgeBase, formatRagContext } from "./rag.ts";
import { saveMessage, getHistory, formatHistoryForLLM } from "./memory.ts";
import { extractEntities, type SelectedContextInput } from "./entities.ts";
import {
  getMunicipalityProfile,
  getObservedYield,
  getPrediction,
  getCropRequirements,
  getCurrentExternalContext,
  extractVerifiedNumbers,
  type DeterministicContext,
  type MunicipalityProfile,
} from "./deterministic.ts";
import {
  ChatbotResponseSchema,
  verifyAndSanitizeResponse,
  type ChatbotResponse,
  type Claim,
} from "./schema.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

interface ChatRequest {
  message: string;
  sessionId?: string;
  selectedContext?: SelectedContextInput | null;
}

export type ChatProvider = "groq" | "rag_fallback" | "static";
export type ChatErrorCode =
  | "GROQ_NOT_CONFIGURED"
  | "GROQ_AUTH"
  | "GROQ_RATE_LIMIT"
  | "GROQ_TIMEOUT"
  | "GROQ_UPSTREAM"
  | "CONTEXT_TIMEOUT"
  | "INTERNAL_ERROR"
  | "CORS_FORBIDDEN"
  | "INVALID_REQUEST"
  | "UNVERIFIED_LOCATION"
  | "OUT_OF_SCOPE_LOCATION";

export interface ChatResponsePayload extends ChatbotResponse {
  reply: string;
  intent: Intent;
  provider: ChatProvider;
  degraded: boolean;
  errorCode?: ChatErrorCode;
  requestId: string;
  latencyMs: number;
  data: {
    municipio: string | null;
    cultivo: string | null;
    lat: number | null;
    lon: number | null;
    sources: string[];
    sourceOfMunicipality?: "message" | "selected_context";
    sourceOfCrop?: "message" | "selected_context";
    conflictDetected?: boolean;
  } | null;
}

function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ------------------------------------------------------------
// Configuración y Validación de CORS
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

export function isOriginAllowed(origin: string | null): boolean {
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

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin),
    },
  });
}

// ------------------------------------------------------------
// Llamada a Groq Cloud con JSON Schema
// ------------------------------------------------------------
async function askLLMStructured(
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  timeoutMs = 12000,
): Promise<{
  data: ChatbotResponse | null;
  provider: ChatProvider;
  degraded: boolean;
  errorCode?: ChatErrorCode;
  latencyMs: number;
}> {
  const start = Date.now();

  if (!GROQ_KEY) {
    console.warn("[Groq Warning] GROQ_API_KEY no configurada. Activando fallback determinista.");
    return {
      data: null,
      provider: "rag_fallback",
      degraded: true,
      errorCode: "GROQ_NOT_CONFIGURED",
      latencyMs: 0,
    };
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: userMessage },
    ];

    const res = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      timeoutMs,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages,
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      },
    );

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      let errorCode: ChatErrorCode = "GROQ_UPSTREAM";
      if (res.status === 401 || res.status === 403) errorCode = "GROQ_AUTH";
      else if (res.status === 429) errorCode = "GROQ_RATE_LIMIT";

      console.warn(
        `[Groq Error] Status ${res.status}, code: ${errorCode}, duration: ${latencyMs}ms`,
      );
      return { data: null, provider: "rag_fallback", degraded: true, errorCode, latencyMs };
    }

    const raw = await res.json();
    const content = raw.choices?.[0]?.message?.content;
    if (!content) {
      return {
        data: null,
        provider: "rag_fallback",
        degraded: true,
        errorCode: "GROQ_UPSTREAM",
        latencyMs,
      };
    }

    const parsedJson = JSON.parse(content);
    const validated = ChatbotResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.warn(
        "[Schema Validation Warning] Groq response failed strict Zod schema:",
        validated.error,
      );
      return {
        data: null,
        provider: "rag_fallback",
        degraded: true,
        errorCode: "GROQ_UPSTREAM",
        latencyMs,
      };
    }

    return {
      data: validated.data,
      provider: "groq",
      degraded: false,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.warn(
      `[Groq Exception] ${isTimeout ? "Timeout" : "Fetch error"}, latency: ${latencyMs}ms`,
    );

    return {
      data: null,
      provider: "rag_fallback",
      degraded: true,
      errorCode: isTimeout ? "GROQ_TIMEOUT" : "GROQ_UPSTREAM",
      latencyMs,
    };
  }
}

// ------------------------------------------------------------
// Servidor Deno Edge Function
// ------------------------------------------------------------
Deno.serve(async (req) => {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const origin = req.headers.get("origin");
  const overallStart = Date.now();

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

  // 2. Validación de Origen POST
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Origin not allowed", code: "CORS_FORBIDDEN", requestId }),
      { status: 403, headers: { "Content-Type": "application/json", Vary: "Origin" } },
    );
  }

  try {
    const { message, sessionId, selectedContext }: ChatRequest = await req.json();
    if (!message || typeof message !== "string" || message.length > 2000) {
      return jsonResponse(
        {
          error: "Invalid message. Must be a string between 1 and 2000 characters.",
          code: "INVALID_REQUEST",
          requestId,
        },
        400,
        origin,
      );
    }
    const sid = sessionId || crypto.randomUUID();

    // 1. Recuperar historial previo antes de registrar el turno actual
    const history = await getHistory(sid, 6).catch(() => []);
    saveMessage(sid, { role: "user", content: message }).catch(() => {});

    const intent: Intent = classifyIntent(message);

    // 2. Control de Saludo
    if (intent === "GREETING") {
      const reply =
        "¡Hola! 👋 Soy el asistente agroclimático oficial de SembraData para Santander.\n\nPuedo ayudarte con datos verificados de:\n- 🌱 **Recomendación de cultivos** (Café, Cacao, Granadilla) según clima y suelo.\n- 📊 **Rendimientos históricos** observados por MinAgricultura / EVA.\n- 🔮 **Predicciones agroclimáticas** Theil-Sen con intervalos de confianza.\n- 💰 **Cotizaciones y mercado** internacional.\n\n¿En qué municipio o cultivo deseas asesoría?";

      saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } }).catch(() => {});

      const payload: ChatResponsePayload = {
        answer: reply,
        reply,
        summary: "Bienvenida y opciones de consulta agroclimática de Santander.",
        claims: [],
        recommendations: [
          {
            action: "Escribe tu consulta o selecciona un municipio en pantalla.",
            basis: ["Catálogo de 87 municipios de Santander"],
            priority: "medium",
          },
        ],
        uncertainties: [],
        insufficientData: false,
        needsHumanReview: false,
        intent,
        provider: "static",
        degraded: false,
        requestId,
        latencyMs: Date.now() - overallStart,
        data: null,
      };

      return jsonResponse(payload as unknown as Record<string, unknown>, 200, origin);
    }

    // 3. Extracción de Entidades con Prioridad (Mensaje > selectedContext)
    const entities = extractEntities(message, selectedContext);

    // Si el usuario preguntó explícitamente por una ubicación fuera de Santander
    if (entities.outOfScopeLocation) {
      const reply = `📍 La ubicación **"${entities.outOfScopeLocation}"** se encuentra fuera de la cobertura de SembraData. Nuestra plataforma está especializada exclusivamente en los **87 municipios del departamento de Santander, Colombia** (ejemplos: *San Gil, San Vicente de Chucurí, Bucaramanga, Socorro, Rionegro, Landázuri, Vélez*).\n\n¿Deseas consultar información para algún municipio santandereano?`;

      saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } }).catch(() => {});

      const payload: ChatResponsePayload = {
        answer: reply,
        reply,
        summary: `Consulta fuera de Santander (${entities.outOfScopeLocation}).`,
        claims: [],
        recommendations: [
          {
            action: "Selecciona un municipio perteneciente a Santander.",
            basis: ["División político-administrativa de Santander (87 municipios)"],
            priority: "high",
          },
        ],
        uncertainties: [
          `No se dispone de datos agroclimáticos validados para ${entities.outOfScopeLocation}.`,
        ],
        insufficientData: true,
        needsHumanReview: false,
        intent,
        provider: "static",
        degraded: false,
        errorCode: "OUT_OF_SCOPE_LOCATION",
        requestId,
        latencyMs: Date.now() - overallStart,
        data: null,
      };

      return jsonResponse(payload as unknown as Record<string, unknown>, 200, origin);
    }

    // 4. Consulta de Lista de Municipios
    if (intent === "MUNICIPALITY_LIST") {
      const reply =
        "🗺️ **Cobertura de SembraData en Santander:**\n\nCubrimos los **87 municipios del departamento**, agrupados en provincias agroclimáticas:\n- **Provincia de Guanentá:** San Gil, Barichara, Curití, Aratoca, Villanueva, Pinchote, etc.\n- **Provincia Comunera:** Socorro, Palmas del Socorro, Simacota, Confines, Oiba, Suaita, etc.\n- **Provincia de Mares:** Barrancabermeja, San Vicente de Chucurí, El Carmen de Chucurí, Puerto Wilches, Betulia.\n- **Provincia de Soto:** Bucaramanga, Floridablanca, Girón, Piedecuesta, Lebrija, Rionegro, El Playón, Tona, Vetas.\n- **Provincia de Vélez:** Vélez, Barbosa, Puente Nacional, Landázuri, Bolívar, Chipatá, Güepsa.\n- **Provincias de García Rovira y Yariguíes.**";

      saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } }).catch(() => {});

      const payload: ChatResponsePayload = {
        answer: reply,
        reply,
        summary: "Catálogo de los 87 municipios de Santander.",
        claims: [
          {
            text: "SembraData cubre los 87 municipios del departamento de Santander",
            claimType: "observed",
            source: "DANE / Gobernación de Santander",
            value: 87,
            unit: "municipios",
            confidence: 100,
          },
        ],
        recommendations: [],
        uncertainties: [],
        insufficientData: false,
        needsHumanReview: false,
        intent,
        provider: "static",
        degraded: false,
        requestId,
        latencyMs: Date.now() - overallStart,
        data: null,
      };

      return jsonResponse(payload as unknown as Record<string, unknown>, 200, origin);
    }

    const rawMunicipio = entities.municipio;
    const rawCultivo = entities.cultivo?.toLowerCase();

    // 5. Validación Geográfica en Base de Datos de Supabase
    let muniProfile: MunicipalityProfile | null = null;
    if (rawMunicipio && supabase) {
      muniProfile = await getMunicipalityProfile(rawMunicipio, supabase);
    }

    // Si el usuario indicó un municipio pero no se pudo validar
    if (rawMunicipio && !muniProfile) {
      const reply = `📍 El municipio **"${rawMunicipio}"** no pudo ser validado en el catálogo oficial de Santander. Por favor verifica la ortografía (ejemplos: *San Gil, Bucaramanga, Socorro, Rionegro, Landázuri, Vélez*).`;

      saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } }).catch(() => {});

      const payload: ChatResponsePayload = {
        answer: reply,
        reply,
        summary: "Municipio no reconocido en Santander.",
        claims: [],
        recommendations: [
          {
            action: "Especifica un municipio válido de Santander.",
            basis: ["Catálogo de 87 municipios de Santander"],
            priority: "high",
          },
        ],
        uncertainties: [`No se encontraron registros para "${rawMunicipio}" en Santander.`],
        insufficientData: true,
        needsHumanReview: false,
        intent,
        provider: "static",
        degraded: false,
        errorCode: "UNVERIFIED_LOCATION",
        requestId,
        latencyMs: Date.now() - overallStart,
        data: null,
      };

      return jsonResponse(payload as unknown as Record<string, unknown>, 200, origin);
    }

    // 6. Consultas Concurrentes a Servicios Deterministas
    const lat = muniProfile ? muniProfile.latitud : 7.12;
    const lon = muniProfile ? muniProfile.longitud : -73.12;

    const [ragResults, externalContext, historicalYield, prediction, cropReqs] = await Promise.all([
      searchKnowledgeBase(message, 2),
      muniProfile
        ? getCurrentExternalContext(lat, lon)
        : Promise.resolve({
            climate: {
              currentTempC: null,
              minTempC: null,
              maxTempC: null,
              humidityPct: null,
              precip7dDaysMm: null,
              windSpeedKmh: null,
              observedAt: new Date().toISOString(),
              source: "Open-Meteo" as const,
              status: "unavailable" as const,
            },
            soil: {
              ph: null,
              organicMatterPct: null,
              texture: null,
              source: "SoilGrids" as const,
              status: "unavailable" as const,
            },
          }),
      muniProfile && rawCultivo && supabase
        ? getObservedYield(muniProfile.id, rawCultivo, supabase)
        : Promise.resolve(null),
      muniProfile && rawCultivo && supabase
        ? getPrediction(muniProfile.id, rawCultivo, supabase)
        : Promise.resolve(null),
      rawCultivo && supabase ? getCropRequirements(rawCultivo, supabase) : Promise.resolve(null),
    ]);

    const ragContext = formatRagContext(ragResults);

    // Fuentes reales empleadas
    const sources: string[] = [];
    if (ragResults.length > 0) sources.push("Manual Técnico ICA / Cenicafé / Fedecacao");
    if (externalContext.climate.status === "available") sources.push("Open-Meteo");
    if (externalContext.soil.status === "available") sources.push("SoilGrids ISRIC");
    if (historicalYield) sources.push("EVA / MinAgricultura");
    if (prediction) sources.push("Modelo Estadístico Theil-Sen");
    if (cropReqs) sources.push(cropReqs.source);

    // 7. Extracción de Números Verificados para Anti-Alucinación
    const { verifiedNumbers, verifiedFacts } = extractVerifiedNumbers({
      municipality: muniProfile,
      historicalYield,
      prediction,
      cropRequirements: cropReqs,
      climate: externalContext.climate,
      soil: externalContext.soil,
    });

    const deterministicContext: DeterministicContext = {
      municipality: muniProfile,
      crop: rawCultivo ? { id: rawCultivo, label: rawCultivo } : null,
      historicalYield,
      prediction,
      cropRequirements: cropReqs,
      climate: externalContext.climate,
      soil: externalContext.soil,
      verifiedNumbers,
      verifiedFacts,
    };

    // 8. Construcción de Prompt Estricto y Llamada a Groq con JSON Mode
    const systemPrompt = buildSystemPrompt(intent, deterministicContext, ragContext);
    const llmHistory = formatHistoryForLLM(history);

    const llmResult = await askLLMStructured(systemPrompt, llmHistory, message, 12000);

    let finalResponse: ChatbotResponse;

    if (llmResult.data && !llmResult.degraded) {
      // Validación y Sanitización Profunda de Afirmaciones Cuantitativas contra Hechos Reales
      finalResponse = verifyAndSanitizeResponse(llmResult.data, verifiedNumbers);
    } else {
      // Modo Degradado Determinista (Fallback Seguro)
      const fallbackClaims: Claim[] = [];
      if (externalContext.climate.currentTempC !== null) {
        fallbackClaims.push({
          text: `Temperatura actual en ${muniProfile?.nombre || "la zona"}: ${externalContext.climate.currentTempC}°C`,
          claimType: "forecast",
          source: "Open-Meteo",
          observedAt: externalContext.climate.observedAt,
          value: externalContext.climate.currentTempC,
          unit: "°C",
        });
      }
      if (historicalYield) {
        fallbackClaims.push({
          text: `Rendimiento histórico promedio observado: ${historicalYield.averageYieldTonHa} ton/ha (${historicalYield.minYear}-${historicalYield.lastObservedYear})`,
          claimType: "observed",
          source: "EVA / MinAgricultura",
          value: historicalYield.averageYieldTonHa,
          unit: "ton/ha",
        });
      }

      const ragAnswer = ragResults[0]?.entry.answer;
      const fallbackText = ragAnswer
        ? `⚠️ **Modo Asistido (RAG):** Te presentamos la información técnica disponible:\n\n${ragAnswer}`
        : `⚠️ **Información agroclimática:** Datos registrados para ${muniProfile?.nombre || "el municipio"}. Temperatura: ${externalContext.climate.currentTempC ?? "N/A"}°C, Humedad: ${externalContext.climate.humidityPct ?? "N/A"}%.`;

      finalResponse = {
        answer: fallbackText,
        summary: `Recomendación técnica basada en documentación oficial para ${muniProfile?.nombre || "la zona"}.`,
        claims: fallbackClaims,
        recommendations: [
          {
            action:
              "Consultar a un extensionista técnico local de Fedecacao / Cenicafé para confirmación en campo.",
            basis: sources,
            priority: "medium",
          },
        ],
        uncertainties: [
          "Motor de inferencia neuronal temporalmente en modo asistido por alta demanda.",
        ],
        insufficientData: !historicalYield && externalContext.climate.status !== "available",
        needsHumanReview: true,
      };
    }

    saveMessage(sid, {
      role: "assistant",
      content: finalResponse.answer,
      metadata: { intent, provider: llmResult.provider, degraded: llmResult.degraded },
    }).catch(() => {});

    const payload: ChatResponsePayload = {
      ...finalResponse,
      reply: finalResponse.answer,
      intent,
      provider: llmResult.provider,
      degraded: llmResult.degraded,
      errorCode: llmResult.errorCode,
      requestId,
      latencyMs: Date.now() - overallStart,
      data: {
        municipio: muniProfile?.nombre ?? rawMunicipio ?? null,
        cultivo: rawCultivo ?? null,
        lat: muniProfile ? muniProfile.latitud : null,
        lon: muniProfile ? muniProfile.longitud : null,
        sources,
        sourceOfMunicipality: entities.sourceOfMunicipality,
        sourceOfCrop: entities.sourceOfCrop,
        conflictDetected: entities.conflictDetected,
      },
    };

    return jsonResponse(payload as unknown as Record<string, unknown>, 200, origin);
  } catch (err) {
    const latencyMs = Date.now() - overallStart;
    console.error(`[Chat Internal Error] Request ${requestId}, duration: ${latencyMs}ms:`, err);

    const errorPayload: ChatResponsePayload = {
      answer:
        "😕 Ocurrió un error al procesar tu consulta agroclimática. Por favor, intenta de nuevo en unos momentos.",
      reply:
        "😕 Ocurrió un error al procesar tu consulta agroclimática. Por favor, intenta de nuevo en unos momentos.",
      summary: "Error de procesamiento en el servidor.",
      claims: [],
      recommendations: [],
      uncertainties: ["Error temporal de comunicación con los servicios."],
      insufficientData: true,
      needsHumanReview: false,
      intent: "UNKNOWN",
      provider: "static",
      degraded: true,
      errorCode: "INTERNAL_ERROR",
      requestId,
      latencyMs,
      data: null,
    };

    return jsonResponse(errorPayload as unknown as Record<string, unknown>, 500, origin);
  }
});
