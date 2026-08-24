# Fuentes de Datos — SembraData

Inventario de fuentes de datos primarias, secundarias y servicios de cómputo utilizados en SembraData.

---

## 1. Datos Históricos Oficiales y Requerimientos Agronómicos

| Fuente / Institución                 | Descripción                                                                                   | Acceso / Protocolo                     | Rol en SembraData                                                                               |
| :----------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **MinAgricultura / EVA**             | Evaluaciones Agropecuarias Municipales históricas (rendimiento en Ton/Ha y superficie en Ha). | Supabase (`rendimiento_historico`)     | **Observación Histórica Oficial**. Serie fundamental para el cálculo de tendencias ($N \ge 3$). |
| **Cenicafé / Fedecacao / AGROSAVIA** | Manuales técnicos y requerimientos agroclimáticos óptimos de Café, Cacao y Granadilla.        | Supabase (`crop_climate_requirements`) | **Reglas Agronómicas Deterministas** (temperatura, precipitación, altitud y pH).                |

---

## 2. Datos Meteorológicos y Satelitales

| Fuente                   | Variables                                                                                                     | Frecuencia            | Caché / TTL                  |
| :----------------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------- | :--------------------------- |
| **Open-Meteo API**       | Temperatura actual, humedad relativa, precipitación 7 días, velocidad de viento, radiación y balance hídrico. | Tiempo real / Horaria | Sin caché (consulta directa) |
| **NASA POWER**           | Radiación solar diaria, evapotranspiración de referencia ($ET_0$), índices GDD y estrés térmico.              | Diaria                | Caché Supabase (7 días)      |
| **IDEAM (datos.gov.co)** | Observaciones de estaciones meteorológicas oficiales en territorio santandereano.                             | Diaria                | Caché Supabase (24 horas)    |

---

## 3. Datos Pedológicos (Suelo)

| Fuente                | Variables                                                                  | Profundidades                                                 |
| :-------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **SoilGrids (ISRIC)** | pH en $H_2O$, materia orgánica, contenido de arena/arcilla/limo y textura. | 6 capas ($0\text{-}5\text{ cm}$ a $100\text{-}200\text{ cm}$) |

---

## 4. Modelos de Inferencia e Inteligencia Artificial

| Servicio / Modelo                                    | Rol Arquitectónico                                                                                                        | Limitación Estricta                                                                          |
| :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| **Theil-Sen / Rolling Backtest** (SembraData Engine) | Cálculo estadístico determinista de tendencias e intervalos de confianza al 80% y 95% ($L_{80}, U_{80}, L_{95}, U_{95}$). | **Única fuente de predicciones numéricas**. Requiere $N \ge 3$ observaciones reales de EVA.  |
| **Groq Cloud (`openai/gpt-oss-20b`)**                | Asistente conversacional agroclimático en Edge Function `chat` con validación Zod y RAG.                                  | **No inventa cifras**. Explica exclusivamente datos suministrados por el motor determinista. |
| **Google Gemini 2.0 Flash**                          | Evaluación cualitativa de consistencia biológica en Edge Function `gemini-assessment`.                                    | **No genera ni altera proyecciones estadísticas**.                                           |
