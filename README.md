# SembraData: Predicción Agroclimática para Santander 🌾📊

SembraData es una plataforma web interactiva y de analítica predictiva diseñada para mitigar los riesgos climáticos y optimizar los rendimientos agrícolas en el departamento de Santander, Colombia. Enfocándose inicialmente en tres cultivos clave de la región (**Cacao, Café y Granadilla**), el sistema procesa datos históricos agroclimáticos mediante modelos de Machine Learning y los expone a través de una interfaz geográfica interactiva y moderna.

---

## 🚀 Características Clave

* **Mapa Interactivo de Santander (Estilo Coroplético):** Visualización georreferenciada de los 87 municipios de Santander, pintando los niveles de riesgo agroclimático calculados por zona en tiempo real.
* **Modelado Predictivo Avanzado:** Clasificación de riesgos climáticos (con Random Forest y XGBoost) y proyecciones de tendencias de rendimiento agrícola temporal (mediante redes neuronales LSTM).
* **Filtros Dinámicos por Cultivo:** Alternancia instantánea entre análisis específicos para Cacao, Café y Granadilla.
* **Asistente Virtual (Chatbot):** Un asistente integrado para que los productores realicen consultas conversacionales rápidas sobre alertas o recomendaciones de siembra por municipio.
* **Panel de KPIs Limpio y Moderno:** Métricas clave al descubierto como Ton/Ha estimadas, alertas de plagas y variaciones de precipitación/temperatura.

---

## 🛠️ Stack Tecnológico

El proyecto adopta una **arquitectura desacoplada (API-First)** para separar eficientemente la carga de procesamiento de Machine Learning de la experiencia de usuario en el cliente.

### Frontend (Interfaz de Usuario)
* **Framework:** Next.js 15 (App Router) + React 19
* **Estilos y Componentes:** Tailwind CSS + `shadcn/ui`
* **Gráficos Estadísticos:** Recharts / Plotly.js
* **Visualización de Mapas:** React-Leaflet (basado en Leaflet.js con capas GeoJSON)
* **Prototipado UI:** Diseñado inicialmente usando Lovable.dev

### Backend & Ciencia de Datos (Core Inteligente)
* **Lenguaje Base:** Python 3.11+
* **Framework de API:** FastAPI
* **Procesamiento de Datos y Georreferenciación:** Pandas, NumPy, GeoPandas
* **Entrenamiento de Modelos:** Scikit-learn, XGBoost, TensorFlow/Keras (para LSTM)

---

## 💾 Fuentes de Datos Utilizadas

El sistema unifica datos históricos regionales y nacionales provenientes de entidades oficiales de Colombia:
1.  **IDEAM:** Series climáticas históricas regionales (Precipitación, Temperatura, Humedad).
2.  **UPRA:** Evaluaciones Agropecuarias Municipales (EVA) históricas del departamento de Santander.
3.  **AGRONET & Datos.gov.co:** Microdatos de producción, áreas sembradas y cosechadas por municipio.

---
