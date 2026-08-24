# Herramientas, APIs y Tecnologias del Proyecto SembraData

> Documentacion tecnica de todas las herramientas, servicios externos, datasets y
> tecnologias utilizadas en la plataforma de prediccion agroclimatica para Santander.

---

## Tabla de Contenidos

1. [Resumen del Stack Tecnologico](#1-resumen-del-stack-tecnologico)
2. [APIs Climaticas y de Suelo](#2-apis-climaticas-y-de-suelo)
3. [APIs de Datos de Mercado](#3-apis-de-datos-de-mercado)
4. [Datasets de Datos Abiertos (datos.gov.co)](#4-datasets-de-datos-abiertos)
5. [Servicios de Backend y Base de Datos](#5-servicios-de-backend-y-base-de-datos)
6. [Servicios de Observabilidad](#6-servicios-de-observabilidad)
7. [Librerias Frontend (React/TypeScript)](#7-librerias-frontend)
8. [Herramientas de Desarrollo](#8-herramientas-de-desarrollo)
9. [Herramientas de Despliegue](#9-herramientas-de-despliegue)
10. [Pipeline ETL (Extraccion, Transformacion, Carga)](#10-pipeline-etl)
11. [Arquitectura General](#11-arquitectura-general)

---

## 1. Resumen del Stack Tecnologico

```
Frontend:      React 19 + TanStack Start + Tailwind CSS 4 + TypeScript 5.8
Backend:       Supabase (PostgreSQL + Edge Functions Deno + RLS Hardening 009)
Server Engine: Nitro (UnJS) via TanStack Start (Node 22 Alpine)
Build:         Vite 8
Testing:       Vitest (unit) + Playwright (E2E)
Deploy:        Vercel / Docker / Kubernetes / Render
Monitoreo:     Sentry
Modelos IA:    Groq (openai/gpt-oss-20b) + Google Gemini 2.0 Flash (Edge Functions)
Pronóstico:    Theil-Sen Robust Estimator con Intervalos L80/U80/L95/U95
```

---

## 2. APIs Climáticas y de Suelo

### 2.1 Open-Meteo — Pronóstico e Histórico Climático

- **Sitio web:** [https://open-meteo.com](https://open-meteo.com)
- **Documentación:** [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
- **Endpoints utilizados:**
  - `https://api.open-meteo.com/v1/forecast` — Clima en tiempo real y pronóstico a 7 días
  - `https://archive-api.open-meteo.com/v1/archive` — Datos históricos
- **Autenticación:** No requiere API key
- **Función en el proyecto:** Monitoreo meteorológico en vivo (temperatura, precipitación, humedad, viento, balance hídrico).

### 2.2 NASA POWER — Datos Agroclimáticos por Satélite

- **Sitio web:** [https://power.larc.nasa.gov](https://power.larc.nasa.gov)
- **Endpoint utilizado:** `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Función en el proyecto:** Radiación solar, evapotranspiración de referencia ($ET_0$) e índices agroclimáticos.

### 2.3 SoilGrids (ISRIC) — Propiedades Pedológicas

- **Sitio web:** [https://soilgrids.org](https://soilgrids.org)
- **Endpoint utilizado:** `https://rest.isric.org/soilgrids/v2.0/properties/query`
- **Función en el proyecto:** Perfiles de suelo por profundidad (pH, materia orgánica, textura arcilla/arena/limo).

### 2.4 IDEAM — Estaciones Meteorológicas Oficiales

- **Portal:** [datos.gov.co](https://datos.gov.co) (Socrata Open Data)
- **Función en el proyecto:** Observaciones reales de estaciones climatológicas en Santander.

---

## 3. APIs de Datos de Mercado

### 3.1 Commodity Forecast API

- **Función en el proyecto:** Cotizaciones internacionales de café y cacao con análisis de tendencia.

---

## 4. Servicios de Backend y Base de Datos

### 4.1 Supabase (PostgreSQL + Edge Functions)

- **PostgreSQL:** Base de datos relacional con Migraciones 001..009 y RLS Hardening.
- **Tablas principales:**
  - `municipios`: 87 municipios de Santander con altitud oficial y coordenadas.
  - `cultivos`: Café, Cacao, Granadilla.
  - `crop_climate_requirements`: Requerimientos óptimos oficiales (Cenicafé / Fedecacao / AGROSAVIA).
  - `rendimiento_historico`: Observaciones reales oficiales de EVA / MinAgricultura.
  - `predicciones_agroclimaticas`: Pronósticos estadísticos versionados con intervalos de predicción al 80% y 95%.
  - `data_quality_quarantine`: Registro de auditoría y aislamiento de anomalías.
  - `chat_conversations`: Historial de chat con acceso restringido a `service_role`.
- **Edge Functions (Deno):**
  - `chat`: Asistente conversacional con Groq (`openai/gpt-oss-20b`), RAG y motor determinista.
  - `gemini-assessment`: Evaluación agronómica cualitativa con Google Gemini 2.0 Flash.

### 4.2 Chatbot Agroclimático Trazable (Groq + Supabase)

- **Modelo:** Groq Cloud `openai/gpt-oss-20b` en modo JSON estricto (`response_format: { type: "json_object" }`).
- **Validación:** Geovalidación en base de datos, cotejo anti-alucinaciones contra `verifiedNumbers` y contrato Zod `ChatbotResponseSchema`.
- **Variable de entorno:** `GROQ_API_KEY` (secreto exclusivo de Supabase Edge Functions).

### 4.3 Evaluador Agronómico Cualitativo (Gemini)

- **Modelo:** Google Gemini 2.0 Flash.
- **Función:** Evalúa cualitativamente si el rendimiento proyectado es biológicamente viable frente a las condiciones del municipio. **No genera ni altera proyecciones estadísticas numéricas.**
- **Variable de entorno:** `GEMINI_API_KEY` (secreto exclusivo de Supabase Edge Functions).o
  - `src/services/chatbot.ts` — Sugerencias de preguntas para el chatbot

---

## 6. Servicios de Observabilidad

### 6.1 Sentry — Monitoreo de Errores y Rendimiento

- **Sitio web:** [https://sentry.io](https://sentry.io)
- **Documentacion:** [https://docs.sentry.io](https://docs.sentry.io)
- **SDK:** `@sentry/react` v10.67.0
- **Variable de entorno:** `VITE_SENTRY_DSN` (opcional — si esta vacio, Sentry se desactiva)
- **Funciones en el proyecto:**
  - Captura de errores en tiempo real con stack traces
  - Browser Tracing para monitorear rendimiento de carga
  - Session Replay para reproducir interacciones de usuario
  - Filtro automatico de `ChunkLoadError` (errores de carga de chunks)
- **Archivo fuente:** `src/lib/sentry.ts`

---

## 7. Librerias Frontend

### Framework y Routing

| Libreria        | Version  | Funcion                         | Enlace                                             |
| --------------- | -------- | ------------------------------- | -------------------------------------------------- |
| React           | 19.2.0   | Framework de UI declarativo     | [react.dev](https://react.dev)                     |
| TanStack Start  | 1.168.32 | Framework full-stack para React | [tanstack.com/start](https://tanstack.com/start)   |
| TanStack Router | 1.170.16 | Enrutamiento basado en archivos | [tanstack.com/router](https://tanstack.com/router) |
| TanStack Query  | 5.101.1  | Fetching y caching de datos     | [tanstack.com/query](https://tanstack.com/query)   |

### UI y Estilos

| Libreria                 | Version     | Funcion                               | Enlace                                                                         |
| ------------------------ | ----------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Tailwind CSS             | 4.2.1       | Framework CSS utility-first           | [tailwindcss.com](https://tailwindcss.com)                                     |
| Radix UI                 | 1.x         | Componentes UI accesibles             | [radix-ui.com](https://www.radix-ui.com)                                       |
| shadcn/ui                | (via Radix) | Componentes UI pre-construidos        | [ui.shadcn.com](https://ui.shadcn.com)                                         |
| Lucide React             | 0.575.0     | Iconografia SVG                       | [lucide.dev](https://lucide.dev)                                               |
| class-variance-authority | 0.7.1       | Variantes de componentes              | [cva.docs](https://cva.docs)                                                   |
| clsx                     | 2.1.1       | Constructores de clases condicionales | [github.com/lukeed/clsx](https://github.com/lukeed/clsx)                       |
| tailwind-merge           | 3.5.0       | Fusion de clases Tailwind             | [github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge) |

### Charts y Visualizacion

| Libreria       | Version     | Funcion                       | Enlace                                                       |
| -------------- | ----------- | ----------------------------- | ------------------------------------------------------------ |
| Recharts       | 2.15.4      | Graficos React basados en D3  | [recharts.org](https://recharts.org)                         |
| jsPDF          | 4.2.1       | Generacion de PDFs en cliente | [parall.ax/products/jspdf](https://parall.ax/products/jspdf) |
| html2canvas    | (via jspdf) | Captura de HTML a imagen      | [html2canvas.hertzen.com](https://html2canvas.hertzen.com)   |
| SheetJS (xlsx) | 0.18.5      | Exportacion a Excel           | [sheetjs.com](https://sheetjs.com)                           |

### Formularios y Validacion

| Libreria            | Version | Funcion                                 | Enlace                                                                               |
| ------------------- | ------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| React Hook Form     | 7.82.0  | Formularios React performantes          | [react-hook-form.com](https://react-hook-form.com)                                   |
| Zod                 | 3.24.2  | Validacion de esquemas TypeScript-first | [zod.dev](https://zod.dev)                                                           |
| @hookform/resolvers | 5.2.2   | Integracion Zod + React Hook Form       | [github.com/react-hook-form/resolvers](https://github.com/react-hook-form/resolvers) |

### Herramientas Generales

| Libreria               | Version | Funcion                  | Enlace                                                                                         |
| ---------------------- | ------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| date-fns               | 4.1.0   | Utilidades de fechas     | [date-fns.org](https://date-fns.org)                                                           |
| sonner                 | 2.0.7   | Notificaciones toast     | [github.com/emilkowalski/sonner](https://github.com/emilkowalski/sonner)                       |
| vaul                   | 1.1.2   | Drawer UI                | [github.com/emilkowalski/vaul](https://github.com/emilkowalski/vaul)                           |
| cmdk                   | 1.1.1   | Command palette          | [cmdk.paco.me](https://cmdk.paco.me)                                                           |
| embla-carousel-react   | 8.6.0   | Carousel UI              | [embla-carousel.com](https://www.embla-carousel.com)                                           |
| react-resizable-panels | 4.6.5   | Paneles redimensionables | [github.com/bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) |
| input-otp              | 1.4.2   | Input OTP                | [github.com/unstable-factory/input-otp](https://github.com/unstable-factory/input-otp)         |

---

## 8. Herramientas de Desarrollo

### Compilacion y Build

| Herramienta                       | Version         | Funcion                                  | Enlace                                               |
| --------------------------------- | --------------- | ---------------------------------------- | ---------------------------------------------------- |
| Vite                              | 8.0.16          | Build tool y dev server                  | [vite.dev](https://vite.dev)                         |
| TypeScript                        | 5.8.3           | Lenguaje tipado                          | [typescriptlang.org](https://www.typescriptlang.org) |
| Nitro                             | 3.0.260603-beta | Motor de servidor (UnJS)                 | [nitro.unjs.io](https://nitro.unjs.io)               |
| @lovable.dev/vite-tanstack-config | 2.7.1           | Configuracion Vite para Lovable/TanStack | [lovable.dev](https://lovable.dev)                   |

### Linting y Formateo

| Herramienta            | Version | Funcion                                              | Enlace                                                                                           |
| ---------------------- | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ESLint                 | 9.32.0  | Linter de JavaScript/TypeScript                      | [eslint.org](https://eslint.org)                                                                 |
| Prettier               | 3.7.3   | Formateador de codigo                                | [prettier.io](https://prettier.io)                                                               |
| eslint-config-prettier | 10.1.1  | Desactiva reglas ESLint que conflictean con Prettier | [github.com/prettier/eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) |
| eslint-plugin-prettier | 5.2.6   | Ejecuta Prettier como regla ESLint                   | [github.com/prettier/eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) |

### Testing

| Herramienta               | Version | Funcion                           | Enlace                                                   |
| ------------------------- | ------- | --------------------------------- | -------------------------------------------------------- |
| Vitest                    | 4.1.10  | Framework de testing unitario     | [vitest.dev](https://vitest.dev)                         |
| @vitest/coverage-v8       | 4.1.10  | Coverage de codigo via V8         | [vitest.dev](https://vitest.dev)                         |
| Playwright                | 1.61.1  | Testing E2E en navegadores reales | [playwright.dev](https://playwright.dev)                 |
| @testing-library/react    | 16.3.2  | Testing de componentes React      | [testing-library.com](https://testing-library.com)       |
| @testing-library/jest-dom | 7.0.0   | Matchers DOM para tests           | [testing-library.com](https://testing-library.com)       |
| jsdom                     | 29.1.1  | Implementacion DOM para tests     | [github.com/jsdom/jsdom](https://github.com/jsdom/jsdom) |

### Git Hooks y CI Local

| Herramienta | Version | Funcion                             | Enlace                                                                           |
| ----------- | ------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Husky       | 9.1.7   | Git hooks                           | [typicode.github.io/husky](https://typicode.github.io/husky)                     |
| lint-staged | 17.1.1  | Ejecutar linting en archivos staged | [github.com/lint-staged/lint-staged](https://github.com/lint-staged/lint-staged) |

### Paquetes y Runtime

| Herramienta    | Funcion                                | Enlace                             |
| -------------- | -------------------------------------- | ---------------------------------- |
| Bun            | Runtime de JavaScript (usado en CI/CD) | [bun.sh](https://bun.sh)           |
| Node.js 22.12+ | Runtime de JavaScript (produccion)     | [nodejs.org](https://nodejs.org)   |
| npm            | Gestor de paquetes                     | [npmjs.com](https://www.npmjs.com) |

---

## 9. Herramientas de Despliegue

### 9.1 Docker

- **Sito oficial:** [https://www.docker.com](https://www.docker.com)
- **Archivos:**
  - `Dockerfile` (raiz) — Multi-stage build para produccion
  - `.dockerignore` — Exclusiones para optimizar la imagen
  - `deployments/docker/Dockerfile.web` — Dockerfile alternativo
- **Imagen base:** `node:22-alpine`
- **Puerto:** 3000
- **Healthcheck:** `wget http://localhost:3000/`
- **Preset:** `NITRO_PRESET=node-server`

### 9.2 Kubernetes

- **Sito oficial:** [https://kubernetes.io](https://kubernetes.io)
- **Archivos:**
  - `deployments/kubernetes/sembradata-deployment.yaml` — Deployment (2 replicas, 256-512 MiB RAM)
  - `deployments/kubernetes/sembradata-hpa.yaml` — HorizontalPodAutoscaler (2-10 replicas, 70% CPU)
- **Recursos:** CPU 250-500m, Memoria 256-512 MiB
- **Secrets:** `sembradata-secrets` (supabase-url, supabase-anon-key)

### 9.3 Render

- **Sito oficial:** [https://render.com](https://render.com)
- **Archivo:** `render.yaml`
- **Configuracion:**
  - Runtime: Node.js (plan gratuito)
  - Build: `npm install && npm run build`
  - Start: `npm start`
  - Auto-deploy: activado (desde GitHub)
  - Healthcheck: `/`
- **Variables de entorno requeridas:**
  - `VITE_SUPABASE_URL` — URL de tu proyecto Supabase
  - `VITE_SUPABASE_ANON_KEY` — Clave anon de Supabase
  - `VITE_IDEAM_APP_TOKEN` — Token IDEAM (opcional)
  - `NITRO_PRESET` — `node-server`

### 9.4 Scripts de Procesamiento GeoJSON

- **Archivos:** `scripts/split-geojson.mjs`, `scripts/merge-geojson.mjs`
- **split-geojson.mjs:** Descarga GeoJSON de municipios de Santander desde data-libre y lo divide en archivos individuales por municipio
- **merge-geojson.mjs:** Fusiona múltiples archivos GeoJSON individuales en un solo `FeatureCollection` con todas las propiedades preservadas
- **Salida:** `src/data/santander-municipios.geo.json` — **87 municipios** del departamento de **Santander**
- **Uso:** `node scripts/merge-geojson.mjs` o `node scripts/split-geojson.mjs`

### 9.5 GitHub Actions (CI/CD)

- **Sito oficial:** [https://github.com/features/actions](https://github.com/features/actions)
- **Archivos:**
  - `.github/workflows/ci-cd-pipeline.yml` — Pipeline CI (lint + build en push/PR)
  - `.github/workflows/data-update-cron.yml` — Cron diario para actualizacion de datos
- **Herramientas:** Bun (runtime), actions/checkout@v4, oven-sh/setup-bun@v2

---

## 10. Pipeline ETL (Extraccion, Transformacion, Carga)

### 10.1 etl_ideam.ts

- **Fuente:** datos.gov.co (Socrata API)
- **Dataset:** `53sq-cmp3` (Series Historicas Climaticas)
- **Destino:** Tablas `ideam_cache`, `clima_mensual`
- **Caracteristicas:** Paginacion automatica (1000 registros/pagina), offset-based
- **Runtime:** Deno
- **Comando:** `deno run --allow-net --allow-env data/etl/etl_ideam.ts`

### 10.2 etl_nasa_power.ts

- **Fuente:** NASA POWER API
- **Destino:** Tablas `nasa_power_cache`, `clima_mensual`
- **Cobertura:** los 87 municipios de Santander con coordenadas representativas
- **Parametros:** T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, ALLSKY_SFC_SW_DWN, WS2M
- **Runtime:** Deno
- **Comando:** `deno run --allow-net --allow-env data/etl/etl_nasa_power.ts`

### 10.3 etl_commodities.ts

- **Fuente:** APIs de precios de materias primas (placeholders)
- **Destino:** Tablas `commodity_cache`, `analysis_history`
- **Materias primas:** coffee, cacao, sugar, palm_oil, banana
- **Estado:** Placeholder (pendiente de implementacion completa)
- **Runtime:** Deno
- **Comando:** `deno run --allow-net --allow-env data/etl/etl_commodities.ts`

---

## 11. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
│                    (Navegador Web)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                           │
│  Dashboard │ Chatbot │ Predicciones │ Mapa │ Export PDF/Excel   │
│                                                                      │
│  Componentes: src/components/sembradata/                          │
│  Hooks: src/hooks/                                                │
│  Rutas: src/routes/                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SERVIDOR (Nitro + TanStack Start)                │
│  SSR │ API Routes │ Server Functions                             │
│  Puerto: 3000 │ Preset: node-server                              │
└──────┬──────────────┬──────────────┬────────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌───────────┐ ┌──────────────────────┐
│  Supabase    │ │  APIs     │ │  Sentry              │
│  PostgreSQL  │ │  Externas │ │  Monitoreo           │
│  + Functions │ │  (5 APIs) │ │  Errores             │
└─────────────┘ └───────────┘ └──────────────────────┘
       │              │
       ▼              ▼
┌─────────────┐ ┌──────────────────────────────────────┐
│  Groq + RAG  │ │ APIs Climáticas: Open-Meteo, NASA    │
│ (chatbot IA) │ │ POWER, IDEAM (datos.gov.co)          │
│             │ │ APIs de Suelo: SoilGrids (ISRIC)     │
└─────────────┘ │ APIs de Mercado: Commodity Forecast  │
                │ Backend: Supabase (cache, historial) │
                └──────────────────────────────────────┘
```

---

## Notas Finales

- **Todas las APIs climáticas y de suelo son gratuitas**; IDEAM cuenta con app token de datos.gov.co opcional.
- **El chatbot usa Groq (`openai/gpt-oss-20b`) y Google Gemini 2.0 Flash vía Supabase Edge Functions**, con motor determinista, RAG semántico y evaluación cualitativa.
- **Supabase PostgreSQL opera bajo RLS Hardening (Migración 009)** con permisos de escritura restringidos a `service_role`.
- **Sentry monitorea errores en producción** con filtro de errores de red.
- **La aplicación opera bajo arquitectura estrictamente conectada** garantizando la integridad de los datos presentados.
