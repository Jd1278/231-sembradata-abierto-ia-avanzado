-- ============================================================
-- SEMBRADATA: MIGRACIÓN 008 — SANEAMIENTO, CUARENTENA, MANTENIMIENTO Y SEGURIDAD RLS
-- Archivo: supabase/migrations/008_data_quality_and_security.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. CREACIÓN DE LA TABLA DE AUDITORÍA Y CUARENTENA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_quality_quarantine (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL,
  record_id TEXT,
  quarantine_reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detected_by TEXT NOT NULL DEFAULT 'data_quality_migration_008',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_quarantine_table ON data_quality_quarantine(source_table);
CREATE INDEX IF NOT EXISTS idx_quarantine_detected ON data_quality_quarantine(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_severity ON data_quality_quarantine(severity);

COMMENT ON TABLE data_quality_quarantine IS 'Registro de registros anómalos o sospechosos puestos en cuarentena antes de depuración.';

-- ------------------------------------------------------------
-- 2. COPIA DE REGISTROS FÍSICAMENTE ANÓMALOS A CUARENTENA
-- ------------------------------------------------------------

-- 2.1 Cuarentena de observaciones IDEAM con valores fuera de límites físicos
INSERT INTO data_quality_quarantine (source_table, record_id, quarantine_reason, payload, severity, detected_by)
SELECT 
  'ideam_cache',
  id::text,
  'Valores meteorológicos fuera de rangos físicos plausibles (-10°C a 55°C, precipitación < 0 o humedad fuera de 0-100%)',
  to_jsonb(i.*),
  'high',
  'data_quality_migration_008'
FROM ideam_cache i
WHERE 
  (temperatura IS NOT NULL AND (temperatura < -10 OR temperatura > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100));

-- Eliminar de ideam_cache los registros que fueron copiados a cuarentena por inconsistencia física
DELETE FROM ideam_cache
WHERE 
  (temperatura IS NOT NULL AND (temperatura < -10 OR temperatura > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100));

-- 2.2 Cuarentena de NASA POWER con coordenadas fuera de territorio nacional o valores corruptos
INSERT INTO data_quality_quarantine (source_table, record_id, quarantine_reason, payload, severity, detected_by)
SELECT 
  'nasa_power_cache',
  id::text,
  'Coordenadas geográficas fuera de Colombia o variables meteorológicas fuera de rango',
  to_jsonb(n.*),
  'high',
  'data_quality_migration_008'
FROM nasa_power_cache n
WHERE 
  (temp_avg IS NOT NULL AND (temp_avg < -10 OR temp_avg > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100))
  OR (lat < -4.5 OR lat > 13.5 OR lng < -82.0 OR lng > -66.0);

DELETE FROM nasa_power_cache
WHERE 
  (temp_avg IS NOT NULL AND (temp_avg < -10 OR temp_avg > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100))
  OR (lat < -4.5 OR lat > 13.5 OR lng < -82.0 OR lng > -66.0);

-- 2.3 Cuarentena de analysis_history con campos obligatorios vacíos o scores imposibles
INSERT INTO data_quality_quarantine (source_table, record_id, quarantine_reason, payload, severity, detected_by)
SELECT 
  'analysis_history',
  id::text,
  'Registro de análisis incompleto, sin municipio o con score fuera del rango 0-100',
  to_jsonb(a.*),
  'medium',
  'data_quality_migration_008'
FROM analysis_history a
WHERE 
  municipio IS NULL 
  OR TRIM(municipio) = '' 
  OR cultivo IS NULL 
  OR TRIM(cultivo) = ''
  OR score < 0 
  OR score > 100;

DELETE FROM analysis_history
WHERE 
  municipio IS NULL 
  OR TRIM(municipio) = '' 
  OR cultivo IS NULL 
  OR TRIM(cultivo) = ''
  OR score < 0 
  OR score > 100;


-- ------------------------------------------------------------
-- 3. SANITIZACIÓN DE REGISTROS DUPLICADOS
-- ------------------------------------------------------------

-- Deduplicación de recommendations_cache conservando el registro más reciente
WITH ranked_recommendations AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY municipio, cultivo, score_range 
      ORDER BY created_at DESC, expires_at DESC
    ) AS rnk
  FROM recommendations_cache
)
DELETE FROM recommendations_cache
WHERE id IN (
  SELECT id FROM ranked_recommendations WHERE rnk > 1
);

-- Deduplicación de commodity_prices conservando el registro más reciente por símbolo y fecha
WITH ranked_commodity AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY symbol, source_timestamp 
      ORDER BY fetched_at DESC
    ) AS rnk
  FROM commodity_prices
  WHERE source_timestamp IS NOT NULL
)
DELETE FROM commodity_prices
WHERE id IN (
  SELECT id FROM ranked_commodity WHERE rnk > 1
);


-- ------------------------------------------------------------
-- 4. FUNCIÓN CENTRALIZADA DE MANTENIMIENTO E IDEMPOTENCIA
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION clean_system_cache_and_audit()
RETURNS TABLE (
  table_name TEXT,
  expired_cleaned BIGINT,
  quarantined_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ideam_expired BIGINT := 0;
  v_nasa_expired BIGINT := 0;
  v_comm_expired BIGINT := 0;
  v_rec_expired BIGINT := 0;
  v_quarantine_total BIGINT := 0;
BEGIN
  -- 1. Limpieza de IDEAM expirado (> 48h)
  WITH deleted AS (
    DELETE FROM ideam_cache 
    WHERE fetched_at < NOW() - INTERVAL '48 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_ideam_expired FROM deleted;

  -- 2. Limpieza de NASA POWER expirado (> 14 días)
  WITH deleted AS (
    DELETE FROM nasa_power_cache 
    WHERE fetched_at < NOW() - INTERVAL '14 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_nasa_expired FROM deleted;

  -- 3. Limpieza de Commodity Cache expirado (> 6 horas)
  WITH deleted AS (
    DELETE FROM commodity_cache 
    WHERE fetched_at < NOW() - INTERVAL '6 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_comm_expired FROM deleted;

  -- 4. Limpieza de Recomendaciones expiradas
  WITH deleted AS (
    DELETE FROM recommendations_cache 
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_rec_expired FROM deleted;

  -- Total en cuarentena actualmente
  SELECT COUNT(*) INTO v_quarantine_total FROM data_quality_quarantine;

  RETURN QUERY VALUES 
    ('ideam_cache', v_ideam_expired, 0::bigint),
    ('nasa_power_cache', v_nasa_expired, 0::bigint),
    ('commodity_cache', v_comm_expired, 0::bigint),
    ('recommendations_cache', v_rec_expired, 0::bigint),
    ('data_quality_quarantine', 0::bigint, v_quarantine_total);
END;
$$;

COMMENT ON FUNCTION clean_system_cache_and_audit IS 'Función centralizada y transaccional para depuración periódica de cachés y verificación de calidad.';


-- ------------------------------------------------------------
-- 5. ENDURECIMIENTO DE SEGURIDAD RLS (LEAST PRIVILEGE)
-- ------------------------------------------------------------

-- 5.1 Eliminar políticas de acceso amplio (read/write indiscriminado para anon)
DROP POLICY IF EXISTS "Allow anon read/write ideam_cache" ON ideam_cache;
DROP POLICY IF EXISTS "Allow anon read/write nasa_power_cache" ON nasa_power_cache;
DROP POLICY IF EXISTS "Allow anon read/write commodity_cache" ON commodity_cache;
DROP POLICY IF EXISTS "Allow anon read/write recommendations_cache" ON recommendations_cache;
DROP POLICY IF EXISTS "Allow anon read/write climate_summaries" ON climate_summaries;
DROP POLICY IF EXISTS "Allow anon read/write commodity_prices" ON commodity_prices;
DROP POLICY IF EXISTS "Allow anon read/write analysis_history" ON analysis_history;

-- 5.2 Establecer permisos estrictos de SOLO LECTURA (SELECT) para el rol 'anon'
CREATE POLICY "Allow anon select ideam_cache" 
  ON ideam_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select nasa_power_cache" 
  ON nasa_power_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select commodity_cache" 
  ON commodity_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select recommendations_cache" 
  ON recommendations_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select climate_summaries" 
  ON climate_summaries FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select commodity_prices" 
  ON commodity_prices FOR SELECT TO anon USING (true);

-- 5.3 Permitir lectura pública de cuarentena solo a administradores o authenticated
ALTER TABLE data_quality_quarantine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read data_quality_quarantine"
  ON data_quality_quarantine FOR SELECT TO authenticated USING (true);

-- 5.4 Permitir inserción en analysis_history con validación estricta de schema
CREATE POLICY "Allow anon insert validated analysis_history"
  ON analysis_history FOR INSERT TO anon
  WITH CHECK (
    score >= 0 AND score <= 100 
    AND municipio IS NOT NULL AND LENGTH(TRIM(municipio)) > 1
    AND cultivo IS NOT NULL AND LENGTH(TRIM(cultivo)) > 1
    AND lat >= -4.5 AND lat <= 13.5
    AND lng >= -82.0 AND lng <= -66.0
  );

CREATE POLICY "Allow anon select analysis_history"
  ON analysis_history FOR SELECT TO anon USING (true);


-- ------------------------------------------------------------
-- 6. CONSTRAINTS SQL DE INTEGRIDAD FÍSICA
-- ------------------------------------------------------------
DO $$ BEGIN
  -- Constraints en analysis_history
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_analysis_history_score_range') THEN
    ALTER TABLE analysis_history ADD CONSTRAINT chk_analysis_history_score_range CHECK (score >= 0 AND score <= 100);
  END IF;

  -- Constraints en predicciones_agroclimaticas
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_predicciones_rendimiento_non_negative') THEN
    ALTER TABLE predicciones_agroclimaticas ADD CONSTRAINT chk_predicciones_rendimiento_non_negative CHECK (rendimiento_estimado >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_predicciones_intervals_ordering') THEN
    ALTER TABLE predicciones_agroclimaticas ADD CONSTRAINT chk_predicciones_intervals_ordering CHECK (
      (limite_inferior_80 IS NULL OR limite_inferior_80 <= rendimiento_estimado)
      AND (limite_superior_80 IS NULL OR rendimiento_estimado <= limite_superior_80)
      AND (limite_inferior_95 IS NULL OR limite_inferior_80 IS NULL OR limite_inferior_95 <= limite_inferior_80)
      AND (limite_superior_95 IS NULL OR limite_superior_80 IS NULL OR limite_superior_80 <= limite_superior_95)
    );
  END IF;
END $$;
