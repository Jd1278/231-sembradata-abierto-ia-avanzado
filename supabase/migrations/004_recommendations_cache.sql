-- SembraData: Cache de recomendaciones dinámicas generadas por IA
-- Ejecutar en Supabase SQL Editor o via `supabase db push`

CREATE TABLE IF NOT EXISTS recommendations_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio TEXT NOT NULL,
  cultivo TEXT NOT NULL,
  score_range TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_recommendations_cache_lookup
  ON recommendations_cache(municipio, cultivo, score_range);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_expires
  ON recommendations_cache(expires_at);

COMMENT ON TABLE recommendations_cache IS 'Cache de recomendaciones IA por municipio/cultivo. Expira en 7 días.';
COMMENT ON COLUMN recommendations_cache.score_range IS 'Rango de score: low (<50), mid (50-69), high (70+)';
COMMENT ON COLUMN recommendations_cache.context IS 'Datos de contexto usados para generar la recomendación.';
COMMENT ON COLUMN recommendations_cache.expires_at IS 'Fecha de expiración del cache.';

ALTER TABLE recommendations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write recommendations_cache"
  ON recommendations_cache FOR ALL TO anon USING (true) WITH CHECK (true);

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendations_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_expired_recommendations IS 'Elimina recomendaciones cache expiradas.';
