# SembraData — Plan de Estabilización, Mejora y Escalabilidad

> **Estado:** COMPLETADO Y CONSOLIDADO (Agosto 2026).
> **Nota de Arquitectura:** El modo offline / PWA fue oficialmente deprecado y eliminado en favor de una arquitectura conectada determinista con validación en tiempo real.

**Estrategia seleccionada:** Opción C — Refactorización controlada + corrección incremental  
**Duración máxima:** 14 días  
**Agente de desarrollo:** OpenCode  
**Base:** Auditoría técnica del repositorio y documento "Actualización Sembra Data"

---

## 1. Objetivo general

Estabilizar SembraData, corregir los problemas funcionales actuales, mejorar la confiabilidad de los análisis agroclimáticos y preparar el sistema para ampliar su cobertura desde Santander hacia Colombia, evitando una reescritura completa durante el plazo de dos semanas.

La estrategia prioriza:

1. Estabilización.
2. Validación de datos.
3. Corrección de lógica.
4. Pruebas automatizadas.
5. Mejoras UI/UX.
6. Escalamiento progresivo a Colombia.

> **Regla principal:** no ampliar la cobertura nacional hasta demostrar que el análisis de un municipio y un cultivo produce resultados coherentes, reproducibles y explicables.

---

# 2. Alcance actual

Según el documento de actualización, SembraData actualmente realiza análisis agroclimáticos para Santander y sus 87 municipios, utilizando los cultivos de cacao, granadilla y café.

Actualmente dispone de:

- Mapa interactivo GeoJSON.
- Rendimiento estimado.
- Riesgo climático.
- Precipitación esperada.
- Temperatura promedio.
- Clasificación visual por colores.
- Histórico vs. predicción.
- Riesgo climático por mes.
- Perfil climático.
- Filtros avanzados.
- Variables de año, mes, altitud, temperatura y precipitación.
- Tipos de suelo: arcilla, limo, arena y franco.
- Chatbot climático.
- Análisis de viabilidad de zona.

---

# 3. Problemas que deben resolverse

## P0 — Críticos

### P0-01 — Lockfile / CI

Error:

```text
error: lockfile had changes, but lockfile is frozen
```

Causa reportada:

El `package.json` y el lockfile no están sincronizados.

Acción:

- Determinar gestor oficial.
- Mantener Bun como gestor oficial si el proyecto ya está basado en Bun.
- Regenerar `bun.lock`.
- Eliminar ambigüedad con otros lockfiles.
- Ejecutar instalación reproducible.
- Validar CI/CD.

Criterio de aceptación:

```text
bun install --frozen-lockfile
typecheck
lint
test
test:e2e
build
```

deben ejecutarse correctamente.

---

### P0-02 — Filtros no afectan el mapa

Problema:

Los filtros reciben parámetros pero el mapa no refleja los cambios.

Flujo objetivo:

```text
AdvancedFilters
      ↓
FilterState
      ↓
FilteredMunicipalities
      ↓
Map
      ↓
KPIs
      ↓
Charts
```

Los filtros deben modificar:

- Municipios visibles.
- Colores del mapa.
- Contadores.
- KPIs.
- Gráficas.
- Selección disponible.

Pruebas requeridas:

- Temperatura.
- Precipitación.
- Altitud.
- Tipo de suelo.
- Año.
- Mes.
- Combinación de filtros.
- Limpieza de filtros.

---

### P0-03 — Histórico de rendimiento

Problema:

La gráfica histórico vs. predicción siempre muestra aumento del rendimiento.

No se debe corregir solamente la visualización.

Auditar:

```text
Dataset
   ↓
Transformación
   ↓
Modelo / fórmula
   ↓
Predicción
   ↓
Normalización
   ↓
Chart
```

Determinar si el comportamiento procede de:

- Fórmula incorrecta.
- Datos sintéticos.
- Regresión.
- Interpolación.
- Normalización.
- Orden temporal.
- Transformación de datos.
- Visualización.

Criterio:

La tendencia debe corresponder a los datos reales o a la lógica de predicción documentada.

---

### P0-04 — Análisis de zona

Problema:

El apartado de analizar zona muestra error al cargar datos.

Flujo objetivo:

```text
Municipio
    ↓
ValidateMunicipality
    ↓
GetClimate
    ↓
GetSoil
    ↓
GetCropRequirements
    ↓
CalculateRisk
    ↓
CalculateViability
    ↓
GenerateRecommendation
    ↓
AnalysisResult
```

Estructura recomendada:

```text
AnalysisResult {
  municipality
  crop
  climate
  soil
  risk
  viability
  confidence
  recommendations
  alternatives
  generatedAt
}
```

---

### P0-05 — Recomendación incorrecta

Problema:

El sistema indica "ventana óptima" incluso cuando el cultivo no es adecuado o existe alto riesgo.

Lógica propuesta:

```text
VIABILIDAD
│
├── NO VIABLE
│     └── No recomendar ventana óptima
│
├── ALTO RIESGO
│     └── Advertencia + alternativa
│
├── VIABLE
│     └── Buscar ventana
│
└── ÓPTIMO
      └── Recomendar ventana
```

La recomendación debe distinguir:

- No viable.
- Alto riesgo.
- Viable.
- Óptimo.

Nunca debe etiquetar automáticamente cualquier periodo como "ventana óptima".

---

# 4. Problemas P1

## P1-01 — Chatbot

El chatbot presenta errores con preguntas climáticas específicas sobre territorios.

Flujo objetivo:

```text
Pregunta
   ↓
Intent
   ↓
Entity extraction
   ↓
¿Requiere datos?
   │
   ├── NO → Knowledge Base / RAG
   │
   └── SÍ
        ↓
    Data retrieval
        ↓
    Structured context
        ↓
        LLM
        ↓
    Validation
        ↓
    Response
```

Ejemplo:

```text
¿Qué temperatura tendrá Barichara esta semana?
        ↓
Barichara
        ↓
coordenadas
        ↓
fuente climática
        ↓
pronóstico
        ↓
LLM explica
```

El LLM no debe inventar datos climáticos.

---

## P1-02 — Gráfica de riesgo climático

Los valores cambian pero la gráfica visualmente cambia poco.

Auditar:

- Escalas.
- Normalización.
- Dominio.
- Rangos.
- Datos enviados al componente.
- Renderizado.

Crear casos de prueba con diferencias extremas.

---

## P1-03 — Perfil climático

Aplicar la misma auditoría realizada para riesgo climático.

La gráfica debe comunicar claramente los cambios producidos por los filtros.

---

## P1-04 — Botón limpiar

Flujo:

```text
Reset Filters
      ↓
Default State
      ↓
Map reset
      ↓
Charts reset
      ↓
KPIs reset
      ↓
Selection reset
```

Agregar prueba E2E.

---

# 5. Mejoras funcionales previstas

El documento de actualización propone:

1. Ampliar el mapa de Santander a Colombia.
2. Mejorar diseño visual del mapa.
3. Mejorar UI/UX.
4. Realizar análisis climático para todo Colombia.
5. Mejorar interacción con gráficas.

Estas mejoras se implementarán después de estabilizar las funcionalidades críticas.

---

# 6. Arquitectura objetivo

Se utilizará una **refactorización controlada**, no una reescritura.

Modelo:

```text
                         USUARIO
                            │
                            ▼
                  WEB (Online Conectado)
             React + TanStack Start
                            │
                            ▼
                    APPLICATION
                            │
                  ┌─────────┼─────────┐
                  ▼         ▼         ▼
             AnalyzeCrop GetClimate GetSoil
             CalculateRisk AskAssistant
                            │
                            ▼
                         DOMAIN
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Climate            Soil             Crop
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                       PREDICTION
                            │
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
               Risk      Viability Recommendation
                            │
                            ▼
                    INFRASTRUCTURE
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
      Open-Meteo          Supabase           Groq
      NASA POWER          PostgreSQL         RAG
      IDEAM               Cache              Tools
      SoilGrids
```

---

# 7. Principio de refactorización controlada

No se debe migrar todo el proyecto de una vez.

Se refactorizarán prioritariamente:

```text
filters
prediction
recommendations
climate
chatbot
data
```

Se evitarán cambios innecesarios en módulos estables.

Objetivo:

> Obtener aproximadamente los beneficios de una arquitectura modular sin asumir el riesgo de una reescritura completa.

---

# 8. Estructura objetivo propuesta

```text
src/
├── app/
│   ├── routes/
│   ├── providers/
│   └── config/
│
├── features/
│   ├── municipality/
│   ├── climate/
│   ├── soil/
│   ├── crops/
│   ├── prediction/
│   ├── chatbot/
│   ├── history/
│   └── commodities/
│
├── domain/
│   ├── crop/
│   ├── climate/
│   ├── soil/
│   ├── prediction/
│   └── municipality/
│
├── infrastructure/
│   ├── supabase/
│   ├── open-meteo/
│   ├── nasa-power/
│   ├── ideam/
│   ├── soilgrids/
│   └── commodities/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
│
└── lib/

supabase/
├── migrations/
├── functions/
└── seed/

data/
├── raw/
├── processed/
├── external/
└── etl/

tests/
├── unit/
├── integration/
└── e2e/

docs/
├── architecture/
├── api/
├── data/
├── ai/
└── deployment/
```

---

# 9. Modelo de dominio

Entidades mínimas:

```text
Municipality
Crop
CropRequirement
ClimateObservation
SoilData
Analysis
RiskAssessment
Recommendation
```

Relación conceptual:

```text
Municipality
      │
      ▼
   Analysis
      │
      ├──────── Crop
      ├──────── ClimateData
      ├──────── SoilData
      ├──────── RiskAssessment
      └──────── Recommendation
```

---

# 10. Modelo de resultado de análisis

Todos los mecanismos de análisis deberían converger a un contrato común:

```typescript
AnalysisResult {
  municipality
  crop
  climate
  soil
  risk
  viability
  confidence
  recommendations
  alternatives
  generatedAt
}
```

Esto evita que cada componente maneje estructuras diferentes.

---

# 11. Estrategia para Colombia

No cargar todo el territorio nacional indiscriminadamente en el frontend.

Objetivo:

```text
Colombia
│
├── Departamento A
├── Departamento B
├── ...
└── Santander
```

Carga progresiva:

```text
Usuario selecciona departamento
        ↓
Cargar GeoJSON
        ↓
Cargar municipios
        ↓
Cargar datos
        ↓
Renderizar
```

Esto permitirá reducir el peso inicial y mantener una arquitectura preparada para crecimiento.

---

# 12. Cronograma de 14 días

## Día 1 — Auditoría y línea base

### Actividades

- Ejecutar instalación.
- Ejecutar typecheck.
- Ejecutar lint.
- Ejecutar tests.
- Ejecutar E2E.
- Ejecutar build.
- Reproducir los ocho problemas.
- Registrar errores.
- Identificar archivos responsables.
- Crear matriz de trazabilidad.

### Entregable

Informe técnico de línea base.

---

## Día 2 — CI/CD y dependencias

### Actividades

- Sincronizar `package.json` y `bun.lock`.
- Definir Bun como gestor oficial si se confirma.
- Revisar lockfiles.
- Corregir pipeline.
- Ejecutar validación completa.

### Entregable

Pipeline reproducible.

---

## Días 3–4 — Filtros

### Actividades

- Auditar `FilterState`.
- Auditar fuente de datos.
- Implementar filtrado real.
- Conectar filtros con mapa.
- Conectar filtros con KPIs.
- Conectar filtros con gráficas.
- Implementar reset.
- Crear pruebas unitarias.
- Crear pruebas E2E.

### Entregable

Filtros completamente funcionales.

---

## Día 5 — Rendimiento

### Actividades

- Auditar dataset.
- Auditar transformación.
- Auditar modelo/fórmula.
- Auditar serie temporal.
- Corregir cálculo.
- Corregir gráfica.
- Agregar pruebas.

### Entregable

Histórico vs. predicción coherente.

---

## Día 6 — Riesgo y perfil climático

### Actividades

- Auditar datos.
- Auditar escalas.
- Auditar normalización.
- Auditar componentes.
- Mejorar interacción.
- Crear casos extremos.

### Entregable

Gráficas visualmente representativas.

---

## Día 7 — Análisis de zona

### Actividades

- Diagnosticar error.
- Separar obtención de datos.
- Crear flujo `AnalyzeCrop`.
- Crear `GetClimate`.
- Crear `GetSoil`.
- Crear `CalculateRisk`.
- Crear `CalculateViability`.
- Crear `AnalysisResult`.

### Entregable

Análisis de zona funcional.

---

## Día 8 — Recomendaciones

### Actividades

- Definir estados de viabilidad.
- Definir reglas.
- Separar viabilidad de ventana de siembra.
- Implementar recomendaciones.
- Implementar alternativas.
- Agregar pruebas.

### Entregable

Recomendaciones coherentes.

---

## Día 9 — Chatbot

### Actividades

- Probar preguntas territoriales.
- Revisar intent classifier.
- Revisar entity extractor.
- Revisar RAG.
- Revisar recuperación de datos.
- Crear flujo de consulta climática.
- Validar respuestas.

### Entregable

Chatbot funcional para consultas climáticas definidas.

---

## Día 10 — UX y limpieza

### Actividades

- Reset.
- Estados de carga.
- Estados vacíos.
- Mensajes de error.
- Indicadores de filtros.
- Feedback visual.
- Mejoras de interacción.

### Entregable

UX funcional y consistente.

---

## Días 11–12 — Colombia

### Actividades

- Validar fuente GeoJSON nacional.
- Diseñar división por departamento.
- Integrar municipios.
- Implementar carga progresiva.
- Integrar cultivos.
- Integrar clima.
- Integrar suelo.
- Validar rendimiento/riesgo.
- Probar Santander después de la migración.

### Entregable

Cobertura nacional inicial.

---

## Día 13 — UI/UX y gráficas

### Actividades

- Rediseñar leyenda.
- Mejorar tooltip.
- Mejorar selección.
- Mejorar estados del mapa.
- Mejorar interacción de gráficas.
- Mostrar filtros activos.
- Mostrar cantidad de municipios filtrados.

### Entregable

Interfaz mejorada.

---

## Día 14 — QA y release

### Actividades

- Unit tests.
- Integration tests.
- E2E.
- Typecheck.
- Lint.
- Build.
- Smoke test.
- Validación de Colombia.
- Validación de Santander.
- Validación de los tres cultivos.
- Revisión final.

### Entregable

Release candidata.

---

# 13. Backlog para OpenCode

## TASK-001

**Título:** Crear línea base del proyecto.

**Objetivo:** Ejecutar todas las validaciones existentes y registrar resultados.

**No modificar:** lógica funcional.

**Criterios:**

```text
typecheck
lint
unit
E2E
build
```

deben tener resultados registrados.

---

## TASK-002

**Título:** Corregir lockfile.

**Objetivo:** Hacer reproducible la instalación.

**Criterios:**

```text
bun install --frozen-lockfile
```

sin errores.

---

## TASK-003

**Título:** Auditar filtros.

**Objetivo:** Identificar dónde se pierde el estado filtrado.

**Entregable:**

Flujo documentado:

```text
UI → State → Selector → Map
```

---

## TASK-004

**Título:** Implementar filtros.

**Criterios:**

Cada filtro debe producir cambios observables en el mapa y datos derivados.

---

## TASK-005

**Título:** Agregar tests de filtros.

---

## TASK-006

**Título:** Auditar rendimiento.

---

## TASK-007

**Título:** Corregir histórico/predicción.

---

## TASK-008

**Título:** Auditar riesgo climático.

---

## TASK-009

**Título:** Corregir visualización de riesgo.

---

## TASK-010

**Título:** Corregir análisis de zona.

---

## TASK-011

**Título:** Crear `AnalysisResult`.

---

## TASK-012

**Título:** Implementar cálculo de viabilidad.

---

## TASK-013

**Título:** Corregir recomendación de siembra.

---

## TASK-014

**Título:** Crear pruebas de recomendaciones.

---

## TASK-015

**Título:** Auditar chatbot.

---

## TASK-016

**Título:** Mejorar recuperación de datos climáticos del chatbot.

---

## TASK-017

**Título:** Implementar reset de filtros.

---

## TASK-018

**Título:** Diseñar carga nacional de GeoJSON.

---

## TASK-019

**Título:** Integrar municipios de Colombia.

---

## TASK-020

**Título:** Mejorar mapa y gráficas.

---

## TASK-021

**Título:** Ejecutar regresión completa.

---

## TASK-022

**Título:** Preparar release.

---

# 13A. Issues funcionales — Solicitud del usuario

> Estos issues fueron especificados por el usuario y deben resolverse antes de任何 otra tarea de las anteriormente listadas.

---

## ISSUE-01 — Botones "Analizar Zona" y "Limpiar" no funcionan

**Prioridad:** P0 Crítico
**Archivos:** `src/components/sembradata/Dashboard.tsx`, `src/components/sembradata/PredictionPanel.tsx`

### Problema

- El botón "Analizar zona" ejecuta `setShowPrediction(true)` pero el panel no abre correctamente o no carga datos.
- El botón "Limpiar" ejecuta `setMunicipio(...)` pero no resetea la selección de forma observable.

### Causa probable

- `filteredMunicipios` se calcula con `useMemo` basado en `filters`. El municipio seleccionado puede no existir en `filteredMunicipios` si los filtros lo excluyen, causando que `muni` sea `undefined`.
- `PredictionPanel` recibe props pero puede no re-renderizar si los valores no cambian referencialmente.
- El botón "Limpiar" solo resetea `municipio` pero no resetea `filters` ni `crop`.

### Flujo objetivo

```text
Click "Analizar zona"
      ↓
setShowPrediction(true)
      ↓
PredictionPanel montado
      ↓
useEffect carga datos (elevación, suelo, clima)
      ↓
evaluateViability()
      ↓
Panel visible con datos completos

Click "Limpiar"
      ↓
setMunicipio(municipio default)
      ↓
setFilters(DEFAULT_FILTERS)
      ↓
setCrop("cacao")
      ↓
Mapa se resetea
      ↓
KPIs se resetean
```

### Archivos a modificar

- `src/components/sembradata/Dashboard.tsx`

### Criterio de aceptación

- Click en "Analizar zona" abre el panel de predicción con datos del municipio actual
- Click en "Limpiar" resetea selección de municipio, filtros y cultivo
- El panel de predicción carga datos correctamente (clima, suelo, viabilidad)

---

## ISSUE-02 — Cache de "Plagas" no cambia al cambiar de municipio

**Prioridad:** P1
**Archivos:** `src/components/sembradata/RiskChart.tsx`, `src/types/prediction-v2.ts`

### Problema

El cálculo de `Plagas` en `RiskChart` usa bins discretos que producen valores muy similares entre municipios:

```typescript
const pestRisk = Math.round(
  Math.min(100, Math.max(10, (avgHum > 75 ? 40 : 0) + (avgTemp > 22 && avgTemp < 28 ? 20 : 0))),
);
```

Esto solo produce valores de 10, 30, 40 o 60 — sin variabilidad suficiente.

### Causa

- La fórmula usa umbrales binarios en vez de cálculos continuos
- No considera textura del suelo, altitud, ni estacionalidad del cultivo
- Cuando `hasRealData = false`, usa función sinusoidal que tampoco varía por municipio

### Flujo objetivo

```text
Cambio de municipio
      ↓
fetchRealtimeData() ejecuta
      ↓
fetchCurrentClimate(lat, lng) retorna datos nuevos
      ↓
RiskChart recibe nuevo `climate` object
      ↓
Cálculo de Plagas usa datos reales del municipio
      ↓
Valores visiblemente diferentes en la gráfica
```

### Archivos a modificar

- `src/components/sembradata/RiskChart.tsx` — Mejorar fórmula de Plagas
- `src/types/prediction-v2.ts` — Reutilizar `calculatePestRisk` existente

### Criterio de aceptación

- Dos municipios con clima diferente muestran barras de Plagas diferentes
- La fórmula considera al menos: humedad, temperatura, precipitación, y condición del cultivo
- El rango de valores va de 0-100 sin saturarse en bins

---

## ISSUE-03 — Recomendación no refleja el estado del municipio

**Prioridad:** P1
**Archivos:** `src/components/sembradata/Dashboard.tsx`

### Problema

La tarjeta de "Recomendación" siempre muestra:

```text
Ventana óptima de siembra para {cultivo} en {municipio}: {ventana}.
```

Esto es estático — no considera si el municipio es de alto riesgo, si el cultivo no es viable, o las condiciones actuales.

### Causa

- El contenido está hardcodeado en el JSX sin usar `realtime.viability`
- No hay lógica que determine el nivel de viabilidad antes de mostrar la recomendación

### Flujo objetivo

```text
Evaluación de viabilidad calculada
      ↓
      ├── Score >= 70 → "Condiciones favorables. Ventana óptima: {window}."
      ├── Score 50-69 → "Riesgo moderado. Considere las condiciones actuales."
      ├── Score < 50  → "Alto riesgo para {cultivo}. Considere cultivos alternativos."
      └── Sin datos   → "Seleccione un municipio para ver recomendaciones."
```

### Archivos a modificar

- `src/components/sembradata/Dashboard.tsx` — Sección de recomendación

### Criterio de aceptación

- La recomendación cambia dinámicamente según el score de viabilidad
- Muestra advertencias cuando el riesgo es alto
- Sugiere alternativas cuando el cultivo no es viable
- Muestra estado por defecto cuando no hay datos

---

## ISSUE-04 — Añadir botón "Aplicar Filtros"

**Prioridad:** P1
**Archivos:** `src/components/sembradata/AdvancedFilters.tsx`, `src/components/sembradata/Dashboard.tsx`

### Problema

Los filtros se aplican inmediatamente al mover los sliders (`onChange` propaga directamente al state del Dashboard). Esto causa múltiples re-renders while el usuario ajusta.

### Solución

Implementar estado temporal en `AdvancedFilters` que solo se propague al Dashboard al hacer click en "Aplicar".

### Flujo objetivo

```text
Usuario ajusta sliders
      ↓
Estado temporal se actualiza (no propaga al padre)
      ↓
Usuario hace click "Aplicar Filtros"
      ↓
onChange() propaga al Dashboard
      ↓
filteredMunicipios se recalcula
      ↓
Mapa y KPIs se actualizan una sola vez
```

### Archivos a modificar

- `src/components/sembradata/AdvancedFilters.tsx` — Añadir estado temporal + botón Aplicar
- `src/components/sembradata/Dashboard.tsx` — Ajustar manejo de filtros

### Criterio de aceptación

- Los sliders muestran valores pero NO actualizan el mapa hasta hacer click
- Botón "Aplicar Filtros" visible cuando hay cambios pendientes
- Click en "Aplicar" propaga todos los cambios de una vez
- Botón "Limpiar" en AdvancedFilters sigue funcionando
- El indicador de "filtros activos" solo aparece después de aplicar

---

## ISSUE-05 — Eliminar botón de "Historial"

**Prioridad:** P2
**Archivos:** `src/components/sembradata/Dashboard.tsx`

### Problema

El usuario solicita eliminar la funcionalidad de historial de análisis de la interfaz.

### Archivos a modificar

- `src/components/sembradata/Dashboard.tsx` — Eliminar import y uso de `<HistoryPanel />`

### No eliminar

- `src/services/analysis-history.ts` — Se mantiene (puede usarse internamente)

### Criterio de aceptación

- El icono de historial no aparece en el header
- No hay errores de compilación por imports huérfanos
- El resto de la aplicación funciona sin cambios

---

## ISSUE-06 — Gráfica "Histórico vs Predicción" siempre va en aumento

**Prioridad:** P0 Crítico
**Archivos:** `src/components/sembradata/YieldChart.tsx`

### Problema

Los datos de la gráfica están hardcodeados con tendencia siempre creciente:

```typescript
{ year: "2020", hist: base * 0.82, pred: null },
{ year: "2021", hist: base * 0.88, pred: null },
{ year: "2022", hist: base * 0.91, pred: null },
{ year: "2023", hist: base * 0.95, pred: null },
{ year: "2024", hist: base * 0.98, pred: base * (...) },
{ year: "2025", hist: null, pred: base * (...) },
...
```

Esto no es realista — los rendimientos agrícolas varían año a año por clima, plagas, manejo.

### Causa

- No hay datos reales de rendimiento histórico por municipio
- Se usan factores estáticos multiplicativos
- No se considera la variabilidad climática histórica

### Solución propuesta

Usar los datos climáticos históricos reales (Open-Meteo Archive) para generar rendimientos simulados pero realistas, incorporando variabilidad climática real. Para cada año, calcular promedio de T° y precipitación, luego aplicar factor de rendimiento basado en condiciones climáticas con variabilidad controlada (±15%).

### Flujo objetivo

```text
Municipio + Cultivo seleccionados
      ↓
fetchHistoricalClimate(lat, lng, 2020-01-01, 2024-12-31)
      ↓
Para cada año, calcular promedio de T°, precipitación
      ↓
Aplicar factor de rendimiento basado en condiciones climáticas
      ↓
Añadir variabilidad controlada (±15%)
      ↓
Gráfica muestra tendencia con fluctuaciones reales
```

### Archivos a modificar

- `src/components/sembradata/YieldChart.tsx` — Generar datos realistas
- Posiblemente `src/services/climate-api.ts` — Reutilizar `fetchHistoricalClimate`

### Criterio de aceptación

- La gráfica muestra fluctuaciones (subidas y bajadas) en el histórico
- Los valores de predicción no son siempre crecientes
- La tendencia general refleja las condiciones climáticas del municipio
- Al cambiar de municipio, la gráfica cambia visiblemente

---

## ISSUE-07 — Verificar limpieza de cache en todos los campos

**Prioridad:** P1
**Archivos:** `src/services/cache.ts`, `src/services/analysis-history.ts`, `supabase/functions/cache-cleanup/index.ts`

### Problema

No hay mecanismo visible para limpiar los caches cuando sea necesario. Se requiere auditar que los caches respetan sus TTLs y que no hay datos obsoletos persistiendo.

### Tabla de caches

| Caché                    | TTL          | Limpieza automática    |
| ------------------------ | ------------ | ---------------------- |
| IDEAM (Supabase)         | 24h          | cache-cleanup CF       |
| NASA POWER (Supabase)    | 7 días       | cache-cleanup CF       |
| Commodities (Supabase)   | 1h           | cache-cleanup CF       |
| Analysis History (local) | Sin TTL      | Nunca se limpia        |
| Rate Limiter (memoria)   | 1 min window | Se resetea por ventana |

### Acciones requeridas

1. Verificar que `isFresh()` en `cache.ts` funciona correctamente
2. Añadir TTL opcional a registros locales de `analysis_history`
3. Verificar que la Edge Function `cache-cleanup` elimina registros vencidos
4. Los datos climáticos se re-fetch pero el cache de Supabase puede retornar datos obsoletos

### Archivos a auditar/modificar

- `src/services/cache.ts`
- `src/services/analysis-history.ts`
- `supabase/functions/cache-cleanup/index.ts`

### Criterio de aceptación

- Los caches de Supabase respetan sus TTLs (24h, 7d, 1h)
- Los datos locales se limpian correctamente
- No hay datos obsoletos mostrándose después de TTL expirado

---

## Resumen de impacto

| Issue    | Archivos                           | Prioridad  | Complejidad |
| -------- | ---------------------------------- | ---------- | ----------- |
| ISSUE-01 | Dashboard.tsx, PredictionPanel.tsx | P0 Crítico | Media       |
| ISSUE-02 | RiskChart.tsx, prediction-v2.ts    | P1         | Media       |
| ISSUE-03 | Dashboard.tsx                      | P1         | Baja        |
| ISSUE-04 | AdvancedFilters.tsx, Dashboard.tsx | P1         | Media       |
| ISSUE-05 | Dashboard.tsx                      | P2         | Baja        |
| ISSUE-06 | YieldChart.tsx                     | P0 Crítico | Alta        |
| ISSUE-07 | cache.ts, analysis-history.ts      | P1         | Media       |

---

# 14. Reglas de trabajo para OpenCode

OpenCode debe trabajar bajo estas reglas:

### Regla 1

No realizar refactorizaciones masivas.

### Regla 2

Una tarea por cambio lógico.

### Regla 3

No modificar archivos no relacionados sin justificarlo.

### Regla 4

Cada cambio funcional debe tener pruebas.

### Regla 5

No eliminar tests para conseguir que el pipeline pase.

### Regla 6

No modificar datos agroclimáticos para "hacer coincidir" la gráfica.

### Regla 7

No inventar umbrales agronómicos.

### Regla 8

No utilizar el LLM como calculadora de riesgo.

### Regla 9

No reemplazar una fuente de datos sin documentarlo.

### Regla 10

Cada commit debe representar una unidad lógica.

---

# 15. Plantilla de tarea para OpenCode

Cada tarea debe entregarse al agente utilizando una estructura similar:

```text
CONTEXTO
[Descripción del módulo]

PROBLEMA
[Problema observable]

OBJETIVO
[Resultado esperado]

ARCHIVOS A INVESTIGAR
[Archivos]

ARCHIVOS A MODIFICAR
[Archivos permitidos]

RESTRICCIONES
[Qué no modificar]

IMPLEMENTACIÓN
[Pasos]

TESTS
[Pruebas necesarias]

CRITERIOS DE ACEPTACIÓN
[Condiciones]

VALIDACIÓN
[Comandos]

NO TERMINAR HASTA
[Condiciones obligatorias]
```

---

# 16. Criterios globales de aceptación

## Filtros

```text
Aplicar filtro
→ mapa cambia
→ KPIs cambian
→ gráficas cambian
→ contador cambia
```

## Análisis

```text
Municipio + cultivo
→ análisis
→ clima
→ suelo
→ riesgo
→ viabilidad
→ confianza
→ recomendación
```

## Recomendación

```text
No viable
≠
Ventana óptima
```

## Chatbot

```text
Pregunta climática
→ municipio identificado
→ fuente consultada
→ respuesta coherente
```

## Gráficas

```text
Datos diferentes
→ representación visual diferente
```

## Colombia

```text
Departamento
→ municipios
→ datos
→ análisis
```

## CI/CD

```text
install ✓
typecheck ✓
lint ✓
unit ✓
E2E ✓
build ✓
```

---

# 17. Preguntas bloqueantes

Estas preguntas deben resolverse antes de modificar las partes correspondientes.

## Datos y predicción

### Q01

¿El rendimiento estimado proviene de un modelo ML, fórmula matemática, regresión, datos sintéticos o combinación?

### Q02

¿Existe dataset real de rendimiento histórico para cacao, café y granadilla por municipio?

### Q03

¿En qué unidad se expresa el rendimiento?

### Q04

¿El riesgo climático es calculado internamente o procede de una fuente externa?

---

## Análisis de zona

### Q05

¿Qué variables deben determinar la viabilidad?

Propuesta:

```text
Clima
+
Suelo
+
Altitud
+
Precipitación
+
Temperatura
+
Riesgo
+
Requisitos del cultivo
```

### Q06

¿Existe una fórmula oficial para determinar viabilidad?

Si existe, proporcionar fórmula y umbrales.

---

## Agronomía

### Q07

¿Qué fuente agronómica define los requisitos de cacao, café y granadilla?

### Q08

Cuando un cultivo es de alto riesgo, ¿se debe:

- Ocultar la ventana.
- Mostrar ventana condicionada.
- Mostrar ventana con advertencia.
- Recomendar otro cultivo.

Recomendación inicial: recomendar alternativa cuando corresponda.

---

## Colombia

### Q09

¿El alcance nacional incluye todos los municipios con análisis completo o solamente visualización?

### Q10

¿La cobertura Colombia es requisito obligatorio para la segunda etapa?

---

## IA

### Q11

¿El chatbot debe limitarse a clima, cultivos, riesgo y siembra?

### Q12

¿Debe responder consultas dinámicas utilizando los datos actuales del sistema?

Ejemplo:

```text
¿Cuál municipio tiene menor riesgo para café?
```

---

## Desarrollo

### Q13

¿OpenCode trabaja directamente sobre el repositorio GitHub o sobre una copia local?

### Q14

¿GitHub Actions es el pipeline oficial?

### Q15

¿Trabaja una sola persona o varias personas simultáneamente?

### Q16

¿Se permite modificar libremente la arquitectura interna?

---

# 18. Información que debe documentarse

Antes del cierre debe existir documentación de:

```text
docs/
├── architecture/
│   ├── current-architecture.md
│   └── target-architecture.md
│
├── data/
│   ├── data-sources.md
│   ├── data-model.md
│   └── validation.md
│
├── ai/
│   ├── chatbot.md
│   ├── rag.md
│   └── prediction.md
│
└── deployment/
    └── ci-cd.md
```

---

# 19. Riesgos del proyecto

| Riesgo                             | Probabilidad | Impacto | Mitigación            |
| ---------------------------------- | -----------: | ------: | --------------------- |
| Refactor demasiado grande          |         Alta |    Alto | Refactor controlado   |
| OpenCode modifica demasiado        |         Alta |    Alto | Tareas pequeñas       |
| Datos insuficientes                |        Media | Crítico | Validación temprana   |
| Modelo de rendimiento incorrecto   |         Alta | Crítico | Auditoría antes de UI |
| APIs externas fallan               |        Media |    Alto | Cache + fallback      |
| Colombia aumenta demasiado el peso |         Alta |   Medio | Carga progresiva      |
| Regresiones                        |        Media |    Alto | E2E                   |
| Chatbot alucina                    |        Media |    Alto | Tool/data retrieval   |
| Falta de criterios agronómicos     |        Media | Crítico | Resolver Q07          |
| Plazo insuficiente                 |         Alta |    Alto | Priorizar P0          |

---

# 20. Resultado esperado al finalizar las dos semanas

El sistema deberá pasar de:

```text
Sistema con funcionalidades existentes
+
errores funcionales
+
lógica parcialmente validada
```

a:

```text
Sistema estabilizado
+
motor de análisis verificable
+
filtros funcionales
+
recomendaciones coherentes
+
chatbot validado
+
gráficas representativas
+
CI/CD reproducible
+
cobertura nacional inicial
+
arquitectura modular controlada
+
tests de regresión
```

---

# 21. Decisión arquitectónica

La estrategia oficialmente recomendada para esta intervención es:

## Opción C — Refactorización controlada + corrección incremental

Motivos:

- Mantiene el código funcional existente.
- Reduce riesgo.
- Es compatible con un plazo máximo de 14 días.
- Permite trabajar de forma controlada con OpenCode.
- Permite mejorar los módulos críticos sin reescribir todo.
- Prepara el proyecto para Colombia.
- Reduce deuda técnica en las zonas que realmente necesitan intervención.

No se recomienda una reescritura completa durante esta etapa.

---

# 22. Orden obligatorio de ejecución

```text
1. Línea base
      ↓
2. CI/CD
      ↓
3. Filtros
      ↓
4. Rendimiento
      ↓
5. Riesgo
      ↓
6. Análisis de zona
      ↓
7. Viabilidad
      ↓
8. Recomendaciones
      ↓
9. Chatbot
      ↓
10. UX
      ↓
11. Colombia
      ↓
12. QA
      ↓
13. Release
```

## Principio final

**Primero confiabilidad, después escalabilidad y finalmente presentación.**

El objetivo no es solamente que SembraData "se vea mejor", sino que los resultados presentados al usuario puedan ser explicados, reproducidos y defendidos técnicamente.

---

# 23. Progreso de ejecución

| Fase                                              | Commits     | Estado |
| ------------------------------------------------- | ----------- | ------ |
| Fase 0 — Issues funcionales (ISSUE-01 a ISSUE-07) | `b3d4486`   | ✅     |
| Fase 1 — Fundación y CI/CD                        | `61c3ab5`   | ✅     |
| Fase 2 — Filtros funcionales                      | `7ea1c10`   | ✅     |
| Fase 3 — Gráficas y rendimiento                   | `d31f1a2`   | ✅     |
| Fase 4 — IA y API Layer                           | `139494a`   | ✅     |
| Fase 5 — UX                                       | `9a08b4b`   | ✅     |
| Fase 6 — Testing y Docs                           | `pendiente` | 🔄     |
| Fase 7 — Release final                            | `pendiente` | ⏳     |

**Tests:** 158/159 (1 fallo pre-existente: Supabase credentials)
**Bun:** 1.3.14 instalado, CI/CD usa `bun install --frozen-lockfile`
