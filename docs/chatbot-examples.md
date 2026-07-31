# Ejemplos de uso del Chatbot

| Usuario | Intención Detectada | Respuesta del Bot |
| :------ | :------------------ | :---------------- |
| *"Qué cultivo me conviene en San Gil?"* | `CROP_RECOMMENDATION` | 🥇 **Café** (92% confianza) — Temp 16°C ideal, pH 5.8 perfecto. 🥈 Granadilla (78%) — Clima frío favorable. 🥉 Cacao (65%). ⚠️ Riesgo: heladas ocasionales. |
| *"Riesgos de cacao en Barrancabermeja"* | `CROP_RISK_ANALYSIS` | ⚠️ Probabilidad de éxito: **75%**. Riesgos: 1. Temperatura alta (34°C vs óptimo 32°C máx) 🔴 2. pH 7.9 ligeramente alto 🟡 3. Baja materia orgánica 🟡. Recomendación: usar sombra y enmiendas orgánicas. |
| *"Requisitos para granadilla en Piedecuesta"* | `CROP_REQUIREMENTS` | ✅ Temp: 14°C (ideal 15-20°C) ✅ pH: 6.2 (ideal 5.5-6.8) ❌ Precipitación baja: 45mm/7días. Acción: instalar riego por goteo. |

## Flujo

```
consulta → classifyIntent (heurístico) → extractEntities (Groq Llama 3.1 8B) →
geocode (Open-Meteo) → fetchClimate + fetchSoil (paralelo) →
buildPrompt (datos reales inyectados) → askLLM (Groq Llama 3.1 8B) → respuesta
```
