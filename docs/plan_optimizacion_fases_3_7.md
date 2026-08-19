# Plan de Optimización — Fases 3 a 7

**Objetivo:** Optimización profunda de IA, UI, robustez y rendimiento.
**Fecha:** 2026-08-18

---

## Fase AI-1 — Eliminar código muerto de la capa IA (~3000 líneas)

> **Impacto crítico:** El bundle incluye knowledge-base.ts (2471 líneas), chatbot-rag.ts, intent-classifier.ts, entity-extractor.ts — ninguno es importado por la UI. Todo se ejecuta en el Edge Function de Supabase, no en el cliente.

| #      | Acción                                                                    | Archivo                                      |
| ------ | ------------------------------------------------------------------------- | -------------------------------------------- |
| AI-1.1 | Mover knowledge-base.ts a `supabase/functions/chat/knowledge-base.ts`     | `src/services/knowledge-base.ts`             |
| AI-1.2 | Mover chatbot-rag.ts a `supabase/functions/chat/rag.ts`                   | `src/services/chatbot-rag.ts`                |
| AI-1.3 | Mover intent-classifier.ts a `supabase/functions/chat/intent.ts`          | `src/services/intent-classifier.ts`          |
| AI-1.4 | Mover entity-extractor.ts a `supabase/functions/chat/entities.ts`         | `src/services/entity-extractor.ts`           |
| AI-1.5 | Mover chatbot.ts (getSuggestions) a componente o eliminar imports muertos | `src/services/chatbot.ts`                    |
| AI-1.6 | Eliminar imports no usados en ChatbotPanel.tsx                            | `src/components/sembradata/ChatbotPanel.tsx` |
| AI-1.7 | Verificar que el Edge Function en Supabase tenga su propia copia          | `supabase/functions/chat/`                   |

**Criterio:** `npm run build` reduce bundle size significativamente. Ningún test se rompe.

---

## Fase AI-2 — Optimizar chatbot.ts (sugerencias) y ChatbotPanel.tsx

> Sugerencias y UI del chat son lo único de IA que queda en el cliente.

| #      | Acción                                                 | Archivo                  | Detalle                                                                                |
| ------ | ------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| AI-2.1 | Memoizar `getSuggestions` con `useMemo`                | `Dashboard.tsx:626`      | `getSuggestions(cropInfo.label, muni?.name)` se recalcula en cada render               |
| AI-2.2 | Agregar `aria-label` al input del chat                 | `ChatbotPanel.tsx:269`   | WCAG 2.1 — input sin label accesible                                                   |
| AI-2.3 | Agregar `aria-label` al botón limpiar chat             | `ChatbotPanel.tsx:159`   | Solo tiene `title`, no `aria-label`                                                    |
| AI-2.4 | Deshabilitar input durante loading                     | `ChatbotPanel.tsx:265`   | El botón se deshabilita pero el input no — el usuario puede escribir y pierde el texto |
| AI-2.5 | Agregar `aria-live="polite"` al contenedor de mensajes | `ChatbotPanel.tsx:173`   | Anunciar nuevos mensajes a screen readers                                              |
| AI-2.6 | Scroll automático al abrir panel                       | `ChatbotPanel.tsx:79-81` | Actualmente solo scrollea cuando `messages` cambia, no al abrir                        |
| AI-2.7 | Extraer `normalize()` a shared utility                 | `chatbot.ts:1-9`         | Eliminar duplicación si se mantiene en cliente                                         |
| AI-2.8 | Typizar `soilType` como unión                          | `AdvancedFilters.tsx:9`  | `"all" \| "arcilla" \| "limo" \| "arena" \| "franco"` en vez de `string`               |

---

## Fase UI-1 — SantanderMap: eliminar re-render completo en cada mouse move

> **BUG CRÍTICO:** `onMouseMove` llama `setTip()` en cada frame → re-render de los ~100 `<path>` del SVG.

| #      | Acción                                            | Archivo                    | Detalle                                                                            |
| ------ | ------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| UI-1.1 | Mover tooltip a ref + CSS transform               | `SantanderMap.tsx:181-189` | Usar `useRef` para posición del tooltip, aplicar `transform` via CSS sin re-render |
| UI-1.2 | Separar tooltip en componente `memo`              | `SantanderMap.tsx:317-365` | El tooltip es un `<div>` que no necesita re-renderizar el SVG                      |
| UI-1.3 | Agregar throttling al mouse move                  | `SantanderMap.tsx:181`     | `requestAnimationFrame` throttle para limitar updates a ~60fps                     |
| UI-1.4 | Corregir `9999` magic number en tooltip           | `SantanderMap.tsx:321`     | Usar `ref.current?.clientWidth` o un valor razonable                               |
| UI-1.5 | Corregir `role="button"` + `tabIndex={-1}`        | `SantanderMap.tsx:157-158` | Los paths no son botones reales — usar `role="option"` o `role="listitem"`         |
| UI-1.6 | Agregar `aria-selected` al municipio seleccionado | `SantanderMap.tsx:153`     | Indicar estado seleccionado a screen readers                                       |

**Fix detallado UI-1.1:**

```tsx
// Actual (causa re-render del SVG completo):
onMouseMove={(e) => {
  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
  setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
}}

// Optimizado:
const tipRef = useRef<HTMLDivElement>(null);
const rafRef = useRef(0);

onMouseMove={(e) => {
  cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(() => {
    if (tipRef.current) {
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
      tipRef.current.style.left = `${e.clientX - rect.left}px`;
      tipRef.current.style.top = `${e.clientY - rect.top}px`;
    }
  });
}}
```

---

## Fase UI-2 — Dashboard: cascade de re-renders y estados faltantes

| #      | Acción                                                 | Archivo                  | Detalle                                                                            |
| ------ | ------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------- |
| UI-2.1 | Agregar estado de error al fetch de clima/suelo        | `Dashboard.tsx:188-192`  | Actualmente solo `console.warn` — el usuario ve datos vacíos sin explicación       |
| UI-2.2 | Mostrar UI de error cuando `realtime.error` exista     | `Dashboard.tsx:399-406`  | Banner o toast con opción de reintentar                                            |
| UI-2.3 | Agregar AbortController al fetch                       | `Dashboard.tsx:138-193`  | Cancelar requests stale al cambiar de municipio/cultivo                            |
| UI-2.4 | Eliminar `<div>` vacío en header                       | `Dashboard.tsx:265`      | `flex items-center gap-1.5` vacío — código muerto                                  |
| UI-2.5 | Memoizar `metrics` correctamente                       | `Dashboard.tsx:205-225`  | Ya usa `useMemo` pero las dependencias incluyen objetos que cambian frecuentemente |
| UI-2.6 | Sincronizar draft de AdvancedFilters con value externo | `AdvancedFilters.tsx:92` | Cuando el parent resetea filtros, el draft se desincroniza                         |
| UI-2.7 | Eliminar Suspense redundante de YieldChart/RiskChart   | `Dashboard.tsx`          | Ya corregido en fase anterior                                                      |
| UI-2.8 | Agregar fallback de error a PredictionPanel            | `Dashboard.tsx:607-622`  | Actualmente tiene `SectionErrorBoundary` pero sin fallback visual                  |

---

## Fase UI-3 — Gráficas: memoización y correctitud

| #      | Acción                                                     | Archivo                                                        | Detalle                                                                                              |
| ------ | ---------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| UI-3.1 | Memoizar `data` en YieldChart con `useMemo`                | `YieldChart.tsx:32-43`                                         | Se recalcula en cada render aunque props no cambien                                                  |
| UI-3.2 | Memoizar `data` en RiskChart con `useMemo`                 | `RiskChart.tsx:25-77`                                          | Incluye `.filter()` sobre `dailyData` × 12 meses — costoso                                           |
| UI-3.3 | Envolver ClimateRadar en `React.memo`                      | `ClimateRadar.tsx:33`                                          | Unlike YieldChart y RiskChart, no tiene memo                                                         |
| UI-3.4 | Eliminar `<Line>` redundante en YieldChart                 | `YieldChart.tsx:100-108`                                       | `<Area>` ya dibuja la línea punteada — `<Line>` es doble render                                      |
| UI-3.5 | Agregar `aria-label` al contenedor de cada gráfico         | `YieldChart.tsx:46`, `RiskChart.tsx:96`, `ClimateRadar.tsx:55` | WCAG — gráficos sin descripción                                                                      |
| UI-3.6 | Agregar `role="img"` + `aria-label` a gráficos Recharts    | Los 3 archivos                                                 | Recharts no maneja a11y nativamente                                                                  |
| UI-3.7 | Agregar indicadores de patrón/texto para colores de riesgo | `RiskChart.tsx`                                                | Accesibilidad para daltonismo — los 3 colores (sequía, heladas, plagas) se distinguen solo por color |

---

## Fase API-1 — Robustez de servicios de datos

| #       | Acción                                           | Archivo                              | Detalle                                                                      |
| ------- | ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| API-1.1 | Agregar timeout a `fetchSoilData`                | `soil-service.ts:77`                 | Actualmente usa `fetch()` raw sin timeout — puede colgarse indefinidamente   |
| API-1.2 | Reusar `fetchWithTimeout` de `climate-api.ts`    | `soil-service.ts`                    | Importar y usar la misma función                                             |
| API-1.3 | Agregar validación de respuesta de API           | `climate-api.ts:226-227`             | `data.daily` puede ser null si la API cambia de formato                      |
| API-1.4 | Agregar validación en `mapDailyData`             | `climate-api.ts:148-168`             | Verificar que `raw.time` existe y es array                                   |
| API-1.5 | Integrar rate limiter con fetch real             | `rate-limiter.ts` + `climate-api.ts` | El rate limiter existe pero **nunca se usa** — `fetchWithRetry` no lo invoca |
| API-1.6 | Limitar requests paralelos en `fetchSoilProfile` | `soil-service.ts:119-121`            | `Promise.all` dispara 6 requests simultáneos al mismo endpoint               |
| API-1.7 | Agregar retry a `fetchSoilData`                  | `soil-service.ts`                    | Actualmente no tiene retry — un error 500 falla directamente                 |
| API-1.8 | Normalizar errores de API en tipos consistentes  | `climate-api.ts`, `soil-service.ts`  | Algunos lanzan `Error`, otros retornan fallback — inconsistente              |

---

## Fase ROB-1 — Tipos y seguridad de tipos

| #       | Acción                                          | Archivo                                 | Detalle                                                                                             |
| ------- | ----------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ROB-1.1 | Typizar `soilType` como unión                   | `AdvancedFilters.tsx:9`                 | `"all" \| "arcilla" \| "limo" \| "arena" \| "franco"`                                               |
| ROB-1.2 | Typizar `crop` en KnowledgeEntry como `CropKey` | `knowledge-base.ts:22` (si se mantiene) | Actualmente es `string`                                                                             |
| ROB-1.3 | Typizar respuesta de Open-Meteo                 | `climate-api.ts:216`                    | Crear interfaz `OpenMeteoResponse` en vez de `Record<string, unknown>`                              |
| ROB-1.4 | Typizar respuesta de SoilGrids                  | `soil-service.ts:79`                    | Crear interfaz `SoilGridsResponse` en vez de `any`                                                  |
| ROB-1.5 | Convertir `evaluateViability` a config object   | `prediction-v2.ts:440-452`              | 12 parámetros posicionales → objeto con tipos                                                       |
| ROB-1.6 | Typizar `MONTH_LABELS` como tupla               | `temporal-optimizer.ts:3-16`            | `[string, string, ..., string]` (12 elementos) para que `MONTH_LABELS[i]` sea `string \| undefined` |

---

## Fase ROB-2 — Error boundaries y manejo de errores

| #       | Acción                                                  | Archivo                 | Detalle                                        |
| ------- | ------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| ROB-2.1 | Agregar error boundary global                           | `App.tsx` o `root.tsx`  | Catch de errores no manejados en toda la app   |
| ROB-2.2 | Agregar `ErrorBoundary` a YieldChart                    | `Dashboard.tsx:544`     | Ya tiene para ClimateRadar, no para YieldChart |
| ROB-2.3 | Agregar `ErrorBoundary` a RiskChart                     | `Dashboard.tsx:564`     | Ya tiene para ClimateRadar, no para RiskChart  |
| ROB-2.4 | Agregar retry visual en Dashboard cuando falla el fetch | `Dashboard.tsx:188-192` | Botón "Reintentar" además de mostrar error     |
| ROB-2.5 | Agregar `onError` handler a `<img>` y `<svg>`           | `SantanderMap.tsx`      | Imágenes SVG sin error handling                |

---

## Fase PERF-1 — Rendimiento del bundle y carga

| #        | Acción                                                            | Archivo                                   | Detalle                                                      |
| -------- | ----------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| PERF-1.1 | Lazy load de PredictionPanel                                      | `Dashboard.tsx:58-60`                     | Ya es lazy — verificar que el chunk se carga bajo demanda    |
| PERF-1.2 | Lazy load de ChatbotPanel                                         | `Dashboard.tsx:55-57`                     | Ya es lazy — OK                                              |
| PERF-1.3 | Lazy load de ClimateRadar                                         | `Dashboard.tsx:52-54`                     | Ya es lazy — OK                                              |
| PERF-1.4 | Analizar bundle con `npx vite-bundle-visualizer`                  | Tool                                      | Identificar chunks más pesados                               |
| PERF-1.5 | Tree-shake Recharts                                               | `vite.config.ts`                          | Importar solo los componentes usados, no el paquete completo |
| PERF-1.6 | Comprimir assets de mapa (GeoJSON)                                | `src/components/sembradata/municipios.ts` | GeoJSON de 87 municipios puede ser pesado                    |
| PERF-1.7 | Usar `React.lazy` + `Suspense` para charts si el bundle es >200KB | `Dashboard.tsx`                           | Solo si el análisis de bundle lo justifica                   |

---

## Fase A11Y-1 — Accesibilidad completa

| #         | Acción                                      | Archivo                       | Detalle                               |
| --------- | ------------------------------------------- | ----------------------------- | ------------------------------------- |
| A11Y-1.1  | `aria-label` en input del chat              | `ChatbotPanel.tsx:269`        | `"Escribe tu pregunta"`               |
| A11Y-1.2  | `aria-label` en botón limpiar chat          | `ChatbotPanel.tsx:159`        | `"Limpiar conversación"`              |
| A11Y-1.3  | `aria-label` en botón enviar chat           | `ChatbotPanel.tsx:273`        | `"Enviar mensaje"`                    |
| A11Y-1.4  | `htmlFor`/`id` en labels de AdvancedFilters | `AdvancedFilters.tsx:127-128` | Labels no asociados con inputs        |
| A11Y-1.5  | `aria-label` en range sliders               | `AdvancedFilters.tsx:63-78`   | Sliders sin label accesible           |
| A11Y-1.6  | `role="img"` + `aria-label` en gráficos     | `YieldChart.tsx:46`, etc.     | Gráficos sin descripción              |
| A11Y-1.7  | `aria-selected` en municipio del mapa       | `SantanderMap.tsx:153`        | Indicar selección actual              |
| A11Y-1.8  | Texto alternativo para colores de riesgo    | `RiskChart.tsx`               | Patrones o textos + colores           |
| A11Y-1.9  | `aria-expanded` en toggle de filtros        | `AdvancedFilters.tsx:112`     | Indicar estado abierto/cerrado        |
| A11Y-1.10 | Keyboard navigation completa en chat        | `ChatbotPanel.tsx`            | Enter para enviar, Escape para cerrar |

---

## Resumen por Fase

| Fase      | Objetivo                     | Bugs   | Optimizaciones | a11y   | Total  |
| --------- | ---------------------------- | ------ | -------------- | ------ | ------ |
| AI-1      | Eliminar código muerto IA    | —      | 7              | —      | 7      |
| AI-2      | Optimizar chat + sugerencias | 1      | 5              | 2      | 8      |
| UI-1      | SantanderMap perf + a11y     | 3      | 3              | 3      | 9      |
| UI-2      | Dashboard re-renders + error | 2      | 4              | —      | 6      |
| UI-3      | Gráficas memo + a11y         | 1      | 4              | 3      | 8      |
| API-1     | Robustez servicios datos     | 4      | 3              | —      | 7      |
| ROB-1     | Tipos y seguridad            | 6      | —              | —      | 6      |
| ROB-2     | Error boundaries             | 2      | 2              | —      | 4      |
| PERF-1    | Bundle y carga               | —      | 7              | —      | 7      |
| A11Y-1    | Accesibilidad completa       | —      | —              | 10     | 10     |
| **TOTAL** |                              | **19** | **35**         | **18** | **72** |

---

## Orden de ejecución recomendado

```
AI-1  → Eliminar ~3000 líneas muertas (mayor impacto inmediato)
AI-2  → Optimizar chat + a11y
UI-1  → SantanderMap (bug crítico de re-render)
API-1 → Robustez de datos (timeout, validation, retry)
ROB-1 → Tipos (previene bugs futuros)
UI-2  → Dashboard error handling
UI-3  → Gráficas memo + a11y
ROB-2 → Error boundaries
PERF-1 → Bundle analysis
A11Y-1 → a11y restante
```
