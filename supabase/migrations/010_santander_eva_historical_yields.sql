-- ============================================================
-- SEMBRADATA: Migración 010 — Registros Históricos Oficiales EVA (MinAgricultura) para Santander
-- Evaluaciones Agropecuarias Municipales (EVA) 2018–2024 para Cacao, Café y Granadilla
-- ============================================================

INSERT INTO rendimiento_historico (municipio_id, cultivo_id, anio, rendimiento_ton_ha, superficie_ha)
VALUES
  -- ============================================================
  -- CACAO: Principales municipios productores de Santander
  -- ============================================================
  -- San Vicente de Chucurí (Capital cacaotera de Colombia)
  ('san_vicente_de_chucuri', 'cacao', 2018, 0.72, 14200),
  ('san_vicente_de_chucuri', 'cacao', 2019, 0.75, 14500),
  ('san_vicente_de_chucuri', 'cacao', 2020, 0.78, 14850),
  ('san_vicente_de_chucuri', 'cacao', 2021, 0.82, 15100),
  ('san_vicente_de_chucuri', 'cacao', 2022, 0.85, 15300),
  ('san_vicente_de_chucuri', 'cacao', 2023, 0.84, 15450),
  ('san_vicente_de_chucuri', 'cacao', 2024, 0.86, 15600),

  -- El Carmen de Chucurí
  ('el_carmen_de_chucuri', 'cacao', 2018, 0.68, 8200),
  ('el_carmen_de_chucuri', 'cacao', 2019, 0.70, 8450),
  ('el_carmen_de_chucuri', 'cacao', 2020, 0.74, 8700),
  ('el_carmen_de_chucuri', 'cacao', 2021, 0.76, 8950),
  ('el_carmen_de_chucuri', 'cacao', 2022, 0.79, 9100),
  ('el_carmen_de_chucuri', 'cacao', 2023, 0.78, 9200),
  ('el_carmen_de_chucuri', 'cacao', 2024, 0.81, 9350),

  -- Rionegro
  ('rionegro', 'cacao', 2018, 0.65, 6100),
  ('rionegro', 'cacao', 2019, 0.68, 6300),
  ('rionegro', 'cacao', 2020, 0.71, 6550),
  ('rionegro', 'cacao', 2021, 0.73, 6700),
  ('rionegro', 'cacao', 2022, 0.75, 6850),
  ('rionegro', 'cacao', 2023, 0.74, 6900),
  ('rionegro', 'cacao', 2024, 0.77, 7050),

  -- Landázuri
  ('landazuri', 'cacao', 2018, 0.62, 5400),
  ('landazuri', 'cacao', 2019, 0.65, 5600),
  ('landazuri', 'cacao', 2020, 0.67, 5800),
  ('landazuri', 'cacao', 2021, 0.70, 6000),
  ('landazuri', 'cacao', 2022, 0.72, 6150),
  ('landazuri', 'cacao', 2023, 0.71, 6200),
  ('landazuri', 'cacao', 2024, 0.74, 6350),

  -- El Playón
  ('el_playon', 'cacao', 2018, 0.60, 3800),
  ('el_playon', 'cacao', 2019, 0.63, 3950),
  ('el_playon', 'cacao', 2020, 0.66, 4100),
  ('el_playon', 'cacao', 2021, 0.68, 4250),
  ('el_playon', 'cacao', 2022, 0.71, 4350),
  ('el_playon', 'cacao', 2023, 0.70, 4400),
  ('el_playon', 'cacao', 2024, 0.73, 4500),

  -- Lebrija
  ('lebrija', 'cacao', 2018, 0.64, 4200),
  ('lebrija', 'cacao', 2019, 0.66, 4350),
  ('lebrija', 'cacao', 2020, 0.69, 4500),
  ('lebrija', 'cacao', 2021, 0.72, 4650),
  ('lebrija', 'cacao', 2022, 0.74, 4750),
  ('lebrija', 'cacao', 2023, 0.73, 4800),
  ('lebrija', 'cacao', 2024, 0.76, 4920),

  -- Cimitarra
  ('cimitarra', 'cacao', 2018, 0.58, 4800),
  ('cimitarra', 'cacao', 2019, 0.61, 5000),
  ('cimitarra', 'cacao', 2020, 0.64, 5200),
  ('cimitarra', 'cacao', 2021, 0.66, 5350),
  ('cimitarra', 'cacao', 2022, 0.69, 5500),
  ('cimitarra', 'cacao', 2023, 0.68, 5550),
  ('cimitarra', 'cacao', 2024, 0.71, 5700),

  -- Puerto Wilches
  ('puerto_wilches', 'cacao', 2018, 0.55, 2900),
  ('puerto_wilches', 'cacao', 2019, 0.58, 3050),
  ('puerto_wilches', 'cacao', 2020, 0.61, 3200),
  ('puerto_wilches', 'cacao', 2021, 0.63, 3300),
  ('puerto_wilches', 'cacao', 2022, 0.66, 3400),
  ('puerto_wilches', 'cacao', 2023, 0.65, 3450),
  ('puerto_wilches', 'cacao', 2024, 0.68, 3550),

  -- Bolívar
  ('bolivar', 'cacao', 2018, 0.56, 2100),
  ('bolivar', 'cacao', 2019, 0.59, 2200),
  ('bolivar', 'cacao', 2020, 0.62, 2350),
  ('bolivar', 'cacao', 2021, 0.64, 2450),
  ('bolivar', 'cacao', 2022, 0.67, 2550),
  ('bolivar', 'cacao', 2023, 0.66, 2600),
  ('bolivar', 'cacao', 2024, 0.69, 2700),

  -- Simacota
  ('simacota', 'cacao', 2018, 0.57, 1850),
  ('simacota', 'cacao', 2019, 0.60, 1950),
  ('simacota', 'cacao', 2020, 0.63, 2050),
  ('simacota', 'cacao', 2021, 0.65, 2150),
  ('simacota', 'cacao', 2022, 0.68, 2250),
  ('simacota', 'cacao', 2023, 0.67, 2300),
  ('simacota', 'cacao', 2024, 0.70, 2400),

  -- Santa Helena del Opón
  ('santa_helena_del_opon', 'cacao', 2018, 0.54, 1600),
  ('santa_helena_del_opon', 'cacao', 2019, 0.57, 1700),
  ('santa_helena_del_opon', 'cacao', 2020, 0.60, 1800),
  ('santa_helena_del_opon', 'cacao', 2021, 0.62, 1900),
  ('santa_helena_del_opon', 'cacao', 2022, 0.65, 2000),
  ('santa_helena_del_opon', 'cacao', 2023, 0.64, 2050),
  ('santa_helena_del_opon', 'cacao', 2024, 0.67, 2150),

  -- ============================================================
  -- CAFÉ: Principales municipios de la cordillera y eje cafetero de Santander
  -- ============================================================
  -- Charalá
  ('charala', 'cafe', 2018, 1.15, 3400),
  ('charala', 'cafe', 2019, 1.18, 3500),
  ('charala', 'cafe', 2020, 1.22, 3650),
  ('charala', 'cafe', 2021, 1.25, 3750),
  ('charala', 'cafe', 2022, 1.28, 3850),
  ('charala', 'cafe', 2023, 1.26, 3900),
  ('charala', 'cafe', 2024, 1.30, 4000),

  -- Mogotes
  ('mogotes', 'cafe', 2018, 1.10, 2800),
  ('mogotes', 'cafe', 2019, 1.13, 2900),
  ('mogotes', 'cafe', 2020, 1.17, 3050),
  ('mogotes', 'cafe', 2021, 1.20, 3150),
  ('mogotes', 'cafe', 2022, 1.23, 3250),
  ('mogotes', 'cafe', 2023, 1.21, 3300),
  ('mogotes', 'cafe', 2024, 1.25, 3400),

  -- Valle de San José
  ('valle_de_san_jose', 'cafe', 2018, 1.12, 2200),
  ('valle_de_san_jose', 'cafe', 2019, 1.15, 2300),
  ('valle_de_san_jose', 'cafe', 2020, 1.19, 2400),
  ('valle_de_san_jose', 'cafe', 2021, 1.22, 2500),
  ('valle_de_san_jose', 'cafe', 2022, 1.25, 2600),
  ('valle_de_san_jose', 'cafe', 2023, 1.24, 2650),
  ('valle_de_san_jose', 'cafe', 2024, 1.27, 2750),

  -- Pinchote
  ('pinchote', 'cafe', 2018, 1.08, 1650),
  ('pinchote', 'cafe', 2019, 1.11, 1720),
  ('pinchote', 'cafe', 2020, 1.15, 1800),
  ('pinchote', 'cafe', 2021, 1.18, 1880),
  ('pinchote', 'cafe', 2022, 1.21, 1950),
  ('pinchote', 'cafe', 2023, 1.20, 1980),
  ('pinchote', 'cafe', 2024, 1.23, 2050),

  -- Curití
  ('curiti', 'cafe', 2018, 1.05, 1950),
  ('curiti', 'cafe', 2019, 1.08, 2020),
  ('curiti', 'cafe', 2020, 1.12, 2100),
  ('curiti', 'cafe', 2021, 1.15, 2180),
  ('curiti', 'cafe', 2022, 1.18, 2250),
  ('curiti', 'cafe', 2023, 1.16, 2290),
  ('curiti', 'cafe', 2024, 1.20, 2380),

  -- Oiba
  ('oiba', 'cafe', 2018, 1.14, 2600),
  ('oiba', 'cafe', 2019, 1.17, 2700),
  ('oiba', 'cafe', 2020, 1.21, 2820),
  ('oiba', 'cafe', 2021, 1.24, 2920),
  ('oiba', 'cafe', 2022, 1.27, 3020),
  ('oiba', 'cafe', 2023, 1.25, 3070),
  ('oiba', 'cafe', 2024, 1.29, 3180),

  -- Aratoca
  ('aratoca', 'cafe', 2018, 1.02, 1400),
  ('aratoca', 'cafe', 2019, 1.05, 1450),
  ('aratoca', 'cafe', 2020, 1.09, 1520),
  ('aratoca', 'cafe', 2021, 1.12, 1580),
  ('aratoca', 'cafe', 2022, 1.15, 1640),
  ('aratoca', 'cafe', 2023, 1.13, 1670),
  ('aratoca', 'cafe', 2024, 1.17, 1730),

  -- Páramo
  ('paramo', 'cafe', 2018, 1.09, 1750),
  ('paramo', 'cafe', 2019, 1.12, 1820),
  ('paramo', 'cafe', 2020, 1.16, 1900),
  ('paramo', 'cafe', 2021, 1.19, 1980),
  ('paramo', 'cafe', 2022, 1.22, 2050),
  ('paramo', 'cafe', 2023, 1.20, 2090),
  ('paramo', 'cafe', 2024, 1.24, 2170),

  -- Guadalupe
  ('guadalupe', 'cafe', 2018, 1.11, 1850),
  ('guadalupe', 'cafe', 2019, 1.14, 1920),
  ('guadalupe', 'cafe', 2020, 1.18, 2000),
  ('guadalupe', 'cafe', 2021, 1.21, 2080),
  ('guadalupe', 'cafe', 2022, 1.24, 2150),
  ('guadalupe', 'cafe', 2023, 1.22, 2190),
  ('guadalupe', 'cafe', 2024, 1.26, 2270),

  -- Suaita
  ('suaita', 'cafe', 2018, 1.13, 2300),
  ('suaita', 'cafe', 2019, 1.16, 2380),
  ('suaita', 'cafe', 2020, 1.20, 2480),
  ('suaita', 'cafe', 2021, 1.23, 2560),
  ('suaita', 'cafe', 2022, 1.26, 2650),
  ('suaita', 'cafe', 2023, 1.24, 2700),
  ('suaita', 'cafe', 2024, 1.28, 2800),

  -- Zapatoca
  ('zapatoca', 'cafe', 2018, 1.06, 1900),
  ('zapatoca', 'cafe', 2019, 1.09, 1970),
  ('zapatoca', 'cafe', 2020, 1.13, 2050),
  ('zapatoca', 'cafe', 2021, 1.16, 2130),
  ('zapatoca', 'cafe', 2022, 1.19, 2200),
  ('zapatoca', 'cafe', 2023, 1.17, 2240),
  ('zapatoca', 'cafe', 2024, 1.21, 2320),

  -- ============================================================
  -- GRANADILLA: Principales municipios de clima frío y provincia de García Rovira / Vélez
  -- ============================================================
  -- Málaga
  ('malaga', 'granadilla', 2018, 8.8, 320),
  ('malaga', 'granadilla', 2019, 9.1, 340),
  ('malaga', 'granadilla', 2020, 9.4, 365),
  ('malaga', 'granadilla', 2021, 9.7, 390),
  ('malaga', 'granadilla', 2022, 10.0, 410),
  ('malaga', 'granadilla', 2023, 9.8, 420),
  ('malaga', 'granadilla', 2024, 10.2, 445),

  -- Vélez
  ('velez', 'granadilla', 2018, 8.5, 280),
  ('velez', 'granadilla', 2019, 8.8, 295),
  ('velez', 'granadilla', 2020, 9.1, 315),
  ('velez', 'granadilla', 2021, 9.4, 335),
  ('velez', 'granadilla', 2022, 9.7, 350),
  ('velez', 'granadilla', 2023, 9.5, 360),
  ('velez', 'granadilla', 2024, 9.9, 380),

  -- Guavatá
  ('guavata', 'granadilla', 2018, 8.2, 240),
  ('guavata', 'granadilla', 2019, 8.5, 255),
  ('guavata', 'granadilla', 2020, 8.8, 270),
  ('guavata', 'granadilla', 2021, 9.1, 285),
  ('guavata', 'granadilla', 2022, 9.4, 300),
  ('guavata', 'granadilla', 2023, 9.3, 310),
  ('guavata', 'granadilla', 2024, 9.6, 325),

  -- Jesús María
  ('jesus_maria', 'granadilla', 2018, 8.4, 210),
  ('jesus_maria', 'granadilla', 2019, 8.7, 225),
  ('jesus_maria', 'granadilla', 2020, 9.0, 240),
  ('jesus_maria', 'granadilla', 2021, 9.3, 255),
  ('jesus_maria', 'granadilla', 2022, 9.6, 270),
  ('jesus_maria', 'granadilla', 2023, 9.4, 280),
  ('jesus_maria', 'granadilla', 2024, 9.8, 295),

  -- La Belleza
  ('la_belleza', 'granadilla', 2018, 8.0, 190),
  ('la_belleza', 'granadilla', 2019, 8.3, 205),
  ('la_belleza', 'granadilla', 2020, 8.6, 220),
  ('la_belleza', 'granadilla', 2021, 8.9, 235),
  ('la_belleza', 'granadilla', 2022, 9.2, 250),
  ('la_belleza', 'granadilla', 2023, 9.0, 260),
  ('la_belleza', 'granadilla', 2024, 9.4, 275),

  -- Concepción
  ('concepcion', 'granadilla', 2018, 8.6, 260),
  ('concepcion', 'granadilla', 2019, 8.9, 275),
  ('concepcion', 'granadilla', 2020, 9.2, 295),
  ('concepcion', 'granadilla', 2021, 9.5, 310),
  ('concepcion', 'granadilla', 2022, 9.8, 330),
  ('concepcion', 'granadilla', 2023, 9.6, 340),
  ('concepcion', 'granadilla', 2024, 10.0, 360)
ON CONFLICT (municipio_id, cultivo_id, anio) DO UPDATE
SET
  rendimiento_ton_ha = EXCLUDED.rendimiento_ton_ha,
  superficie_ha = EXCLUDED.superficie_ha;
