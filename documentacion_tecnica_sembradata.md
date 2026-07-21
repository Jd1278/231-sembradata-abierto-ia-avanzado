# 📘 Documentación Técnica — SembraData
## Predicción Agroclimática para Santander, Colombia

---

**Versión:** 1.0  
**Fecha:** 13 de julio de 2026  
**ID-Equipo:** 231
**Equipo:** Equipo SembraData Unidades Tecnlógicas de Santander
**Integrantes:** Ing.Diego Cruz, Juan Paredes, Jerson Muñoz y Andrea Vargas 
**Repositorio:** https://github.com/Jd1278/231-sembradata-abierto-ia-avanzado  
**Despliegue:** https://231-sembradata-abierto-ia-avanzado.vercel.app

---

## 📑 Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Modelos de Machine Learning](#4-modelos-de-machine-learning)
5. [Estructura de Datos](#5-estructura-de-datos)
6. [API y Endpoints](#6-api-y-endpoints)
7. [Guía de Instalación y Despliegue](#7-guía-de-instalación-y-despliegue)
8. [Metodología CRISP-DM](#8-metodología-crisp-dm)
9. [Validación y Métricas](#9-validación-y-métricas)
10. [Impacto y Sostenibilidad](#10-impacto-y-sostenibilidad)
11. [Roadmap y Próximos Pasos](#11-roadmap-y-próximos-pasos)
12. [Referencias](#12-referencias)

---

## 1. Resumen Ejecutivo

**SembraData** es una plataforma web interactiva de analítica predictiva diseñada para mitigar riesgos climáticos y optimizar rendimientos agrícolas en el departamento de **Santander, Colombia**. El sistema procesa datos históricos agroclimáticos mediante modelos de Machine Learning y los expone a través de una interfaz geográfica interactiva.

### Alcance Inicial
- **Cultivos:** Cacao, Café, Granadilla
- **Cobertura:** 87 municipios de Santander
- **Periodo de datos:** 2015–2026
- **Beneficiarios estimados:** ~45,000 agricultores

### Objetivos Principales
1. Pronosticar rendimiento esperado de cultivos con base en datos climáticos históricos y proyectados.
2. Evaluar el nivel de riesgo agroclimático (sequía, heladas, plagas) por municipio y mes.
3. Facilitar la toma de decisiones informadas sobre ventanas óptimas de siembra.

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIO FINAL                                  │
│                    (Agricultor, Institución, Investigador)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND — Next.js 15                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Mapa Leaflet │  │ Dashboard    │  │ Chatbot UI   │  │ Panel de KPIs    │ │
│  │ (GeoJSON)    │  │ Recharts     │  │ (RAG)        │  │ (shadcn/ui)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                              Tailwind CSS + React 19                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    HTTP/REST (JSON)  │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND — FastAPI (Python)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Endpoints    │  │ Modelos ML   │  │ Preproceso   │  │ Embeddings RAG   │ │
│  │ Predictivos  │  │ (RF/XGB/LSTM)│  │ (Pandas/Geo) │  │ (FAISS/Chroma)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                              Python 3.11+                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE DATOS                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Supabase (PG)    │  │ Archivos GeoJSON │  │ Fuentes Externas (APIs)   │ │
│  │ PostgreSQL       │  │ Shapefiles       │  │ IDEAM, DANE, Datos.gov   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Patrón Arquitectónico

El proyecto adopta una **arquitectura desacoplada (API-First)** que separa eficientemente:
- **Frontend:** Experiencia de usuario, renderizado, visualización geoespacial.
- **Backend:** Procesamiento de datos, entrenamiento de modelos, inferencia predictiva.
- **Capa de Datos:** Almacenamiento estructurado y geoespacial.

### 2.3 Flujo de Datos

```
Fuentes (IDEAM, DANE, Datos.gov)
        │
        ▼
[Ingesta] → Limpieza (Pandas/NumPy) → Transformación (GeoPandas)
        │
        ▼
[Almacenamiento] → PostgreSQL (Supabase) + GeoJSON estáticos
        │
        ▼
[Entrenamiento] → Random Forest / XGBoost / LSTM (TensorFlow/Keras)
        │
        ▼
[Inferencia] → FastAPI Endpoints → Next.js Frontend
        │
        ▼
[Visualización] → Mapa Coroplético + Dashboard + Chatbot
```

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Componente | Tecnología | Versión | Función |
|---|---|---|---|
| Framework | Next.js | 15 | Renderizado SSR, enrutamiento App Router |
| UI Library | React | 19 | Componentes interactivos |
| Estilos | Tailwind CSS | 3.x | Sistema de diseño utility-first |
| Componentes UI | shadcn/ui | — | Componentes accesibles y reutilizables |
| Gráficos | Recharts / Plotly.js | — | Visualización de series temporales y KPIs |
| Mapas | React-Leaflet + Leaflet.js | — | Mapa coroplético georreferenciado |
| Prototipado | Lovable.dev | — | Diseño inicial de la interfaz |

### 3.2 Backend & Ciencia de Datos

| Componente | Tecnología | Versión | Función |
|---|---|---|---|
| Lenguaje | Python | 3.11+ | Lógica de procesamiento y modelado |
| Framework API | FastAPI | — | Exposición de endpoints REST |
| Procesamiento | Pandas, NumPy | — | Limpieza y transformación de datos |
| Geoespacial | GeoPandas | — | Georreferenciación y operaciones espaciales |
| ML Clásico | Scikit-learn | — | Random Forest, Gradient Boosting |
| ML Avanzado | XGBoost | — | Clasificación de riesgo |
| Deep Learning | TensorFlow / Keras | — | Redes neuronales LSTM para series temporales |
| Embeddings | FAISS / ChromaDB | — | Sistema RAG para chatbot |

### 3.3 Infraestructura y Despliegue

| Componente | Tecnología | Función |
|---|---|---|
| Frontend Hosting | Vercel | Despliegue continuo del frontend |
| Backend Hosting | (Por definir: Render/Railway/AWS) | Despliegue de la API FastAPI |
| Base de Datos | Supabase (PostgreSQL) | Almacenamiento relacional con extensión PostGIS |
| Control de Versiones | Git + GitHub | Gestión del código fuente |
| Licencia | MIT | Código abierto |

---

## 4. Modelos de Machine Learning

### 4.1 Modelo de Predicción de Rendimiento (Regresión)

**Algoritmo:** Random Forest / Gradient Boosting (XGBoost)  
**Variables de entrada:**
- Precipitación acumulada mensual (mm)
- Temperatura promedio, máxima y mínima (°C)
- Humedad relativa (%)
- Velocidad del viento (km/h)
- Altitud del municipio (msnm)
- Zona agroecológica
- Mes y año (estacionalidad)

**Variable objetivo:** Rendimiento estimado (Ton/Ha)

**Métricas de desempeño:**
| Métrica | Valor Esperado | Valor Obtenido |
|---|---|---|
| R² | ≥ 0.75 | ~0.78 |
| MAE | ≤ 0.15 Ton/Ha | Por validar |
| RMSE | — | Por validar |

**Técnica de validación:** Validación cruzada temporal (walk-forward)

### 4.2 Modelo de Clasificación de Riesgo Agroclimático

**Algoritmo:** XGBoost / Logistic Regression  
**Clases:** Bajo, Medio, Alto  
**Factores de riesgo evaluados:**
- Riesgo por sequía (score 0-100)
- Riesgo por heladas (score 0-100)
- Riesgo por plagas (score 0-100)

**Métricas de desempeño:**
| Métrica | Valor Esperado | Valor Obtenido |
|---|---|---|
| F1-Score | ≥ 0.80 | Por validar |
| AUC-ROC | ≥ 0.85 | Por validar |

### 4.3 Modelo de Series Temporales (LSTM)

**Algoritmo:** Redes Neuronales Recurrentes LSTM (TensorFlow/Keras)  
**Propósito:** Proyección de tendencias de rendimiento agrícola a mediano plazo  
**Secuencia de entrada:** Ventana temporal de 12 meses  
**Horizonte de predicción:** 3-6 meses  

### 4.4 Sistema Conversacional (RAG)

**Arquitectura:** Retrieval-Augmented Generation  
**Componentes:**
- Embeddings de datos climáticos y agrícolas
- Base vectorial (FAISS/ChromaDB)
- LLM para generación de respuestas en lenguaje natural

**Funcionalidad:** Consultas conversacionales sobre alertas y recomendaciones de siembra por municipio.

---

## 5. Estructura de Datos

### 5.1 Esquema de Base de Datos (PostgreSQL)

#### Tabla: `municipios`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | TEXT | Nombre del municipio |
| departamento | TEXT | Departamento (Santander) |
| latitud | NUMERIC | Coordenada latitud |
| longitud | NUMERIC | Coordenada longitud |
| altitud_msnm | NUMERIC | Altitud en metros sobre el nivel del mar |
| area_km2 | NUMERIC | Área en kilómetros cuadrados |
| poblacion | INTEGER | Población estimada |
| zone_agroecologica | TEXT | Zona agroecológica (alta, media, baja) |

#### Tabla: `cultivos`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | TEXT | Nombre del cultivo |
| clave | TEXT | Clave interna (cacao, cafe, granadilla) |
| rendimiento_base | NUMERIC | Rendimiento base en Ton/Ha |
| ventana_siembra | TEXT | Ventana óptima de siembra |
| descripcion | TEXT | Descripción del cultivo |

#### Tabla: `clima_mensual`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| municipio_id | UUID | FK → municipios.id |
| anio | INTEGER | Año del registro |
| mes | INTEGER | Mes del registro (1-12) |
| precipitacion_mm | NUMERIC | Precipitación acumulada en mm |
| temp_promedio | NUMERIC | Temperatura promedio en °C |
| temp_max | NUMERIC | Temperatura máxima en °C |
| temp_min | NUMERIC | Temperatura mínima en °C |
| humedad_relativa | NUMERIC | Humedad relativa promedio (%) |
| vel_viento | NUMERIC | Velocidad del viento (km/h) |

#### Tabla: `rendimiento_historico`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| municipio_id | UUID | FK → municipios.id |
| cultivo_id | UUID | FK → cultivos.id |
| anio | INTEGER | Año del registro |
| rendimiento_ton_ha | NUMERIC | Rendimiento real en Ton/Ha |
| superficie_ha | NUMERIC | Superficie cultivada en hectáreas |

#### Tabla: `riesgo_agroclimatico`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| municipio_id | UUID | FK → municipios.id |
| cultivo_id | UUID | FK → cultivos.id |
| anio | INTEGER | Año del registro |
| mes | INTEGER | Mes del registro (1-12) |
| nivel_riesgo | TEXT | Nivel de riesgo (Bajo, Medio, Alto) |
| riesgo_sequia | NUMERIC | Score de riesgo por sequía (0-100) |
| riesgo_heladas | NUMERIC | Score de riesgo por heladas (0-100) |
| riesgo_plagas | NUMERIC | Score de riesgo por plagas (0-100) |
| factor_productividad | NUMERIC | Factor de ajuste de productividad |

#### Tabla: `predicciones`
| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| municipio_id | UUID | FK → municipios.id |
| cultivo_id | UUID | FK → cultivos.id |
| anio | INTEGER | Año predicho |
| mes | INTEGER | Mes predicho (1-12) |
| rendimiento_estimado | NUMERIC | Rendimiento estimado en Ton/Ha |
| confianza | NUMERIC | Nivel de confianza del modelo (0-1) |
| modelo_version | TEXT | Versión del modelo utilizado |
| created_at | TIMESTAMP | Fecha de creación del registro |

### 5.2 Fuentes de Datos

| Categoría | Fuente | Variables | Frecuencia |
|---|---|---|---|
| Climáticos | IDEAM | Precipitación, temperatura, humedad, viento | Diaria |
| Climáticos | Datos.gov.co | Series históricas climáticas | Mensual |
| Climáticos | ERA5 (Copernicus) | Reanálisis climático global | Horaria |
| Geoespaciales | DANE - MCP | Límites municipales de Santander | Estática |
| Geoespaciales | Google Earth Engine | NDVI, cobertura del suelo | Mensual |
| Agrícolas | DANE - Censo Agropecuario | Superficie, producción, rendimiento | Decenal |
| Agrícolas | MinAgricultura - SIPSA | Precios de productos agrícolas | Semanal |
| Agrícolas | FEDECAPEC / FNC | Estadísticas sectoriales | Anual |
| Riesgo | IDEAM - Alertas | Alertas meteorológicas activas | Eventual |
| Riesgo | EM-DAT | Base de datos internacional de desastres | Eventual |

---

## 6. API y Endpoints

### 6.1 Especificación General

- **Framework:** FastAPI
- **Formato:** JSON
- **Autenticación:** (Por definir: API Key / JWT)
- **Documentación automática:** `/docs` (Swagger UI), `/redoc` (ReDoc)

### 6.2 Endpoints Principales (Propuestos)

#### Predicción de Rendimiento
```
GET /api/v1/prediccion/rendimiento
POST /api/v1/prediccion/rendimiento
```
**Parámetros:**
- `municipio_id` (UUID)
- `cultivo_id` (UUID)
- `anio` (int)
- `mes` (int)

**Respuesta:**
```json
{
  "municipio": "Bucaramanga",
  "cultivo": "Cacao",
  "rendimiento_estimado": 1.45,
  "unidad": "Ton/Ha",
  "confianza": 0.82,
  "modelo_version": "v1.2.0",
  "fecha_prediccion": "2026-07-20T18:00:00Z"
}
```

#### Clasificación de Riesgo
```
GET /api/v1/riesgo/clasificar
POST /api/v1/riesgo/clasificar
```
**Parámetros:**
- `municipio_id` (UUID)
- `cultivo_id` (UUID)
- `anio` (int)
- `mes` (int)

**Respuesta:**
```json
{
  "municipio": "San Gil",
  "cultivo": "Café",
  "nivel_riesgo": "Medio",
  "riesgo_sequia": 45,
  "riesgo_heladas": 30,
  "riesgo_plagas": 55,
  "factor_productividad": 0.95,
  "confianza": 0.78
}
```

#### Datos para Mapa Coroplético
```
GET /api/v1/mapa/riesgo
```
**Parámetros:**
- `cultivo_id` (UUID)
- `anio` (int)
- `mes` (int)

**Respuesta:** GeoJSON FeatureCollection con propiedades de riesgo por municipio.

#### Consulta al Chatbot (RAG)
```
POST /api/v1/chat/consulta
```
**Cuerpo:**
```json
{
  "pregunta": "¿Cuál es el mejor mes para sembrar cacao en San Gil?",
  "municipio_id": "uuid-san-gil",
  "cultivo_id": "uuid-cacao"
}
```

#### KPIs del Dashboard
```
GET /api/v1/dashboard/kpis
```
**Parámetros:**
- `municipio_id` (UUID, opcional)
- `cultivo_id` (UUID, opcional)
- `anio` (int)

---

## 7. Guía de Instalación y Despliegue

### 7.1 Requisitos Previos

- Node.js 18+ (Frontend)
- Python 3.11+ (Backend)
- Bun o npm (Gestor de paquetes)
- Git
- Cuenta en Vercel (Frontend)
- Cuenta en Supabase (Base de datos)

### 7.2 Instalación del Frontend

```bash
# Clonar repositorio
git clone https://github.com/Jd1278/231-sembradata-abierto-ia-avanzado.git
cd 231-sembradata-abierto-ia-avanzado

# Instalar dependencias
bun install
# o
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con:
# NEXT_PUBLIC_API_URL=https://tu-api-fastapi.com
# NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Ejecutar en desarrollo
bun run dev
# o
npm run dev

# Construir para producción
bun run build
# o
npm run build
```

### 7.3 Instalación del Backend

```bash
# Navegar al directorio del backend
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con:
# DATABASE_URL=postgresql://user:pass@host:port/db
# SUPABASE_URL=https://tu-proyecto.supabase.co
# SUPABASE_KEY=tu-service-key

# Ejecutar en desarrollo
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Ejecutar tests
pytest
```

### 7.4 Despliegue en Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

O mediante integración continua desde GitHub:
1. Conectar repositorio en Vercel Dashboard
2. Configurar variables de entorno
3. Despliegue automático en cada push a `main`

### 7.5 Despliegue del Backend (Opciones)

**Opción A: Render**
1. Crear cuenta en render.com
2. Conectar repositorio
3. Configurar build command: `pip install -r requirements.txt`
4. Configurar start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Opción B: Railway**
1. Crear cuenta en railway.app
2. Desplegar desde GitHub
3. Configurar variables de entorno

**Opción C: AWS (Producción)**
- ECS Fargate o EC2 con Docker
- RDS PostgreSQL
- API Gateway + Lambda (opcional)

### 7.6 Configuración de Base de Datos (Supabase)

```sql
-- Crear tablas (ejecutar en SQL Editor de Supabase)
-- Ver sección 5.1 para el esquema completo

-- Habilitar extensión PostGIS para datos geoespaciales
CREATE EXTENSION IF NOT EXISTS postgis;

-- Crear índices espaciales
CREATE INDEX idx_municipios_geom ON municipios USING GIST (
  ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
);
```

---

## 8. Metodología CRISP-DM

SembraData sigue una adaptación de **CRISP-DM** (Cross-Industry Standard Process for Data Mining) para proyectos de IA agrícola.

### Fase 1: Comprensión del Negocio
- **Stakeholders:** Agricultores, instituciones agrarias (MIDT), investigadores.
- **KPIs definidos:**
  - Rendimiento agrícola (Ton/Ha)
  - Nivel de riesgo agroclimático
  - Confianza del modelo
  - Reducción de pérdidas por eventos climáticos (15-20% estimado)

### Fase 2: Comprensión de los Datos
- **Fuentes principales:** IDEAM (clima), DANE (censos agrarios), datos.gov.co
- **Periodo:** 2015–2026
- **Cobertura:** 107 municipios de Santander (nota: README indica 87, documentación indica 107)
- **Volumen estimado:** ~50,000 registros climáticos mensuales

### Fase 3: Preparación de los Datos
- Limpieza de valores atípicos en registros climáticos
- Imputación de datos faltantes por interpolación temporal
- Normalización de variables numéricas (Min-Max, Z-Score)
- Codificación de variables categóricas (One-Hot Encoding para riesgo, zona agroecológica)
- Generación de features temporales (estacionalidad, tendencias)

### Fase 4: Modelado
| Modelo | Algoritmo | Librería | Propósito |
|---|---|---|---|
| Predicción de rendimiento | Random Forest / XGBoost | Scikit-learn / XGBoost | Regresión |
| Clasificación de riesgo | Logistic Regression / XGBoost | Scikit-learn / XGBoost | Clasificación |
| Series temporales | LSTM | TensorFlow/Keras | Proyección de tendencias |
| Embeddings conversacionales | RAG | FAISS + LLM | Chatbot |

### Fase 5: Evaluación
- **Métricas de regresión:** MAE, RMSE, R²
- **Métricas de clasificación:** F1-Score, AUC-ROC
- **Validación cruzada temporal (walk-forward):** Simula predicciones en el tiempo real
- **Pruebas de equidad territorial (bias_tests/):** Evita discriminación de municipios pequeños

### Fase 6: Despliegue
- API REST con FastAPI
- Base de datos: Supabase (PostgreSQL)
- Frontend: Next.js + React + Tailwind CSS
- Monitoreo de data drift mensual
- Retraining automático trimestral (propuesto)

---

## 9. Validación y Métricas

### 9.1 Validación de Datos

**Verificaciones:**
- Confirmar que datos climáticos coinciden con registros del IDEAM
- Validar límites municipales con el DANE (MCP actualizado)
- Cotejar rendimientos históricos con el Censo Agropecuario

**Tests de integridad:**
```bash
# Ejecutar tests de integración de datos
bun run test:integration
```

### 9.2 Validación de Modelos

| Modelo | Métrica | Valor Esperado |
|---|---|---|
| Rendimiento (regresión) | R² | ≥ 0.75 |
| Rendimiento (regresión) | MAE | ≤ 0.15 Ton/Ha |
| Riesgo (clasificación) | F1-Score | ≥ 0.80 |
| Riesgo (clasificación) | AUC-ROC | ≥ 0.85 |

**Reproducibilidad:**
```bash
# Ejecutar todos los tests
bun run test:all

# Tests de sesgo territorial
bun run test:bias
```

### 9.3 Validación de la Interfaz

**Criterios de aceptación:**
- [ ] El mapa muestra los 87 municipios de Santander
- [ ] Los filtros (municipio, año, mes, cultivo) funcionan correctamente
- [ ] Los KPIs se actualizan al cambiar los filtros
- [ ] Los gráficos muestran datos coherentes
- [ ] El chatbot responde en lenguaje natural

### 9.4 Validación Ética

- Ejecutar tests de equidad territorial
- Verificar que municipios pequeños no reciben sistemáticamente clasificaciones de alto riesgo
- Confirmar que las métricas de confianza se muestran al usuario

---

## 10. Impacto y Sostenibilidad

### 10.1 Impacto Social

| Indicador | Valor |
|---|---|
| Beneficiarios directos | ~45,000 agricultores pequeños y medianos |
| Beneficiarios indirectos | ~200,000 personas (cadenas productivas) |
| Reducción de pérdidas estimada | 15-20% por eventos climáticos |
| Cultivos cubiertos | Cacao, Café, Granadilla |

### 10.2 Impacto Económico

- Aumento proyectado del ingreso agrícola en 12% para los primeros 3 años
- Optimización del uso de insumos agrícolas basada en pronósticos precisos
- Fortalecimiento de la competitividad del cacao y café santandereano

### 10.3 Consideraciones Éticas

| Principio | Implementación |
|---|---|
| Sesgo algorítmico | Pruebas de equidad territorial (bias_tests/) |
| Privacidad | No se recopilan datos personales de agricultores individuales |
| Transparencia | Métricas de confianza y explicabilidad visibles al usuario |
| Accesibilidad | Diseño responsive para dispositivos móviles |

### 10.4 Mitigación de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Sesgo territorial | Media | Alto | Pruebas de equidad automatizadas |
| Datos incompletos | Alta | Medio | Imputación por interpolación temporal |
| Dependencia de fuentes externas | Media | Alto | Múltiples fuentes de datos |
| Baja adopción | Media | Medio | Interfaz intuitiva, capacitación |

---

## 11. Roadmap y Próximos Pasos

### Corto Plazo (0-6 meses)
- [ ] Implementar sistema de alertas tempranas automatizadas
- [ ] Integrar datos satelitales (NDVI) para monitoreo en tiempo real
- [ ] Desarrollar módulo de recomendaciones prescriptivas
- [ ] Mejorar cobertura de datos climáticos estacionales en zonas rurales

### Mediano Plazo (6-18 meses)
- [ ] Expandir a otros cultivos estratégicos de la región (aguacate, uchuva, panela)
- [ ] Establecer alianzas con IDEAM y DANE para acceso a datos en tiempo real
- [ ] Implementar sistema de retroalimentación de agricultores para validación de predicciones
- [ ] Desarrollar aplicación móvil nativa (iOS/Android)

### Largo Plazo (18+ meses)
- [ ] Escalar a otros departamentos de Colombia (Boyacá, Cundinamarca, Antioquia)
- [ ] Integrar modelos de cambio climático (proyecciones IPCC)
- [ ] Desarrollar marketplace de insumos agrícolas basado en predicciones
- [ ] Publicar paper científico con resultados validados

---

## 12. Referencias

1. IDEAM (Instituto de Hidrología, Meteorología y Estudios Ambientales). https://www.ideam.gov.co
2. UPRA (Unidad de Planificación Rural Agropecuaria). Evaluaciones Agropecuarias Municipales (EVA).
3. DANE (Departamento Administrativo Nacional de Estadística). Censo Agropecuario. https://www.dane.gov.co
4. AGRONET. Microdatos de producción agrícola. https://www.minagricultura.gov.co
5. Datos Abiertos Colombia. https://datos.gov.co
6. ERA5 Reanalysis. Copernicus Climate Data Store. https://cds.climate.copernicus.eu
7. Chapman, P., et al. (2000). CRISP-DM 1.0: Step-by-step data mining guide.
8. Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.
9. Chen, T., & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. KDD 2016.
10. Hochreiter, S., & Schmidhuber, J. (1997). Long Short-Term Memory. Neural Computation, 9(8), 1735-1780.

---

<div align="center">

**Hecho con 🌱 para el agro de Santander, Colombia**

*Distribuido bajo la Licencia MIT*

</div>
