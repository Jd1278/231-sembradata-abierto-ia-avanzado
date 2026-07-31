<div align="center">

# SembraData: Predicción Agroclimática — Santander

> **SembraData** es una plataforma web interactiva de analítica predictiva diseñada para mitigar los riesgos climáticos y optimizar los rendimientos agrícolas en el **departamento de Santander, Colombia**. Cubre los 87 municipios del departamento, enfocándose en cultivos clave como **Cacao, Café y Granadilla**, con datos climáticos en tiempo real y análisis de suelo por zona.

<br/>

![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.168-3B82F6?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.49-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Node--server-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## Despliegue de la Aplicación

> [!IMPORTANT]
> La versión más reciente de la plataforma se encuentra desplegada y disponible para producción. Los datos GeoJSON cubren exclusivamente los 87 municipios de Santander.

<div align="center">

### [Abrir SembraData en Vercel](https://231-sembradata-abierto-ia-avanzado.vercel.app/)

**`https://231-sembradata-abierto-ia-avanzado.vercel.app/`**

</div>

---

## Características Clave

|                            | Característica                        | Descripción                                                                                                                                                                    |
| :------------------------: | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  :globe_showing_americas:  | **Mapa Interactivo Santander**        | Visualización coroplética de los **87 municipios** de Santander con selector de municipio y datos de riesgo agroclimático.                                                    |
|        :bar_chart:         | **Panel de Predicción Detallado**     | Al seleccionar una zona, se abre un panel con variables de suelo (pH, materia orgánica, textura) y clima (temperatura, precipitación, viento, radiación solar) en tiempo real. |
|       :earth_africa:       | **Datos Climáticos en Tiempo Real**   | Integración con **Open-Meteo API** para obtener clima actual, pronóstico 7 días e históricos (90 días). Sin API key requerida.                                                 |
|        :satellite:         | **Validación Histórica (NASA POWER)** | Comparación pronóstico vs datos satelitales históricos de **NASA POWER** con índices agroclimáticos (GDD, aridez, estrés UV).                                                  |
|         :antenna:          | **Estaciones IDEAM**                  | Datos reales de estaciones meteorológicas del **IDEAM** vía **datos.gov.co** (Socrata). Paginación automática y retry con exponential backoff.                                 |
|         :seedling:         | **Análisis de Suelo**                 | Datos de **SoilGrids (ISRIC)** con 6 niveles de profundidad (0-5cm a 100-200cm): pH, materia orgánica, textura, drenaje, fertilidad, carbono orgánico.                         |
|          :robot:           | **Chatbot con Groq Llama 3.1 8B**     | Asistente inteligente con clasificador heurístico de intenciones, extracción de entidades, perfiles de cultivo y consulta directa a Groq (Llama 3.1 8B) vía Supabase Edge Function. |
|           :dart:           | **Evaluación de Viabilidad**          | Análisis automático: variables favorables/desfavorables, nivel de confianza, recomendaciones específicas y cultivos alternativos.                                              |
|          :dollar:          | **Precios Internacionales**           | Precios de café (Arabica), cacao y commodities agrícolas con análisis de tendencia y detección de puntos de inflexión.                                                         |
| :chart_with_upwards_trend: | **Panel de KPIs**                     | Métricas clave: rendimiento estimado, riesgo agroclimático, precipitación y temperatura.                                                                                       |
|           :mag:            | **Índices Agroclimáticos**            | Días-grado acumulados, índice de aridez, estrés hídrico, riesgo de heladas, demanda hídrica.                                                                                   |
|        :floppy_disk:        | **Cache de APIs**             | Cache inteligente en Supabase para datos de IDEAM (24h), NASA POWER (7 días) y precios (1h).                                                               |
|       :potted_plant:       | **NDVI por satélite**                  | Índice de vegetación calculado desde datos satelitales de Open-Meteo Archive.                                                                                                  |
|       :bookmark:         | **Historial de Análisis**             | Cada análisis se guarda automáticamente en Supabase (tabla `analysis_history`).                                                                                       |
|          :phone:           | **PWA Offline**                       | Service Worker v2 con stale-while-revalidate y sincronización en IndexedDB.                                                                                                     |

---

## Stack Tecnológico

### Frontend — Interfaz de Usuario

| Componente           | Tecnología                 | Rol / Función                                          |
| :------------------- | :------------------------- | :----------------------------------------------------- |
| **Framework**        | TanStack Start + Vite      | SSR/SSG, enrutamiento file-based, bundler              |
| **UI Library**       | React 19                   | Componentes de interfaz                                |
| **Estilos**          | Tailwind CSS 4 + shadcn/ui | Sistema de diseño utility-first + componentes Radix UI |
| **Gráficos**         | Recharts                   | Visualización de series temporales, KPIs, radar        |
| **Mapas**            | SVG personalizado          | Mapa coroplético interactivo con proyección custom     |
| **Estado Asíncrono** | TanStack React Query       | Gestión de datos del servidor                          |
| **Router**           | TanStack Router            | Enrutamiento tipado file-based                         |
| **PWA**              | Service Worker v2          | Offline mode, stale-while-revalidate, IndexedDB sync   |

### Backend & Servicios

| Componente               | Tecnología          | Rol / Función                                            |
| :----------------------- | :------------------ | :------------------------------------------------------- |
| **Backend-as-a-Service** | Supabase            | PostgreSQL, Auth, Edge Functions, Cache de APIs, historial |
| **Edge Functions**       | Deno (Supabase)     | Chatbot IA (`chat`) y limpieza de cache (`cache-cleanup`) |
| **Chatbot IA**           | Groq Llama 3.1 8B   | Clasificador de intenciones + extracción de entidades + consulta directa |
| **Servidor**             | Nitro (node-server) | Motor de servidor SSR para Docker/Vercel                 |
| **Cache**                | Supabase            | Cache de respuestas de APIs externas (IDEAM, NASA, precios) |

### APIs Externas

| API                        | Costo              | Datos                                                            | Cache            | Enlace Oficial                                         |
| :------------------------- | :----------------- | :--------------------------------------------------------------- | :--------------- | :----------------------------------------------------- |
| **Open-Meteo**             | Gratis             | Clima actual, pronóstico 7d, históricos 90d, humedad del suelo, NDVI | No (tiempo real) | [open-meteo.com](https://open-meteo.com)               |
| **NASA POWER**             | Gratis             | Datos satelitales diarios + índices agroclimáticos (GDD, aridez) | 7 días           | [power.larc.nasa.gov](https://power.larc.nasa.gov)     |
| **IDEAM (datos.gov.co)**   | Gratis (app token) | Estaciones meteorológicas nacionales reales                      | 24 horas         | [datos.gov.co](https://datos.gov.co)                   |
| **SoilGrids (ISRIC)**      | Gratis             | Propiedades del suelo a 6 niveles de profundidad                 | No (estático)    | [soilgrids.org](https://soilgrids.org)                 |
| **Commodity Forecast API** | Gratis             | Precios internacionales de café y cacao                          | 1 hora           | —                                                     |
| **Groq**                   | Gratis (~30 req/min) | Llama 3.1 8B para clasificación, extracción de entidades y respuestas del chatbot (server-side) | No | [console.groq.com/keys](https://console.groq.com/keys) |
| **Supabase**               | Gratis/Plan        | PostgreSQL, Auth, Edge Functions, Cache, Historial               | N/A              | [supabase.com](https://supabase.com)                   |

---

## Fuentes de Datos

|  #  | Fuente                | Datos                                                                                                                 | Enlace Oficial                                             |
| :-: | :-------------------- | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
|  1  | **Open-Meteo API**    | Clima en tiempo real: temperatura, precipitación, viento, radiación solar, humedad, UV, pronóstico 7d, históricos 90d, NDVI | [open-meteo.com](https://open-meteo.com)                   |
|  2  | **SoilGrids (ISRIC)** | Propiedades del suelo a 6 niveles: pH, materia orgánica, textura, carbono orgánico, nitrogen, CIC                     | [soilgrids.org](https://soilgrids.org)                     |
|  3  | **IDEAM**             | Series climáticas históricas de Colombia (datos.gov.co Socrata)                                                       | [datos.gov.co](https://datos.gov.co)                       |
|  4  | **NASA POWER**        | Datos satelitales diarios + índices agroclimáticos (GDD, aridez, estrés UV, demanda hídrica)                          | [power.larc.nasa.gov](https://power.larc.nasa.gov)         |
|  5  | **Commodity Forecast**| Precios internacionales de café (Arabica) y cacao                                                                     | —                                                          |
|  6  | **Datos GeoJSON**     | **87** municipios de **Santander** en `src/data/colombia-municipios.geo.json`                                        | [IGAC](https://igac.gov.co) / [geoportal.dane.gov.co](https://geoportal.dane.gov.co) |
|  7  | **Groq**              | LLM Llama 3.1 8B para el chatbot (Edge Function `supabase/functions/chat`)                                            | [console.groq.com/keys](https://console.groq.com/keys)     |
|  8  | **Supabase**          | Cache de APIs y historial de análisis (`api_cache`, `analysis_history`)                                               | [supabase.com](https://supabase.com)                       |

---

## Estructura del Proyecto

```
scripts/
├── split-geojson.mjs       # Descarga GeoJSON nacional y divide por departamento
└── merge-geojson.mjs       # Fusiona archivos GeoJSON individuales en uno solo

src/
├── components/
│   ├── sembradata/          # Componentes de la aplicación
│   │   ├── Dashboard.tsx    # Dashboard principal (lazy-loaded)
│   │   ├── SantanderMap.tsx # Mapa SVG interactivo (navegación por teclado)
│   │   ├── PredictionPanel.tsx  # Panel de análisis de viabilidad (focus trap)
│   │   ├── ChatbotPanel.tsx # Chatbot flotante (memoria, markdown, sessionId)
│   │   ├── ClimateRadar.tsx # Gráfico radar/spider de 5 ejes climáticos
│   │   ├── HistoryPanel.tsx # Historial de análisis guardados
│   │   ├── RiskChart.tsx    # Gráfico de riesgo agroclimático
│   │   ├── YieldChart.tsx   # Gráfico de rendimiento estimado
│   │   ├── AdvancedFilters.tsx # Filtros avanzados de municipios
│   │   ├── OfflineIndicator.tsx # Indicador de estado offline (PWA)
│   │   ├── SectionErrorBoundary.tsx # Manejo de errores por sección
│   │   ├── dashboard/       # KPIs, leyenda del mapa, bloques de filtro
│   │   ├── prediction/      # Climate, Commodity, HistoricalValidation,
│   │   │                    # IdeamStation, Ndvi, Recommendations, Soil, Viability
│   │   ├── Skeletons.tsx   # 6 componentes de skeleton loading
│   │   ├── data.ts          # Datos de cultivos
│   │   ├── geo-utils.ts     # Utilidades de proyección SVG
│   │   └── municipios.ts    # Features de municipios de Santander
│   └── ui/                  # Componentes shadcn/ui
├── services/
│   ├── climate-api.ts       # Cliente Open-Meteo (tiempo real + históricos)
│   ├── soil-service.ts      # Cliente SoilGrids (6 niveles de profundidad)
│   ├── nasa-power.ts        # Cliente NASA POWER (agroclimatology indices)
│   ├── ideam.ts             # Cliente IDEAM (paginación + retry con backoff)
│   ├── commodity-price.ts   # Cliente precios internacionales
│   ├── cache.ts             # Sistema de cache en Supabase
│   ├── analysis-history.ts  # Historial de análisis (Supabase)
│   ├── temporal-optimizer.ts # Optimización temporal de consultas
│   ├── rate-limiter.ts      # Limitador de peticiones
│   ├── chatbot.ts           # Sugerencias de preguntas para el chatbot
│   ├── chatbot-rag.ts       # RAG del chatbot sobre base de conocimiento
│   ├── intent-classifier.ts # Clasificador heurístico de intenciones
│   ├── entity-extractor.ts  # Extracción de entidades (cultivos, municipios)
│   ├── knowledge-base.ts    # Base de conocimiento (entradas, sinónimos)
│   └── supabase.ts          # Cliente Supabase
├── data/
│   ├── colombia-municipios.geo.json  # GeoJSON 87 municipios de Santander
│   ├── crop-requirements.ts # Requerimientos agronómicos por cultivo
│   └── departamentos.ts     # Mapeo de departamentos
├── types/
│   ├── crops.ts             # Tipos de cultivos
│   ├── database.ts          # Interfaces de BD
│   └── prediction-v2.ts     # Tipos de predicción v2 (mejorado)
├── hooks/
│   ├── use-mobile.tsx       # Breakpoint móvil
│   └── use-offline.ts       # Estado online/offline
├── lib/
│   ├── utils.ts             # Utilidades (cn, etc.)
│   ├── sentry.ts            # Inicialización de Sentry
│   ├── error-capture.ts     # Captura de errores globales
│   └── error-page.ts        # Página de error SSR
└── routes/
    ├── __root.tsx           # Layout raíz (skip-to-content link)
    └── index.tsx            # Ruta principal (lazy-loaded)

supabase/
├── migrations/
│   ├── 001_api_cache.sql    # Tablas de cache para APIs
│   └── 002_analysis_history.sql # Tabla de historial de análisis
├── functions/
│   ├── chat/
│   │   ├── index.ts         # Edge Function chatbot (Groq Llama 3.1 8B)
│   │   └── memory.ts        # Memoria de conversaciones en Supabase
│   └── cache-cleanup/
│       └── index.ts         # Edge Function para limpieza de cache

data/
├── etl/
│   ├── etl_ideam.ts         # ETL pipeline IDEAM
│   ├── etl_nasa_power.ts    # ETL pipeline NASA POWER
│   └── etl_commodities.ts   # ETL pipeline commodities
├── metadata.json            # Configuración de pipelines
└── README.md                # Documentación del directorio data/

docs/
├── api/
│   ├── openapi.yaml         # Especificación OpenAPI 3.1.0
│   └── api_spec.md          # Documentación de endpoints
├── architecture/
│   └── arquitectura_sistemas.md
├── data_dictionary.md       # Diccionario de datos
├── fuentes_datos.md         # Fuentes de datos
├── herramientas_y_apis.md   # Herramientas, APIs y tecnologías del proyecto
├── conclusiones.md
├── marco_metodologico.md
├── planteamiento_problema.md
├── public_impact_assessment.md
└── validacion_guide.md

public/
├── sw.js                    # Service Worker v2 (stale-while-revalidate + IndexedDB)
├── offline.html             # Página offline funcional
├── manifest.json            # PWA manifest
└── icons/                   # Iconos PWA
```

---

## Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/sembradata.git
cd sembradata

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea tu archivo .env local con las variables de la sección "Variables de Entorno"

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# IDEAM (opcional — datos.gov.co)
VITE_IDEAM_APP_TOKEN=tu-app-token

# Sentry (opcional)
VITE_SENTRY_DSN=

# Preset de Nitro (node-server para Docker/local, vercel para Vercel)
NITRO_PRESET=node-server
```

> **Importante:** Las variables `VITE_*` se inyectan en el bundle del cliente **en tiempo de build**. Deben estar presentes al ejecutar `npm run build` (o como build args de Docker). No exponer `GROQ_API_KEY` en el frontend.

> **Nota:** La API Key de Groq (`GROQ_API_KEY`) se configura como secreto en las Edge Functions de Supabase (server-side):
> ```bash
> supabase secrets set GROQ_API_KEY=tu-groq-key
> ```
> Nunca se expone al frontend.

### Base de Datos

Ejecuta el SQL de las migraciones en el **SQL Editor** de Supabase:

```sql
-- Ejecuta este bloque en Supabase SQL Editor
-- 1. supabase/migrations/001_api_cache.sql  (tablas de cache)
-- 2. supabase/migrations/002_analysis_history.sql  (historial de análisis)
```

---

## Despliegue con Docker

> El `Dockerfile` es multi-stage (base `node:22-alpine`). Requiere **Node.js ≥ 22.12.0** (ver `engines` en `package.json` y `engine-strict` en `.npmrc`). El preset de Nitro usado es `node-server` (salida `.output/`).

```bash
# Construir imagen (las VITE_* son build-time, pásalas como build args)
docker build -t sembradata \
  --build-arg VITE_SUPABASE_URL=https://tu-proyecto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=tu-anon-key \
  --build-arg VITE_IDEAM_APP_TOKEN=tu-token \
  --build-arg VITE_SENTRY_DSN=tu-dsn \
  .

# Ejecutar
docker run -p 3000:3000 sembradata
```

### Build args (Docker)

| Argumento                | Requerido | Descripción                                  |
| :----------------------- | :-------: | :------------------------------------------- |
| `VITE_SUPABASE_URL`      |    Si     | URL del proyecto Supabase                    |
| `VITE_SUPABASE_ANON_KEY` |    Si     | Clave anónima de Supabase                    |
| `VITE_IDEAM_APP_TOKEN`   |    No     | Token de datos.gov.co para IDEAM             |
| `VITE_SENTRY_DSN`        |    No     | DSN de Sentry                                 |

> Los secrets (como `GROQ_API_KEY`) nunca van a la imagen; se configuran en Supabase.

---

## Despliegue en Vercel

El proyecto usa **TanStack Start + Nitro**. En Vercel define la variable de entorno de build `NITRO_PRESET=vercel` para que Nitro genere el artefacto del Build Output API (`.vercel/output/`):

1. Importa el repo en Vercel (framework: **Other** / TanStack Start).
2. Build command: `npm run build`.
3. Define las variables de entorno de build: `NITRO_PRESET=vercel`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_IDEAM_APP_TOKEN`, `VITE_SENTRY_DSN`.
4. Deploy.

> Sin `NITRO_PRESET=vercel`, el build usa `node-server` por defecto (`.output/`), pensado para Docker/Node, y Vercel no lo servirá correctamente.

---

## Desarrollo

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests unitarios (145 tests)
npm run test

# Tests E2E (31 casos)
npm run test:e2e

# Build
npm run build

# Validación completa
npm run validate
```

### Métricas de Calidad (v0.5.1)

| Métrica                   | Valor                  |
| :------------------------ | :--------------------- |
| Tests unitarios/componen. | 145/145 passing        |
| Tests E2E                 | 31 casos (`e2e/`, requiere `npx playwright install chromium`) |
| Errores TypeScript        | 0                      |
| Errores ESLint            | 0 (6 warnings)         |
| Build                     | OK (Nitro `node-server`, salida `.output/`) |
| Cobertura GeoJSON         | 87 municipios de Santander |

---

## API

La especificación de la API está documentada en `docs/api/openapi.yaml` (OpenAPI 3.1.0), con 6 endpoints planteados para consultas climáticas, de rendimiento y riesgo. Documentación detallada en `docs/api/api_spec.md`.

> Los datos en la aplicación se consumen directamente desde el frontend hacia las APIs externas (Open-Meteo, NASA POWER, IDEAM, SoilGrids, Commodity Forecast) y Supabase; los endpoints REST son la capa documentada para la fase de API formal.

---

## Licencia

Distribuido bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para más detalles.

<br/>

**Hecho con :seedling: para el agro de Colombia**
