# Guía de Validación y Reproducibilidad — SembraData

Esta guía permite a auditores, evaluadores técnicos y pares revisores validar los resultados, la metodología y los componentes de SembraData.

---

## 1. Validación de Datos e Integridad Histórica

### Verificación de Fuentes

- **Series Históricas:** Confirmar que los rendimientos históricos en `rendimiento_historico` corresponden a las Evaluaciones Agropecuarias Municipales (EVA / MinAgricultura).
- **Límites Territoriales:** Validar que el GeoJSON y catálogo municipal cubren exactamente los **87 municipios de Santander**.
- **Propiedades de Suelo:** Contrastar perfiles de suelo con SoilGrids ISRIC a 6 profundidades.
- **Meteorología:** Verificar que Open-Meteo e IDEAM suministran variables climáticas consistentes en tiempo real.
- **Aislamiento de Anomalías:** Comprobar que anomalías o valores físicos imposibles son aislados en `data_quality_quarantine`.

---

## 2. Validación de Modelos y Anti-Alucinación

### Criterios de Rendimiento y Cobertura

- **Estimador Theil-Sen:** Proyección de tendencia con pendientes medianas robustas frente a valores atípicos.
- **Intervalos de Predicción:** Validación matemática de límites $L_{80} \le \text{Pred} \le U_{80}$ y $L_{95} \le L_{80} \le U_{80} \le U_{95}$.
- **Insuficiencia de Muestra:** Si un cultivo en un municipio tiene menos de 3 años de datos observados ($N < 3$), el sistema debe retornar `insufficient_data` (**0 datos sintéticos**).
- **Chatbot Trazable:** Las respuestas deben estructurarse con Zod, rechazar consultas fuera de Santander y respaldar todas las afirmaciones numéricas con hechos observados o normativos.

---

## 3. Comandos de Reproducibilidad Técnica

```bash
# 1. Validación estricta de tipos TypeScript
npm run typecheck

# 2. Análisis estático de código y reglas de calidad
npm run lint

# 3. Ejecución de la suite completa de pruebas unitarias e integración (392 tests)
npm run test

# 4. Pipeline de validación integral y compilación de producción Nitro SSR
npm run validate
```

---

## 4. Lista de Verificación de Interfaz y Usabilidad

- [ ] El mapa coroplético renderiza los **87 municipios de Santander**.
- [ ] La selección de municipio y cultivo actualiza los paneles de clima, suelo y requerimientos.
- [ ] El gráfico **Histórico vs. Predicción** muestra la serie observada de EVA continuada por el pronóstico Theil-Sen con intervalos de confianza.
- [ ] La Edge Function `gemini-assessment` emite evaluación cualitativa de consistencia agronómica.
- [ ] El chatbot responde preguntas agronómicas con el modelo `openai/gpt-oss-20b` y muestra el acordeón de afirmaciones verificadas.
- [ ] El detector de conectividad en tiempo real informa el estado online/offline sin almacenar datos sustitutos locales.
- [ ] La navegación por teclado (flechas, Enter, Escape) y atributos de accesibilidad WCAG 2.1 están activos en el mapa y modales.
