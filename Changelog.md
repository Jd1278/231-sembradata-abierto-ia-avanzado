# Changelog

Todos los cambios notables en SembraData.

## [0.5.1] - 2026-07-28

### Added

- **Santander GeoJSON consolidado:** Se unificó `santander.geo.json` (87 municipios) como única fuente geoespacial del proyecto, eliminando el GeoJSON nacional de 1,122 municipios.
- **Scripts de procesamiento GeoJSON:** `scripts/split-geojson.mjs` y `scripts/merge-geojson.mjs` para manejo de archivos GeoJSON.
- **Filtro dinámico de municipios por departamento:** El dashboard ahora filtra correctamente los municipios según el departamento seleccionado, usando `filteredMunicipios` (useMemo).

### Fixed

- **Bug de filtro de municipios:** Al seleccionar un departamento diferente a Santander, se seguían mostrando los municipios de Santander. Corregido añadiendo campo `departamento` al mapeo de `MUNICIPIOS` en `data.ts` y filtrando con `filteredMunicipios` en `Dashboard.tsx`.
- **Bug de estado inicial de `municipio`:** El regex `/vicente/i` matcheaba 3 municipios de 3 departamentos distintos. `find()` devolvía "San Vicente Ferrer (Antioquia)" en vez del de Santander. Corregido usando lazy initializer que filtra primero por el departamento default.
- **Bug de resolución de `muni`:** `MUNICIPIOS.find()` buscaba en el listado global, permitiendo seleccionar municipios de otro departamento. Corregido: ahora busca en `filteredMunicipios`.

### Changed

- **municipios.ts simplificado:** Importación estática de `colombia-municipios.geo.json`, exporta `getFeaturesForDepartment(deptName)` que filtra por `properties.dpt`.
- **SantanderMap.tsx optimizado:** Reemplazado `useEffect` con lógica asíncrona por `useMemo` con `getFeaturesForDepartment`. Eliminados imports no usados.
- **Build time reducido:** ~6s (vs ~24s en v0.5.0) debido a optimizaciones en el bundler.

### Removed

- **Archivos de datos por departamento:** Se eliminaron los 33 archivos GeoJSON individuales (`src/data/*.geo.json` excepto `colombia-departamentos.geo.json` y `colombia-municipios.geo.json`).

## [0.5.0] - 2026-07-23

### Added

#### API Integration Improvements

- **Open-Meteo histórico automático:** `past_days=90` por defecto, nueva función `fetchRecentHistory()` con serie temporal 90 días, campos de humedad del suelo añadidos al tipo `ClimateData`.
- **NASA POWER agroclimatology:** Nuevo tipo `AgiClimatologyIndices` (GDD, aridity, heat/uv stress days, water demand), función `fetchAgroclimatologySummary()` con 6 parámetros agroclimáticos.
- **SoilGrids profundidad configurable:** 6 niveles de profundidad (0-5cm a 100-200cm), tipo `SoilProfile` con profundidad y nivel, `fetchSoilProfile()` reutilizable.
- **IDEAM paginación + retry:** `fetchWithBackoff()` con exponential backoff (5 intentos, delay progresivo), `fetchAllSocrata()` con paginación automática de 1000 registros/página.

#### New Data APIs

- **Commodity Forecast:** Pronósticos de precios internacionales de café (Arabica) y cacao con señal de mercado (Bullish/Bearish/Neutral), score climático, riesgo por región y recomendaciones de siembra.
- **Groq (Llama 3.1 8B):** Nuevo motor del chatbot desplegado como Edge Function de Supabase con clasificador de intenciones, extracción de entidades y RAG sobre la base de conocimiento local.

#### Technical Improvements

- **Excel export (.xlsx):** Exportación a formato Excel con 3 hojas (Resumen, Análisis Climático, Recomendaciones) usando SheetJS.
- **Push notifications nativas:** Alertas del navegador para heladas, sequías y olas de calor con sistema de permisos y toggle ON/OFF.
- **Share analysis por URL:** Compartir análisis via query params codificados (`?a=base64`) y Web Share API nativa con fallback a clipboard.
- **IndexedDB cache offline:** Almacenamiento local de análisis completos con TTL de 30 días, soporte para búsquedas por departamento y fecha.

#### Data & Documentation Services

- **Cache de APIs en Supabase:** Tablas `ideam_cache`, `nasa_power_cache` y `commodity_cache` con TTL configurable (IDEAM 24h, NASA POWER 7 días, precios 1h) para reducir llamadas externas.
- **Documentación de integraciones actualizada:** `docs/herramientas_y_apis.md`, `docs/fuentes_datos.md`, `docs/data-sources.md` y `data/README.md` reflejan las 5 APIs reales (Open-Meteo, NASA POWER, IDEAM, SoilGrids, Commodity Forecast) + Groq + Supabase.

### Changed

- **Rendimiento de bundle optimizado:** Code splitting a nivel de ruta: chunk de rutas lazy-loaded reducido de 820 KB a 1.3 KB (-99.8%). Dashboard, ChatbotPanel y PredictionPanel se cargan bajo demanda.
- **Service Worker v2:** Implementación de stale-while-revalidate strategy, página offline funcional (`offline.html`), background sync para formularios, purged cache automático cada 7 días.
- **Recharts animations:** 11 gráficos con animaciones de entrada suaves (duración 800-1000ms, ease-out).
- **Accesibilidad mejorada:** Skip-to-content link, focus trapping en modales (PredictionPanel, HistoryPanel), navegación por teclado en mapa SVG (flechas, Enter, Escape), regiones aria-live para actualizaciones dinámicas.

### Added (Infrastructure)

- **ETL pipeline stubs:** Módulos de extracción para IDEAM, NASA POWER y commodities con funciones `extract()`, `transform()` y `load()`.
- **Edge function `cache-cleanup`:** Función serverless para limpiar cache expirado en Supabase.
- **API OpenAPI 3.1.0:** Especificación completa con 6 endpoints, 7 schemas, autenticación Bearer y rate limiting documentado.
- **ClimateRadar:** Nuevo componente de gráfico radar/spider con 5 ejes (Temperatura, Lluvia, Humedad, Viento, Radiación).
- **Pipeline metadata:** Archivo `metadata.json` con configuración de ETL, schemas de datos y dependencias.

### Testing

- **145 tests unitarios:** Suites para cache, rate-limiter, climate-api, prediction-v2, utils, i18n, data-structure, componentes y error boundary.
- **31 casos E2E:** Playwright tests para dashboard, filtros, predicciones, chatbot, exportación PDF, historial, accesibilidad y responsive.

## [0.4.0] - 2026-07-23

### Added

- **Notificaciones push:** Alertas automáticas de heladas (<2°C), sequía (precip<5mm + hum<30%), y ola de calor (>35°C). Panel de notificaciones con toggle ON/OFF y historial de alertas.
- **Historial de análisis:** Cada análisis se guarda automáticamente en Supabase (o localStorage como fallback). Panel de historial con puntuación, fecha y opciones de eliminar.
- **Multi-idioma (i18n):** Soporte Español/Inglés con 150+ traducciones. Botón de cambio de idioma en el header. Preferencia guardada en localStorage.
- **NDVI vegetación satelital:** Nueva sección en el panel de predicción con datos NDVI de Open-Meteo Archive (MODIS). Serie temporal 30 días, semáforo de salud vegetal.
- **Skeleton loaders mejorados:** 6 componentes de skeleton (Climate, Soil, Historical, IDEAM, Commodity, Viability) para loading states consistentes por sección.
- **Lazy loading de secciones:** Secciones pesadas (HistoricalValidation, IDEAM, Commodity, NDVI, ExportPdf) ahora se cargan bajo demanda. Chunk principal reducido 25% (1,031→767 kB).
- **Exportar PDF completo:** Genera PDF con viabilidad, clima, suelo y recomendaciones. Incluido en el panel de predicción.
- **SQL migration 002:** Tabla `analysis_history` con índices y RLS.

### Changed

- **Dashboard responsive:** Padding reducido en móvil, KPIs en 2 columnas, PredictionPanel full-width en móvil.
- **Chatbot responsive:** Panel de chat full-width en pantallas pequeñas.
- **SEO actualizado:** Meta tags para Santander (87 municipios), keywords, Open Graph, Twitter cards.

### Fixed

- **200 errores de formato Prettier** corregidos.
- **5 variables/imports no utilizados** eliminados.
- **Supabase queries con manejo de errores** en todas las funciones.

## [0.3.0] - 2026-07-23

### Added

- **Sistema de cache para APIs externas:** Cache inteligente en Supabase con tablas `ideam_cache`, `nasa_power_cache` y `commodity_cache`. TTL configurable por fuente (IDEAM 24h, NASA POWER 7 días, precios 1h). Reduce llamadas a APIs externas y mejora rendimiento.
- **SQL migration para cache:** Archivo `supabase/migrations/001_api_cache.sql` con tablas, índices, función de limpieza y políticas RLS.
- **Servicio de caché genérico:** `src/services/cache.ts` con funciones `getCached()` y `setCached()` reutilizables.

### Changed

- **Servicios actualizados con cache-first:** IDEAM, NASA POWER y Commodity Price ahora leen de cache primero, consultan la API solo si no hay datos válidos, y escriben el resultado en cache.
- **README actualizado:** Estructura del proyecto refleja archivos nuevos, sección de APIs externas actualizada, Docker e variables de entorno documentados.
- **Changelog actualizado:** Esta entrada.

### Removed

- **`src/hooks/use-supabase-data.ts` eliminado:** Hook muerto (98 líneas) que nunca era importado en ningún componente. Refactorizado en v0.2.0 con `src/services/supabase.ts`.

### Fixed

- **200 errores de formato Prettier** corregidos con `eslint --fix`.
- **5 variables/imports no utilizados eliminados:**
  - `confidence`, `favorable`, `unfavorable` en `src/types/prediction.ts`
  - `DEPARTAMENTOS` en `src/components/sembradata/Dashboard.tsx`
  - `cn` en `src/components/sembradata/PredictionPanel.tsx`
  - `onDepartamentoChange` prop en `src/components/sembradata/SantanderMap.tsx`
  - `key` en `tests/unit/test_data_structure.ts`
- **Supabase queries con manejo de errores:** Todas las funciones de query en `supabase.ts` ahora validan `isSupabaseConfigured()` antes de conectar y manejan errores internamente sin propagar al frontend.

### Security

- Variables de entorno documentadas completamente: `VITE_IDEAM_APP_TOKEN` agregada a `render.yaml` y `.env.example`.
- Credenciales de Supabase mantienen sin cambios.

## [0.2.0] - 2026-07-22

### Added

- **Cobertura Santander:** La plataforma se enfoca en los 87 municipios del departamento de Santander.
- **Selector de departamento:** Nuevo filtro por departamento con agrupación regional (Caribe, Andina, Pacífica, Orinoquía, Amazonía, Insular)
- **GeoJSON de Colombia:** Archivo simplificado de departamentos para visualización SVG
- **Panel de Predicción Detallado:** Al seleccionar una zona, se muestra un panel completo con:
  - Variables del suelo (pH, materia orgánica, textura, drenaje, fertilidad, erosión, carbono orgánico)
  - Variables climáticas en tiempo real (temperatura, humedad, precipitación, viento, radiación solar, UV, nubosidad, presión)
  - Índices agroclimáticos (días-grado, aridez, estrés hídrico, riesgo de heladas)
  - Pronóstico climático 7 días
  - Evaluación de viabilidad con puntuación 0-100
  - Variables favorables/desfavorables con explicaciones
  - Recomendaciones específicas por zona
  - Cultivos alternativos recomendados
- **Servicio de clima (Open-Meteo API):** Integración con API gratuita para datos climáticos actuales, pronósticos e históricos
- **Servicio de suelo (SoilGrids):** Integración con ISRIC para propiedades del suelo a nivel mundial
- **Tipos de predicción:** Interfaces TypeScript para análisis de viabilidad

### Changed

- **Mapa actualizado:** El mapa ahora soporta carga dinámica de departamentos con loading states
- **Dashboard renovado:** Selector de departamento en sidebar, botón "Analizar zona" para abrir panel de predicción
- **Knowledge base expandida:** 4 nuevas entradas sobre provincias de Santander, cultivos principales, suelos y cadenas de valor
- **Edge Function actualizada:** System prompt actualizado para contexto de Santander
- **README actualizado:** Stack tecnológico corregido (TanStack Start, no Next.js), nuevas características documentadas
- **Greeting messages:** Actualizados para mencionar los 87 municipios de Santander

### Fixed

- **Bug en ChatbotPanel:** Corregido el llamado a `processQuery` que pasaba argumentos posicionales incorrectos en lugar de un objeto de contexto

### Security

- API Key de OpenAI gestionada server-side en Edge Functions de Supabase (nunca expuesta al frontend)
- Variables de entorno para credenciales de Supabase en render.yaml

## [0.1.0] - 2026-07-13

### Added

- Estructura base del repositorio según guía de proyecto abierto con IA
- Dashboard interactivo con mapas choropleth de Santander
- Conexión a Supabase para persistencia de datos
- Filtros por municipio, año, mes y cultivo
- Gráficos de rendimiento histórico vs. predicción
- Gráfico de riesgo climático por mes
- Panel de asistente conversacional
- Documentación del proyecto (docs/, README, LICENSE)
- Configuraciones de despliegue (Docker, Kubernetes)
- Tests unitarios, de integración y de sesgo
