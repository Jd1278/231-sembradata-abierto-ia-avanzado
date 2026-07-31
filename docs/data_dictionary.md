# Diccionario de Datos — SembraData

## Tabla: municipios

| Columna            | Tipo    | Descripción                              |
| ------------------ | ------- | ---------------------------------------- |
| id                 | uuid    | Identificador único del municipio        |
| nombre             | text    | Nombre del municipio                     |
| departamento       | text    | Departamento de Santander, Colombia                 |
| latitud            | numeric | Coordenada latitude                      |
| longitud           | numeric | Coordenada longitude                     |
| altitud_msnm       | numeric | Altitud en metros sobre el nivel del mar |
| area_km2           | numeric | Área en kilómetros cuadrados             |
| poblacion          | integer | Población estimada                       |
| zone_agroecologica | text    | Zona agroecológica (alta, media, baja)   |

## Tabla: cultivos

| Columna          | Tipo    | Descripción                                  |
| ---------------- | ------- | -------------------------------------------- |
| id               | uuid    | Identificador único del cultivo              |
| nombre           | text    | Nombre del cultivo (Cacao, Café, Granadilla) |
| clave            | text    | Clave interna (cacao, cafe, granadilla)      |
| rendimiento_base | numeric | Rendimiento base en Ton/Ha                   |
| ventana_siembra  | text    | Ventana óptima de siembra                    |
| descripcion      | text    | Descripción del cultivo                      |

## Tabla: clima_mensual

| Columna          | Tipo    | Descripción                   |
| ---------------- | ------- | ----------------------------- |
| id               | uuid    | Identificador único           |
| municipio_id     | uuid    | FK → municipios.id            |
| anio             | integer | Año del registro              |
| mes              | integer | Mes del registro (1-12)       |
| precipitacion_mm | numeric | Precipitación acumulada en mm |
| temp_promedio    | numeric | Temperatura promedio en °C    |
| temp_max         | numeric | Temperatura máxima en °C      |
| temp_min         | numeric | Temperatura mínima en °C      |
| humedad_relativa | numeric | Humedad relativa promedio (%) |
| vel_viento       | numeric | Velocidad del viento (km/h)   |

## Tabla: rendimiento_historico

| Columna            | Tipo    | Descripción                       |
| ------------------ | ------- | --------------------------------- |
| id                 | uuid    | Identificador único               |
| municipio_id       | uuid    | FK → municipios.id                |
| cultivo_id         | uuid    | FK → cultivos.id                  |
| anio               | integer | Año del registro                  |
| rendimiento_ton_ha | numeric | Rendimiento real en Ton/Ha        |
| superficie_ha      | numeric | Superficie cultivada en hectáreas |

## Tabla: riesgo_agroclimatico

| Columna              | Tipo    | Descripción                         |
| -------------------- | ------- | ----------------------------------- |
| id                   | uuid    | Identificador único                 |
| municipio_id         | uuid    | FK → municipios.id                  |
| cultivo_id           | uuid    | FK → cultivos.id                    |
| anio                 | integer | Año del registro                    |
| mes                  | integer | Mes del registro (1-12)             |
| nivel_riesgo         | text    | Nivel de riesgo (Bajo, Medio, Alto) |
| riesgo_sequia        | numeric | Score de riesgo por sequía (0-100)  |
| riesgo_heladas       | numeric | Score de riesgo por heladas (0-100) |
| riesgo_plagas        | numeric | Score de riesgo por plagas (0-100)  |
| factor_productividad | numeric | Factor de ajuste de productividad   |

## Tabla: predicciones

| Columna              | Tipo      | Descripción                         |
| -------------------- | --------- | ----------------------------------- |
| id                   | uuid      | Identificador único                 |
| municipio_id         | uuid      | FK → municipios.id                  |
| cultivo_id           | uuid      | FK → cultivos.id                    |
| anio                 | integer   | Año predicho                        |
| mes                  | integer   | Mes predicho (1-12)                 |
| rendimiento_estimado | numeric   | Rendimiento estimado en Ton/Ha      |
| confianza            | numeric   | Nivel de confianza del modelo (0-1) |
| modelo_version       | text      | Versión del modelo utilizado        |
| created_at           | timestamp | Fecha de creación del registro      |

## Tabla: ideam_cache

Cache de datos del IDEAM (datos.gov.co). TTL: 24 horas.

| Columna      | Tipo      | Descripción                                  |
| ------------ | --------- | -------------------------------------------- |
| id           | uuid      | Identificador único                          |
| municipality | text      | Nombre del municipio consultado              |
| data         | jsonb     | Datos completos de estaciones meteorológicas |
| created_at   | timestamp | Fecha de creación del registro               |
| expires_at   | timestamp | Fecha de expiración del cache                |

**RLS:** Permite SELECT/INSERT/UPDATE para role `anon`.

## Tabla: nasa_power_cache

Cache de datos satelitales de NASA POWER. TTL: 7 días.

| Columna    | Tipo      | Descripción                      |
| ---------- | --------- | -------------------------------- |
| id         | uuid      | Identificador único              |
| latitude   | numeric   | Latitud de la ubicación          |
| longitude  | numeric   | Longitud de la ubicación         |
| start_date | text      | Fecha de inicio del rango        |
| end_date   | text      | Fecha de fin del rango           |
| data       | jsonb     | Datos meteorológicos satelitales |
| created_at | timestamp | Fecha de creación del registro   |
| expires_at | timestamp | Fecha de expiración del cache    |

**RLS:** Permite SELECT/INSERT/UPDATE para role `anon`.

## Tabla: commodity_cache

Cache de precios internacionales de café y cacao. TTL: 1 hora.

| Columna    | Tipo      | Descripción                     |
| ---------- | --------- | ------------------------------- |
| id         | uuid      | Identificador único             |
| symbol     | text      | Símbolo del commodity (ej: "C") |
| data       | jsonb     | Datos completos del commodity   |
| created_at | timestamp | Fecha de creación del registro  |
| expires_at | timestamp | Fecha de expiración del cache   |

**RLS:** Permite SELECT/INSERT/UPDATE para role `anon`.

## Tabla: analysis_history

Historial de análisis de viabilidad realizados por los usuarios. Cada análisis se guarda automáticamente.

| Columna      | Tipo      | Descripción                               |
| ------------ | --------- | ----------------------------------------- |
| id           | uuid      | Identificador único del análisis          |
| department   | text      | Departamento analizado                    |
| municipality | text      | Municipio analizado (opcional)            |
| score        | integer   | Puntuación de viabilidad (0-100)          |
| crop         | text      | Cultivo analizado                         |
| climate_data | jsonb     | Datos climáticos del momento del análisis |
| soil_data    | jsonb     | Datos de suelo del análisis               |
| created_at   | timestamp | Fecha de creación del registro            |

**RLS:** Permite SELECT/INSERT/DELETE para role `anon`.

## Tipos de Servicios Externos

### ClimateData (Open-Meteo)

| Campo              | Tipo   | Descripción                 |
| ------------------ | ------ | --------------------------- |
| temperature        | number | Temperatura actual (°C)     |
| humidity           | number | Humedad relativa (%)        |
| precipitation      | number | Precipitación (mm)          |
| windSpeed          | number | Velocidad del viento (km/h) |
| solarRadiation     | number | Radiación solar (MJ/m²)     |
| uvIndex            | number | Índice UV                   |
| soilMoisture0To1cm | number | Humedad del suelo 0-1cm     |
| soilMoisture1To3cm | number | Humedad del suelo 1-3cm     |

### AgriClimatologyIndices (NASA POWER)

| Campo             | Tipo   | Descripción                                |
| ----------------- | ------ | ------------------------------------------ |
| growingDegreeDays | number | Días-grado acumulados                      |
| aridityIndex      | number | Índice de aridez (precipitación/potencial) |
| heatStressDays    | number | Días de estrés térmico (>35°C)             |
| uvStressDays      | number | Días de estrés UV                          |
| waterDemandMm     | number | Demanda hídrica total (mm)                 |
| frostRiskDays     | number | Días de riesgo de heladas                  |

### SoilProfile (SoilGrids)

| Campo         | Tipo   | Descripción                        |
| ------------- | ------ | ---------------------------------- |
| depth         | string | Rango de profundidad (ej: "0-5cm") |
| level         | number | Nivel de profundidad (0-5)         |
| ph            | number | pH del suelo                       |
| organicMatter | number | Materia orgánica (%)               |
| texture       | string | Textura (arena/limo/arcilla)       |
| drainageClass | string | Clase de drenaje                   |

### CommodityPrice (Commodity Forecast)

| Campo          | Tipo   | Descripción                                          |
| -------------- | ------ | ---------------------------------------------------- |
| crop           | string | Cultivo (cacao, cafe, granadilla)                    |
| label          | string | Etiqueta del cultivo                                 |
| price          | number | Precio de pronóstico                                 |
| unit           | string | Unidad de medida (kg)                                |
| currency       | string | Moneda (COP)                                         |
| change         | number | Cambio porcentual                                    |
| signal         | string | Señal de mercado (Bullish/Bearish/Neutral)           |
| recommendation | string | Recomendación de siembra                             |
| climateScore   | number | Score climático (0-100)                              |
| confidence     | number | Confianza del pronóstico (0-1)                       |
| reasoning      | string | Razonamiento del pronóstico                          |
| stressors      | array  | Factores estresantes climáticos por región           |
| regions        | array  | Regiones con anomalía térmica y score climático      |
| sources        | array  | Fuentes de datos                                     |
| forecastedAt   | string | Fecha del pronóstico                                 |
