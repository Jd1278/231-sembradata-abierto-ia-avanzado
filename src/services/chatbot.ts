const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const CHAT_HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};
const SUPABASE_REST = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;

export interface RecommendationContext {
  municipio: string;
  cultivo: string;
  score: number;
  temp: number;
  precip: number;
  humidity: number;
  ph: number;
  organicMatter: number;
  texture: string;
  altitude: number;
  month: string;
}

export function computeContextHash(ctx: RecommendationContext): string {
  const normMuni = ctx.municipio.toLowerCase().trim();
  const normCrop = ctx.cultivo.toLowerCase().trim();
  const roundedScore = Math.round(ctx.score / 5) * 5; // bins of 5 points
  const roundedTemp = Math.round(ctx.temp);
  const roundedPrecip = Math.round(ctx.precip / 15) * 15;
  const roundedPh = Math.round(ctx.ph * 2) / 2;

  return `${normMuni}:${normCrop}:${roundedScore}:${roundedTemp}c:${roundedPrecip}mm:ph${roundedPh}`;
}

async function getCachedRecommendation(
  municipio: string,
  cultivo: string,
  contextHash: string,
): Promise<{ recommendation: string; cachedAt: string } | null> {
  try {
    const nowIso = new Date().toISOString();
    const params = new URLSearchParams({
      municipio: `eq.${municipio}`,
      cultivo: `eq.${cultivo}`,
      context_hash: `eq.${contextHash}`,
      expires_at: `gt.${nowIso}`,
      order: "created_at.desc",
      limit: "1",
      select: "recommendation,created_at",
    });
    const r = await fetch(`${SUPABASE_REST}/recommendations_cache?${params}`, {
      headers: { apikey: CHAT_HEADERS.apikey, Authorization: CHAT_HEADERS.Authorization },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as { recommendation: string; created_at: string }[];
    if (rows.length === 0 || !rows[0].recommendation) return null;
    return {
      recommendation: rows[0].recommendation,
      cachedAt: rows[0].created_at,
    };
  } catch {
    return null;
  }
}

async function cacheRecommendation(
  municipio: string,
  cultivo: string,
  contextHash: string,
  recommendation: string,
  context: RecommendationContext,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours TTL
    await fetch(`${SUPABASE_REST}/recommendations_cache`, {
      method: "POST",
      headers: {
        ...CHAT_HEADERS,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        municipio,
        cultivo,
        context_hash: contextHash,
        score_range: context.score >= 70 ? "high" : context.score >= 50 ? "mid" : "low",
        recommendation,
        context,
        expires_at: expiresAt,
      }),
    });
  } catch {
    // silent fail for cache write
  }
}

export async function generateRecommendation(ctx: RecommendationContext): Promise<string | null> {
  const hash = computeContextHash(ctx);

  const cached = await getCachedRecommendation(ctx.municipio, ctx.cultivo, hash);
  if (cached) {
    return `${cached.recommendation}\n\n*(Recomendación en caché del ${new Date(cached.cachedAt).toLocaleDateString()})*`;
  }

  try {
    const message = `Genera una recomendación agrícola concisa (máximo 3 oraciones) para ${ctx.cultivo} en ${ctx.municipio}, Santander.
Datos: temperatura ${ctx.temp}°C, precipitación ${ctx.precip}mm, humedad ${ctx.humidity}%, pH ${ctx.ph}, materia orgánica ${ctx.organicMatter}%, textura ${ctx.texture}, altitud ${ctx.altitude}m, mes ${ctx.month}, score de viabilidad ${ctx.score}/100.
Sé específico con el municipio y las condiciones actuales. Incluye una acción concreta.`;

    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: CHAT_HEADERS,
      body: JSON.stringify({ message, sessionId: `rec-${ctx.municipio}-${ctx.cultivo}` }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const reply: string | null = data.answer ?? data.reply ?? null;

    if (reply) {
      await cacheRecommendation(ctx.municipio, ctx.cultivo, hash, reply, ctx);
    }

    return reply;
  } catch {
    return null;
  }
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSuggestions(crop?: string, municipio?: string): string[] {
  const suggestions: string[] = [];
  const muniText = municipio ? municipio.trim() : null;

  let cropDisplay = "café";
  if (crop) {
    const cropLower = normalize(crop);
    if (cropLower.includes("cacao")) cropDisplay = "cacao";
    else if (cropLower.includes("granadilla")) cropDisplay = "granadilla";
    else cropDisplay = "café";
  }

  if (muniText && crop) {
    suggestions.push(`¿Cuándo sembrar ${cropDisplay} en ${muniText}?`);
    suggestions.push(`¿Qué rendimiento histórico de ${cropDisplay} existe en ${muniText}?`);
    suggestions.push(`¿Cuál es la predicción estadística de ${cropDisplay} en ${muniText}?`);
    suggestions.push(`¿Cómo está el clima actual en ${muniText}?`);
    suggestions.push(`¿Cuál es el precio de mercado para ${cropDisplay}?`);
  } else if (muniText) {
    suggestions.push(`¿Qué cultivo es más viable en ${muniText}?`);
    suggestions.push(`¿Cómo está el clima actual en ${muniText}?`);
    suggestions.push(`¿Cuáles son los riesgos agroclimáticos en ${muniText}?`);
    suggestions.push("¿Qué significan los niveles de riesgo?");
    suggestions.push("¿Cuáles son los 87 municipios de Santander?");
  } else if (crop) {
    suggestions.push(`¿Cuáles son los requisitos de siembra para ${cropDisplay}?`);
    suggestions.push(`¿Cuál es el precio internacional de ${cropDisplay}?`);
    suggestions.push(`¿En qué municipios de Santander se cultiva más ${cropDisplay}?`);
    suggestions.push("¿Qué significan los niveles de riesgo?");
    suggestions.push("¿Cómo hacer agricultura sostenible?");
  } else {
    suggestions.push("¿Qué cultivo me recomiendas para Santander?");
    suggestions.push("¿Cuáles son los 87 municipios de Santander?");
    suggestions.push("¿Qué significan los niveles de riesgo agroclimático?");
    suggestions.push("¿Cómo funciona la predicción Theil-Sen?");
    suggestions.push("¿Cómo hacer agricultura sostenible?");
  }

  return suggestions.slice(0, 5);
}
