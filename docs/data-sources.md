| Característica | Fuente de Datos | Link |
|:---|:---|:---|
| **Mapa Departamental Interactivo** | DANE (DIVIPOLA) + GeoJSON propio | [DANE DIVIPOLA](https://www.dane.gov.co/index.php/estadisticas-por-tema/estadisticas-territoriales/division-politico-administrativa-de-colombia) |
| **Panel de Predicción Detallado** | Agregación: Open-Meteo + SoilGrids + NASA POWER | [Open-Meteo](https://open-meteo.com/) · [SoilGrids](https://www.isric.org/explore/soilgrids) · [NASA POWER](https://power.larc.nasa.gov/) |
| **Datos Climáticos en Tiempo Real** | Open-Meteo API | [open-meteo.com](https://open-meteo.com/) |
| **Validación Histórica (NASA POWER)** | NASA POWER (agroclimatology) | [power.larc.nasa.gov](https://power.larc.nasa.gov/) |
| **Estaciones IDEAM** | IDEAM vía datos.gov.co (Socrata) | [datos.gov.co - IDEAM](https://www.datos.gov.co/Ambiente-y-Desarrollo-Sostenible) |
| **Análisis de Suelo** | SoilGrids (ISRIC) | [isric.org/soilgrids](https://www.isric.org/explore/soilgrids) |
| **Chatbot** | Groq Llama 3.1 8B | [groq.com](https://groq.com/) |
| **Evaluación de Viabilidad** | Motor interno (agrega Open-Meteo, SoilGrids, NASA POWER) | — |
| **Precios Internacionales** | Commodity Forecast API | [commodityforecasts.co.uk](https://www.commodityforecasts.co.uk/) |
| **Panel de KPIs** | Agregación interna de múltiples APIs | — |
| **Índices Agroclimáticos** | NASA POWER (GDD, aridez, estrés UV) | [power.larc.nasa.gov](https://power.larc.nasa.gov/) |
| **Cache de APIs** | Supabase (PostgreSQL) | [supabase.com](https://supabase.com/) |
| **Alertas Tempranas** | Motor de riesgo interno (agrega Open-Meteo + NASA POWER) | [prediction-engine](https://github.com/) |
| **Pronósticos Estacionales** | Open-Meteo (históricos 90d + pronóstico 7d) + NASA POWER | [open-meteo.com](https://open-meteo.com/) · [power.larc.nasa.gov](https://power.larc.nasa.gov/) |
| **Calidad del Suelo** | SoilGrids (ISRIC) | [isric.org/soilgrids](https://www.isric.org/explore/soilgrids) |
| **Exportación Excel** | SheetJS (xlsx) — librería cliente | [sheetjs.com](https://sheetjs.com/) |
| **Notificaciones Push** | Web Push API nativa del navegador | [MDN Web Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) |
| **Compartir por URL** | Web Share API nativa | [MDN Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) |
| **Multi-idioma** | Sistema interno de traducción | — |
| **Historial de Análisis** | Supabase + IndexedDB (fallback offline) | [supabase.com](https://supabase.com/) |
