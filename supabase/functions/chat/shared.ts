export type Intent =
  | "CROP_RECOMMENDATION"
  | "CROP_RISK_ANALYSIS"
  | "CROP_REQUIREMENTS"
  | "GENERAL"
  | "GREETING"
  | "UNKNOWN";

export interface RealTimeData {
  clima: {
    current?: { temperature_2m: number; relative_humidity_2m: number };
    daily?: {
      temperature_2m_min: number[];
      temperature_2m_max: number[];
      precipitation_sum: number[];
    };
  } | null;
  suelo: { ph: number; textura: string } | null;
}

export function classifyIntent(msg: string): Intent {
  const ascii = msg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(hola|buenos dias|buenas tardes|buenas noches)/.test(ascii)) return "GREETING";

  if (
    /recomiend/.test(ascii) ||
    /viabilidad/.test(ascii) ||
    /viable/.test(ascii) ||
    /(que|cuál|cual|mejor|que cultivo|cual cultivo).{0,20}cultivo/.test(ascii) ||
    /cultivo.{0,20}(que|cuál|cual|mejor)/.test(ascii) ||
    (/cultivo/.test(ascii) && /conviene|recomienda|siembra|produce/.test(ascii)) ||
    /apto para/.test(ascii) ||
    /funciona en/.test(ascii)
  )
    return "CROP_RECOMMENDATION";

  if (
    /riesgo/.test(ascii) ||
    /peligro/.test(ascii) ||
    /exito/.test(ascii) ||
    /éxito/.test(ascii) ||
    /probabilidad/.test(ascii) ||
    /tiene exito/.test(ascii) ||
    /saldrá/.test(ascii) ||
    /saldra/.test(ascii)
  )
    return "CROP_RISK_ANALYSIS";

  if (
    /requisito/.test(ascii) ||
    /como (sembrar|plantar|cultivar)/.test(ascii) ||
    /pasos para sembrar/.test(ascii) ||
    /\bsembrar\b/.test(ascii) ||
    /\bplantar\b/.test(ascii) ||
    /\bcultivar\b/.test(ascii) ||
    /ciclo de vida/.test(ascii) ||
    /cuidados/.test(ascii) ||
    /cosecha/.test(ascii)
  )
    return "CROP_REQUIREMENTS";

  return "UNKNOWN";
}

const SYSTEM_PREAMBLE = `Eres un agrónomo experto en Santander, Colombia. Responde en español, sé conciso (<300 palabras), usa emojis.`;

function fmtClima(municipio: string, data: RealTimeData): string {
  const lines = [`### Datos reales de ${municipio}`];
  if (data.clima) {
    const precip7d = (data.clima.daily?.precipitation_sum ?? []).reduce(
      (a: number, b: number) => a + b,
      0,
    );
    const tempMin = data.clima.daily?.temperature_2m_min?.[0];
    const tempMax = data.clima.daily?.temperature_2m_max?.[0];
    lines.push(
      `- Open-Meteo:`,
      `  - Temp actual: ${data.clima.current?.temperature_2m ?? "N/A"}°C${tempMin != null && tempMax != null ? ` (rango ${tempMin}-${tempMax}°C)` : ""}`,
      `  - Precip 7d: ${precip7d} mm`,
      `  - Humedad: ${data.clima.current?.relative_humidity_2m ?? "N/A"}%`,
    );
  }
  if (data.suelo) {
    lines.push(
      `- SoilGrids:`,
      `  - pH suelo: ${data.suelo.ph ?? "N/A"}`,
      `  - Textura: ${data.suelo.textura ?? "N/A"}`,
    );
  }
  if (!data.clima && !data.suelo) {
    lines.push("(Datos climáticos no disponibles)");
  }
  return lines.join("\n");
}

export function buildSystemPrompt(
  intent: Intent,
  municipio: string,
  data: RealTimeData | null,
  ragContext: string,
): string {
  const sections: string[] = [SYSTEM_PREAMBLE];

  if (ragContext) {
    sections.push(`\n### Knowledge Base (fuente confiable)\n${ragContext}`);
  }
  if (data && municipio) {
    sections.push(fmtClima(municipio, data));
  }

  sections.push(buildInstructions(intent));
  return sections.join("\n\n");
}

function buildInstructions(intent: Intent): string {
  switch (intent) {
    case "CROP_RECOMMENDATION":
      return `### Instrucciones
1. Recomienda los 3 cultivos más viables ordenados por confianza.
2. Para cada: % de confianza, por qué viable (según datos reales), 1 riesgo principal.
3. Si el usuario menciona un cultivo específico, enfócate en él.`;
    case "CROP_RISK_ANALYSIS":
      return `### Instrucciones
1. Calcula probabilidad de éxito (0-100%).
2. Lista 3 riesgos principales con nivel (Alto/Medio/Bajo).
3. Da 2 recomendaciones prácticas para mitigar riesgos.`;
    case "CROP_REQUIREMENTS":
      return `### Instrucciones
1. Haz un checklist: ¿cumple o no cada requisito?
2. Indica qué falta y cómo corregirlo.
3. Sé práctico y accionable.`;
    default:
      return `### Instrucciones
Responde de forma útil y basada en datos. Si no sabes, sugiere preguntar a un técnico local.`;
  }
}
