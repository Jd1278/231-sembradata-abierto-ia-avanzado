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
