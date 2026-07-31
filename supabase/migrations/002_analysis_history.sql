-- SembraData: Tabla de historial de análisis
-- Ejecutar en Supabase SQL Editor o via `supabase db push`

-- ============================================================
-- Historial de análisis de viabilidad realizados por el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio TEXT NOT NULL,
  departamento TEXT NOT NULL,
  cultivo TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  score NUMERIC NOT NULL,
  viable BOOLEAN NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_history_created
  ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_municipio
  ON analysis_history(municipio);
CREATE INDEX IF NOT EXISTS idx_analysis_history_cultivo
  ON analysis_history(cultivo);

COMMENT ON TABLE analysis_history IS 'Historial de análisis de viabilidad agroclimática.';
COMMENT ON COLUMN analysis_history.score IS 'Puntuación de viabilidad 0-100.';
COMMENT ON COLUMN analysis_history.recommendations IS 'Lista de recomendaciones generadas.';

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write analysis_history"
  ON analysis_history FOR ALL TO anon USING (true) WITH CHECK (true);
