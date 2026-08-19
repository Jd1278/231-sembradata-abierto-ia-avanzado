const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const CHAT_HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

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

export async function generateRecommendation(ctx: RecommendationContext): Promise<string | null> {
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
    return data.reply ?? null;
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

  if (crop) {
    const cropLower = normalize(crop);
    if (cropLower.includes("cacao")) {
      suggestions.push("¿Cuándo sembrar cacao?");
      suggestions.push("¿Qué enfermedades afectan al cacao?");
      suggestions.push("¿Qué rendimiento esperar?");
    } else if (cropLower.includes("cafe") || cropLower.includes("café")) {
      suggestions.push("¿Cuándo sembrar café?");
      suggestions.push("¿Qué plagas afectan al café?");
      suggestions.push("¿A qué altitud crece mejor?");
    } else if (cropLower.includes("granadilla")) {
      suggestions.push("¿Cuándo sembrar granadilla?");
      suggestions.push("¿Cómo cuidar la granadilla?");
      suggestions.push("¿Qué clima necesita?");
    }
  }

  if (municipio) {
    suggestions.push(`¿Cómo está el clima en ${municipio}?`);
    suggestions.push(`¿Qué riesgo hay en ${municipio}?`);
  }

  suggestions.push("¿Qué significan los niveles de riesgo?");
  suggestions.push("¿Cómo hacer agricultura sostenible?");
  suggestions.push("¿Qué financiación existe para agricultores?");

  return suggestions.slice(0, 5);
}
