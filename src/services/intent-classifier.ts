export type ChatIntent =
  | "CROP_RECOMMENDATION"
  | "CROP_RISK_ANALYSIS"
  | "CROP_REQUIREMENTS"
  | "GENERAL_KNOWLEDGE"
  | "GREETING"
  | "UNKNOWN";

const intentPatterns: Record<ChatIntent, RegExp[]> = {
  CROP_RECOMMENDATION: [
    /qu[eé]\s+(cultivar|sembrar|plantar|recomiendas|conviene|es\s+mejor)/i,
    /qu[eé]\s+cultivo\s+(es\s+)?m[aá]s\s+viable/i,
    /recomi[eé]ndame\s+un\s+cultivo/i,
    /para\s+qu[eé]\s+sirve\s+(este|mi)\s+suelo/i,
  ],
  CROP_RISK_ANALYSIS: [
    /riesgos?\s+de\s+cultivar/i,
    /probabilidad\s+de\s+[ée]xito/i,
    /qu[eé]\s+tan\s+(conveniente|riesgoso|seguro)/i,
    /conviene\s+cultivar/i,
    /peligros?\s+de/i,
    /problemas?\s+(con|del)/i,
  ],
  CROP_REQUIREMENTS: [
    /requisitos?\s+para\s+cultivar/i,
    /requisitos?\s+de\s+cultivo/i,
    /qu[eé]\s+necesita\s+/i,
    /condiciones?\s+(para|del|de)/i,
    /c[oó]mo\s+cultivar/i,
    /pasos?\s+para\s+sembrar/i,
  ],
  GENERAL_KNOWLEDGE: [
    /qu[eé]\s+(es|son)/i,
    /c[oó]mo\s+(funciona|se\s+mide)/i,
    /diferencia\s+entre/i,
  ],
  GREETING: [
    /hola/i,
    /buenos\s+d[ií]as/i,
    /buenas\s+tardes/i,
    /buenas\s+noches/i,
    /qu[eé]\s+tal/i,
    /c[oó]mo\s+est[aá]s/i,
  ],
  UNKNOWN: [/.*/],
};

export function classifyIntent(message: string): { intent: ChatIntent; confidence: number } {
  const lower = message.toLowerCase();

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (intent === "UNKNOWN") continue;
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return { intent: intent as ChatIntent, confidence: 0.9 };
      }
    }
  }

  return { intent: "UNKNOWN", confidence: 0.5 };
}
