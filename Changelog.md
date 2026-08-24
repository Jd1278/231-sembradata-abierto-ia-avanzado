# Changelog

Todos los cambios notables en SembraData.

## [0.6.0] - 2026-08-24

### Added

- **Motor Estadístico de Predicción Versionado:** Implementado modelo Theil-Sen con estimación de tendencias e intervalos de confianza al 80% y 95% ($L_{80}, U_{80}, L_{95}, U_{95}$).
- **Integridad de Datos Históricos (EVA):** Proyecciones estrictamente respaldadas por registros observados oficiales de Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura). Eliminada por completo la generación de observaciones sintéticas cuando $N < 3$, retornando `status: "insufficient_data"`.
- **Evaluación Cualitativa con Google Gemini:** Creada Edge Function `gemini-assessment` (`gemini-2.0-flash`) para análisis biológico y agronómico cualitativo con validación Zod completa, presupuesto de tiempo (8s) y sin alteración de datos numéricos.
- **Chatbot Agroclimático Anti-Alucinaciones:** Chatbot Groq con modelo `openai/gpt-oss-20b`, herramientas deterministas del servidor (`getMunicipalityProfile`, `getObservedYield`, `getPrediction`, `getCropRequirements`, `getCurrentExternalContext`, `extractVerifiedNumbers`), geovalidación estricta de 87 municipios de Santander, umbral de similitud RAG $\ge 3.0$, y acordeón de afirmaciones verificadas.
- **Migración 007 (Predicciones Versionadas):** Tabla `predicciones_agroclimaticas` con metadata de features, versión del modelo, e intervalos estadísticos.
- **Migración 008 (Calidad de Datos y Cuarentena):** Tabla `data_quality_quarantine` para aislamiento y auditoría de anomalías físicas y meteorológicas.
- **Migración 009 (Endurecimiento RLS):** Políticas RLS estrictas: `chat_conversations` y `predicciones_agroclimaticas` con escritura restringida exclusivamente a `service_role`; búsqueda segura `SET search_path = public, pg_temp;` en funciones administrativas.
- **Seguridad en Edge Functions y CORS:** Validación dinámica de allowlist de orígenes autorizados (`localhost`, `vercel.app`, `lovable.dev`) con rechazo HTTP 403 Forbidden y header `Vary: Origin`.
- **Docker y DevOps:** Creado `.dockerignore` estricto; Dockerfiles actualizados a multi-stage con `node:22-alpine`, usuario no privilegiado (`node`) y build reproducible con `npm ci`.
- **Suite de Pruebas Automatizadas:** 51 archivos de prueba con 392 tests unitarios e integración pasando al 100%.

### Changed

- **Arquitectura de Caché:** Frontend transformado en 100% solo lectura; escrituras de caché y purga delegadas al servidor vía RPC `clean_system_cache_and_audit()`.
- **Endpoints Serverless:** `/api/reports/generate`, `/api/reports/schedule` y `/api/notifications/send` retornan HTTP 501 Not Implemented estructurado en lugar de respuestas simuladas.
- **Preservación de Metadatos:** Corregida asignación de municipio y cultivo en `buildUnifiedSeriesPoints` para Café, Cacao y Granadilla sin valores hardcodeados.

### Removed

- **Modo Offline y Service Workers:** Eliminados por completo `public/sw.js` funcional, `offline.html`, manifest PWA y almacenamiento en `localStorage` como sustituto de predicciones. La aplicación ahora es estrictamente conectada con indicador de red en tiempo real.
- **Caché en IndexedDB para análisis:** Eliminada persistencia local no conectada para evitar mostrar datos obsoletos como actuales.

---

## [0.5.1] - 2026-07-28

### Added

- **Santander GeoJSON consolidado:** Se unificó `santander.geo.json` (87 municipios) como única fuente geoespacial del proyecto.
- **Scripts de procesamiento GeoJSON:** `scripts/split-geojson.mjs` y `scripts/merge-geojson.mjs` para manejo de archivos GeoJSON.
- **Filtro dinámico de municipios:** El dashboard filtra correctamente los municipios según el departamento seleccionado.

### Fixed

- **Bug de filtro de municipios:** Corregido mapeo de `MUNICIPIOS` en `data.ts` y filtrado con `filteredMunicipios` en `Dashboard.tsx`.
- **Bug de estado inicial:** Corregido selector inicial que causaba coincidencias ambiguas de municipios homónimos.

---

## [0.5.0] - 2026-07-23

### Added

- **Open-Meteo histórico:** Integración de serie temporal de clima reciente y humedad del suelo.
- **NASA POWER agroclimatology:** Índices agroclimáticos (GDD, aridez, demanda hídrica).
- **SoilGrids profundidad:** Perfiles de suelo en 6 profundidades.
- **IDEAM paginación:** Paginación automática y retry con backoff exponencial.
- **Commodity Forecast:** Precios internacionales de café y cacao.

---

## [0.4.0] - 2026-07-23

### Added

- **Notificaciones climáticas:** Alertas de heladas, sequía y ola de calor.
- **Historial de análisis:** Tabla `analysis_history` con persistencia en Supabase.
- **Multi-idioma:** Soporte inicial Español / Inglés.
- **NDVI satelital:** Serie temporal de índice de vegetación.
