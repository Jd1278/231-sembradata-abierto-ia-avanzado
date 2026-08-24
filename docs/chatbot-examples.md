# Ejemplos de Uso y Trazabilidad del Chatbot Agroclimático

Ejemplos reales de consultas, resolución determinista de contexto, respuestas estructuradas y acordeón de afirmaciones verificadas.

---

## Ejemplo 1: Recomendación de Cultivo en Municipio de Santander

### Consulta del Usuario

> _"¿Qué cultivo me conviene sembrar en San Gil?"_

### Proceso Interno

1. **Detección Territorial:** Municipio `san_gil` identificado en el catálogo de 87 municipios de Santander (Altitud: 1160 msnm, Zona Subandina).
2. **Extracción Determinista:**
   - Observaciones históricas de EVA: Café ($1.25\text{ Ton/Ha}$), Cacao ($0.85\text{ Ton/Ha}$).
   - Pronósticos Theil-Sen con intervalos $L_{80}/U_{80}/L_{95}/U_{95}$.
   - Clima Open-Meteo actual y suelo SoilGrids (pH 6.2).
3. **Inferencia Groq (`openai/gpt-oss-20b`):** Generación de JSON estructurado.

### Respuesta del Asistente

> **Respuesta:** En San Gil (1160 msnm), el cultivo de **café** presenta una viabilidad agroclimática favorable gracias a temperaturas medias de 21°C y pH de 6.2, alineadas con los requerimientos óptimos de Cenicafé. El **cacao** es igualmente viable en cotas medias.
>
> **Afirmaciones Verificadas (Claims):**
>
> - `[Observado]` Altitud oficial de San Gil: **1160 msnm** (Fuente: Catálogo Oficial Santander, Confianza: 95%).
> - `[Modelo]` Pronóstico de rendimiento para Café: **1.28 Ton/Ha** (Intervalo 80%: 1.15 - 1.40 Ton/Ha, Fuente: Modelo Theil-Sen SembraData).
> - `[Agronómico]` pH óptimo para Café: **5.5 - 6.5** (Fuente: Cenicafé).

---

## Ejemplo 2: Consulta Fuera de Santander (Control Geográfico)

### Consulta del Usuario

> _"¿Cómo sembrar cacao en Medellín?"_

### Proceso Interno

1. **Detección Territorial:** `Medellín` no pertenece a los 87 municipios de Santander.
2. **Rechazo Seguro:** No se generan cálculos fuera de ámbito ni inferencias inventadas.

### Respuesta del Asistente

> **Respuesta:** SembraData está especializado exclusivamente en los 87 municipios del departamento de **Santander, Colombia**. No disponemos de datos agroclimáticos validados para Medellín (Antioquia). Por favor selecciona un municipio de Santander como San Vicente de Chucurí, Rionegro, Landázuri o El Playón para consultar viabilidad de cacao.
>
> **Metadatos:** `insufficientData: true`, `needsHumanReview: false`.
