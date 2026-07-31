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
- **Transparencia:** Los modelos incluyen métricas de confianza y explicabilidad
- **Accesibilidad:** La plataforma cumple WCAG 2.1 (focus trap, keyboard nav, aria-live)
- **Offline-first:** IndexedDB permite uso sin conexión (30 días de datos offline)
- **Multi-idioma:** Soporte Español/Inglés para diversidad cultural

## Mitigación de Riesgos

| Riesgo                          | Probabilidad | Impacto | Mitigación                                           |
| ------------------------------- | ------------ | ------- | ---------------------------------------------------- |
| Sesgo territorial               | Media        | Alto    | Pruebas de equidad automatizadas                     |
| Datos incompletos               | Alta         | Medio   | 5 APIs externas + cache con TTL + interpolación temporal |
| Dependencia de fuentes externas | Media        | Alto    | Múltiples fuentes + cache con TTL + fallback offline |
| Baja adopción                   | Media        | Medio   | Interfaz intuitiva, PWA, capacitación                |
| Limitaciones de API             | Baja         | Medio   | Rate limiting + exponential backoff + cache          |
| Eventos extremos                | Media        | Alto    | Alertas tempranas (Open-Meteo, NASA POWER)           |
