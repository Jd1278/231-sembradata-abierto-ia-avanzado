-- SembraData: Migración 006 — Optimización de Esquema, Constraints, Índices y Estructuras Agroclimáticas (Fase 0)
-- Ejecutar en Supabase SQL Editor o mediante el ejecutor de migraciones de SembraData

-- ============================================================
-- 1. OPTIMIZACIÓN DE TABLA: municipios
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_municipios_lat') THEN
    ALTER TABLE municipios ADD CONSTRAINT chk_municipios_lat CHECK (latitud >= -90 AND latitud <= 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_municipios_lng') THEN
    ALTER TABLE municipios ADD CONSTRAINT chk_municipios_lng CHECK (longitud >= -180 AND longitud <= 180);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_municipios_alt') THEN
    ALTER TABLE municipios ADD CONSTRAINT chk_municipios_alt CHECK (altitud_msnm >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_municipios_nombre ON municipios(nombre);
CREATE INDEX IF NOT EXISTS idx_municipios_coords ON municipios(latitud, longitud);

COMMENT ON COLUMN municipios.latitud IS 'Latitud en grados decimales WGS84 (-90 a 90).';
COMMENT ON COLUMN municipios.longitud IS 'Longitud en grados decimales WGS84 (-180 a 180).';
COMMENT ON COLUMN municipios.altitud_msnm IS 'Elevación oficial del municipio en metros sobre el nivel del mar.';

-- ============================================================
-- 2. OPTIMIZACIÓN DE TABLA: cultivos
-- ============================================================
ALTER TABLE cultivos
  ADD COLUMN IF NOT EXISTS scientific_name TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Actualizar nombres científicos agronómicos oficiales
UPDATE cultivos SET scientific_name = 'Coffea arabica' WHERE id = 'cafe' AND (scientific_name IS NULL OR scientific_name = '');
UPDATE cultivos SET scientific_name = 'Theobroma cacao' WHERE id = 'cacao' AND (scientific_name IS NULL OR scientific_name = '');
UPDATE cultivos SET scientific_name = 'Passiflora ligularis' WHERE id = 'granadilla' AND (scientific_name IS NULL OR scientific_name = '');

COMMENT ON COLUMN cultivos.scientific_name IS 'Nombre científico taxonómico del cultivo.';
COMMENT ON COLUMN cultivos.active IS 'Indica si el cultivo está activo en el motor de recomendaciones.';

-- ============================================================
-- 3. NUEVA ESTRUCTURA: crop_climate_requirements
--    Rangos agroclimáticos oficiales (Cenicafé, Fedecacao, AGROSAVIA)
-- ============================================================
CREATE TABLE IF NOT EXISTS crop_climate_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
  
  -- Temperatura (°C)
  temperature_min_c NUMERIC NOT NULL,
  temperature_optimal_min_c NUMERIC NOT NULL,
  temperature_optimal_max_c NUMERIC NOT NULL,
  temperature_max_c NUMERIC NOT NULL,
  
  -- Precipitación anual (mm/año)
  precipitation_min_mm NUMERIC NOT NULL,
  precipitation_optimal_min_mm NUMERIC NOT NULL,
  precipitation_optimal_max_mm NUMERIC NOT NULL,
  precipitation_max_mm NUMERIC NOT NULL,
  
  -- Humedad relativa (%)
  humidity_min_pct NUMERIC NOT NULL DEFAULT 50,
  humidity_optimal_min_pct NUMERIC NOT NULL DEFAULT 70,
  humidity_optimal_max_pct NUMERIC NOT NULL DEFAULT 85,
  humidity_max_pct NUMERIC NOT NULL DEFAULT 95,
  
  -- Altitud (msnm)
  altitude_min_m NUMERIC NOT NULL,
  altitude_optimal_min_m NUMERIC NOT NULL,
  altitude_optimal_max_m NUMERIC NOT NULL,
  altitude_max_m NUMERIC NOT NULL,
  
  -- pH de suelo
  ph_min NUMERIC DEFAULT 4.5,
  ph_optimal_min NUMERIC DEFAULT 5.5,
  ph_optimal_max NUMERIC DEFAULT 6.5,
  ph_max NUMERIC DEFAULT 7.5,
  
  -- Pesos para scoring multicriterio
  weight_temperature NUMERIC NOT NULL DEFAULT 0.35,
  weight_precipitation NUMERIC NOT NULL DEFAULT 0.30,
  weight_altitude NUMERIC NOT NULL DEFAULT 0.20,
  weight_humidity NUMERIC NOT NULL DEFAULT 0.15,
  
  -- Metadata agronómica
  cycle_days INTEGER,
  soil_preference TEXT,
  source TEXT NOT NULL DEFAULT 'Cenicafé / Fedecacao / AGROSAVIA',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(crop_id)
);

CREATE INDEX IF NOT EXISTS idx_crop_requirements_crop ON crop_climate_requirements(crop_id);

COMMENT ON TABLE crop_climate_requirements IS 'Requisitos agronómicos y umbrales bioclimáticos oficiales por cultivo.';

-- Seed agronómico oficial para Café, Cacao y Granadilla
INSERT INTO crop_climate_requirements (
  crop_id,
  temperature_min_c, temperature_optimal_min_c, temperature_optimal_max_c, temperature_max_c,
  precipitation_min_mm, precipitation_optimal_min_mm, precipitation_optimal_max_mm, precipitation_max_mm,
  humidity_min_pct, humidity_optimal_min_pct, humidity_optimal_max_pct, humidity_max_pct,
  altitude_min_m, altitude_optimal_min_m, altitude_optimal_max_m, altitude_max_m,
  ph_min, ph_optimal_min, ph_optimal_max, ph_max,
  cycle_days, soil_preference, source
) VALUES
  ('cafe', 15.0, 18.0, 22.0, 26.0, 1200.0, 1500.0, 2000.0, 3000.0, 60.0, 70.0, 85.0, 95.0, 900.0, 1200.0, 1800.0, 2200.0, 5.0, 5.5, 6.5, 7.0, 365, 'Franco-arcilloso, volcánico, bien drenado, rico en materia orgánica', 'Cenicafé'),
  ('cacao', 18.0, 21.0, 32.0, 38.0, 1200.0, 1500.0, 2500.0, 3500.0, 65.0, 75.0, 85.0, 98.0, 0.0, 100.0, 800.0, 1200.0, 5.5, 6.0, 7.0, 7.8, 1095, 'Franco-arenoso a franco-arcilloso, profundo, buen drenaje', 'Fedecacao / AGROSAVIA'),
  ('granadilla', 12.0, 15.0, 20.0, 24.0, 800.0, 1000.0, 2000.0, 2800.0, 55.0, 65.0, 80.0, 90.0, 1500.0, 1800.0, 2800.0, 3200.0, 5.0, 5.5, 6.8, 7.5, 270, 'Franco-arenoso, profundo, permeable, rico en materia orgánica', 'AGROSAVIA')
ON CONFLICT (crop_id) DO UPDATE SET
  temperature_min_c = EXCLUDED.temperature_min_c,
  temperature_optimal_min_c = EXCLUDED.temperature_optimal_min_c,
  temperature_optimal_max_c = EXCLUDED.temperature_optimal_max_c,
  temperature_max_c = EXCLUDED.temperature_max_c,
  precipitation_min_mm = EXCLUDED.precipitation_min_mm,
  precipitation_optimal_min_mm = EXCLUDED.precipitation_optimal_min_mm,
  precipitation_optimal_max_mm = EXCLUDED.precipitation_optimal_max_mm,
  precipitation_max_mm = EXCLUDED.precipitation_max_mm,
  altitude_min_m = EXCLUDED.altitude_min_m,
  altitude_optimal_min_m = EXCLUDED.altitude_optimal_min_m,
  altitude_optimal_max_m = EXCLUDED.altitude_optimal_max_m,
  altitude_max_m = EXCLUDED.altitude_max_m,
  updated_at = NOW();

-- ============================================================
-- 4. NUEVA ESTRUCTURA: climate_summaries
--    Resúmenes consolidados con trazabilidad temporal explícita
-- ============================================================
CREATE TABLE IF NOT EXISTS climate_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  
  -- Período temporal explícito
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly', 'annual', 'historical', 'recent_90d')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Variables de temperatura (°C)
  mean_temperature_c NUMERIC,
  min_temperature_c NUMERIC,
  max_temperature_c NUMERIC,
  temperature_stddev NUMERIC,
  
  -- Variables de precipitación (mm)
  precipitation_mm NUMERIC,
  precipitation_daily_mean_mm NUMERIC,
  precipitation_stddev NUMERIC,
  precipitation_cv NUMERIC,
  
  -- Humedad y evapotranspiración
  mean_humidity_pct NUMERIC,
  et0_mm NUMERIC,
  water_balance_mm NUMERIC,
  water_deficit_mm NUMERIC,
  
  -- Métricas de calidad y completitud
  valid_observations INTEGER NOT NULL DEFAULT 0,
  expected_observations INTEGER NOT NULL DEFAULT 0,
  completeness NUMERIC NOT NULL DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 1),
  
  -- Trazabilidad
  source TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(municipio_id, period_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_climate_summaries_lookup 
  ON climate_summaries(municipio_id, period_type, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_climate_summaries_calc 
  ON climate_summaries(calculated_at DESC);

COMMENT ON TABLE climate_summaries IS 'Resúmenes bioclimáticos consolidados y validados por municipio y período.';

-- ============================================================
-- 5. OPTIMIZACIÓN DE TABLA: riesgo_agroclimatico
-- ============================================================
ALTER TABLE riesgo_agroclimatico
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 1),
  ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS climate_summary_id UUID REFERENCES climate_summaries(id) ON DELETE SET NULL;

COMMENT ON COLUMN riesgo_agroclimatico.risk_score IS 'Puntuación normalizada de riesgo agroclimático de 0.00 (riesgo mínimo) a 1.00 (riesgo extremo).';

-- ============================================================
-- 6. NUEVA ESTRUCTURA: commodity_prices
--    Cotizaciones internacionales normalizadas y trazables
-- ============================================================
CREATE TABLE IF NOT EXISTS commodity_prices (
  id BIGSERIAL PRIMARY KEY,
  commodity TEXT NOT NULL CHECK (commodity IN ('cafe', 'cacao', 'granadilla')),
  symbol TEXT NOT NULL,
  market TEXT NOT NULL,
  contract TEXT,
  price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit TEXT NOT NULL DEFAULT 'lb',
  change NUMERIC,
  change_percent NUMERIC,
  is_forecast BOOLEAN NOT NULL DEFAULT false,
  is_cached BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_lookup 
  ON commodity_prices(commodity, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_symbol 
  ON commodity_prices(symbol, fetched_at DESC);

COMMENT ON TABLE commodity_prices IS 'Historial y cotizaciones de commodities con trazabilidad de mercado, contrato y fuente.';

-- ============================================================
-- 7. OPTIMIZACIÓN DE TABLA: analysis_history
-- ============================================================
ALTER TABLE analysis_history
  ADD COLUMN IF NOT EXISTS municipio_id TEXT REFERENCES municipios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cultivo_id TEXT REFERENCES cultivos(id) ON DELETE SET NULL;

-- ============================================================
-- 8. CONSTRAINTS FÍSICOS EN TABLAS DE CACHE
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ideam_temp') THEN
    ALTER TABLE ideam_cache ADD CONSTRAINT chk_ideam_temp CHECK (temperatura IS NULL OR (temperatura >= -20 AND temperatura <= 60));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ideam_precip') THEN
    ALTER TABLE ideam_cache ADD CONSTRAINT chk_ideam_precip CHECK (precipitacion IS NULL OR precipitacion >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ideam_hum') THEN
    ALTER TABLE ideam_cache ADD CONSTRAINT chk_ideam_hum CHECK (humedad IS NULL OR (humedad >= 0 AND humedad <= 100));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nasa_temp') THEN
    ALTER TABLE nasa_power_cache ADD CONSTRAINT chk_nasa_temp CHECK (temp_avg IS NULL OR (temp_avg >= -20 AND temp_avg <= 60));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nasa_precip') THEN
    ALTER TABLE nasa_power_cache ADD CONSTRAINT chk_nasa_precip CHECK (precipitacion IS NULL OR precipitacion >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nasa_hum') THEN
    ALTER TABLE nasa_power_cache ADD CONSTRAINT chk_nasa_hum CHECK (humedad IS NULL OR (humedad >= 0 AND humedad <= 100));
  END IF;
END $$;

-- ============================================================
-- 9. ROW LEVEL SECURITY PARA NUEVAS TABLAS
-- ============================================================
ALTER TABLE crop_climate_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon read crop_climate_requirements' AND tablename = 'crop_climate_requirements') THEN
    CREATE POLICY "Allow anon read crop_climate_requirements"
      ON crop_climate_requirements FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon read/write climate_summaries' AND tablename = 'climate_summaries') THEN
    CREATE POLICY "Allow anon read/write climate_summaries"
      ON climate_summaries FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon read/write commodity_prices' AND tablename = 'commodity_prices') THEN
    CREATE POLICY "Allow anon read/write commodity_prices"
      ON commodity_prices FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
