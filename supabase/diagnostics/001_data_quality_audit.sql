-- ============================================================
-- SEMBRADATA: CONSULTAS DE AUDITORÍA Y DIAGNÓSTICO DE CALIDAD DE DATOS (SOLO LECTURA)
-- Archivo: supabase/diagnostics/001_data_quality_audit.sql
-- Ejecutar en Supabase SQL Editor para inspeccionar el estado de la base de datos
-- ============================================================

-- ------------------------------------------------------------
-- 1. REGISTROS EXPIRADOS EN CACHÉS TRANSITORIOS
-- ------------------------------------------------------------

-- 1.1 IDEAM Cache: Registros con más de 48 horas de antigüedad
SELECT 
  'ideam_cache' AS tabla,
  'expired_cache' AS categoria,
  COUNT(*) AS cantidad_expirados,
  MIN(fetched_at) AS mas_antiguo,
  MAX(fetched_at) AS mas_reciente
FROM ideam_cache
WHERE fetched_at < NOW() - INTERVAL '48 hours';

-- 1.2 NASA POWER Cache: Registros con más de 14 días
SELECT 
  'nasa_power_cache' AS tabla,
  'expired_cache' AS categoria,
  COUNT(*) AS cantidad_expirados,
  MIN(fetched_at) AS mas_antiguo,
  MAX(fetched_at) AS mas_reciente
FROM nasa_power_cache
WHERE fetched_at < NOW() - INTERVAL '14 days';

-- 1.3 Commodity Cache: Registros con más de 6 horas
SELECT 
  'commodity_cache' AS tabla,
  'expired_cache' AS categoria,
  COUNT(*) AS cantidad_expirados,
  MIN(fetched_at) AS mas_antiguo,
  MAX(fetched_at) AS mas_reciente
FROM commodity_cache
WHERE fetched_at < NOW() - INTERVAL '6 hours';

-- 1.4 Recommendations Cache: Recomendaciones con expires_at superado
SELECT 
  'recommendations_cache' AS tabla,
  'expired_cache' AS categoria,
  COUNT(*) AS cantidad_expirados,
  MIN(expires_at) AS mas_antiguo,
  MAX(expires_at) AS mas_reciente
FROM recommendations_cache
WHERE expires_at < NOW();


-- ------------------------------------------------------------
-- 2. REGISTROS DUPLICADOS POR CLAVE LÓGICA NATURAL
-- ------------------------------------------------------------

-- 2.1 IDEAM: Duplicados por (estacion_id, fecha)
SELECT 
  'ideam_cache' AS tabla,
  estacion_id,
  fecha,
  COUNT(*) AS ocurrencias
FROM ideam_cache
GROUP BY estacion_id, fecha
HAVING COUNT(*) > 1;

-- 2.2 NASA POWER: Duplicados por coordenadas redondeadas a 2 decimales y fecha
SELECT 
  'nasa_power_cache' AS tabla,
  ROUND(lat, 2) AS lat_round,
  ROUND(lng, 2) AS lng_round,
  fecha,
  COUNT(*) AS ocurrencias
FROM nasa_power_cache
GROUP BY ROUND(lat, 2), ROUND(lng, 2), fecha
HAVING COUNT(*) > 1;

-- 2.3 Recommendations: Duplicados por municipio, cultivo y score_range
SELECT 
  'recommendations_cache' AS tabla,
  municipio,
  cultivo,
  score_range,
  COUNT(*) AS ocurrencias
FROM recommendations_cache
GROUP BY municipio, cultivo, score_range
HAVING COUNT(*) > 1;

-- 2.4 Commodity Prices: Duplicados por símbolo y timestamp de fuente
SELECT 
  'commodity_prices' AS tabla,
  symbol,
  source_timestamp,
  COUNT(*) AS ocurrencias
FROM commodity_prices
WHERE source_timestamp IS NOT NULL
GROUP BY symbol, source_timestamp
HAVING COUNT(*) > 1;


-- ------------------------------------------------------------
-- 3. REGISTROS FÍSICAMENTE INCONSISTENTES O IMPOSIBLES
-- ------------------------------------------------------------

-- 3.1 IDEAM: Temperaturas fuera de [-10°C, 55°C], precipitación negativa o humedad fuera de [0, 100]
SELECT 
  'ideam_cache' AS tabla,
  'invalid_physics' AS tipo_anomalia,
  id,
  estacion_id,
  fecha,
  temperatura,
  precipitacion,
  humedad
FROM ideam_cache
WHERE 
  (temperatura IS NOT NULL AND (temperatura < -10 OR temperatura > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100));

-- 3.2 NASA POWER: Temperaturas fuera de [-10°C, 55°C], precipitación < 0, humedad fuera de [0, 100] o coordenadas fuera de Colombia
SELECT 
  'nasa_power_cache' AS tabla,
  'invalid_physics_or_coords' AS tipo_anomalia,
  id,
  lat,
  lng,
  fecha,
  temp_avg,
  precipitacion,
  humedad
FROM nasa_power_cache
WHERE 
  (temp_avg IS NOT NULL AND (temp_avg < -10 OR temp_avg > 55))
  OR (precipitacion IS NOT NULL AND precipitacion < 0)
  OR (humedad IS NOT NULL AND (humedad < 0 OR humedad > 100))
  OR (lat < -4.5 OR lat > 13.5 OR lng < -82.0 OR lng > -66.0);

-- 3.3 Rendimiento Histórico (EVA / MinAgricultura): Rendimientos <= 0 o años futuros imposibles
SELECT 
  'rendimiento_historico' AS tabla,
  'invalid_historical_record' AS tipo_anomalia,
  id,
  municipio_id,
  cultivo_id,
  anio,
  rendimiento_ton_ha
FROM rendimiento_historico
WHERE 
  rendimiento_ton_ha <= 0 
  OR anio < 1980 
  OR anio > EXTRACT(YEAR FROM NOW());

-- 3.4 Predicciones Agroclimáticas: Inversión de intervalos o valores negativos
SELECT 
  'predicciones_agroclimaticas' AS tabla,
  'invalid_prediction_interval' AS tipo_anomalia,
  id,
  municipio_id,
  cultivo_id,
  anio_objetivo,
  rendimiento_estimado,
  limite_inferior_80,
  limite_superior_80,
  limite_inferior_95,
  limite_superior_95
FROM predicciones_agroclimaticas
WHERE 
  rendimiento_estimado < 0
  OR (limite_inferior_80 IS NOT NULL AND limite_inferior_80 > rendimiento_estimado)
  OR (limite_superior_80 IS NOT NULL AND rendimiento_estimado > limite_superior_80)
  OR (limite_inferior_95 IS NOT NULL AND limite_inferior_95 > limite_inferior_80)
  OR (limite_superior_95 IS NOT NULL AND limite_superior_80 > limite_superior_95);


-- ------------------------------------------------------------
-- 4. REGISTROS HUÉRFANOS O INCOMPLETOS EN ANÁLISIS DE USUARIO
-- ------------------------------------------------------------

-- 4.1 Historial de Análisis: Score fuera de rango [0, 100], municipio vacío o coordenadas fuera de límites
SELECT 
  'analysis_history' AS tabla,
  'incomplete_or_invalid_analysis' AS tipo_anomalia,
  id,
  municipio,
  cultivo,
  score,
  viable,
  created_at
FROM analysis_history
WHERE 
  municipio IS NULL 
  OR TRIM(municipio) = '' 
  OR cultivo IS NULL 
  OR TRIM(cultivo) = ''
  OR score < 0 
  OR score > 100
  OR lat < -4.5 
  OR lat > 13.5 
  OR lng < -82.0 
  OR lng > -66.0;

-- 4.2 Referencias Huérfanas de Municipio o Cultivo en predicciones
SELECT 
  'predicciones_agroclimaticas' AS tabla,
  'orphan_foreign_keys' AS tipo_anomalia,
  p.id,
  p.municipio_id,
  p.cultivo_id
FROM predicciones_agroclimaticas p
LEFT JOIN municipios m ON p.municipio_id = m.id
LEFT JOIN cultivos c ON p.cultivo_id = c.id
WHERE m.id IS NULL OR c.id IS NULL;
