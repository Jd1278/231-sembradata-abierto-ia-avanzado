import { KNOWLEDGE_BASE, SYNONYMS, type KnowledgeEntry } from "./knowledge-base";
import { CROP_DATA } from "../components/sembradata/data";
import type { CropKey } from "@/types/crops";
export interface KnowledgeContext {
  entries: { question: string; answer: string; category: string; score: number }[];
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

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 2);
}

function expandSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (token === key || syns.includes(token)) {
        expanded.add(key);
        for (const s of syns) expanded.add(s);
      }
    }
  }
  return [...expanded];
}

function calculateRelevance(
  entry: KnowledgeEntry,
  queryTokens: string[],
  expandedTokens: string[],
): number {
  let score = 0;
  const queryStr = normalize(expandedTokens.join(" "));

  for (const keyword of entry.keywords) {
    const kw = normalize(keyword);
    if (queryStr.includes(kw)) {
      score += kw.length * 2;
    }
    for (const token of expandedTokens) {
      if (token.includes(kw) || kw.includes(token)) {
        score += 3;
      }
    }
  }

  if (entry.crop) {
    const cropInfo = CROP_DATA[entry.crop as CropKey];
    if (cropInfo) {
      const cropName = normalize(cropInfo.label);
      if (queryStr.includes(cropName)) {
        score += 5;
      }
    }
  }

  const categoryKeywords: Record<string, string[]> = {
    siembra: ["sembrar", "siembra", "plantar", "época", "cuando"],
    plaga: ["plaga", "enfermedad", "hongo", "roya", "broca"],
    cultivo: ["rendimiento", "producción", "toneladas", "cosecha"],
    clima: ["clima", "temperatura", "lluvia", "tiempo"],
    suelo: ["suelo", "ph", "tierra", "fertilidad"],
    riesgo: ["riesgo", "peligro", "alerta", "amenaza"],
    general: ["mercado", "precio", "sostenible", "financiación"],
  };

  const entryCategoryKws = categoryKeywords[entry.category] ?? [];
  for (const ck of entryCategoryKws) {
    if (expandedTokens.some((t) => t.includes(ck) || ck.includes(t))) {
      score += 2;
    }
  }

  const queryLen = expandedTokens.length;
  if (queryLen > 0) {
    const matchRatio = score / (entry.keywords.length * 2 + 10);
    score = score * (1 + matchRatio * 0.5);
  }

  return score;
}

export function buildRagContext(query: string, topK = 5): KnowledgeContext {
  const queryTokens = tokenize(query);
  const expandedTokens = expandSynonyms(queryTokens);

  const scored: { entry: KnowledgeEntry; score: number }[] = [];
  for (const entry of KNOWLEDGE_BASE) {
    const score = calculateRelevance(entry, queryTokens, expandedTokens);
    if (score > 0) {
      scored.push({ entry, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);

  const entries = scored.slice(0, topK).map((s) => ({
    question: s.entry.question,
    answer: s.entry.answer,
    category: s.entry.category,
    score: s.score,
  }));

  return { entries };
}

export function detectIntent(query: string): string {
  const q = normalize(query);

  if (q.match(/\b(cuando|cuándo|época|momento|fecha|mes)\b/)) return "temporal";
  if (q.match(/\b(cómo|como|técnica|método|metodo|proceso|paso)\b/)) return "procedural";
  if (q.match(/\b(cuánto|cuanto|cantidad|rendimiento|toneladas|kilos|peso)\b/))
    return "cuantitativo";
  if (q.match(/\b(dónde|donde|lugar|zona|municipio|departamento|región)\b/)) return "geografico";
  if (q.match(/\b(porque|por qué|razón|razon|causa|motivo)\b/)) return "explicativo";
  if (q.match(/\b(comparar|diferencia|mejor|peor|versus|vs)\b/)) return "comparativo";
  if (q.match(/\b(recomendar|sugerir|consejo|opinar|opinión)\b/)) return "recomendacion";

  return "general";
}

export function analyzeConversation(messages: { role: string; text: string }[]): {
  topicsDiscussed: string[];
  userIntent: string | null;
} {
  const topicsDiscussed: string[] = [];
  let userIntent: string | null = null;

  for (const msg of messages) {
    if (msg.role === "user") {
      const tokens = tokenize(msg.text);
      const expanded = expandSynonyms(tokens);

      if (expanded.some((t) => ["cacao", "chocolate", "mazorca"].includes(t)))
        topicsDiscussed.push("cacao");
      if (expanded.some((t) => ["cafe", "café", "pergamino", "arabica"].includes(t)))
        topicsDiscussed.push("cafe");
      if (expanded.some((t) => ["granadilla", "pasiflora", "maracuya"].includes(t)))
        topicsDiscussed.push("granadilla");
      if (expanded.some((t) => ["clima", "temperatura", "lluvia", "tiempo"].includes(t)))
        topicsDiscussed.push("clima");
      if (expanded.some((t) => ["siembra", "sembrar", "plantar", "época"].includes(t)))
        topicsDiscussed.push("siembra");
      if (expanded.some((t) => ["plaga", "enfermedad", "hongo", "roya"].includes(t)))
        topicsDiscussed.push("plagas");
      if (expanded.some((t) => ["suelo", "ph", "tierra", "fertilidad"].includes(t)))
        topicsDiscussed.push("suelo");
      if (expanded.some((t) => ["mercado", "precio", "vender", "exportar"].includes(t)))
        topicsDiscussed.push("mercado");

      if (expanded.some((t) => ["cuando", "época", "momento", "fecha"].includes(t)))
        userIntent = "temporal";
      else if (expanded.some((t) => ["como", "técnica", "método", "proceso"].includes(t)))
        userIntent = "procedural";
      else if (expanded.some((t) => ["cuanto", "cantidad", "rendimiento", "toneladas"].includes(t)))
        userIntent = "cuantitativo";
      else if (expanded.some((t) => ["donde", "lugar", "zona", "municipio"].includes(t)))
        userIntent = "geografico";
    }
  }

  return {
    topicsDiscussed: [...new Set(topicsDiscussed)],
    userIntent,
  };
}
