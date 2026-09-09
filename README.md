<img width="1500" height="500" alt="baner-sembradata" src="https://github.com/user-attachments/assets/43bb04ad-fbc3-425a-ae59-336a69692401" />
<div align="center">

# SembraData: Predicción Agroclimática — Santander

> **SembraData** es una plataforma web interactiva de analítica agroclimática predictiva diseñada para mitigar los riesgos climáticos y optimizar la toma de decisiones agrícolas en el **departamento de Santander, Colombia**. Cubre los **87 municipios del departamento**, integrando observaciones climáticas, perfiles de suelo, series históricas verificadas de **EVA / MinAgricultura**, pronósticos estadísticos reproducibles y asistentes de IA con validación geográfica y controles contra alucinaciones.

<br/>

![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.168-3B82F6?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.49-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Node_22_Alpine-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## Despliegue de la Aplicación

> [!IMPORTANT]
> La versión beta en producción se encuentra desplegada y conectada a Supabase. La cobertura geográfica y agroclimática está delimitada a los **87 municipios de Santander**, está versión contiene un análisis sobre los cultivos de café, cacao y granadilla.

<div align="center">

### [Abrir SembraData en Producción](https://231-sembradata-abierto-ia-avanzado.vercel.app/)

**`https://231-sembradata-abierto-ia-avanzado.vercel.app/`**

### [Sustentación y Documentación Ejecutiva](https://gamma.app/docs/Prediccion-Agroclimatica-Inteligente-vr0vp5qbfomjv4y)

</div>

---

## Características Principales

| Icono | Módulo / Característica | Descripción Técnica |
| :---: | :---------------------- | :----------------- |
| 🗺️ | **Mapa Coroplético de Santander** | Visualización vectorial SVG de los **87 municipios** con selección geográfica, clasificación agroecológica y niveles de riesgo. |
| 📈 | **Histórico vs. Predicción** | Contraste entre series históricas observadas de **EVA / MinAgricultura** y proyecciones estadísticas mediante **Theil-Sen + Rolling Origin**, con intervalos de predicción al 80% y 95%. No utiliza datos sintéticos y requiere **N ≥ 3 observaciones reales**. |
| 🤖 | **Chatbot Agroclimático Trazable** | Asistente con servicios deterministas, validación geográfica, RAG con umbral de relevancia y modelo Groq `openai/gpt-oss-20b`, acompañado de sanitización de respuestas y afirmaciones verificables. |
| 🧪 | **Evaluación Agronómica Gemini** | Edge Function `gemini-assessment` con **Google Gemini 2.0 Flash** para evaluar cualitativamente la consistencia biológica sin modificar los valores numéricos del motor estadístico. |
| ⛅ | **Clima en Vivo — Open-Meteo** | Consulta de clima actual, pronóstico a 7 días y variables para balance hídrico. |
| 🛰️ | **Validación Satelital — NASA POWER** | Consulta de radiación solar, evapotranspiración de referencia y variables agroclimáticas históricas. |
| 📡 | **Estaciones IDEAM** | Integración de estaciones meteorológicas oficiales mediante datos abiertos de IDEAM / Socrata. |
| 🪨 | **Propiedades del Suelo — SoilGrids ISRIC** | Perfiles pedológicos por profundidad con pH en H₂O, materia orgánica y textura de arena, arcilla y limo. |
| 🌱 | **Recomendación de Cultivos** | Evaluación de compatibilidad bioclimática mediante perfiles de temperatura, precipitación, altitud y humedad, incluyendo cultivos alternativos. |
| 📊 | **Mercado Internacional y Nacional** | Referencias de mercado internacional para cacao y café, junto con precios nacionales DANE SIPSA / Centroabastos y análisis asociado a presión climática. |
| 🛡️ | **Arquitectura Conectada y Segura** | Aplicación conectada a Supabase con RLS, control de calidad de datos, dataset EVA 2018–2024 y frontend orientado a lectura de información validada. |

---

## Arquitectura del Sistema

<img width="2816" height="1536" alt="Infraestructura-sembradata" src="https://github.com/user-attachments/assets/ed868e85-a8ac-4c71-bef1-e5748952ecf0" />


---

## Objetivo del Proyecto

**SembraData** aborda la toma de decisiones agrícolas bajo incertidumbre climática en Santander mediante la integración de datos abiertos, información agroclimática, propiedades del suelo y modelos estadísticos reproducibles.

La plataforma integra:

- **Datos históricos oficiales** del Ministerio de Agricultura mediante EVA 2018–2024.
- **Variables agroclimáticas** provenientes de NASA POWER y Open-Meteo.
- **Perfiles pedológicos** de SoilGrids / ISRIC.
- **Estaciones meteorológicas oficiales** del IDEAM mediante Socrata.
- **Modelos estadísticos robustos** basados en Theil-Sen y Rolling Origin.
- **Asistentes de IA** con Groq y Google Gemini para interacción y evaluación cualitativa.
- **Validación geográfica** limitada al catálogo de municipios de Santander.
- **Controles de calidad** para evitar que datos insuficientes o inválidos sean tratados como predicciones confiables.

### Propuesta de Valor

| Stakeholder | Beneficio |
| :---------- | :-------- |
| **Agricultores** | Consulta de condiciones agroclimáticas, riesgo y proyección de rendimiento por municipio y cultivo. |
| **Entidades gubernamentales** | Dashboard centralizado con información abierta, trazable y validada. |
| **Investigadores** | Motor estadístico reproducible que evita datos sintéticos y exige un mínimo de observaciones reales. |
| **Mercado** | Integración de referencias nacionales e internacionales para complementar el análisis productivo. |

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
| :--------- | :------ | :-------- |
| **React** | 19.2.0 | Biblioteca principal para la interfaz de usuario. |
| **TanStack Start** | 1.168+ | Framework full-stack con SSR, routing basado en archivos y streaming. |
| **TanStack Router** | 1.170+ | Enrutamiento tipado y code-splitting. |
| **TanStack React Query** | 5.101+ | Gestión de estado del servidor, cache y sincronización. |
| **Tailwind CSS** | 4.2.1 | Sistema de estilos utility-first. |
| **Radix UI** | 2.2+ | Primitivas accesibles para componentes de interfaz. |
| **Lucide React** | 0.575+ | Iconografía. |
| **Vaul** | 1.1+ | Drawers y modales. |
| **Embla Carousel** | 8.6+ | Carruseles interactivos. |
| **Sonner** | 2.0+ | Notificaciones toast. |
| **React Hook Form + Zod** | 7.82+ / 3.24+ | Formularios y validación tipada. |

### Backend y Servicios

| Tecnología | Versión | Propósito |
| :--------- | :------ | :-------- |
| **Supabase PostgreSQL** | 15+ | Persistencia relacional, RLS y almacenamiento de datos agroclimáticos. |
| **Supabase Edge Functions** | Deno 2.x | Servicios server-side para IA y tareas de backend. |
| **Vite** | 8.0+ | Bundler y servidor de desarrollo. |
| **Nitro** | 3.0+ beta | Runtime y servidor de producción. |

### IA y Machine Learning

| Tecnología | Modelo / Servicio | Propósito |
| :--------- | :---------------- | :-------- |
| **Groq Cloud API** | `openai/gpt-oss-20b` | Chatbot agroclimático con RAG y motor determinista. |
| **Google Generative AI** | Gemini 2.0 Flash | Evaluación cualitativa de consistencia biológica. |
| **Motor Estadístico Propio** | Theil-Sen + Rolling Origin | Predicción de rendimiento e intervalos L₈₀/U₈₀ y L₉₅/U₉₅. |

### Visualización y GIS

| Tecnología | Propósito |
| :--------- | :-------- |
| **SVG Vectorial Nativo** | Mapa coroplético interactivo de los 87 municipios de Santander. |
| **Tailwind CSS / CSS** | Clasificación visual de zonas agroecológicas, compatibilidad y riesgo. |
| **Gráficos React** | Visualización de históricos, predicciones, riesgo y rendimiento. |

### Monitoreo y Calidad

| Tecnología | Propósito |
| :--------- | :-------- |
| **Sentry** | Seguimiento de errores, rendimiento y telemetría. |
| **Vitest** | Pruebas unitarias e integración. |
| **Playwright** | Pruebas end-to-end. |
| **ESLint + Prettier** | Calidad y consistencia del código. |
| **Husky + lint-staged** | Validaciones automáticas sobre cambios. |

---

## APIs, Modelos y Fuentes de Datos

### Endpoints Externos Consumidos

| API                      | Página principal                                                                   | Datos                                                       | Autenticación                |
| :----------------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------- | :--------------------------- |
| **Open-Meteo**           | [https://open-meteo.com/](https://open-meteo.com/)                                 | Clima actual, pronóstico 7 días y variables agroclimáticas. | Sin clave                    |
| **NASA POWER**           | [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/)                       | Radiación solar, ET₀ y variables históricas.                | Sin clave                    |
| **IDEAM Socrata**        | [https://www.datos.gov.co/](https://www.datos.gov.co/)                             | Estaciones meteorológicas oficiales.                        | Token Socrata opcional       |
| **SoilGrids ISRIC**      | [https://www.isric.org/explore/soilgrids](https://www.isric.org/explore/soilgrids) | pH, materia orgánica y textura por profundidad.             | Sin clave                    |
| **Groq Cloud**           | [https://groq.com/](https://groq.com/)                                             | LLM `openai/gpt-oss-20b`.                                   | `GROQ_API_KEY` server-side   |
| **Google Generative AI** | [https://ai.google.dev/](https://ai.google.dev/)                                   | Gemini 2.0 Flash.                                           | `GEMINI_API_KEY` server-side |


### Edge Functions

| Función | Método | Descripción |
| :------ | :----- | :---------- |
| `chat` | `POST` | Chatbot agroclimático con validación geográfica, RAG, motor determinista y sanitización de respuesta. |
| `gemini-assessment` | `POST` | Evaluación cualitativa de consistencia biológica. |
| `cache-cleanup` | `POST / interno` | Limpieza de información temporal almacenada en cache. |

> **Nota:** Las Edge Functions se despliegan desde `supabase/functions/`. No deben confundirse con rutas `/.netlify/functions/*`, que no representan la estructura actual del backend del repositorio.

### Modelos Predictivos

| Modelo | Tipo | Variables / Datos | Resultado |
| :----- | :--- | :---------------- | :-------- |
| **Theil-Sen Regressor** | Estadístico robusto no paramétrico | Año, rendimiento histórico y variables agroclimáticas disponibles | Rendimiento proyectado |
| **Rolling Origin Validation** | Validación temporal walk-forward | Series históricas EVA | Intervalos de predicción L₈₀, U₈₀, L₉₅ y U₉₅ |
| **Compatibilidad bioclimática** | Scoring determinista | Temperatura, precipitación, humedad, altitud y perfiles de cultivo | Nivel de compatibilidad y cultivos candidatos |

> **Restricción de calidad:** El motor no debe generar una predicción estadística cuando no existen al menos **3 observaciones reales** disponibles para el contexto analizado. No se utilizan datos sintéticos para completar series insuficientes.

### Datasets Principales
## Datasets Principales

| Fuente                               | Periodo / Cobertura                | Uso                                                        | Enlace oficial                                                                                                                        |
| :----------------------------------- | :--------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **EVA — MinAgricultura**             | 2018–2024 / 87 municipios          | Series históricas de rendimiento y producción.             | [Evaluaciones Agropecuarias Municipales — Agronet](https://www.agronet.gov.co/estadistica/Paginas/home.aspx?cod=59)                   |
| **NASA POWER**                       | 1984–presente                      | Variables agroclimáticas históricas y satelitales.         | [NASA POWER](https://power.larc.nasa.gov/)                                                                                            |
| **IDEAM**                            | Por estación                       | Observaciones meteorológicas oficiales.                    | [IDEAM](http://www.ideam.gov.co/) / [Datos Abiertos Colombia](https://www.datos.gov.co/)                                              |
| **Open-Meteo**                       | Actual / pronóstico                | Variables climáticas operativas.                           | [Open-Meteo](https://open-meteo.com/)                                                                                                 |
| **SoilGrids ISRIC**                  | Datos estáticos por profundidad    | Caracterización del suelo.                                 | [SoilGrids — ISRIC](https://soilgrids.org/)                                                                                           |
| **Mercado nacional e internacional** | Según disponibilidad del proveedor | Referencias de cacao, café y otros indicadores de mercado. | [DANE — SIPSA](https://www.dane.gov.co/index.php/servicios-al-ciudadano/servicios-de-informacion/sipsa) / [ICE](https://www.ice.com/) |
| **GeoJSON Santander**                | 87 municipios                      | Representación geográfica y validación espacial.           | [IGAC](https://www.igac.gov.co/) / [Geoportal DANE](https://geoportal.dane.gov.co/)                                                   |


---

## Estructura del Proyecto

La estructura siguiente refleja la organización actual de la rama `version`:

```text
231-sembradata-abierto-ia-avanzado/
│
├── .github/                    # Configuración de GitHub
├── .husky/                     # Hooks de Git
├── .lovable/                   # Configuración asociada al entorno Lovable
├── RECURSOS/                   # Recursos del proyecto
├── config/                    # Configuración adicional
├── data/                      # ETL, metadatos y documentación de datos
│   ├── etl/
│   ├── README.md
│   └── metadata.json
├── deployments/               # Recursos de despliegue
├── docs/                      # Documentación técnica y metodológica
│   ├── api/
│   ├── architecture/
│   ├── deployment/
│   ├── migration/
│   ├── analisis_fases_3_7.md
│   ├── chatbot-examples.md
│   ├── conclusiones.md
│   ├── data-sources.md
│   ├── data_dictionary.md
│   ├── fuentes_datos.md
│   ├── herramientas_y_apis.md
│   ├── marco_metodologico.md
│   ├── plan_optimizacion_fases_3_7.md
│   ├── planteamiento_problema.md
│   ├── public_impact_assessment.md
│   └── validacion_guide.md
├── e2e/                       # Pruebas E2E adicionales
├── public/                    # Recursos públicos y PWA
│   ├── icons/
│   ├── favicon.ico
│   └── sw.js
├── reports/                   # Informes y reportes generados
│   ├── informe_optimizacion.md
│   └── reporte_final.pdf
├── scripts/                   # Scripts auxiliares y de procesamiento
├── src/
│   ├── components/
│   │   ├── sembradata/
│   │   │   ├── dashboard/
│   │   │   ├── prediction/
│   │   │   ├── AdvancedFilters.tsx
│   │   │   ├── ChatbotPanel.tsx
│   │   │   ├── ClimateRadar.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── OfflineIndicator.tsx
│   │   │   ├── PredictionPanel.tsx
│   │   │   ├── RiskChart.tsx
│   │   │   ├── SantanderMap.tsx
│   │   │   ├── SectionErrorBoundary.tsx
│   │   │   ├── Skeletons.tsx
│   │   │   ├── YieldChart.tsx
│   │   │   ├── data.ts
│   │   │   ├── geo-utils.ts
│   │   │   └── municipios.ts
│   │   └── ui/               # Componentes de interfaz reutilizables
│   ├── data/                  # Datos estáticos y requerimientos de cultivos
│   ├── hooks/                 # Hooks React
│   ├── lib/                   # Utilidades, errores y monitoreo
│   ├── routes/                # Rutas TanStack
│   ├── services/
│   │   ├── analysis-history.ts
│   │   ├── cache.ts
│   │   ├── chatbot.ts
│   │   ├── climate-api.ts
│   │   ├── climate-calculator.ts
│   │   ├── climate-state.ts
│   │   ├── commodity-price.ts
│   │   ├── commodity-service.ts
│   │   ├── crop-recommendations.ts
│   │   ├── forecasting-engine.ts
│   │   ├── gemini-service.ts
│   │   ├── historical-prediction-service.ts
│   │   ├── ideam.ts
│   │   ├── map-compatibility.ts
│   │   ├── nasa-power.ts
│   │   ├── rate-limiter.ts
│   │   ├── soil-service.ts
│   │   ├── supabase.ts
│   │   └── temporal-optimizer.ts
│   ├── types/                  # Tipos TypeScript del dominio
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── supabase/
│   ├── diagnostics/
│   ├── functions/
│   │   ├── cache-cleanup/
│   │   ├── chat/
│   │   └── gemini-assessment/
│   ├── migrations/
│   │   ├── 001_api_cache.sql
│   │   ├── 002_analysis_history.sql
│   │   ├── 003_chat_conversations.sql
│   │   ├── 004_recommendations_cache.sql
│   │   ├── 005_analysis_history_columns.sql
│   │   ├── 006_phase0_optimization.sql
│   │   ├── 007_agroclimatic_predictions_v2.sql
│   │   ├── 008_data_quality_and_security.sql
│   │   ├── 009_security_and_rls_hardening.sql
│   │   └── 010_santander_eva_historical_yields.sql
│   └── config.toml
├── tests/
│   ├── bias_tests/
│   ├── components/
│   ├── e2e/
│   ├── integration/
│   ├── unit/
│   └── setup.ts
│
├── AGENTS.md
├── Changelog.md
├── Dockerfile
├── LICENSE
├── Plan_SembraData_Opcion_C_14_dias.md
├── knowledge-base-export.json
├── n8n-workflow-sembradata-chatbot.json
├── package.json
├── playwright.config.ts
├── render.yaml
├── requirements.txt
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Configuración de Variables de Entorno

### Variables públicas del frontend

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_IDEAM_APP_TOKEN=tu-app-token
VITE_SENTRY_DSN=
```

### Secretos server-side

```env
GROQ_API_KEY=tu-groq-api-key
GEMINI_API_KEY=tu-gemini-api-key
ALLOWED_ORIGINS=https://tu-dominio.com
```

> [!CAUTION]
> `GROQ_API_KEY` y `GEMINI_API_KEY` **nunca deben exponerse en el frontend**, en archivos `.env` versionados, en el bundle de producción ni en la imagen Docker.

Las claves de IA deben configurarse como secretos de las Edge Functions de Supabase.

---

## Inicio Rápido y Desarrollo Local

### Requisitos Previos

- **Node.js:** `>= 22.12.0`
- **npm:** compatible con el proyecto actual
- **Supabase:** proyecto configurado para las migraciones y Edge Functions
- **Git**

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jd1278/231-sembradata-abierto-ia-avanzado.git
cd 231-sembradata-abierto-ia-avanzado

# 2. Instalar dependencias
npm ci

# 3. Crear variables de entorno
cp .env.example .env

# 4. Iniciar desarrollo
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

---

## Base de Datos y Supabase

El repositorio contiene **10 migraciones** principales que evolucionan la base de datos desde cache e historial hasta seguridad, calidad de datos y dataset histórico EVA.

```text
001_api_cache
002_analysis_history
003_chat_conversations
004_recommendations_cache
005_analysis_history_columns
006_phase0_optimization
007_agroclimatic_predictions_v2
008_data_quality_and_security
009_security_and_rls_hardening
010_santander_eva_historical_yields
```

La migración `009` incorpora el endurecimiento de seguridad y RLS, mientras que la `010` incorpora el dataset histórico EVA de Santander.

---

## Despliegue con Docker

El proyecto dispone de un `Dockerfile` multi-stage basado en **Node 22 Alpine** y ejecuta el servidor SSR de Nitro.

```bash
# Construir imagen
docker build \
  --build-arg VITE_SUPABASE_URL="https://tu-proyecto.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="tu-anon-key" \
  -t sembradata-web:latest .

# Ejecutar contenedor
docker run -d \
  -p 3000:3000 \
  --name sembradata-app \
  sembradata-web:latest

# Comprobar estado
docker ps

# Comprobar respuesta HTTP
wget -qO- http://localhost:3000/
```

---

## Despliegue en Vercel

La aplicación se encuentra preparada para producción mediante Vercel y Nitro.

Configura como mínimo:

```env
NITRO_PRESET=vercel
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_IDEAM_APP_TOKEN=tu-token
VITE_SENTRY_DSN=tu-dsn
```

El proceso de construcción utiliza:

```bash
npm run build
```

---

## Despliegue de Edge Functions

```bash
# Iniciar sesión
npx supabase login

# Desplegar chatbot
npx supabase functions deploy chat \
  --project-ref <project-ref> \
  --no-verify-jwt

# Desplegar evaluación Gemini
npx supabase functions deploy gemini-assessment \
  --project-ref <project-ref> \
  --no-verify-jwt

# Desplegar limpieza de cache
npx supabase functions deploy cache-cleanup \
  --project-ref <project-ref>
```

Configura los secretos sin versionarlos:

```bash
npx supabase secrets set GROQ_API_KEY="<tu_groq_api_key>" \
  --project-ref <project-ref>

npx supabase secrets set GEMINI_API_KEY="<tu_gemini_api_key>" \
  --project-ref <project-ref>
```

---

## Pipeline de Calidad y Validación

El proyecto incluye validación de tipos, linting, pruebas automatizadas y build de producción.

```bash
# Validación de tipos
npm run typecheck

# Linting
npm run lint

# Suite completa de pruebas
npm run test

# Pruebas unitarias
npm run test:unit

# Pruebas de componentes
npm run test:components

# Pruebas E2E
npm run test:e2e

# Cobertura
npm run test:coverage

# Build
npm run build

# Validación completa
npm run validate
```

### Estado actual del pipeline

De acuerdo con el estado documentado de la rama `version`:

- **51 archivos de prueba**
- **392 pruebas unitarias/integración**
- TypeScript validado mediante `tsc --noEmit`
- ESLint integrado en el pipeline
- Build de producción mediante Vite/Nitro
- Pruebas E2E mediante Playwright

> Para obtener cifras de cobertura, tiempos de ejecución o resultados de una ejecución concreta, debe ejecutarse la suite en el entorno actual; este README no asume resultados que no estén registrados en el repositorio.

---

## Documentación del Proyecto

La documentación técnica está organizada en:

```text
docs/
├── api/                    # Documentación de APIs
├── architecture/          # Arquitectura del sistema
├── deployment/             # Despliegue
├── migration/              # Migraciones y evolución de datos
├── analisis_fases_3_7.md
├── chatbot-examples.md
├── conclusiones.md
├── data-sources.md
├── data_dictionary.md
├── fuentes_datos.md
├── herramientas_y_apis.md
├── marco_metodologico.md
├── plan_optimizacion_fases_3_7.md
├── planteamiento_problema.md
├── public_impact_assessment.md
└── validacion_guide.md
```

Otros documentos relevantes del repositorio:

- `AGENTS.md` — reglas y contexto para agentes de desarrollo.
- `Changelog.md` — historial de cambios.
- `Plan_SembraData_Opcion_C_14_dias.md` — plan de optimización.
- `reports/informe_optimizacion.md` — informe técnico.
- `reports/reporte_final.pdf` — reporte final.
- `data/README.md` — documentación del directorio de datos.

---

## Licencia

Distribuido bajo la **Licencia MIT**. Consulta el archivo [`LICENSE`](LICENSE) para los términos completos.

<br/>

<div align="center">

**Hecho con 🌱 para el agro de Colombia**

</div>
