-- ============================================================
-- Migración 007: Tabla Versionada de Predicciones Agroclimáticas
-- SembraData v2 — Modelo Estadístico Reproducible + Evaluación Gemini
-- ============================================================

CREATE TABLE IF NOT EXISTS public.predicciones_agroclimaticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id VARCHAR(50) NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    cultivo_id VARCHAR(50) NOT NULL REFERENCES public.cultivos(id) ON DELETE CASCADE,
    anio_objetivo INTEGER NOT NULL CHECK (anio_objetivo >= 2020 AND anio_objetivo <= 2050),
    rendimiento_estimado NUMERIC(6,3) NOT NULL CHECK (rendimiento_estimado >= 0),
    limite_inferior_80 NUMERIC(6,3) NOT NULL CHECK (limite_inferior_80 >= 0),
    limite_superior_80 NUMERIC(6,3) NOT NULL CHECK (limite_superior_80 >= limite_inferior_80),
    limite_inferior_95 NUMERIC(6,3) NOT NULL CHECK (limite_inferior_95 >= 0 AND limite_inferior_95 <= limite_inferior_80),
    limite_superior_95 NUMERIC(6,3) NOT NULL CHECK (limite_superior_95 >= limite_superior_80),
    modelo_nombre VARCHAR(100) NOT NULL,
    modelo_version VARCHAR(20) NOT NULL,
    metricas_validacion JSONB NOT NULL DEFAULT '{}'::jsonb,
    features_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    fuente_climatica VARCHAR(100) NOT NULL DEFAULT 'IDEAM + Open-Meteo ERA5',
    data_quality_score NUMERIC(4,3) NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    gemini_assessment JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deprecated', 'insufficient_data')),
    error_message TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT uq_prediccion_version UNIQUE (municipio_id, cultivo_id, anio_objetivo, modelo_version)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_pred_agro_lookup 
    ON public.predicciones_agroclimaticas (municipio_id, cultivo_id, anio_objetivo);

CREATE INDEX IF NOT EXISTS idx_pred_agro_status 
    ON public.predicciones_agroclimaticas (status);

CREATE INDEX IF NOT EXISTS idx_pred_agro_generated 
    ON public.predicciones_agroclimaticas (generated_at DESC);

-- Habilitar RLS
ALTER TABLE public.predicciones_agroclimaticas ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (cualquier usuario autenticado o anónimo puede consultar pronósticos)
CREATE POLICY "Permitir lectura pública de predicciones agroclimáticas"
    ON public.predicciones_agroclimaticas
    FOR SELECT
    USING (true);

-- Política de escritura restringida (servicio / rol autenticado)
CREATE POLICY "Permitir inserción y actualización a servicio autorizado"
    ON public.predicciones_agroclimaticas
    FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Comentarios explicativos
COMMENT ON TABLE public.predicciones_agroclimaticas IS 'Historial y persistencia de pronósticos agroclimáticos generados por el motor estadístico con intervalos de predicción al 80% y 95%, trazabilidad de features y evaluación de Gemini.';
