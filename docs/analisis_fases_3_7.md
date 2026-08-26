# Plan de Análisis y Búsqueda de Errores — Fases 3 a 7

> **Registro Histórico de Auditoría:** Este documento registra los análisis y correcciones de errores ejecutados durante las Fases 3 a 7 de optimización del proyecto SembraData. Todos los hallazgos críticos fueron resueltos y consolidados en la versión actual v0.6.0.

**Alcance:**

- Fase 3: Gráficas y rendimiento (`RiskChart.tsx`, `ClimateRadar.tsx`, `YieldChart.tsx`)
- Fase 4: IA y API Layer (`climate-api.ts`, `ChatbotPanel.tsx` — ya analizado en sección anterior)
- Fase 5: UX (`Dashboard.tsx` — Suspense/loading skeletons)
- Fase 6: Testing & Docs (solo documentación, sin código funcional)
- Fase 7: Release (`package.json`, tests — sin código funcional)

**Nota:** El análisis del chatbot/IA ya se completó en la sección anterior. Este plan se enfoca en las capas de gráficas, API, datos, UX y integración.

---

## Fase 3A — RiskChart.tsx (Análisis completo)

### BUG-3A-01 — Violación de immutabilidad en `data.forEach` (Alta)

**Ubicación:** `src/components/sembradata/RiskChart.tsx:82-92`

**Problema:**

```typescript
if (viability) {
  const score = viability.score;
  if (score >= 70)
    data.forEach((d) => {
      d.Sequía = Math.round(d.Sequía * 0.7);
      // ...
    });
```

El array `data` se construye con `.map()` (nueva referencia), pero luego `forEach` **muta** los objetos internos directamente. Aunque el array es nuevo, los objetos internos se comparten con la referencia anterior si React re-renderiza sin cambiar el array.

**Impacto:** Puede causar rendering inconsistente si React compara referencias de objetos internos.

**Fix:** Usar `.map()` en lugar de `.forEach()` para crear nuevos objetos.

---

### BUG-3A-02 — Valores de riesgo pueden exceder 100 (Media)

**Ubicación:** `src/components/sembradata/RiskChart.tsx:87-92`

**Problema:**

```typescript
else if (score < 50)
  data.forEach((d) => {
    d.Sequía = Math.round(d.Sequía * 1.3);  // Puede dar > 100
    d.Heladas = Math.round(d.Heladas * 1.3);
    d.Plagas = Math.round(d.Plagas * 1.3);
  });
```

Si `Sequía` = 80 y `score` = 40, entonces `80 * 1.3 = 104`. El dominio del eje Y es `[0, 100]`, pero los datos pueden tener valores > 100, causando que las barras se salgan del área visible.

**Impacto:** Barras se desbordan del gráfico en municipalities con alto riesgo y viability score bajo.

**Fix:** Aplicar `Math.min(100, ...)` después del multiplicador, o mover el clamp al final.

---

### BUG-3A-03 — `factor` puede ser undefined en el fallback seasonal (Media)

**Ubicación:** `src/components/sembradata/RiskChart.tsx:73`

**Problema:**

```typescript
Sequía: Math.max(5, Math.round(40 + seasonal * 25 - factor * 10)),
```

Cuando no hay datos climáticos reales, se usa `factor` directamente. Si `factor` es `undefined` (posible cuando `muni` es undefined), `undefined * 10 = NaN`, y `Math.round(NaN) = NaN`.

**Impacto:** Gráfico muestra barras vacías o NaN cuando no hay datos del municipio seleccionado.

**Fix:** Agregar default: `factor ?? 1`.

---

### BUG-3A-04 — `MONTH_LABELS.indexOf(month)` puede retornar -1 (Baja)

**Ubicación:** `src/components/sembradata/RiskChart.tsx:29`

**Problema:** `month` viene de `MONTH_LABELS[...]` y se usa `new Date(d.date).getMonth()` para comparar, no el label del mes. Esto es correcto pero frágil — si el string `m` no es un label válido, el índice puede ser incorrecto.

**Impacto:** Bajo — el dato viene de la API y siempre es válido.

---

## Fase 3B — ClimateRadar.tsx (Análisis completo)

### BUG-3B-01 — `dynamicRange` con un solo valor produce rango inútil (Alta)

**Ubicación:** `src/components/sembradata/ClimateRadar.tsx:40-44`

**Problema:**

```typescript
const tempRange = dynamicRange([temperature], 0.2);
```

Con un solo valor `v`, `min = max = v`, `margin = max(0 * 0.2, 1) = 1`. Entonces el rango es `[v-1, v+1]`. Normalizar `v` dentro de `[v-1, v+1]` siempre da **~50**.

Todas las 5 variables (temp, humedad, precip, viento, radiación) se normalizan individualmente, así que **el radar siempre muestra un pentágono casi perfecto** con todas las puntas en ~50%.

**Impacto:** El gráfico radar es visualmente inútil — no diferencia entre condiciones climáticas.

**Fix:** Usar un **rango global fijo** o usar los rangos de referencia agrícola (ej: temp [0,40], humedad [0,100], etc.).

---

### BUG-3B-02 — `dynamicRange` puede producir rango negativo si el valor es pequeño (Baja)

**Ubicación:** `src/components/sembradata/ClimateRadar.tsx:30`

**Problema:** Si `temperature = 0.5`, el rango es `[-0.5, 1.5]`. Normalizar 0.5 en `[-0.5, 1.5]` → `50`. Esto es funcional pero puede generar rangos raros.

**Impacto:** Visual, no funcional.

---

## Fase 3C — YieldChart.tsx (Análisis completo)

### BUG-3C-01 — `year <= 2024` hardcodeado — roto para años futuros (Alta)

**Ubicación:** `src/components/sembradata/YieldChart.tsx:37`

**Problema:**

```typescript
if (year <= 2024) {
  return { year: String(year), hist: histYield, pred: year === 2024 ? histYield : null };
}
```

Estamos en 2026. Los años 2025 y 2026 ahora se tratan como "predicción" en lugar de "histórico". La gráfica muestra 2025-2026 como predicción cuando en realidad son datos históricos.

**Impacto:** La línea de predicción se extiende incorrectamente a años que ya pasaron.

**Fix:** Usar `new Date().getFullYear() - 1` como umbral en lugar de hardcodear 2024.

---

### BUG-3C-02 — `<Line>` y `<Area>` para `pred` se superponen (Baja)

**Ubicación:** `src/components/sembradata/YieldChart.tsx:88-108`

**Problema:** Hay un `<Area>` y un `<Line>` ambos con `dataKey="pred"`. El Area muestra el área sombreada y el Line los puntos. Funciona pero es redundante — `<Area>` con `strokeWidth` ya dibuja la línea.

**Impacto:** Rendimiento marginal (doble renderizado de la misma serie).

---

### BUG-3C-03 — `seededRandom` produce valores predecibles (Baja)

**Ubicación:** `src/components/sembradata/YieldChart.tsx:20-23`

**Problema:** La función es determinista — el mismo crop+factor siempre produce la misma "variación histórica". No es un bug per se, pero los datos no reflejan variabilidad real.

**Impacto:** Usuarios expertos notarán que los datos históricos siempre son iguales.

---

## Fase 4A — climate-api.ts (Análisis completo)

### BUG-4A-01 — Cache eviction es LIFO en vez de FIFO (Media)

**Ubicación:** `src/services/climate-api.ts:71-74`

**Problema:**

```typescript
if (responseCache.size > 200) {
  const oldest = responseCache.keys().next().value;
  if (oldest) responseCache.delete(oldest);
}
```

`Map.keys().next().value` retorna la **primera clave insertada** (la más antigua), lo cual es FIFO. **Esto es correcto.** No es un bug.

_Corrección: Este item no es un bug. Map mantiene orden de inserción._

---

### BUG-4A-02 — `fetchWithTimeout` no cancela el timeout si fetch es exitoso rápido (Media)

**Ubicación:** `src/services/climate-api.ts:82-91`

**Problema:**

```typescript
async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
```

Esto es **correcto** — `clearTimeout` se ejecuta en `finally`. No es un bug.

_Corrección: Este item no es un bug._

---

### BUG-4A-03 — `responseCache` crece indefinidamente en largas sesiones (Media)

**Ubicación:** `src/services/climate-api.ts:53-54`

**Problema:** El cache tiene un límite de 200 entradas, pero solo se limpia cuando se intenta insertar una nueva entrada. En sesiones largas sin nuevas inserciones, las entradas expiradas permanecen en memoria.

**Impacto:** Memory leak menor — entries expiradas no se borran proactivamente.

**Fix:** Opcional: implementar limpieza periódica o usar WeakRef.

---

### BUG-4A-04 — `fetchCurrentClimate` puede fallar si `current` es null (Media)

**Ubicación:** `src/services/climate-api.ts:226`

**Problema:**

```typescript
const current = data.current as Record<string, number>;
```

Si la API de Open-Meteo no retorna `current` (ej: en modo archive), `current` será `undefined`, y `current.temperature_2m` lanzará TypeError.

**Impacto:** Error no capturado al usar API incorrecta.

**Fix:** Agregar null check: `const current = (data.current ?? {}) as Record<string, number>;`

---

### BUG-4A-05 — `fetchHistoricalClimate` no tiene validación de rango de fechas (Baja)

**Ubicación:** `src/services/climate-api.ts:269-295`

**Problema:** Si `startDate > endDate`, la API retorna un error pero el código no valida antes de hacer fetch.

**Impacto:** Error 400 de la API, manejado por el catch general.

---

### BUG-4A-06 — `fetchRecentHistory` usa `forecast_days: "0"` con endpoint de forecast (Baja)

**Ubicación:** `src/services/climate-api.ts:343-363`

**Problema:** La combinación `past_days: "90"` + `forecast_days: "0"` en el endpoint `/forecast` puede no retornar datos futuros. Esto es correcto para historial reciente pero la semántica es confusa.

---

### BUG-4A-07 — `computeAgriculturalIndices` puede dividir por cero (Media)

**Ubicación:** `src/services/climate-api.ts:183`

**Problema:**

```typescript
aridityIndex: +(monthlyPrecip > 0 ? monthlyPrecip / (gdd * 0.002 + 0.5) : 0).toFixed(2),
```

`gdd * 0.002 + 0.5` siempre es >= 0.5, así que **no hay división por cero**. Pero `gdd` puede ser 0 cuando `avgTemp < 10`, dando `aridityIndex = monthlyPrecip / 0.5 = monthlyPrecip * 2`, lo cual puede ser un número alto.

**Impacto:** Índice de aridez puede ser > 1 en climas fríos con precipitación alta.

---

### BUG-4A-08 — `clearClimateCache` no se exporta correctamente para tests (Baja)

**Ubicación:** `src/services/climate-api.ts:78-80`

**Problema:** `clearClimateCache` se exporta pero solo se usa en tests. No es un bug, pero si se olvida en tests, puede causar interferencia entre tests.

---

## Fase 5 — Dashboard.tsx / UX (Análisis completo)

### BUG-5-01 — `Suspense` alrededor de componentes no lazy-loaded es inútil (Media)

**Ubicación:** `src/components/sembradata/Dashboard.tsx:545-553, 565-573`

**Problema:**

```typescript
<Suspense fallback={<div className="h-[280px] animate-pulse rounded-2xl bg-muted" />}>
  <YieldChart ... />
</Suspense>
```

`YieldChart` y `RiskChart` **NO están lazy-loaded** — se importan estáticamente en las líneas 24-25. `<Suspense>` solo funciona con componentes lazy o con Promesas. Los fallbacks nunca se muestran.

**Impacto:** Los skeletons de carga nunca aparecen. Los gráficos aparecen instantáneamente pero vacíos hasta que se cargan los datos.

**Fix:** O hacer `YieldChart` y `RiskChart` lazy-loaded, o mover el estado de carga al componente padre.

---

### BUG-5-02 — `setMunicipio` en effect puede causar loop (Baja)

**Ubicación:** `src/components/sembradata/Dashboard.tsx:199-203`

**Problema:**

```typescript
useEffect(() => {
  if (muni && muni.name !== municipio) {
    setMunicipio(muni.name);
  }
}, [muni, municipio]);
```

Cuando los filtros cambian y `filteredMunicipios` se actualiza, `muni` cambia, lo que ejecuta `setMunicipio(muni.name)`, lo que cambia `muni` (porque `muni` depende de `municipio`). Esto puede causar un loop si `municipio` no está en `filteredMunicipios`.

**Impacto:** Posible re-render innecesario, pero el guard `muni.name !== municipio` lo previene la mayoría de las veces.

---

### BUG-5-03 — `fetchGen` ref no se resetea al cambiar de municipio (Media)

**Ubicación:** `src/components/sembradata/Dashboard.tsx:136`

**Problema:**

```typescript
const fetchGen = useRef(0);
```

`fetchGen` se usa para evitar updates stale, pero nunca se resetea a 0 cuando el componente se desmonta o el municipio cambia. El valor puede crecer indefinidamente (aunque Number.MAX_SAFE_INTEGER es grande).

**Impacto:** Práctico — no es un bug real, pero es un code smell.

---

### BUG-5-04 — `metrics.gdd.toFixed(1)` puede fallar si `metrics.gdd` es undefined (Media)

**Ubicación:** `src/components/sembradata/Dashboard.tsx:442`

**Problema:**

```typescript
<span className="text-muted-foreground">{metrics.gdd.toFixed(1)} °C·día</span>
```

`metrics.gdd` viene de `realtime.climate?.agriculturalIndex?.GrowingDegreeDays ?? 0`. Si `realtime.climate` es null, `gdd = 0`, y `(0).toFixed(1) = "0.0"`. Esto es **correcto**.

_Corrección: No es un bug._

---

### BUG-5-05 — Select de meses muestra meses del año actual pero no refleja filtros (Baja)

**Ubicación:** `src/components/sembradata/Dashboard.tsx:334-346`

**Problema:**

```typescript
{MONTH_LABELS.slice(
  0,
  Number(year) === new Date().getFullYear()
    ? new Date().getMonth() + 1
    : 12,
).map((m) => ...)}
```

Si el usuario selecciona un año futuro (ej: 2027), el selector muestra los 12 meses, pero la API no tiene datos futuros. El usuario podría seleccionar "Dic" de 2027 y obtener datos vacíos.

**Impacto:** UX confusa — el usuario puede seleccionar meses sin datos.

---

## Fase 6 — Testing & Docs

### BUG-6-01 — Tests de supabase_connection usan `describe.skipIf` correctamente (Info)

No hay bugs — el skip condicional funciona como esperado.

---

## Fase 7 — Release

### BUG-7-01 — `package.json` version 0.6.0 pero `App.tsx` puede tener hardcodes (Info)

No hay bugs funcionales en el release bump.

---

## Resumen por Severidad

| Severidad | Bugs | IDs                                                                                  |
| --------- | ---- | ------------------------------------------------------------------------------------ |
| **Alta**  | 3    | BUG-3A-01, BUG-3B-01, BUG-3C-01                                                      |
| **Media** | 6    | BUG-3A-02, BUG-3A-03, BUG-4A-03, BUG-4A-04, BUG-4A-07, BUG-5-01                      |
| **Baja**  | 7    | BUG-3A-04, BUG-3B-02, BUG-3C-02, BUG-3C-03, BUG-4A-05, BUG-4A-06, BUG-5-02, BUG-5-05 |
| **Info**  | 3    | BUG-5-03, BUG-6-01, BUG-7-01                                                         |

---

## Prioridad de Corrección

### Prioridad 1 — Bugs funcionales visibles

1. **BUG-3C-01** — YieldChart hardcode 2024 (roto para 2025+)
2. **BUG-3B-01** — ClimateRadar siempre muestra ~50 (inútil)
3. **BUG-3A-01** — RiskChart muta objetos (puede causar rendering inconsistente)

### Prioridad 2 — Bugs de integridad de datos

4. **BUG-3A-02** — RiskChart valores > 100 (barras desbordadas)
5. **BUG-4A-04** — fetchCurrentClimate puede fallar con current null
6. **BUG-5-01** — Suspense inútil (skeletons nunca se muestran)

### Prioridad 3 — Mejoras y edge cases

7. **BUG-4A-03** — Cache memory leak menor
8. **BUG-5-02** — Loop potencial en setMunicipio
9. **BUG-4A-07** — aridityIndex puede ser > 1

### Prioridad 4 — Code smells

10. **BUG-3A-03** — factor undefined fallback
11. **BUG-3C-02** — Line+Area redundante
12. **BUG-5-03** — fetchGen no se resetea
