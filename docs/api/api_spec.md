# Especificacion API — SembraData

## Base URL

```
https://hhnbaxwbeywyriigcwav.supabase.co/rest/v1/
```

## Autenticacion

Todas las peticiones requieren el header:

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
```

## Endpoints

### GET /municipios

Obtiene la lista de municipios de Santander.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Bucaramanga",
      "departamento": "Santander",
      "latitud": 7.125,
      "longitud": -73.125,
      "altitud_msnm": 959,
      "area_km2": 165,
      "poblacion": 581130,
      "zone_agroecologica": "alta"
    }
  ]
}
```

### GET /clima_mensual

Obtiene datos climaticos mensuales filtrados.

**Query Parameters:**

| Param        | Tipo    | Descripcion      |
| ------------ | ------- | ---------------- |
| municipio_id | uuid    | ID del municipio |
| anio         | integer | Ano              |
| mes          | integer | Mes (1-12)       |

### GET /rendimiento_historico

Obtiene rendimiento historico por municipio y cultivo.

**Query Parameters:**

| Param        | Tipo    | Descripcion      |
| ------------ | ------- | ---------------- |
| municipio_id | uuid    | ID del municipio |
| cultivo_id   | uuid    | ID del cultivo   |
| anio_gte     | integer | Ano minimo       |
| anio_lte     | integer | Ano maximo       |

### GET /riesgo_agroclimatico

Obtiene el nivel de riesgo agroclimatico.

**Query Parameters:**

| Param        | Tipo    | Descripcion      |
| ------------ | ------- | ---------------- |
| municipio_id | uuid    | ID del municipio |
| cultivo_id   | uuid    | ID del cultivo   |
| anio         | integer | Ano              |
| mes          | integer | Mes (1-12)       |

### GET /predicciones

Obtiene predicciones de rendimiento futuro.

**Query Parameters:**

| Param        | Tipo    | Descripcion      |
| ------------ | ------- | ---------------- |
| municipio_id | uuid    | ID del municipio |
| cultivo_id   | uuid    | ID del cultivo   |
| anio_gte     | integer | Ano minimo       |

### GET /cultivos

Obtiene la lista de cultivos disponibles.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Cacao",
      "clave": "cacao",
      "rendimiento_base": 0.85,
      "ventana_siembra": "abril - mayo",
      "descripcion": "Cultivo insignia de Santander"
    }
  ]
}
```

## Servicios Externos

Las siguientes APIs externas se consumen desde el frontend y backend (con cache en Supabase):

| API                | Endpoint                 | Datos                                       |
| ------------------ | ------------------------ | ------------------------------------------- |
| Open-Meteo         | api.open-meteo.com       | Clima actual, pronostico 7d, historicos 90d, NDVI |
| NASA POWER         | power.larc.nasa.gov      | Datos satelitales + indices agroclimaticos  |
| IDEAM              | datos.gov.co             | Estaciones meteorologicas reales            |
| SoilGrids          | rest.isric.org           | Propiedades del suelo (6 profundidades)     |
| Commodity Forecast | commodityforecasts.co.uk | Precios cafe y cacao                        |
| Groq               | api.groq.com             | Chatbot IA (Llama 3.1 8B) via Edge Function (server-side) |
| Supabase           | supabase.co              | PostgreSQL + Edge Functions + cache         |

## Documentacion OpenAPI

La especificacion completa OpenAPI 3.1.0 se encuentra en `docs/api/openapi.yaml` con:

- 6 endpoints documentados
- 7 schemas de datos
- 2 esquemas de autenticacion (Bearer + ApiKey)
- Ejemplos para cada endpoint
