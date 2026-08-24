# Evaluación de Impacto Público

## Impacto Social

- **Beneficiarios directos:** ~450,000 agricultores pequeños y medianos en los 87 municipios de Santander
- **Beneficiarios indirectos:** Cadenas productivas de cacao, café y granadilla (~2,000,000 personas)
- **Reducción de pérdidas:** Estimación de reducción del 15-20% en pérdidas por eventos climáticos
- **Cobertura geográfica:** 87 municipios (33,828 km²)

## Impacto Económico

- Aumento proyectado del ingreso agrícola en 12% para los primeros 3 años
- Optimización del uso de insumos agrícolas basada en pronósticos precisos
- Fortalecimiento de la competitividad del cacao, café y granadilla colombianos
- Acceso a datos de mercados internacionales (Commodity Forecast)

## Impacto Ambiental

- Monitoreo de índices agroclimáticos (GDD, aridez, estrés hídrico) desde NASA POWER
- Alertas tempranas de sequía y heladas basadas en Open-Meteo y NASA POWER
- Pronósticos climáticos a 7 días para planificación agrícola (Open-Meteo)
- Datos de humedad del suelo para riego eficiente (SoilGrids, 6 profundidades)

## Consideraciones Éticas

- **Sesgo algorítmico:** Se implementan pruebas de equidad territorial (bias_tests/) para evitar discriminación de municipios pequeños
- **Privacidad:** No se recopilan datos personales de agricultores individuales
- **Transparencia:** Los modelos incluyen métricas de confianza e intervalos estadísticos reproducibles ($L_{80}, U_{80}, L_{95}, U_{95}$).
- **Accesibilidad:** La plataforma cumple WCAG 2.1 (focus trap, keyboard nav, aria-live).
- **Conectividad y Veracidad:** Exige conexión en tiempo real para evitar mostrar datos obsoletos como actuales.
- **Multi-idioma:** Soporte Español/Inglés para diversidad cultural.

## Mitigación de Riesgos

| Riesgo                                   | Probabilidad | Impacto | Mitigación                                                                                 |
| ---------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------ |
| Sesgo territorial                        | Media        | Alto    | Pruebas de equidad territorial automatizadas en los 87 municipios.                         |
| Muestra histórica insuficiente ($N < 3$) | Alta         | Alto    | Política de 0 datos sintéticos; declaración formal de `insufficient_data`.                 |
| Dependencia de fuentes externas          | Media        | Medio   | Múltiples fuentes meteorológicas (Open-Meteo, IDEAM, NASA POWER) + Caché server-side.      |
| Alucinaciones en IA                      | Media        | Alto    | Chatbot Groq con validación Zod, RAG con umbral $\ge 3.0$ y cotejo determinista de claims. |
| Eventos extremos                         | Media        | Alto    | Alertas agroclimáticas tempranas y evaluación cualitativa con Gemini 2.0 Flash.            |
