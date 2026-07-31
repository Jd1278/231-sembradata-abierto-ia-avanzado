# Informe Técnico — Optimización SembraData

## Resumen de cambios

Se realizó una reestructuración integral del frontend y del pipeline predictivo
para eliminar datos estáticos, unificar el motor de viabilidad y conectar todos
los componentes con datos climáticos y de suelo reales vía API.

---

## 1. Eliminación de componentes obsoletos

| Archivo                | Acción        | Impacto                          |
|------------------------|---------------|----------------------------------|
| `ExportPdfButton.tsx`  | Eliminado     | PDF no era usado                 |
| `LanguageSwitcher.tsx` | Eliminado     | Solo español                     |
| `i18n/index.ts`        | Simplificado  | 144 traducciones, solo español   |

---

## 2. Unificación del motor de viabilidad

| Archivo                        | Cambio                                              |
|--------------------------------|-----------------------------------------------------|
| `prediction.ts`                | Re-exporta `prediction-v2.ts`                       |
| `prediction-v2.ts`             | Motor único con 10 factores, interacciones, pest    |
| `crop-features.ts`             | Rangos unificados con prediction-v2                 |
| `crop-features.ts`             | `scoreCropClimateMatch` ahora usa rangos por cultivo|
| `inference.ts`                 | Delega a `evaluateViability` (antes duplicaba)      |
| `train.ts`                     | Features alineados con `ClimateFeatures` reales      |

### Arquitectura final del pipeline

```
ClimateData ──► extractClimateFeatures() ──► ClimateFeatures
     │
     ├─► normalizeClimate() ──► NormalizedClimate ──► scoreCropClimateMatch()
     │
     └─► evaluateViability() ──► ViabilityResult (score, factors, pest, recs)
              ▲
              │
         inference.ts predict() (wrapper público)
```

---

## 3. Dashboard con datos reales

| Componente       | Antes                          | Después                              |
|------------------|--------------------------------|--------------------------------------|
| Dashboard        | Datos estáticos + hash riesgo  | `fetchCurrentClimate` + `fetchSoilData` + `evaluateViability` |
| SantanderMap     | `risk` de `MUNICIPIOS` fijo   | Prop `dynamicRisk` para coloreado dinámico |
| RiskChart        | Datos mock                     | Gráfico con `dailyData` real de Open-Meteo |
| YieldChart       | Proyección fija                | Ajuste por `viabilityScore`          |
| ZoneComparison   | Eliminado                      | Funcionalidad descartada del proyecto        |

---

## 4. Correcciones de datos

### Coordenadas geográficas
- `FeatureResult` ahora incluye `geolat`/`geolng` extraídos del GeoJSON real
- `Municipio` expone `geolat`/`geolng` para consumo en componentes
- Dashboard usa `muni.geolat/dept.lat` con fallback

### pH del suelo
- Fuente: SoilGrids API (`phh2o / 10`) — correcto
- Fallback regionalizado en 6 zonas (Amazonía, Orinoquía, Pacífico, Caribe,
  Sierra Nevada, Andina) — antes solo 3 valores posibles
- Altitud estimada desde `factor` en vez de hardcoded 500 msnm

### Rango temporal óptimo
- `OPTIMAL_TIME_RANGES` documentado en `climate-api.ts`
- 90 días actual (Open-Meteo) para estación actual
- 365 días recomendado para ciclo fenológico completo
- Rangos definidos: 7d, 90d, 180d, 365d, 5años, 30años

---

## 5. Chatbot con arquitectura RAG + Groq

| Capa        | Tecnología                              |
|-------------|-----------------------------------------|
| NLP local   | Tokenización + sinónimos + KB           |
| Clasificador| `intent-classifier.ts` (heurístico)     |
| Entidades   | `entity-extractor.ts` (regex, sin API)  |
| RAG         | `chatbot-rag.ts` (contexto de conocimiento) |
| LLM         | Groq Llama 3.1 8B (Supabase Edge Function) |

Flujo: `usuario → intent-classifier → entity-extractor → chatbot-rag → Edge Function chat → Groq → respuesta + fuentes`

---

## 6. Estado final del proyecto

```
npm run build  →  ✓ exitoso (cliente + SSR)
npm run typecheck  →  sin errores (verificado vía build)
```

Pendiente para futuras iteraciones:
- Entrenamiento real del modelo (actualmente stub en `train.ts`)
- Notebooks Python para validación cruzada
- Tests unitarios específicos de `evaluateViability`
- Monitoréo de confianza del modelo en producción
