# Arquitectura de SembraData

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React 19)                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Dashboard │  │ MapView  │  │ Chatbot   │  │ Prediction   │  │
│  │ (KPIs)   │  │ (SVG)    │  │ Panel     │  │ Panel        │  │
│  │ lazy     │  │ keyboard │  │ memory +  │  │ focus trap   │  │
│  │ loaded   │  │ nav      │  │ markdown  │  │ + aria-live  │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │              │              │                │           │
│  ┌────┴──────────────┴──────────────┴────────────────┴──────┐   │
│  │              Supabase Client (JS SDK) + IndexedDB        │   │
│  │              Analysis Cache (30 days TTL)                 │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                    Service Worker v2                       │   │
│  │         stale-while-revalidate + offline fallback         │   │
│  │              + background sync (PWA)                       │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼───────────────────────────────────┐
│                     BACKEND (Supabase)                          │
│  ┌──────────────┐  ┌───────┴──┐  ┌──────────────┐             │
│  │ PostgreSQL   │  │ Auth     │  │ Edge Functions│             │
│  │ (datos)      │  │ (JWT)    │  │ (Deno)       │             │
│  │ 10+ tables   │  │          │  │ chat + cache │             │
│  └──────────────┘  └──────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                EXTERNAL APIs (5) + Groq + Supabase               │
│  ┌──────────────┐  ┌───────┴──┐  ┌──────────────┐             │
│  │ Open-Meteo   │  │ NASA     │  │ IDEAM        │             │
│  │ (clima 90d)  │  │ POWER    │  │ (datos.gov)  │             │
│  └──────────────┘  └──────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌───────┴──┐  ┌──────────────┐             │
│  │ SoilGrids    │  │ Commodity│  │ Groq         │             │
│  │ (6 depths)   │  │ Forecast │  │ (chatbot IA) │             │
│  └──────────────┘  └──────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

1. **Ingesta:** Datos climáticos de Open-Meteo, NASA POWER e IDEAM se procesan y cachean en Supabase
2. **Cache:** Los datos se almacenan en Supabase (24h-7d TTL) y IndexedDB (30d offline)
3. **Consulta:** El frontend consulta Supabase vía JS SDK con filtros dinámicos
4. **Predicción:** El motor de predicción v2 calcula viabilidad con 8 factores ponderados
5. **Visualización:** React renderiza KPIs, mapa SVG, gráficos Recharts y radar
6. **Conversación:** El chatbot genera respuestas con memoria, sinónimos y 50+ entradas
7. **Exportación:** El usuario puede exportar a PDF (jsPDF) o Excel (SheetJS)
8. **Compartir:** El análisis se comparte vía URL codificada o Web Share API

## Seguridad

- Variables de entorno para credenciales Supabase (nunca en código fuente)
- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación JWT para accesos autenticados
- Rate limiting en endpoints públicos
- `GROQ_API_KEY` gestionada server-side en la Edge Function de Supabase (nunca expuesta al frontend)
- Service Worker con cache seguro (stale-while-revalidate)
- Focus trapping en modales para accesibilidad (WCAG 2.1)

## Componentes Clave

### Code Splitting

- Dashboard, ChatbotPanel, PredictionPanel se cargan bajo demanda (lazy)
- Chunk principal de rutas: 1.3 KB (-99.8% vs 820 KB antes)

### Service Worker v2

- Stale-while-revalidate: cache servido mientras se actualiza en background
- Offline fallback: página offline.html funcional
- Background sync para formularios

### Accesibilidad

- Skip-to-content link
- Focus trapping en modales (PredictionPanel, HistoryPanel)
- Navegación por teclado en mapa SVG (flechas, Enter, Escape)
- Regiones aria-live para actualizaciones dinámicas

### ETL Pipeline

- `data/etl/etl_ideam.ts`: Extracción de estaciones meteorológicas
- `data/etl/etl_nasa_power.ts`: Datos satelitales + índices agroclimáticos
- `data/etl/etl_commodities.ts`: Precios internacionales de commodities
