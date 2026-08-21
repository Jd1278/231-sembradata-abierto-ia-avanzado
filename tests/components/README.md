# Pruebas por Componentes — SembraData

## Arquitectura de Pruebas

El proyecto implementa una **estrategia de pruebas en 3 capas**:

| Capa            | Herramienta                    | Ubicación           | Propósito                                     |
| --------------- | ------------------------------ | ------------------- | --------------------------------------------- |
| **Unitarias**   | Vitest                         | `tests/unit/`       | Lógica de negocio, servicios, utilidades      |
| **Componentes** | Vitest + React Testing Library | `tests/components/` | Comportamiento visual, interacciones, estados |
| **E2E**         | Playwright                     | `e2e/`              | Flujos completos de usuario en navegador      |

### Diferencia entre pruebas unitarias y por componentes

| Aspecto          | Unitarias                             | Componentes                                        |
| ---------------- | ------------------------------------- | -------------------------------------------------- |
| **Qué validan**  | Funciones, lógica, datos              | Renderizado, interacciones, estados UI             |
| **Dependencias** | Ninguna (mocks de servicios externos) | jsdom simula el navegador                          |
| **React**        | No renderizan componentes             | Renderizan componentes con RTL                     |
| **Velocidad**    | ~15s                                  | ~45s (incluye setup de jsdom)                      |
| **Ejemplo**      | `expect(sum(1,2)).toBe(3)`            | `expect(getByText('Guardar')).toBeInTheDocument()` |

## Estructura de Carpetas

```
tests/
├── unit/                        # Pruebas unitarias (test_*.ts)
│   ├── test_cache.ts
│   ├── test_climate_api.ts
│   ├── test_data_structure.ts
│   ├── test_municipios.ts
│   ├── test_prediction_v2.ts
│   └── test_rate_limiter.ts
├── components/                  # Pruebas por componentes (test_*.tsx)
│   ├── README.md                # Esta documentación
│   ├── test-utils.tsx           # Utilidades compartidas de renderizado
│   ├── test_filter_block.tsx
│   ├── test_kpi_card.tsx
│   ├── test_risk_kpi_card.tsx
│   ├── test_map_legend.tsx
│   ├── test_offline_indicator.tsx
│   ├── test_section_error_boundary.tsx
│   ├── test_advanced_filters.tsx
│   └── test_history_panel.tsx
├── integration/
│   └── test_supabase_connection.ts
├── bias_tests/
│   └── test_territorial_fairness.ts
└── setup.ts                     # Configuración global (jest-dom)
```

## Convención de Nombres

- **Archivos:** `test_<nombre_componente>.tsx` (prefijo `test_`, snake_case, extensión `.tsx`)
- **Suites:** `describe("<NombreComponente>", ...)` en español
- **Tests:** `it("acción esperada", ...)` en español descriptivo
- **Data-testid:** `data-testid="nombre-componente"` en componentes clave

## Utilidades Compartidas

### `test-utils.tsx`

Provee un `setup()` que envuelve `render()` de RTL con `userEvent`:

```tsx
import { setup } from "./test-utils";

test("ejemplo", async () => {
  const { user, getByText } = setup(<MiComponente />);
  await user.click(getByText("Enviar"));
});
```

## Cobertura de Pruebas (8 componentes, 40 tests)

| Componente             | Tests | Cubre                                                     |
| ---------------------- | ----- | --------------------------------------------------------- |
| `FilterBlock`          | 3     | Renderizado con/sin icono, children complejos             |
| `KpiCard`              | 6     | Props, variantes de color (primary/sky/earth), edge cases |
| `RiskKpiCard`          | 6     | 3 estados de riesgo, clases CSS, icono                    |
| `MapLegend`            | 3     | 3 niveles, dots, data-testid                              |
| `OfflineIndicator`     | 3     | Estado online/offline, icono                              |
| `SectionErrorBoundary` | 5     | Error/éxito, fallback, botón reintentar                   |
| `AdvancedFilters`      | 7     | Expandir/colapsar, cambio de filtros, reset               |
| `HistoryPanel`         | 5     | Apertura/cierre, datos mock, vacío, Escape                |

## Cómo Crear una Nueva Prueba por Componente

1. Crear archivo `tests/components/test_<nombre>.tsx`
2. Usar `setup` de `test-utils` para renderizado
3. Usar `screen` (opcional) o queries desestructuradas
4. Seguir el patrón:

```tsx
import { describe, it, expect } from "vitest";
import { MiComponente } from "../../src/components/...";
import { setup } from "./test-utils";

describe("MiComponente", () => {
  it("renderiza correctamente", () => {
    const { getByText } = setup(<MiComponente />);
    expect(getByText("Texto esperado")).toBeInTheDocument();
  });

  it("maneja interacción del usuario", async () => {
    const { user, getByRole } = setup(<MiComponente />);
    await user.click(getByRole("button"));
  });
});
```

## Cómo Ejecutar las Pruebas

```bash
# Pruebas unitarias SOLO
npm run test:unit

# Pruebas por componentes SOLO
npm run test:components

# Todas las pruebas (unitarias + componentes + integración + bias)
npm test

# Pruebas en modo watch
npm run test:watch

# Con cobertura
npm run test:coverage

# E2E
npm run test:e2e
```

## Buenas Prácticas

1. **Independencia:** Cada test debe funcionar sin depender de otros tests.
2. **Aislamiento:** Mockear servicios externos (`analysis-history`, `supabase`, `fetch`).
3. **Usuario real:** Preferir `userEvent` sobre `fireEvent` para simular interacciones reales.
4. **Query semántica:** Priorizar `getByRole` > `getByLabelText` > `getByTestId`.
5. **Sin lógica de producción:** No duplicar lógica del componente en el test.
6. **Estado vacío primero:** Probar componente sin datos antes que con datos.
7. **Un assertion por concepto:** Preferir múltiples tests simples sobre uno complejo.
8. **Nombres descriptivos:** `"no renderiza nada cuando está online"` en vez de `"test1"`.
9. **Cleanup automático:** Vitest + jsdom limpian automáticamente después de cada test.
10. **Mock global para console.error:** En tests de error boundaries, silenciar errores esperados.
