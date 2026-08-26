# Marco Metodológico — CRISP-DM Adaptado a SembraData

SembraData sigue una adaptación rigurosa de CRISP-DM (Cross-Industry Standard Process for Data Mining) para sistemas predictivos y asistentes agroclimáticos en el departamento de Santander, Colombia.

---

## Fases de la Metodología

### 1. Comprensión del Negocio y Dominio Agrícola

- **Stakeholders:** Agricultores, asistentes técnicos, cooperativas y entidades gremiales (Cenicafé, Fedecacao, AGROSAVIA).
- **KPIs:** Rendimiento proyectado (Ton/Ha), intervalos de confianza estadística, índice de adecuación agroclimática y mitigación de riesgos de heladas/sequías.
- **Ámbito Geográfico:** Los 87 municipios de Santander, con análisis priorizado en Café, Cacao y Granadilla.

### 2. Comprensión de los Datos e Integración Institucional

- **Series Históricas Oficiales:** Registros observados de Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura) para Santander.
- **Meteorología en Tiempo Real:** Open-Meteo API (clima actual y pronóstico 7 días) e IDEAM (estaciones meteorológicas oficiales).
- **Datos Satelitales y Pedológicos:** NASA POWER (radiación y evapotranspiración) y SoilGrids ISRIC (propiedades de suelo a 6 profundidades).
- **Reglas Fisiológicas:** Requerimientos térmicos, hídricos, altitudinales y de pH institucionales en `crop_climate_requirements`.

### 3. Preparación de Datos y Gobernanza de Calidad

- **Aislamiento de Anomalías:** Registros físicos imposibles o corruptos son aislados en `data_quality_quarantine` mediante auditoría server-side.
- **Deduplicación Ponderada:** Las observaciones históricas repetidas se unifican mediante promedio ponderado por superficie cosechada (`superficie_ha`).
- **Política de Integridad Numérica:** Se prohíbe la generación de observaciones sintéticas cuando la muestra histórica es menor a 3 registros ($N < 3$), declarando formalmente el estado `insufficient_data`.

### 4. Modelado Estadístico y Asistencia Conversacional

- **Motor Estadístico (Theil-Sen / Rolling Backtest):** Estimador robusto no paramétrico insensible a outliers para la proyección de pendientes de rendimiento con intervalos de confianza al 80% y 95% ($L_{80}, U_{80}, L_{95}, U_{95}$).
- **Evaluación Cualitativa (Google Gemini 2.0 Flash):** Verificación de coherencia biológica y agronómica mediante Edge Function `gemini-assessment` sin alterar los números calculados.
- **Chatbot Agroclimático Trazable (Groq `openai/gpt-oss-20b`):** Asistente con validación geográfica estricta en Santander, RAG con umbral de similitud $\ge 3.0$ y verificación server-side de afirmaciones numéricas.

### 5. Evaluación y Verificación Continua

- **Métricas Estadísticas:** MAE, RMSE, SMAPE y validación de cobertura de intervalos.
- **Control de Calidad de Software:** 51 archivos de prueba con 392 tests unitarios e integración pasando al 100%.
- **Validación Anti-Alucinaciones:** Verificación determinista de claims y eliminación de sesgos territoriales.

### 6. Despliegue y Operación Conectada

- **Frontend / Servidor:** React 19 + TanStack Start con SSR Nitro sobre Node 22 Alpine en Docker / Vercel.
- **Backend / Seguridad:** Supabase PostgreSQL con RLS Hardening (Migración 009) y Edge Functions en Deno.
- **Conectividad:** Aplicación estrictamente conectada con monitoreo de estado de red en tiempo real.
