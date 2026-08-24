/**
 * Serverless Handler - Endpoints de reportes y notificaciones
 *
 * Los endpoints en esta capa retornan HTTP 501 Not Implemented
 * para evitar respuestas simuladas sin operaciones reales persistidas.
 */

interface ServerlessEvent {
  path: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
}

interface ServerlessResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

const ALLOWED_ORIGINS = [
  "https://231-sembradata-abierto-ia-avanzado.vercel.app",
  "https://lovable.dev",
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^https:\/\/(231-)?[a-z0-9-]+-jd1278s-projects\.vercel\.app$/,
  /^https:\/\/(231-)?sembradata-abierto-ia-avanzado.*\.vercel\.app$/,
];

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
}

function getCorsHeaders(origin?: string): Record<string, string> {
  if (!origin || !isOriginAllowed(origin)) {
    return { Vary: "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export async function handler(event: ServerlessEvent): Promise<ServerlessResponse> {
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  if (event.method === "OPTIONS") {
    if (origin && !isOriginAllowed(origin)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden: Origin not allowed", code: "CORS_FORBIDDEN" }),
        headers: { "Content-Type": "application/json", Vary: "Origin" },
      };
    }
    return { statusCode: 204, body: "", headers: corsHeaders };
  }

  if (origin && !isOriginAllowed(origin)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden: Origin not allowed", code: "CORS_FORBIDDEN" }),
      headers: { "Content-Type": "application/json", Vary: "Origin" },
    };
  }

  switch (event.path) {
    case "/api/reports/generate":
    case "/api/reports/schedule":
    case "/api/notifications/send":
      return {
        statusCode: 501,
        body: JSON.stringify({
          error:
            "Endpoint no implementado en capa serverless. Operación disponible exclusivamente vía Supabase Backend / Edge Functions autenticadas.",
          code: "NOT_IMPLEMENTED",
          path: event.path,
        }),
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      };

    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Ruta no encontrada", code: "NOT_FOUND" }),
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      };
  }
}
