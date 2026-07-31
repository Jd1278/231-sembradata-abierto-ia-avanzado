-- SembraData: Tablas de cache para APIs externas
-- Ejecutar en Supabase SQL Editor o via `supabase db push`

-- ============================================================
-- 1. Cache de observaciones IDEAM (datos.gov.co)
--    TTL recomendado: 24 horas (las estaciones reportan 1 vez al día)
-- ============================================================
CREATE TABLE IF NOT EXISTS ideam_cache (
  id BIGSERIAL PRIMARY KEY,
  estacion_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  temperatura NUMERIC,
  humedad NUMERIC,
  precipitacion NUMERIC,
  velocidad_viento NUMERIC,
  direccion_viento NUMERIC,
  presion NUMERIC,
  radiacion_solar NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(estacion_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_ideam_cache_lookup
  ON ideam_cache(estacion_id, fecha);

CREATE INDEX IF NOT EXISTS idx_ideam_cache_fetched
  ON ideam_cache(fetched_at);

COMMENT ON TABLE ideam_cache IS 'Cache de observaciones meteorológicas IDEAM. TTL 24h.';
COMMENT ON COLUMN ideam_cache.fetched_at IS 'Momento en que se obtuvieron estos datos de la API.';

-- ============================================================
-- 2. Cache de datos satelitales NASA POWER
--    TTL recomendado: 7 días (datos históricos nunca cambian)
-- ============================================================
CREATE TABLE IF NOT EXISTS nasa_power_cache (
  id BIGSERIAL PRIMARY KEY,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  temp_avg NUMERIC,
  temp_max NUMERIC,
  temp_min NUMERIC,
  precipitacion NUMERIC,
  humedad NUMERIC,
  velocidad_viento NUMERIC,
  radiacion_solar NUMERIC,
  evapotranspiracion NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lat, lng, fecha)
);

CREATE INDEX IF NOT EXISTS idx_nasa_power_lookup
  ON nasa_power_cache(lat, lng, fecha);

CREATE INDEX IF NOT EXISTS idx_nasa_power_fetched
  ON nasa_power_cache(fetched_at);

COMMENT ON TABLE nasa_power_cache IS 'Cache de datos satelitales NASA POWER. TTL 7 días.';

-- ============================================================
-- 3. Cache de precios de commodity
--    TTL recomendado: 1 hora (precios cambian poco frecuente)
-- ============================================================
CREATE TABLE IF NOT EXISTS commodity_cache (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commodity_cache_fetched
  ON commodity_cache(fetched_at);

COMMENT ON TABLE commodity_cache IS 'Cache de precios internacionales de commodity. TTL 1h.';

-- ============================================================
-- 4. Función de limpieza automática de cache expirado
--    Se puede llamar con: SELECT clean_expired_cache();
--    O programar como pg_cron job cada 6 horas.
-- ============================================================
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- IDEAM: eliminar datos mayores a 48 horas
  DELETE FROM ideam_cache WHERE fetched_at < NOW() - INTERVAL '48 hours';

  -- NASA POWER: eliminar datos mayores a 14 días
  DELETE FROM nasa_power_cache WHERE fetched_at < NOW() - INTERVAL '14 days';

  -- Commodity: eliminar datos mayores a 6 horas
  DELETE FROM commodity_cache WHERE fetched_at < NOW() - INTERVAL '6 hours';
END;
$$;

COMMENT ON FUNCTION clean_expired_cache IS 'Limpia registros de cache expirados. Ejecutar cada 6h.';

-- ============================================================
-- 5. RLS Policies — permitir lectura/escrita al cliente anónimo
--    (Supabase habilita RLS por defecto en tablas nuevas)
-- ============================================================
ALTER TABLE ideam_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE nasa_power_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_cache ENABLE ROW LEVEL SECURITY;

-- Permitir todo al service_role (ya lo tiene por defecto)
-- Políticas para el anon key:
CREATE POLICY "Allow anon read/write ideam_cache"
  ON ideam_cache FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon read/write nasa_power_cache"
  ON nasa_power_cache FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon read/write commodity_cache"
  ON commodity_cache FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
