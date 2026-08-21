# Guia de Validacion

Esta guia permite a pares revisores validar los resultados y metodologia de SembraData.

## 1. Validacion de Datos

### Verificar fuentes

- Confirmar que los datos climaticos coinciden con registros del IDEAM
- Validar limites municipales con el DANE (MCP actualizado)
- Validar propiedades de suelo con SoilGrids (ISRIC, 6 profundidades)
- Comparar pronosticos con historicos satelitales de NASA POWER (indices agroclimaticos)
- Validar precios de commodities con Commodity Forecast

### Calidad de datos

```bash
# Ejecutar tests de integracion de datos
npm run test
```

## 2. Validacion de Modelos

### Metricas esperadas

| Modelo                  | Metrica  | Valor esperado |
| ----------------------- | -------- | -------------- |
| Rendimiento (regresion) | R2       | >= 0.75        |
| Rendimiento (regresion) | MAE      | <= 0.15 Ton/Ha |
| Riesgo (clasificacion)  | F1-Score | >= 0.80        |
| Riesgo (clasificacion)  | AUC-ROC  | >= 0.85        |

### Reproducibilidad

```bash
# Ejecutar todos los tests unitarios (145 tests)
npm run test

# Ejecutar tests E2E (31 casos)
npm run test:e2e

# Validacion completa
npm run validate
```

## 3. Validacion de la Interfaz

### Criterios de aceptacion

- [ ] El mapa muestra los 87 municipios de Santander
- [ ] Los filtros (departamento, cultivo) funcionan correctamente
- [ ] Los KPIs se actualizan al cambiar los filtros
- [ ] Los graficos muestran datos coherentes
- [ ] El chatbot responde en lenguaje natural con memoria
- [ ] La exportacion a PDF genera un documento completo
- [ ] La exportacion a Excel genera un archivo .xlsx
- [ ] El modo offline funciona (IndexedDB + Service Worker)
- [ ] La navegacion por teclado funciona en el mapa SVG
- [ ] El skip-to-content link funciona correctamente
- [ ] Los focus traps funcionan en modales (PredictionPanel, HistoryPanel)
- [ ] Las regiones aria-live anuncian actualizaciones dinamicas
- [ ] El boton de compartir genera una URL valida

## 4. Validacion de APIs Externas

### Verificar integraciones

| API                | Endpoint                 | Verificacion                               |
| ------------------ | ------------------------ | ------------------------------------------ |
| Open-Meteo         | /v1/forecast             | Datos climaticos actuales + pronostico 7d  |
| NASA POWER         | /temporal/daily          | Datos satelitales + indices agroclimaticos |
| IDEAM              | datos.gov.co             | Estaciones meteorologicas reales           |
| SoilGrids          | /soilgrids/v2.0          | Propiedades del suelo a 6 profundidades    |
| Commodity Forecast | commodityforecasts.co.uk | Precios cafe y cacao                       |
| Groq (chatbot)     | api.groq.com             | Respuestas del chatbot (server-side)       |
| Supabase           | supabase.co              | Cache de APIs, historial, Edge Functions   |

## 5. Validacion Etica

- Ejecutar tests de equidad territorial
- Verificar que municipios pequenos no reciben sistematicamente clasificaciones de alto riesgo
- Confirmar que las metricas de confianza se muestran al usuario
- Validar que el chatbot no genera recomendaciones medicas o legales
- Verificar que las alertas no causan alarmismo innecesario
