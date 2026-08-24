import type { DeterministicContext } from "./deterministic.ts";

export type Intent =
  | "CURRENT_CLIMATE"
  | "HISTORICAL_YIELD"
  | "STATISTICAL_PREDICTION"
  | "MARKET_PRICE"
  | "CROP_RISK_ANALYSIS"
  | "RISK_ANALYSIS"
  | "CROP_RECOMMENDATION"
  | "CROP_REQUIREMENTS"
  | "MUNICIPALITY_LIST"
  | "INDICATOR_EXPLANATION"
  | "COMPARE_CROPS"
  | "GREETING"
  | "GENERAL"
  | "CLARIFICATION_REQUIRED"
  | "UNKNOWN";

export function classifyIntent(msg: string): Intent {
  const ascii = msg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Saludos
  if (/^(hola|buenos dias|buenas tardes|buenas noches|que tal|saludos|hey|buen dia)/.test(ascii)) {
    return "GREETING";
  }

  // 2. Consulta de municipios disponibles
  if (
    /87 municipios/.test(ascii) ||
    /cuales municipios/.test(ascii) ||
    /que municipios/.test(ascii) ||
    /lista de municipios/.test(ascii) ||
    /municipios de santander/.test(ascii) ||
    /cobertura de municipios/.test(ascii)
  ) {
    return "MUNICIPALITY_LIST";
  }

  // 3. Comparación entre cultivos
  if (
    /compar(ar|acion|a|ando)/.test(ascii) ||
    (ascii.includes("cafe") && ascii.includes("cacao")) ||
    (ascii.includes("cafe") && ascii.includes("granadilla")) ||
    (ascii.includes("cacao") && ascii.includes("granadilla")) ||
    /diferencia entre/.test(ascii) ||
    /cual rinde mas/.test(ascii) ||
    /cual produce mas/.test(ascii)
  ) {
    return "COMPARE_CROPS";
  }

  // 4. Explicación de indicadores agroclimáticos
  if (
    /que significa/.test(ascii) ||
    /que es (el |la |un |una )?(gdd|aridez|evapotranspiracion|ndvi|ph|kpi|materia organica|score|viabilidad|indice)/.test(
      ascii,
    ) ||
    /como se interpreta/.test(ascii) ||
    /que quiere decir/.test(ascii)
  ) {
    return "INDICATOR_EXPLANATION";
  }

  // 5. Precios y mercado internacional
  if (
    /precio/.test(ascii) ||
    /cotizacion/.test(ascii) ||
    /mercado/.test(ascii) ||
    /\bbolsa\b/.test(ascii) ||
    /cuanto vale/.test(ascii) ||
    /cuanto cuesta/.test(ascii) ||
    /dolar/.test(ascii) ||
    /centavos/.test(ascii) ||
    /\bice\b/.test(ascii) ||
    /\bsipsa\b/.test(ascii) ||
    /vender/.test(ascii)
  ) {
    return "MARKET_PRICE";
  }

  // 6. Rendimiento histórico observado
  if (
    /historico/.test(ascii) ||
    /historica/.test(ascii) ||
    /produccion pasada/.test(ascii) ||
    /cuanto se ha producido/.test(ascii) ||
    /rendimiento anterior/.test(ascii) ||
    /registros pasados/.test(ascii) ||
    /eva/.test(ascii) ||
    /minagricultura/.test(ascii)
  ) {
    return "HISTORICAL_YIELD";
  }

  // 7. Predicción y pronóstico futuro
  if (
    /prediccion/.test(ascii) ||
    /proyeccion/.test(ascii) ||
    /pronostico estadistico/.test(ascii) ||
    /cuanto va a producir/.test(ascii) ||
    /cuanto rendira/.test(ascii) ||
    /rendimiento futuro/.test(ascii) ||
    /proximos a(n|ñ)os/.test(ascii) ||
    /theil sen/.test(ascii)
  ) {
    return "STATISTICAL_PREDICTION";
  }

  // 8. Clima actual y meteorología
  if (
    /clima actual/.test(ascii) ||
    /temperatura actual/.test(ascii) ||
    /esta lloviendo/.test(ascii) ||
    /cuanto llueve/.test(ascii) ||
    /lluvia hoy/.test(ascii) ||
    /pronostico 7 dias/.test(ascii) ||
    /humedad actual/.test(ascii) ||
    /viento hoy/.test(ascii) ||
    /radiacion solar/.test(ascii) ||
    /estado del tiempo/.test(ascii)
  ) {
    return "CURRENT_CLIMATE";
  }

  // 9. Recomendación de cultivos y viabilidad
  if (
    /recomiend/.test(ascii) ||
    /viabilidad/.test(ascii) ||
    /viable/.test(ascii) ||
    /(que|cuál|cual|mejor|que cultivo|cual cultivo).{0,20}cultivo/.test(ascii) ||
    /cultivo.{0,20}(que|cuál|cual|mejor)/.test(ascii) ||
    (/cultivo/.test(ascii) && /conviene|recomienda|siembra|produce/.test(ascii)) ||
    /apto para/.test(ascii) ||
    /funciona en/.test(ascii)
  ) {
    return "CROP_RECOMMENDATION";
  }

  // 10. Riesgos agroclimáticos
  if (
    /riesgo/.test(ascii) ||
    /peligro/.test(ascii) ||
    /exito/.test(ascii) ||
    /éxito/.test(ascii) ||
    /probabilidad/.test(ascii) ||
    /tiene exito/.test(ascii) ||
    /saldrá/.test(ascii) ||
    /saldra/.test(ascii) ||
    /helada/.test(ascii) ||
    /sequia/.test(ascii) ||
    /plaga/.test(ascii)
  ) {
    return "CROP_RISK_ANALYSIS";
  }

  // 11. Requisitos de siembra y agronómicos
  if (
    /requisito/.test(ascii) ||
    /como (sembrar|plantar|cultivar)/.test(ascii) ||
    /pasos para sembrar/.test(ascii) ||
    /\bsembrar\b/.test(ascii) ||
    /\bplantar\b/.test(ascii) ||
    /\bcultivar\b/.test(ascii) ||
    /ciclo de vida/.test(ascii) ||
    /cuidados/.test(ascii) ||
    /cosecha/.test(ascii) ||
    /altitud optima/.test(ascii) ||
    /ph optimo/.test(ascii)
  ) {
    return "CROP_REQUIREMENTS";
  }

  // 12. Consultas demasiado cortas o ambiguas
  if (ascii.length < 5 || /^(que|como|cuando|donde|por que)\??$/.test(ascii)) {
    return "CLARIFICATION_REQUIRED";
  }

  return "GENERAL";
}

const SYSTEM_PREAMBLE = `Eres el Asistente Agroclimático Oficial de SembraData para el departamento de Santander, Colombia.
Tu propósito es explicar de manera pedagógica, concisa y 100% verificable los datos agroclimáticos reales de la plataforma.

REGLAS DE ORO OBLIGATORIAS (ANTI-ALUCINACIÓN):
1. Responde EXCLUSIVAMENTE en formato JSON válido según el esquema solicitado.
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
7. Si el usuario pregunta por un municipio fuera de Santander (ej. Medellín, Bogotá, Cali), explícale con amabilidad que SembraData cubre exclusivamente los 87 municipios de Santander y sugiere municipios como San Gil, San Vicente de Chucurí o Rionegro.`;

export function buildSystemPrompt(
  intent: Intent,
  deterministicContext: DeterministicContext,
  ragContext: string,
): string {
  const sections: string[] = [SYSTEM_PREAMBLE];

  // Intención detectada
  sections.push(`### INTENCIÓN DETECTADA DE LA CONSULTA:\n\`${intent}\``);

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
