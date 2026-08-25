# Diccionario de Datos — SembraData

Documentación técnica del esquema relacional de PostgreSQL en Supabase para SembraData (Migraciones 001 a 009).

---

## 1. Tablas Maestras y Geográficas

### Tabla: `municipios`

Catálogo oficial de los 87 municipios del departamento de Santander.

| Columna              | Tipo               | Descripción                                              |
| :------------------- | :----------------- | :------------------------------------------------------- |
| `id`                 | `VARCHAR(50)` (PK) | Identificador normalizado (ej: `san_gil`, `bucaramanga`) |
| `nombre`             | `VARCHAR(100)`     | Nombre oficial del municipio                             |
| `departamento`       | `VARCHAR(50)`      | Departamento (`Santander`)                               |
| `latitud`            | `NUMERIC(8,5)`     | Latitud geográfica                                       |
| `longitud`           | `NUMERIC(8,5)`     | Longitud geográfica                                      |
| `altitud_msnm`       | `INTEGER`          | Altitud oficial sobre el nivel del mar                   |
| `area_km2`           | `NUMERIC(8,2)`     | Extensión territorial en kilómetros cuadrados            |
| `poblacion`          | `INTEGER`          | Población estimada                                       |
| `zone_agroecologica` | `VARCHAR(50)`      | Zona agroecológica (`Andina`, `Subandina`, etc.)         |

**RLS:** `SELECT` público habilitado para `anon` y `authenticated`.

---

### Tabla: `cultivos`

Catálogo de cultivos agrícolas priorizados.

| Columna            | Tipo               | Descripción                                   |
| :----------------- | :----------------- | :-------------------------------------------- |
| `id`               | `VARCHAR(50)` (PK) | Identificador (`cacao`, `cafe`, `granadilla`) |
| `nombre`           | `VARCHAR(100)`     | Nombre común                                  |
| `rendimiento_base` | `NUMERIC(6,3)`     | Rendimiento de referencia (Ton/Ha)            |
| `ventana_siembra`  | `TEXT`             | Calendario agrícola recomendado               |

---

## 2. Requerimientos Fisiológicos y Series Observadas

### Tabla: `crop_climate_requirements`

Rangos óptimos y tolerancias agronómicas oficiales (Cenicafé / Fedecacao / AGROSAVIA).

| Columna                        | Tipo               | Descripción                            |
| :----------------------------- | :----------------- | :------------------------------------- |
| `id`                           | `UUID` (PK)        | Identificador único                    |
| `crop_id`                      | `VARCHAR(50)` (FK) | Relación con `cultivos.id`             |
| `temperature_optimal_min_c`    | `NUMERIC(4,1)`     | Temperatura óptima mínima (°C)         |
| `temperature_optimal_max_c`    | `NUMERIC(4,1)`     | Temperatura óptima máxima (°C)         |
| `precipitation_optimal_min_mm` | `NUMERIC(6,1)`     | Precipitación anual óptima mínima (mm) |
| `precipitation_optimal_max_mm` | `NUMERIC(6,1)`     | Precipitación anual óptima máxima (mm) |
| `altitude_optimal_min_m`       | `INTEGER`          | Altitud óptima mínima (msnm)           |
| `altitude_optimal_max_m`       | `INTEGER`          | Altitud óptima máxima (msnm)           |
| `humidity_optimal_min_pct`     | `NUMERIC(4,1)`     | Humedad relativa óptima mínima (%)     |
| `humidity_optimal_max_pct`     | `NUMERIC(4,1)`     | Humedad relativa óptima máxima (%)     |
| `ph_optimal_min`               | `NUMERIC(3,1)`     | pH de suelo óptimo mínimo              |
| `ph_optimal_max`               | `NUMERIC(3,1)`     | pH de suelo óptimo máximo              |
| `source`                       | `TEXT`             | Fuente agronómica oficial              |
| `active`                       | `BOOLEAN`          | Estado de vigencia del requerimiento   |

---

### Tabla: `rendimiento_historico`

Observaciones agropecuarias oficiales recolectadas por EVA / MinAgricultura (2018–2024, Migración 010) para municipios productores de Santander.

| Columna              | Tipo               | Descripción                           |
| :------------------- | :----------------- | :------------------------------------ |
| `id`                 | `UUID` (PK)        | Identificador único                   |
| `municipio_id`       | `VARCHAR(50)` (FK) | Relación con `municipios.id`          |
| `cultivo_id`         | `VARCHAR(50)` (FK) | Relación con `cultivos.id`            |
| `anio`               | `INTEGER`          | Año calendario observado (2018..2024) |
| `rendimiento_ton_ha` | `NUMERIC(6,3)`     | Rendimiento observado (Ton/Ha)        |
| `superficie_ha`      | `NUMERIC(10,2)`    | Área cosechada (Hectáreas)            |

---

## 3. Predicciones Versionadas y Calidad de Datos

### Tabla: `predicciones_agroclimaticas` (Migración 007 / 009)

Historial y persistencia de pronósticos estadísticos (Theil-Sen / Rolling Origin).

| Columna                | Tipo               | Descripción                                     |
| :--------------------- | :----------------- | :---------------------------------------------- |
| `id`                   | `UUID` (PK)        | Identificador único                             |
| `municipio_id`         | `VARCHAR(50)` (FK) | Relación con `municipios.id`                    |
| `cultivo_id`           | `VARCHAR(50)` (FK) | Relación con `cultivos.id`                      |
| `anio_objetivo`        | `INTEGER`          | Año proyectado ($2020..2050$)                   |
| `rendimiento_estimado` | `NUMERIC(6,3)`     | Predicción estimada (Ton/Ha)                    |
| `limite_inferior_80`   | `NUMERIC(6,3)`     | Límite inferior de predicción al 80% ($L_{80}$) |
| `limite_superior_80`   | `NUMERIC(6,3)`     | Límite superior de predicción al 80% ($U_{80}$) |
| `limite_inferior_95`   | `NUMERIC(6,3)`     | Límite inferior de predicción al 95% ($L_{95}$) |
| `limite_superior_95`   | `NUMERIC(6,3)`     | Límite superior de predicción al 95% ($U_{95}$) |
| `modelo_nombre`        | `VARCHAR(100)`     | Nombre del modelo (`Theil-Sen`)                 |
| `modelo_version`       | `VARCHAR(20)`      | Versión del modelo (`2.6.0-stat`)               |
| `metricas_validacion`  | `JSONB`            | MAE, RMSE, SMAPE y tamaño de muestra            |
| `features_snapshot`    | `JSONB`            | Clima, suelo y altitud del momento de cálculo   |
| `status`               | `VARCHAR(20)`      | `active`, `archived`, `insufficient_data`       |
| `expires_at`           | `TIMESTAMPTZ`      | Expiración del pronóstico                       |

**RLS:** `SELECT` público habilitado. `INSERT/UPDATE/DELETE` restringido estrictamente a `service_role`.

---

### Tabla: `data_quality_quarantine` (Migración 008 / 009)

Registro de auditoría y aislamiento de anomalías físicas o registros corruptos.

| Columna             | Tipo          | Descripción                         |
| :------------------ | :------------ | :---------------------------------- |
| `id`                | `UUID` (PK)   | Identificador único del evento      |
| `source_table`      | `TEXT`        | Tabla origen del registro anómalo   |
| `record_id`         | `TEXT`        | ID del registro en la tabla origen  |
| `quarantine_reason` | `TEXT`        | Causa del aislamiento               |
| `payload`           | `JSONB`       | Contenido del registro aislado      |
| `severity`          | `TEXT`        | `low`, `medium`, `high`, `critical` |
| `detected_at`       | `TIMESTAMPTZ` | Fecha y hora de detección           |

**RLS:** Restringido exclusivamente a `service_role`.

---

## 4. Memoria y Caché de APIs

### Tabla: `chat_conversations` (Migración 003 / 009)

Historial conversacional del asistente agroclimático.

| Columna      | Tipo          | Descripción                            |
| :----------- | :------------ | :------------------------------------- |
| `id`         | `UUID` (PK)   | Identificador del mensaje              |
| `session_id` | `TEXT`        | ID de sesión anónima o autenticada     |
| `role`       | `TEXT`        | `user`, `assistant`, `system`          |
| `content`    | `TEXT`        | Contenido del mensaje                  |
| `metadata`   | `JSONB`       | Intención, claims y fuentes utilizadas |
| `created_at` | `TIMESTAMPTZ` | Timestamp del mensaje                  |

**RLS:** Restringido a `service_role` (usado por Edge Function `chat`).

---

### Tablas de Caché: `ideam_cache`, `nasa_power_cache`, `commodity_cache`

Almacenamiento temporal server-side de respuestas de APIs externas.

**RLS:** `SELECT` público para datos vigentes. Escritura y purga restringidas al servidor vía RPC `clean_system_cache_and_audit()`.
