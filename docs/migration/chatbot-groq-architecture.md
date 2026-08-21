# Chatbot — Arquitectura con Groq (Llama 3.1 8B) + RAG

## Estado Actual (Julio 2026)

El chatbot usa clasificador heurístico de intenciones + extracción de entidades + contexto RAG sobre la base de conocimiento local, con respuesta generada por **Groq Llama 3.1 8B** desplegado como **Supabase Edge Function**. No depende de n8n ni de orquestadores externos.

## Arquitectura

```
Usuario → ChatbotPanel → Edge Function `chat` (Supabase)
                            │
                ┌───────────┴───────────────────┐
                │                               │
        classifyIntent()                 extractEntities()
        (heurístico, intent-classifier.ts)  (regex, entity-extractor.ts)
                │                               │
                └───────────┴─────┬─────────────┘
                                  │
                         buildRagContext()
                         (chatbot-rag.ts +
                          knowledge-base.ts,
                          50+ entradas)
                                  │
                          Groq Llama 3.1 8B
                          (API compatible con OpenAI,
                           GROQ_API_KEY en Supabase)
                                  │
                            Respuesta + fuentes
                            (contexto de conocimiento)
```

## Puntos de Integración

### 1. Supabase Edge Function `chat`

- **Archivo:** `supabase/functions/chat/index.ts`
- **Invocación:** desde el frontend vía `@supabase/supabase-js` con la anon key
- **Lenguaje:** Deno
- **Secreto:** `GROQ_API_KEY` (configurado en el dashboard de Supabase, nunca en el frontend)
- **Ruta secundaria:** `supabase/functions/cache-cleanup` — limpieza de caché expirado

### 2. Payload que recibe la Edge Function

```json
{
  "message": "texto de la consulta del usuario",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "knowledgeContext": {
    "entries": [
      {
        "question": "¿Cuándo sembrar cacao?",
        "answer": "La época...",
        "category": "siembra",
        "score": 12.5
      }
    ]
  }
}
```

### 3. Respuesta que devuelve la Edge Function

```json
{
  "reply": "texto de respuesta formateado (markdown ligero)",
  "confidence": 0.85,
  "metadata": {
    "variablesUsadas": ["temperatura", "precipitación"],
    "fuentes": ["Open-Meteo", "SoilGrids"],
    "fechaActualizacion": "2026-07-29"
  }
}
```

### 4. Archivos involucrados

| Archivo                             | Rol                                            |
| ----------------------------------- | ---------------------------------------------- |
| `supabase/functions/chat/index.ts`  | Edge Function principal (clasificación + Groq) |
| `src/services/chatbot.ts`           | Sugerencias de preguntas para el panel         |
| `src/services/chatbot-rag.ts`       | Contexto RAG + detección de intención          |
| `src/services/intent-classifier.ts` | Clasificador heurístico de intenciones         |
| `src/services/entity-extractor.ts`  | Extracción de entidades por regex (sin API)    |
| `src/services/knowledge-base.ts`    | 50+ entradas de conocimiento                   |
| `src/services/data-orchestrator.ts` | Orquestador de datos climáticos y suelo        |
| `.env`                              | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  |

## Despliegue de la Edge Function

```bash
# Instalar CLI de Supabase
npx supabase login

# Vincular el proyecto y desplegar la función
npx supabase link --project-ref <ref>
npx supabase functions deploy chat

# Configurar el secreto GROQ_API_KEY
npx supabase secrets set GROQ_API_KEY=tu_key
```

## Importación de Conocimiento para RAG

La base de conocimiento se mantiene en `src/services/knowledge-base.ts`:

```typescript
import { KNOWLEDGE_BASE } from "./services/knowledge-base";
const data = buildRagContext(consulta, 5);
// data.entries → array de { question, answer, category, score }
// Los top-K ítems más relevantes se inyectan en el system prompt de Groq
```

## Mapa de Archivos del Chatbot

```
src/services/
├── chatbot.ts              # Sugerencias de preguntas
├── chatbot-rag.ts          # Contexto RAG + detección de intención
├── knowledge-base.ts       # 50+ entradas de conocimiento
├── intent-classifier.ts    # Clasificador heurístico de intenciones
├── entity-extractor.ts     # Extracción de entidades por regex
├── data-orchestrator.ts    # Orquestador de clima/suelo

supabase/functions/
├── chat/index.ts           # Edge Function (clasificación + Groq)
└── cache-cleanup/index.ts  # Limpieza de caché expirado

src/components/sembradata/
├── ChatbotPanel.tsx        # UI del chatbot flotante
```

## Rollback / Modo local

El clasificador heurístico y la base de conocimiento funcionan sin LLM: si la Edge Function no está desplegada o Groq no responde, se puede responder desde el contexto local de conocimiento sin generar respuestas por LLM.
