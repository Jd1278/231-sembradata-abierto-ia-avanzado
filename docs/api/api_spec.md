# Especificación de API — SembraData

Documentación técnica de los endpoints REST y Edge Functions de SembraData.

---

## 1. URLs Base

- **REST API (Supabase PostgREST):** `https://hhnbaxwbeywyriigcwav.supabase.co/rest/v1/`
- **Edge Functions Gateway:** `https://hhnbaxwbeywyriigcwav.supabase.co/functions/v1/`

---

## 2. Autenticación y Encabezados

Las peticiones al REST API requieren los siguientes encabezados:

```http
apikey: <VITE_SUPABASE_ANON_KEY>
Authorization: Bearer <VITE_SUPABASE_ANON_KEY>
Content-Type: application/json
```

---

## 3. Endpoints de Datos (PostgREST)

### `GET /municipios`

Obtiene el catálogo oficial de los 87 municipios del departamento de Santander.

**Ejemplo de Respuesta:**

```json
[
  {
    "id": "san_gil",
    "nombre": "SAN GIL",
    "departamento": "Santander",
    "latitud": 6.5656,
    "longitud": -73.1207,
    "altitud_msnm": 1160,
    "zone_agroecologica": "Subandina"
  }
]
```

### `GET /rendimiento_historico`

Obtiene las observaciones reales de rendimiento y superficie del Ministerio de Agricultura (EVA).

**Parámetros Query:**

- `municipio_id`: `eq.san_gil`
- `cultivo_id`: `eq.cacao`
- `order`: `anio.asc`

### `GET /predicciones_agroclimaticas`

Consulta los pronósticos estadísticos versionados con intervalos de predicción.

**Parámetros Query:**

- `municipio_id`: `eq.san_gil`
- `cultivo_id`: `eq.cacao`
- `status`: `eq.active`

**Ejemplo de Respuesta:**

```json
[
  {
    "id": "76495bcf-3b95-460d-85ad-27083fb8b04a",
    "municipio_id": "san_gil",
    "cultivo_id": "cacao",
    "anio_objetivo": 2025,
    "rendimiento_estimado": 1.45,
    "limite_inferior_80": 1.28,
    "limite_superior_80": 1.62,
    "limite_inferior_95": 1.15,
    "limite_superior_95": 1.75,
    "modelo_nombre": "Theil-Sen",
    "modelo_version": "2.6.0-stat",
    "status": "active"
  }
]
```

### `GET /crop_climate_requirements`

Obtiene los rangos óptimos de temperatura, precipitación, altitud y pH según Cenicafé / Fedecacao / AGROSAVIA.

---

## 4. Edge Functions Serverless

### `POST /functions/v1/chat`

Invoca al asistente conversacional agroclimático respaldado por motor determinista y RAG.

**Cuerpo de Solicitud:**

```json
{
  "message": "¿Qué cultivo es viable en San Gil?",
  "sessionId": "usr-session-1234"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "answer": "En San Gil (1160 msnm), el cultivo de café y cacao presentan condiciones térmicas favorables...",
  "summary": "Evaluación agronómica determinista para San Gil",
  "claims": [
    {
      "text": "Altitud oficial de San Gil: 1160 msnm",
      "claimType": "observed",
      "source": "Base oficial de Santander",
      "value": 1160,
      "unit": "msnm",
      "confidence": 95
    }
  ],
  "recommendations": [
    {
      "action": "Verificar drenaje del lote antes de siembra.",
      "basis": ["Manual Técnico ICA"],
      "priority": "medium"
    }
  ],
  "insufficientData": false,
  "needsHumanReview": false,
  "requestId": "92a188da-908d-4f0f-8c38-2321481b7e4f",
  "latencyMs": 1450
}
```

### `POST /functions/v1/gemini-assessment`

Evalúa la coherencia biológica del pronóstico mediante Google Gemini 2.0 Flash sin alterar las cifras numéricas.

---

## 5. Endpoints Serverless en Deprecación

- `POST /api/reports/generate` $\to$ Retorna **HTTP 501 Not Implemented** (`NOT_IMPLEMENTED`).
- `POST /api/reports/schedule` $\to$ Retorna **HTTP 501 Not Implemented** (`NOT_IMPLEMENTED`).
- `POST /api/notifications/send` $\to$ Retorna **HTTP 501 Not Implemented** (`NOT_IMPLEMENTED`).
