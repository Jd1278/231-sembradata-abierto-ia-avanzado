-- ============================================================
-- SEMBRADATA: MIGRACIÓN 009 — ENDURECIMIENTO DE SEGURIDAD RLS
-- Archivo: supabase/migrations/009_security_and_rls_hardening.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENDURECIMIENTO DE chat_conversations
-- ------------------------------------------------------------
-- Revocar políticas permisivas para evitar que anon lea o escriba conversaciones ajenas
DROP POLICY IF EXISTS "Allow anon read/write chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Permitir lectura y escritura de conversaciones" ON public.chat_conversations;

-- Habilitar RLS estricto
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Política: Solo service_role (usado por Edge Functions) puede gestionar el historial
CREATE POLICY "Permitir gestion de chat exclusivamente a service_role"
  ON public.chat_conversations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 2. ENDURECIMIENTO DE predicciones_agroclimaticas
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir inserción y actualización a servicio autorizado" ON public.predicciones_agroclimaticas;
DROP POLICY IF EXISTS "Permitir lectura pública de predicciones agroclimáticas" ON public.predicciones_agroclimaticas;

ALTER TABLE public.predicciones_agroclimaticas ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier usuario (anon / authenticated)
CREATE POLICY "Permitir lectura publica de predicciones agroclimaticas"
  ON public.predicciones_agroclimaticas
  FOR SELECT
  USING (true);

-- Escritura restringida estrictamente a service_role
CREATE POLICY "Permitir escritura de predicciones exclusivamente a service_role"
  ON public.predicciones_agroclimaticas
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 3. ENDURECIMIENTO DE data_quality_quarantine
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Restringir cuarentena a service_role" ON public.data_quality_quarantine;
DROP POLICY IF EXISTS "Allow anon read data_quality_quarantine" ON public.data_quality_quarantine;

ALTER TABLE public.data_quality_quarantine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restringir acceso de cuarentena exclusivamente a service_role"
  ON public.data_quality_quarantine
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 4. SEGURIDAD EN FUNCIONES SECURITY DEFINER
-- ------------------------------------------------------------
-- Fijar search_path seguro para prevenir ataques de secuestro de esquema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'clean_system_cache_and_audit'
  ) THEN
    ALTER FUNCTION public.clean_system_cache_and_audit() SET search_path = public, pg_temp;
  END IF;
END $$;
