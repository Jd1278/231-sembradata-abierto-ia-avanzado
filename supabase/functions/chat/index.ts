import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { classifyIntent, buildSystemPrompt, type Intent } from "./shared.ts";
import { searchKnowledgeBase, formatRagContext } from "./rag.ts";
import { saveMessage, getHistory, formatHistoryForLLM } from "./memory.ts";
import { extractEntities } from "./entities.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY")!;

interface ChatRequest {
  message: string;
  sessionId?: string;
}

function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function geocode(
  name: string,
): Promise<{ name: string; latitude: number; longitude: number } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es`;
    const r = await fetchWithTimeout(url, 8000);
    const d = await r.json();
    return d.results?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchClimate(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=7`;
    const r = await fetchWithTimeout(url, 8000);
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchSoil(lat: number, lon: number) {
  try {
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&depth=0-5cm&value=mean&properties=phh2o,clay,sand,silt,ocd`;
    const r = await fetchWithTimeout(url, 15000);
    const d = await r.json();
    const get = (p: string) =>
      d.properties?.layers?.find(
        (l: { name: string; depths?: { values?: { mean?: number } }[] }) => l.name === p,
      )?.depths?.[0]?.values?.mean ?? 0;
    const clay = get("clay"),
      sand = get("sand");
    let textura = "Franco";
    if (clay > 40) textura = "Arcilloso";
    else if (sand > 50) textura = "Arenoso";
    return { ph: get("phh2o") / 10, materiaOrganica: get("ocd"), textura };
  } catch {
    return null;
  }
}

async function askLLM(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string,
  ragFallback?: string,
): Promise<string> {
  if (!GROQ_KEY) {
    return (
      ragFallback ?? "El servicio de IA no está configurado. Por favor contacte al administrador."
    );
  }
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];
  try {
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", 30000, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.4,
        max_tokens: 800,
      }),
    });
    if (!res.ok) {
      console.error("GROQ API error:", res.status);
      return ragFallback ?? "El servicio de IA no está disponible temporalmente. Intenta de nuevo.";
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? ragFallback ?? "No pude generar una respuesta.";
  } catch (e) {
    console.error("GROQ fetch error:", e);
    return (
      ragFallback ?? "Lo siento, no pude generar una respuesta en este momento. Intenta de nuevo."
    );
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { message, sessionId }: ChatRequest = await req.json();
    const sid = sessionId || crypto.randomUUID();

    await saveMessage(sid, { role: "user", content: message });
    const history = await getHistory(sid, 10);

    const intent: Intent = classifyIntent(message);

    if (intent === "GREETING") {
      const reply =
        "¡Hola! 👋 Soy tu asistente agrícola de SembraData. Puedo ayudarte a:\n\n🌱 Recomendar cultivos para tu municipio\n⚠️ Analizar riesgos de un cultivo\n📋 Revisar requisitos de siembra\n\n¿Qué necesitas saber hoy?";
      await saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } });
      return jsonResponse({ reply, intent, data: null });
    }

    const entities = extractEntities(message);
    const municipio = entities.municipio;
    const cultivo = entities.cultivo?.toLowerCase();

    if (!municipio && intent !== "GENERAL" && intent !== "UNKNOWN") {
      const reply =
        '🤔 Para responder necesito que me indiques el **municipio**. Ejemplo: *"¿Qué cultivo es viable en **San Gil**?"*';
      await saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } });
      return jsonResponse({ reply, intent, data: null });
    }

    const [ragResults, geo] = await Promise.all([
      searchKnowledgeBase(message, 2),
      municipio ? geocode(municipio) : null,
    ]);
    const ragContext = formatRagContext(ragResults);

    let clima: unknown = null;
    let suelo: unknown = null;
    const sources = ["Knowledge Base"];

    if (geo) {
      const [c, s] = await Promise.all([
        fetchClimate(geo.latitude, geo.longitude),
        fetchSoil(geo.latitude, geo.longitude),
      ]);
      if (c) sources.push("Open-Meteo");
      if (s) sources.push("SoilGrids");
      clima = c;
      suelo = s;
    }

    const realTimeData = clima && suelo ? { clima, suelo } : null;

    const systemPrompt = buildSystemPrompt(
      intent === "UNKNOWN" ? "GENERAL" : intent,
      geo?.name ?? municipio ?? "",
      realTimeData as Parameters<typeof buildSystemPrompt>[2],
      ragContext,
    );

    const llmHistory = formatHistoryForLLM(history);
    const ragFallback = ragResults.length > 0 ? ragResults[0].entry.answer : undefined;
    const reply = await askLLM(systemPrompt, llmHistory, message, ragFallback);

    await saveMessage(sid, { role: "assistant", content: reply, metadata: { intent } });

    return jsonResponse({
      reply,
      intent,
      data: {
        municipio: geo?.name ?? municipio ?? null,
        cultivo: cultivo ?? null,
        lat: geo?.latitude ?? null,
        lon: geo?.longitude ?? null,
        sources,
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return jsonResponse(
      {
        reply:
          "😕 Ocurrió un error consultando los datos. Por favor intenta de nuevo en unos segundos.",
        intent: "ERROR",
        data: null,
      },
      500,
    );
  }
});
