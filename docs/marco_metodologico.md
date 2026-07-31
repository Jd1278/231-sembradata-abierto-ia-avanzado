# Marco Metodológico — CRISP-DM Adaptado

SembraData sigue una adaptación de CRISP-DM (Cross-Industry Standard Process for Data Mining) para proyectos de IA agrícola.

## Fases

### 1. Comprensión del Negocio

- Identificar stakeholders: agricultores, instituciones agrarias, MIDT
- Definir KPIs: rendimiento (Ton/Ha), nivel de riesgo, confianza del modelo
- Cobertura: 87 municipios del departamento de Santander

### 2. Comprensión de los Datos

- **5 APIs externas integradas + IA + backend:**
  - Climáticas: Open-Meteo (90d históricos + pronóstico 7d), NASA POWER (satelital), IDEAM (estaciones, datos.gov.co)
  - Suelo: SoilGrids ISRIC (6 niveles de profundidad)
  - Mercado: Commodity Forecast (café, cacao)
  - IA conversacional: Groq (Llama 3.1 8B) para el chatbot (server-side)
  - Backend: Supabase (cache de APIs, historial de análisis, Edge Functions)
- Periodo: 2015–2026
- Cobertura: 87 municipios de Santander

### 3. Preparación de los Datos

- Limpieza de valores atípicos en registros climáticos
- Imputación de datos faltantes por interpolación temporal
- Normalización de variables numéricas
- Codificación de variables categóricas (riesgo, zona agroecológica)
- Cache inteligente con TTL por fuente (24h-7d)

### 4. Modelado

- **Motor de predicción v2:** 8 factores ponderados con score de confianza
  - Temperatura, precipitación, humedad, suelo, altitud, estacionalidad, plagas, cultivo
- Clasificación de riesgo: Logistic Regression / XGBoost
- Embeddings climáticos para el sistema conversacional (RAG)
- Chatbot con memoria de conversación, sinónimos y detección de intención

### 5. Evaluación

- Métricas: MAE, RMSE, R² para regresión; F1, AUC-ROC para clasificación
- Validación cruzada temporal (walk-forward)
- Pruebas de equidad territorial (bias_tests/)
- 145 tests unitarios/componentes + 31 casos E2E automatizados

### 6. Despliegue

- Frontend: React 19 + TanStack Start (SSR) + Tailwind CSS 4
- Backend: Supabase (PostgreSQL, Edge Functions, Auth)
- APIs: 5 fuentes externas integradas + Groq + Supabase
- Monitoreo: PWA con Service Worker v2, offline-first
- CI/CD: Vercel (producción) + Docker + Kubernetes (contenedores)
- Accesibilidad: WCAG 2.1 (focus trap, keyboard nav, aria-live)
