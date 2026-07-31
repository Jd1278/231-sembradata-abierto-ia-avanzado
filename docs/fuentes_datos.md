# Fuentes de Datos

## Datos Climáticos

| Fuente               | URL                         | Costo              | Frecuencia       | Variables                                                                                                      | Cache            |
| -------------------- | --------------------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------- | ---------------- |
| Open-Meteo           | https://open-meteo.com      | Gratis             | Diaria / Horaria | Temperatura, precipitación, viento, radiación solar, humedad, UV, pronóstico 7d, históricos 90d                | No (tiempo real) |
| IDEAM (datos.gov.co) | https://datos.gov.co        | Gratis (app token) | Diaria           | Temperatura, precipitación, viento, humedad, radiación solar, nubosidad                                        | 24 horas         |
| NASA POWER           | https://power.larc.nasa.gov | Gratis             | Diaria           | Temperatura, precipitación, radiación solar, humedad, viento + índices agroclimáticos (GDD, aridez, estrés UV) | 7 días           |

## Datos de Suelo

| Fuente            | URL                    | Costo  | Variables                                                                 | Profundidades                                        |
| ----------------- | ---------------------- | ------ | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| SoilGrids (ISRIC) | https://rest.isric.org | Gratis | pH, materia orgánica, textura, drenaje, carbono orgánico, fertilidad, CIC | 0-5cm, 5-15cm, 15-30cm, 30-60cm, 60-100cm, 100-200cm |

## Datos de Mercado

| Fuente                 | URL                                  | Costo  | Variables                                                                | Cache  |
| ---------------------- | ------------------------------------ | ------ | ------------------------------------------------------------------------ | ------ |
| Commodity Forecast API | https://www.commodityforecasts.co.uk | Gratis | Precios internacionales de café (Arabica) y cacao + riesgo climático     | 1 hora |

## Datos Geoespaciales

| Fuente           | URL                     | Formato      | Descripción                                        |
| ---------------- | ----------------------- | ------------ | -------------------------------------------------- |
| DANE - Divipola  | https://www.dane.gov.co | JSON/GeoJSON | Límites municipales del departamento de Santander  |
| GeoJSON Colombia | Archivo local           | GeoJSON      | Departamento de Santander para visualización SVG |

## Datos de Riesgo Agroclimático

| Fuente          | Descripción                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| NASA POWER      | Índices agroclimáticos (GDD, aridez, estrés hídrico) calculados a partir de datos satelitales     |
| Motor de predicción | Modelo de riesgo (sequía, helada, plaga) combinando clima, suelo y cultivo en `src/services/prediction-engine.ts` |

## IA y Backend

| Fuente          | Descripción                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| Groq (Llama 3.1 8B) | Chatbot con RAG sobre la base de conocimiento local (server-side, Edge Function de Supabase) |
| Supabase        | PostgreSQL + Edge Functions + caché de APIs con TTL y control de concurrencia  |
