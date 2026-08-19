-- SembraData: Add missing columns to analysis_history
-- Ejecutar en Supabase SQL Editor

ALTER TABLE analysis_history
  ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pest_risk_level TEXT DEFAULT 'Bajo';

COMMENT ON COLUMN analysis_history.confidence IS 'Nivel de confianza del análisis (0-100).';
COMMENT ON COLUMN analysis_history.pest_risk_level IS 'Nivel de riesgo de plagas: Bajo, Medio, Alto.';
