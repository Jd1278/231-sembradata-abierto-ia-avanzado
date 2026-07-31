# Data Directory

This directory contains ETL pipelines, metadata, and processed data for the SembraData project.

## Structure

- **etl/**: ETL pipeline scripts for ingesting external data sources
  - `etl_ideam.ts`: IDEAM meteorological station data (datos.gov.co Socrata)
  - `etl_nasa_power.ts`: NASA POWER satellite daily data + agroclimatology indices
  - `etl_commodities.ts`: International commodity prices (coffee, cocoa, sugar, etc.)
- **raw/**: Raw downloaded data files
- **processed/**: Processed and transformed data
- **external/**: External data references
- **realtime/**: Real-time streaming data
- **metadata.json**: Pipeline configuration, scheduling, and table definitions

## Usage

ETL pipelines are written in TypeScript and can be run with Deno or Node.js:

```bash
# IDEAM pipeline
deno run --allow-net --allow-env data/etl/etl_ideam.ts

# NASA POWER pipeline
deno run --allow-net --allow-env data/etl/etl_nasa_power.ts

# Commodities pipeline
deno run --allow-net --allow-env data/etl/etl_commodities.ts
```

## Metadata

The `metadata.json` file contains pipeline configuration, scheduling, and table definitions for all ETL processes.

## External Data Sources (5 APIs) + AI + Backend

| Source                 | Type                  | Frequency | Service File                              |
| ---------------------- | --------------------- | --------- | ----------------------------------------- |
| Open-Meteo             | Climate               | Real-time | `src/services/climate-api.ts`             |
| NASA POWER             | Satellite             | Daily     | `src/services/nasa-power.ts`              |
| IDEAM (datos.gov.co)   | Meteorological        | Daily     | `src/services/ideam.ts`                   |
| SoilGrids (ISRIC)      | Soil properties       | Static    | `src/services/soil-service.ts`            |
| Commodity Forecast     | Market prices         | Hourly    | `src/services/commodity-price.ts`         |
| Groq (Llama 3.1 8B)    | Chatbot AI (server-side) | Real-time | `supabase/functions/chat`               |
| Supabase               | Cache, history, Edge Functions | Real-time | `src/services/cache.ts`, `src/services/supabase.ts` |
| **GeoJSON Colombia**   | **Municipios Santander (87)**| **Static**| **`src/data/colombia-municipios.geo.json`**|
