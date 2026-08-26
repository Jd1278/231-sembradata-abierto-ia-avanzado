# Guía de Arquitectura y Despliegue de Edge Functions — SembraData

Documentación técnica para el despliegue, configuración segura de secretos, validación Zod y observabilidad de las Edge Functions de SembraData en Supabase.

---

## 1. Catálogo de Edge Functions

| Función                                                                                                                                                              | Runtime | Propósito                                                                                                                           | Autenticación y Seguridad                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`supabase/functions/chat`](file:///c:/Users/inteligencia/Documents/SembraData/231-sembradata-abierto-ia-avanzado/supabase/functions/chat)                           | Deno    | Asistente agroclimático trazable con Groq (`openai/gpt-oss-20b`), motor determinista, RAG híbrido y verificador anti-alucinaciones. | Allowlist CORS dinámico, validación Zod de claims, rate limiting y modo degradado. |
| [`supabase/functions/gemini-assessment`](file:///c:/Users/inteligencia/Documents/SembraData/231-sembradata-abierto-ia-avanzado/supabase/functions/gemini-assessment) | Deno    | Evaluación cualitativa de coherencia biológica y agronómica mediante Google Gemini 2.0 Flash API.                                   | Allowlist CORS dinámico, validación Zod I/O, timeout 8s y `requestId`.             |

---

## 2. Configuración de Secretos en Supabase

Los secretos se configuran de forma segura en el Dashboard de Supabase (**Project Settings > Edge Functions > Secrets**) o mediante la CLI de Supabase autenticada:

```bash
# Configurar la API key de Groq para el chatbot
npx supabase secrets set GROQ_API_KEY="<tu_groq_api_key>" --project-ref <project-ref>

# Configurar la API key de Gemini para la evaluación de predicciones
npx supabase secrets set GEMINI_API_KEY="<tu_gemini_api_key>" --project-ref <project-ref>

# (Opcional) Orígenes CORS permitidos adicionales separados por coma
npx supabase secrets set ALLOWED_ORIGINS="https://sembradata.com,https://www.sembradata.com" --project-ref <project-ref>
```

> [!IMPORTANT]
> **Regla de Seguridad:** Nunca incluir API keys en el repositorio, en archivos `.env` versionados ni en el código frontend.

---

## 3. Despliegue de Edge Functions

Para desplegar las funciones actualizadas al proyecto de Supabase:

```bash
# Iniciar sesión en Supabase CLI
npx supabase login

# Desplegar la función de chat (Groq + motor determinista)
npx supabase functions deploy chat --project-ref <project-ref> --no-verify-jwt

# Desplegar la función de evaluación agronómica de Gemini
npx supabase functions deploy gemini-assessment --project-ref <project-ref> --no-verify-jwt
```

---

## 4. Política de CORS y Presupuestos de Tiempo

- **Patrones de Origen Permitidos:**
  - Producción: `https://231-sembradata-abierto-ia-avanzado.vercel.app`, `https://lovable.dev`
  - Vercel Previews: `https://*-sembradata-abierto-ia-avanzado*.vercel.app`, `https://231-*-jd1278s-projects.vercel.app`
  - Desarrollo Local: `http://localhost:*`, `http://127.0.0.1:*`
- **Rechazo Explícito:** Orígenes no reconocidos reciben **HTTP 403 Forbidden** con `{ "code": "CORS_FORBIDDEN" }` y encabezado `Vary: Origin`.
- **Presupuestos de Tiempo:**
  - `chat`: 20s timeout global (Geocoding 3.5s, Clima/Suelo 4.0s paralelos, Groq 12.0s).
  - `gemini-assessment`: 8s timeout con respuesta estructurada de fallback seguro.
