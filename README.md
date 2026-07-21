<div align="center">

# 🌾 SembraData: Predicción Agroclimática para Santander 📊

> **SembraData** es una plataforma web interactiva y de analítica predictiva diseñada para mitigar los riesgos climáticos y optimizar los rendimientos agrícolas en el departamento de **Santander, Colombia**. Enfocándose inicialmente en tres cultivos clave de la región — **Cacao, Café y Granadilla** — el sistema procesa datos históricos agroclimáticos mediante modelos de _Machine Learning_ y los expone a través de una interfaz geográfica interactiva y moderna.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## 🌐 Despliegue de la Aplicación

> [!IMPORTANT]
> La versión más reciente de la plataforma se encuentra desplegada y disponible para producción.

<div align="center">

### 🚀 &nbsp; [**➡️ &nbsp; Abrir SembraData en Vercel &nbsp; ⬅️**](https://231-sembradata-abierto-ia-avanzado.vercel.app) &nbsp; 🚀

**`https://231-sembradata-abierto-ia-avanzado.vercel.app`**
>[PRESENTACIÓN DEL PROYECTO]
>A continuación encontrará una presentación ejecutiva sobre el proyecto sembradata
###  &nbsp; [**➡️ &nbsp; Abrir presentación sembradata &nbsp; ⬅️**](https://gamma.app/docs/Prediccion-Agroclimatica-para-Santander-1m0u0el9tewy1ul) &nbsp; 
</div>

---

## ✨ Características Clave

| | Característica | Descripción |
|:---:|:---|:---|
| 🗺️ | **Mapa Interactivo de Santander** | Visualización coroplética georreferenciada de los **87 municipios**, pintando los niveles de riesgo agroclimático calculados por zona en tiempo real. |
| 🤖 | **Modelado Predictivo Avanzado** | Clasificación de riesgos climáticos (**Random Forest** y **XGBoost**) y proyecciones de tendencias de rendimiento agrícola temporal (redes neuronales **LSTM**). |
| 🌱 | **Filtros Dinámicos por Cultivo** | Alternancia instantánea entre análisis específicos para **Cacao, Café y Granadilla**. |
| 💬 | **Asistente Virtual (Chatbot)** | Asistente integrado para consultas conversacionales rápidas sobre alertas o recomendaciones de siembra por municipio. |
| 📈 | **Panel de KPIs Limpio y Moderno** | Métricas clave al descubierto: Ton/Ha estimadas, alertas de plagas y variaciones de precipitación/temperatura. |

---

## 🛠️ Stack Tecnológico

> El proyecto adopta una **arquitectura desacoplada (API-First)** para separar eficientemente la carga de procesamiento de _Machine Learning_ de la experiencia de usuario en el cliente.

### 🎨 Frontend — Interfaz de Usuario

| Componente | Tecnología | Rol / Función |
|:---|:---|:---|
| **Framework** | Next.js 15 (App Router) + React 19 | Renderizado, enrutamiento y base de la SPA |
| **Estilos y Componentes** | Tailwind CSS + `shadcn/ui` | Sistema de diseño y componentes accesibles |
| **Gráficos Estadísticos** | Recharts / Plotly.js | Visualización de series y KPIs |
| **Visualización de Mapas** | React-Leaflet (Leaflet.js + GeoJSON) | Mapa coroplético georreferenciado |
| **Prototipado UI** | Lovable.dev | Diseño inicial de la interfaz |

### 🧠 Backend & Ciencia de Datos — Core Inteligente

| Componente | Tecnología | Rol / Función |
|:---|:---|:---|
| **Lenguaje Base** | Python 3.11+ | Lógica de procesamiento y modelado |
| **Framework de API** | FastAPI | Exposición de endpoints predictivos |
| **Procesamiento y Geo** | Pandas, NumPy, GeoPandas | Limpieza, transformación y georreferenciación |
| **Entrenamiento de Modelos** | Scikit-learn, XGBoost, TensorFlow/Keras | Clasificación de riesgo y modelos LSTM |

---

## 💾 Fuentes de Datos Utilizadas

> El sistema unifica datos históricos regionales y nacionales provenientes de entidades oficiales de Colombia.

<details>
<summary><b>📂 Ver fuentes oficiales analizadas</b></summary>

<br/>

| # | Fuente | Datos Aportados |
|:---:|:---|:---|
| 1️⃣ | **IDEAM** | Series climáticas históricas regionales (Precipitación, Temperatura, Humedad). |
| 2️⃣ | **UPRA** | Evaluaciones Agropecuarias Municipales (EVA) históricas del departamento de Santander. |
| 3️⃣ | **AGRONET & Datos.gov.co** | Microdatos de producción, áreas sembradas y cosechadas por municipio. |

</details>

---

<div align="center">

## 📄 Licencia

Distribuido bajo la **Licencia MIT**. 

<br/>

**Hecho con 🌱 para el agro de Santander, Colombia**

</div>
