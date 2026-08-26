# Data Sources Reference — SembraData

Inventory and technical classification of primary data providers, institutional sources, and AI evaluation services.

---

## 1. Ground Truth Historical Observations

- **Source:** Ministry of Agriculture and Rural Development (MinAgricultura) / Municipal Agricultural Evaluations (EVA).
- **Scope:** 87 municipalities of Santander, Colombia.
- **Crops:** Cocoa (`cacao`), Coffee (`cafe`), Sweet Granadilla (`granadilla`).
- **Policy:** Strictly verified historical records. When sample size $N < 3$, statistical projections are halted with `status: "insufficient_data"` to avoid synthetic hallucinations.

---

## 2. Live Weather and Pedology

- **Open-Meteo API:** Real-time temperature, humidity, wind, and 7-day cumulative precipitation forecasts.
- **SoilGrids ISRIC:** Global pedological database providing pH, organic matter, and soil texture at 6 depth strata.
- **NASA POWER:** Solar irradiance, evapotranspiration ($ET_0$), and agroclimatic indices.
- **IDEAM Socrata Open Data:** Official Colombian meteorological station observations.

---

## 3. Statistical Forecasting & Artificial Intelligence

- **Statistical Forecasting (Theil-Sen Robust Linear Estimator):** Reproducible mathematical trend fitting with 80% and 95% confidence intervals ($L_{80}, U_{80}, L_{95}, U_{95}$).
- **Groq Cloud (`openai/gpt-oss-20b`):** Edge Function-based conversational assistant strictly bounded by server-side deterministic context.
- **Google Gemini 2.0 Flash:** Server-side qualitative agronomic evaluation without quantitative numerical modifications.
