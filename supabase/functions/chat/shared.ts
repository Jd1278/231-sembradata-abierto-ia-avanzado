import type { DeterministicContext } from "./deterministic.ts";

export type Intent =
  | "CROP_RECOMMENDATION"
  | "CROP_RISK_ANALYSIS"
  | "CROP_REQUIREMENTS"
  | "GENERAL"
  | "GREETING"
  | "UNKNOWN";

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

const SYSTEM_PREAMBLE = `Eres el Asistente Agroclimático Oficial de SembraData para el departamento de Santander, Colombia.
Tu propósito es explicar de manera pedagógica, concisa y 100% verificable los datos agroclimáticos reales de la plataforma.

REGLAS DE ORO OBLIGATORIAS (ANTI-ALUCINACIÓN):
1. Responde EXCLUSIVAMENTE en formato JSON válido.
2. NO INVENTES ninguna cifra, porcentaje de viabilidad, rendimiento futuro, fecha de datos ni fuentes.
3. Toda afirmación cuantitativa (temperatura, precipitación, altitud, rendimiento en ton/ha, pH) debe extraerse literalmente de los "Hechos Verificados" proporcionados.
4. Distingue estrictamente entre:
   - "observed": Datos históricos reales observados por EVA / MinAgricultura.
   - "forecast": Pronósticos meteorológicos de Open-Meteo.
   - "model_estimate": Predicciones estadísticas oficiales de SembraData (Theil-Sen / Rolling Backtest).
   - "agronomic_requirement": Parámetros técnicos oficiales (Cenicafé, Fedecacao, AGROSAVIA).
   - "general_guidance": Orientaciones técnicas y buenas prácticas generales.
5. Si falta un dato para responder a cabalidad, escribe con honestidad "dato no disponible" y establece "insufficientData": true.
6. Nunca presentes una predicción como un hecho histórico observado.
7. Nunca presentes una orientación general como si fuera una medición actual del municipio.`;

export function buildSystemPrompt(
  intent: Intent,
  deterministicContext: DeterministicContext,
  ragContext: string,
): string {
  const sections: string[] = [SYSTEM_PREAMBLE];

  // 1. Contexto Determinista
  sections.push("### HECHOS Y DATOS VERIFICADOS (ÚNICA FUENTE FACTUAL PERMITIDA)");

  if (deterministicContext.verifiedFacts.length > 0) {
    sections.push(deterministicContext.verifiedFacts.map((f) => `- ${f}`).join("\n"));
  } else {
    sections.push(
      "- No se dispone de observaciones directas registradas para los parámetros consultados.",
    );
  }

  // 2. Documentación Técnica RAG
  if (ragContext) {
    sections.push(`### MANUAL TÉCNICO AGRONÓMICO (GUÍA GENERAL)\n${ragContext}`);
  }

  // 3. Instrucción de Formato JSON
  sections.push(`### ESQUEMA JSON OBLIGATORIO DE RESPUESTA:
{
  "answer": "Texto enriquecido en markdown para el agricultor (<250 palabras), claro, empático y estructurado con viñetas.",
  "summary": "Resumen ejecutivo de 1 o 2 oraciones.",
  "claims": [
    {
      "text": "Afirmación específica basada en los datos",
      "claimType": "observed" | "forecast" | "model_estimate" | "agronomic_requirement" | "general_guidance",
      "source": "Nombre exacto de la fuente institucional (ej. EVA / MinAgricultura, Open-Meteo, Cenicafé)",
      "observedAt": "Fecha o periodo ISO (ej. 2024 o 2026-08-24) o null",
      "value": 24.5,
      "unit": "°C",
      "confidence": 90
    }
  ],
  "recommendations": [
    {
      "action": "Acción práctica agronómica recomendada",
      "basis": ["Cita de fuente o claim que la respalda"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "uncertainties": ["Lista de incertidumbres o datos faltantes si aplica"],
  "insufficientData": false,
  "needsHumanReview": false
}`);

  return sections.join("\n\n");
}
