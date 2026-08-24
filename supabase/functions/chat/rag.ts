export interface RagEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  crop?: string;
}

interface RagResult {
  entry: RagEntry;
  score: number;
}

const KNOWLEDGE_BASE: RagEntry[] = [
  {
    id: "cacao-siembra",
    category: "siembra",
    keywords: [
      "cacao",
      "siembra",
      "sembrar",
      "plantar",
      "cacaotero",
      "mazorca",
      "theobroma",
      "vivero",
      "semilla",
    ],
    question: "¿Cómo sembrar cacao en Santander?",
    crop: "cacao",
    answer: `**Siembra de Cacao en Santander**
El cacao es un cultivo ideal para zonas bajas y medias de Santander.

**Época de siembra:** Entre abril y junio, aprovechando las primeras lluvias.
**Distanciamiento:** 3 m x 3 m en terreno plano, 3.5 m x 3.5 m en laderas. Densidad: ~1,100 árboles/ha.
**Preparación:** Hoyos de 60x60x60 cm con estiércol curado y fertilizante fosforado.
**Variedades recomendadas:** CCN-51 (alta productividad), IMC-67 (buen rendimiento), Tingo María (zonas húmedas).`,
  },
  {
    id: "cacao-rendimiento",
    category: "cultivo",
    keywords: [
      "cacao",
      "rendimiento",
      "produccion",
      "toneladas",
      "kilos",
      "kg",
      "mazorca",
      "productividad",
      "almendra",
    ],
    question: "¿Cuál es el rendimiento del cacao en Santander?",
    crop: "cacao",
    answer: `**Rendimiento del Cacao en Santander**
**Sin tecnología:** 300-500 kg/ha en almendra seca.
**Con buena tecnología:** 1,500-2,500 kg/ha.
**Alta tecnología:** hasta 3,500 kg/ha.
**Ciclo:** Producción a los 3-4 años, plenitud a los 6-8 años, vida útil de 25-30 años.
1 kg de almendra seca ≈ 4 kg de mazorca fresca.`,
  },
  {
    id: "cacao-enfermedades",
    category: "plaga",
    keywords: ["cacao", "enfermedad", "monilia", "escoba de bruja", "mazorca", "hongo", "plaga"],
    question: "¿Qué enfermedades afectan al cacao en Santander?",
    crop: "cacao",
    answer: `**Enfermedades del Cacao en Santander**
**Moniliasis:** Causa pérdidas del 30-80%. Control: remoción de mazorcas enfermas cada 15 días, trichoderma.
**Escoba de Bruja:** Deformación de brotes. Control: poda sanitaria, caldo bordelés.
**Mazorca Negra:** Pudrición por Phytophthora. Control: buen drenaje, oxychloride de cobre.
**Antracnosis:** Manchas oscuras. Control: azufre, cobertura de frutos.`,
  },
  {
    id: "cacao-variedades",
    category: "cultivo",
    keywords: ["cacao", "variedad", "CCN-51", "IMC", "tingo", "semilla", "genetica", "culta"],
    question: "¿Qué variedades de cacao son adecuadas para Santander?",
    crop: "cacao",
    answer: `**Variedades de Cacao para Santander**
**CCN-51:** Alta productividad (2,000-3,500 kg/ha), tolerante a enfermedades, necesita buena fertilización.
**IMC-67:** Buen equilibrio producción-calidad, ideal para cacao fino de aroma.
**Tingo María:** Adaptada a zonas húmedas, productividad moderada (1,200-1,800 kg/ha).
**EET-8 (Trinitario):** Calidad excepcional para mercados especiales, menor rendimiento pero prima de precio.`,
  },
  {
    id: "cacao-suelo",
    category: "suelo",
    keywords: [
      "cacao",
      "suelo",
      "tierra",
      "ph",
      "drenaje",
      "acidez",
      "terreno",
      "abono",
      "fertilizante",
    ],
    question: "¿Qué tipo de suelo necesita el cacao?",
    crop: "cacao",
    answer: `**Suelo para Cacao en Santander**
**Profundidad:** Mínimo 1.5 m sin capa impermeable.
**Textura:** Franco-arcillosa o franco-arenosa.
**Drenaje:** Bueno, sin encharcamientos.
**pH:** Entre 5.5 y 7.0 (ligeramente ácido a neutro).
**Materia orgánica:** Mantener cobertura viva, aplicar mulch y compost de residuos de poda.`,
  },
  {
    id: "cacao-cosecha",
    category: "cosecha",
    keywords: ["cacao", "cosecha", "recoleccion", "mazorca", "almendra"],
    question: "¿Cómo cosechar cacao correctamente?",
    crop: "cacao",
    answer: `**Cosecha del Cacao en Santander**
**Señales de madurez:** Color verde a amarillo/rojizo, sonido sordo al golpear, semillas blanco-crema.
**Época:** Principal en octubre-noviembre, mitaca en abril-mayo. Recolectar cada 15-20 días.
**Post-cosecha:** Abrir mazorcas dentro de 24h, fermentación 5-6 días en cajones de madera, secado hasta 7% humedad.`,
  },
  {
    id: "cacao-fertilizacion",
    category: "cultivo",
    keywords: [
      "cacao",
      "fertilizacion",
      "fertilizante",
      "abono",
      "nutrientes",
      "nitrogeno",
      "fosforo",
      "potasio",
    ],
    question: "¿Cómo fertilizar cacao en Santander?",
    crop: "cacao",
    answer: `**Fertilización del Cacao en Santander**
Por árbol/año: N: 100-150g, P: 30-50g, K: 80-120g, Ca: 40-60g, Mg: 20-30g, Boro: 5-10g.
**Programa:** Abril (NPK completo + Mg), Julio (NPK + microelementos), Octubre (N + K).
**Aplicación:** En anillo a 1.5 m del tronco, profundidad 10-15 cm.`,
  },
  {
    id: "cafe-siembra",
    category: "siembra",
    keywords: ["cafe", "café", "siembra", "sembrar", "plantar", "arabica", "robusta", "vivero"],
    question: "¿Cómo sembrar café en Santander?",
    crop: "cafe",
    answer: `**Siembra de Café en Santander**
**Época:** Entre marzo y junio, con las primeras lluvias.
**Distanciamiento:** 2 m x 1.5 m (3,333 plantas/ha), surcos en curva de nivel.
**Preparación:** Bancos o terrazas en laderas, hoyos de 50x50x50 cm con abono orgánico.
**Variedades:** Caturra (alta calidad), Castillo (resistente a roya), Tabi (tolerante a sequía), Colombia (resistente a roya y broca).`,
  },
  {
    id: "cafe-rendimiento",
    category: "cultivo",
    keywords: [
      "cafe",
      "café",
      "rendimiento",
      "produccion",
      "cosecha",
      "kg",
      "quintales",
      "pergamino",
    ],
    question: "¿Cuál es el rendimiento del café en Santander?",
    crop: "cafe",
    answer: `**Rendimiento del Café en Santander**
**Baja tecnología:** 10-15 qq/ha.
**Tecnología media:** 20-30 qq/ha.
**Alta tecnología:** 35-50 qq/ha (cafés especiales).
**Conversión:** 1 qq cereza ≈ 0.5 qq pergamino ≈ 0.45 qq verde.
**Plenitud productiva:** Años 4-8 (30-50 qq/ha).`,
  },
  {
    id: "cafe-altitud",
    category: "cultivo",
    keywords: ["cafe", "café", "altitud", "altura", "msnm", "elevacion", "zona", "metros"],
    question: "¿En qué altitud crece mejor el café en Santander?",
    crop: "cafe",
    answer: `**Altitud para Café en Santander**
**1,200-1,500 msnm:** Café bueno, rendimiento alto.
**1,500-1,800 msnm:** Café superior, equilibrio calidad-rendimiento.
**1,800-2,200 msnm:** Café especial, alta acidez y complejidad.
**>2,200 msnm:** Café premium, perfil aromático excepcional.
**Temperatura óptima:** 17-23°C para arábica.`,
  },
  {
    id: "cafe-plagas",
    category: "plaga",
    keywords: [
      "cafe",
      "café",
      "plaga",
      "roya",
      "broca",
      "minador",
      "hongo",
      "insecto",
      "enfermedad",
    ],
    question: "¿Qué plagas afectan al café en Santander?",
    crop: "cafe",
    answer: `**Plagas del Café en Santander**
**Roya (Hemileia vastatrix):** Manchas amarillas/naranjas, defoliación. Control: variedades resistentes (Castillo, Colombia), fungicidas preventivos.
**Broca (Hypothenemus hampei):** Perfora frutos, pérdida hasta 30%. Control: recolección de frutos caídos, trampas con feromonas.
**Minador (Leucoptera coffeella):** Galerías en hojas. Control: poda, aceites minerales.
**Cercospora:** Manchas oscuras. Control: fungicidas de cobre, buena ventilación.`,
  },
  {
    id: "cafe-cosecha",
    category: "cosecha",
    keywords: [
      "cafe",
      "café",
      "cosecha",
      "recoleccion",
      "cereza",
      "pergamino",
      "despulpado",
      "fermentacion",
    ],
    question: "¿Cómo cosechar café en Santander?",
    crop: "cafe",
    answer: `**Cosecha del Café en Santander**
**Señales de madurez:** Frutos rojo brillante, ligeramente blandos.
**Época:** Principal octubre-diciembre, secundaria abril-mayo. Recolección cada 8-15 días.
**Post-cosecha:** Despulpado, fermentación 12-36h en tanques, secado a 11-12% humedad.`,
  },
  {
    id: "granadilla-siembra",
    category: "siembra",
    keywords: ["granadilla", "siembra", "sembrar", "plantar", "pasiflora", "tutor", "enredadera"],
    question: "¿Cómo sembrar granadilla en Santander?",
    crop: "granadilla",
    answer: `**Siembra de Granadilla en Santander**
**Época:** Entre marzo y mayo, temperatura ideal 18-25°C.
**Distanciamiento:** 3 m x 2.5 m (plano), 4 m x 3 m (laderas). Densidad: 800-1,333 plantas/ha.
**Sistema de tutorado:** Postes de concreto (4 m) con cable galvanizado.
**Variedades:** Bocadillo (la más cultivada), Sweetgrenadine (dulce), Gulupa (valor agregado alto).`,
  },
  {
    id: "granadilla-rendimiento",
    category: "cultivo",
    keywords: ["granadilla", "rendimiento", "produccion", "kilos", "fruto", "cosecha", "toneladas"],
    question: "¿Cuál es el rendimiento de la granadilla en Santander?",
    crop: "granadilla",
    answer: `**Rendimiento de Granadilla en Santander**
**Plantas jóvenes (año 1-2):** 5-10 kg/planta.
**Plantas adultas (año 3+):** 15-25 kg/planta.
**Promedio por hectárea:** 12,000-25,000 kg/ha/año.
**Ciclo:** Primer fruto a los 8-10 meses, plenitud años 2-6.`,
  },
  {
    id: "granadilla-cuidados",
    category: "cultivo",
    keywords: [
      "granadilla",
      "cuidados",
      "manejo",
      "poda",
      "fertilizacion",
      "riego",
      "tutor",
      "abono",
    ],
    question: "¿Qué cuidados necesita la granadilla?",
    crop: "granadilla",
    answer: `**Cuidados de la Granadilla**
**Poda:** Formación (3-4 ramas principales), aireación (ramas secas y enfermas).
**Fertilización:** Año 1: 150g NPK 15-15-15 cada 2 meses. Año 2+: 300g NPK + 100g KCl.
**Riego:** 1-2 veces/semana en época seca, 20-30 litros/planta. No encharcar.
**Polinización:** Instalar 1-2 colmenas de abejas por hectárea.`,
  },
  {
    id: "granadilla-clima",
    category: "clima",
    keywords: [
      "granadilla",
      "clima",
      "temperatura",
      "frio",
      "helada",
      "altitud",
      "zona",
      "condiciones",
    ],
    question: "¿Qué clima necesita la granadilla?",
    crop: "granadilla",
    answer: `**Clima para Granadilla**
**Temperatura óptima:** 18-25°C. Mínima: 10°C. Muere a -1°C (helada).
**Altitud ideal:** 1,500-2,200 msnm.
**Precipitación:** 1,200-2,000 mm anuales distribuidos. No tolera sequías >2 meses.
**Humedad relativa:** 60-80%. >90% favorece enfermedades fúngicas.
**Viento:** Proteger con cortavientos. Daña flores y reduce polinización.`,
  },
  {
    id: "granadilla-enfermedades",
    category: "plaga",
    keywords: ["granadilla", "enfermedad", "fusarium", "nematodo", "mosca", "hongo", "plaga"],
    question: "¿Qué enfermedades afectan la granadilla en Santander?",
    crop: "granadilla",
    answer: `**Enfermedades de la Granadilla**
**Fusarium:** Secado progresivo de ramas. Control: trichoderma, rotación.
**Nematodos (Meloidogyne):** Abultamientos en raíces. Control: abono verde con leguminosas.
**Mosca de la fruta (Anastrepha):** Larvas dentro del fruto. Control: trampas McPhail, cebo attract.
**Virus (Woodiness):** Deformación de frutos. Control: eliminación de plantas enfermas, control de pulgones.`,
  },
  {
    id: "clima-santander",
    category: "clima",
    keywords: [
      "clima",
      "santander",
      "temperatura",
      "lluvia",
      "temporada",
      "condiciones",
      "region",
      "zona",
    ],
    question: "¿Cómo es el clima en Santander para agricultura?",
    answer: `**Clima de Santander para Agricultura**
**Zona cálida (<1,000 msnm):** 24-28°C, 1,500-2,000 mm/año.
**Zona templada (1,000-2,000 msnm):** 18-24°C, 1,200-1,800 mm/año.
**Zona fría (>2,000 msnm):** 12-18°C, 1,000-1,500 mm/año.
**Épocas de lluvia:** Abril-junio (principal), Septiembre-noviembre (secundaria).
**Riesgos:** Sequías (enero-marzo), inundaciones, granizadas (>1,800 msnm), heladas (>2,200 msnm).`,
  },
  {
    id: "clima-sequia",
    category: "clima",
    keywords: ["sequia", "sequía", "agua", "riego", "falta", "seco", "irrigacion", "conservacion"],
    question: "¿Cómo manejar la sequía en agricultura?",
    answer: `**Manejo de Sequía en Agricultura**
**Mulch:** Reduce evaporación 50-70%.
**Riego por goteo:** Ahorra 40-60% de agua.
**Materia orgánica en suelo:** Aumentar a 2-4%.
**Variedades tolerantes:** Tabi (café), CCN-51 (cacao), yuca, plátano.
**Almacenamiento:** Tanques de 5,000-10,000 litros, jagüeyes.`,
  },
  {
    id: "clima-heladas",
    category: "riesgo",
    keywords: [
      "helada",
      "heladas",
      "frio",
      "frio",
      "temperatura",
      "congelacion",
      "proteccion",
      "riesgo",
    ],
    question: "¿Cómo proteger cultivos de heladas?",
    answer: `**Protección contra Heladas**
**Medidas preventivas:** Calefactores entre plantas, cortavientos, riego por aspersión (contra-intuitivo pero protege), mulch grueso.
**Cultivos sensibles:** Cacao, granadilla (muy sensible), café.
**Post-helada:** No podar inmediatamente (esperar 7-10 días), aplicar fertilizante rico en potasio, riego abundante.`,
  },
  {
    id: "riesgo-evaluacion",
    category: "riesgo",
    keywords: ["riesgo", "nivel", "peligro", "amenaza", "alerta", "emergencia", "desastre"],
    question: "¿Cómo evaluar el nivel de riesgo en mi finca?",
    answer: `**Evaluación de Riesgo Agrícola**
**Tipos:** Climático (sequía, helada, inundación), Biológico (plagas, enfermedades), Económico (precios), Físico (erosión).
**Escala 1-5:** 1 (<10% probabilidad) a 5 (>70%).
**Indicadores:** Temp <10°C (helada), Lluvia <50 mm/mes (sequía), >5% hojas con plagas (acción inmediata).`,
  },
  {
    id: "general-mercado",
    category: "general",
    keywords: ["mercado", "precio", "venta", "comercializacion", "exportar", "vender", "demanda"],
    question: "¿Cómo acceder a mercados para mis productos agrícolas?",
    answer: `**Acceso a Mercados en Santander**
**Canales:** Plaza de mercado local, intermediarios, restaurantes, exportación.
**Estrategias:** Agruparse en asociaciones, transformar productos (cacao a chocolate, café tostado), certificar orgánico.
**Mercados regionales:** Bogotá (hortalizas), Medellín (frutas), Bucaramanga (plátano, yuca).`,
  },
  {
    id: "general-sostenibilidad",
    category: "general",
    keywords: [
      "sostenibilidad",
      "sostenible",
      "organico",
      "ecologico",
      "ambiental",
      "agroecologia",
    ],
    question: "¿Cómo hacer agricultura sostenible en Santander?",
    answer: `**Agricultura Sostenible en Santander**
**Prácticas:** Sistemas agroforestales, cobertura viva, compostaje, rotación de cultivos.
**Certificaciones:** Orgánico, Rainforest Alliance, UTZ, Comercio Justo.
**Beneficios:** 20-40% más precio, acceso a mercados premium, reducción de costos, mejor salud.`,
  },
  {
    id: "general-financiacion",
    category: "general",
    keywords: ["financiacion", "credito", "prestamo", "subsidio", "banco", "apoyo", "financiero"],
    question: "¿Qué opciones de financiación hay para agricultores en Santander?",
    answer: `**Financiación para Agricultores en Santander**
**Entidades:** Banco Agrario, Bancóldex, Finagro.
**Tasas:** 10-18% EA según entidad y programa.
**Requisitos:** Registro Agropecuario (RUA), plan de negocio básico, garantías.
**Subsidios:** Renovación de cultivos (70%), Protección de Cultivos, Comercialización.`,
  },
  {
    id: "tecnico-analisis-suelo",
    category: "tecnico",
    keywords: [
      "analisis",
      "suelo",
      "tierra",
      "ph",
      "nutrientes",
      "materia organica",
      "fosforo",
      "potasio",
    ],
    question: "¿Cómo realizar un análisis de suelo para mi finca?",
    answer: `**Análisis de Suelo para tu Finca**
**Qué evaluar:** pH, materia orgánica, N, P, K, Ca, Mg, micronutrientes.
**Cómo tomar muestras:** Zonificar la finca, tomar 10-15 submuestras por zona a 0-20 cm de profundidad, mezclar y enviar 500g al laboratorio.
**Costo:** $50,000-250,000 COP según profundidad.
**Frecuencia:** Cada 2 años para cultivos permanentes.`,
  },
  {
    id: "tecnico-riego",
    category: "tecnico",
    keywords: [
      "riego",
      "irrigacion",
      "goteo",
      "aspiracion",
      "agua",
      "eficiencia",
      "sistema",
      "ahorro",
    ],
    question: "¿Cómo implementar un sistema de riego eficiente?",
    answer: `**Riego Eficiente**
**Goteo:** Ahorra 40-60% agua. Ideal para hortalizas, café, cacao. Inversión: $2,000-5,000/m lineal.
**Aspersión:** Ahorra 30-50%. Ideal para pastos y granos. $1,500-3,000/m.
**Microaspersión:** Ahorra 50-70%. Precisión alta para invernaderos. $3,000-6,000/m.
**Retorno:** Aumento producción 20-40%, payback 2-3 años.`,
  },
  {
    id: "requisitos-cacao",
    category: "cultivo",
    keywords: [
      "cacao",
      "requisitos",
      "condiciones",
      "necesita",
      "optimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
    ],
    question: "¿Cuáles son los requisitos de cultivo del cacao?",
    crop: "cacao",
    answer: `**Requisitos del Cacao**
**Temperatura:** 20-28°C (óptimo). Mínima 15°C.
**Precipitación:** 1,500-2,500 mm/año.
**Altitud:** 0-1,500 msnm.
**pH:** 5.0-7.0 (óptimo 5.5-6.5).
**Suelo:** Franco a franco-arcilloso, profundo (>1.5 m), buen drenaje.
**Sombrío:** Requiere sombra temporal y permanente al 40-60%.`,
  },
  {
    id: "requisitos-cafe",
    category: "cultivo",
    keywords: [
      "cafe",
      "café",
      "requisitos",
      "condiciones",
      "necesita",
      "optimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
    ],
    question: "¿Cuáles son los requisitos de cultivo del café?",
    crop: "cafe",
    answer: `**Requisitos del Café**
**Temperatura:** 17-24°C (arábica). Máxima 30°C.
**Precipitación:** 1,500-2,200 mm/año.
**Altitud:** 1,200-1,800 msnm (arábica).
**pH:** 5.5-6.5.
**Suelo:** Franco a franco-arcilloso, profundo (>1 m), buen drenaje, pendiente 25-50%.
**Sombra regulada:** 30-40% con guamo, nogal o carbonero.`,
  },
  {
    id: "requisitos-granadilla",
    category: "cultivo",
    keywords: [
      "granadilla",
      "requisitos",
      "condiciones",
      "necesita",
      "optimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
    ],
    question: "¿Cuáles son los requisitos de cultivo de la granadilla?",
    crop: "granadilla",
    answer: `**Requisitos de la Granadilla**
**Temperatura:** 18-25°C (óptimo). Mínima 10°C. Muere a -1°C.
**Precipitación:** 1,200-2,000 mm/año.
**Altitud:** 1,500-2,200 msnm.
**pH:** 5.5-6.5.
**Suelo:** Franco a franco-arenoso, profundo (>0.8 m), excelente drenaje.
**Tutorado:** Sistema de soporte obligatorio (postes de concreto o guadua a 4 m).`,
  },
  {
    id: "clima-regiones",
    category: "clima",
    keywords: [
      "region",
      "zona",
      "altitud",
      "provincia",
      "magdalena medio",
      "soto",
      "guanenta",
      "velez",
    ],
    question: "¿Cuáles son las regiones agrícolas de Santander?",
    answer: `**Regiones Agrícolas de Santander**
**Magdalena Medio:** Cacao, plátano, ganadería. Cálido.
**Soto Norte y Sur:** Café de montaña, granadilla, hortalizas. Templado.
**Guanentá (San Gil, Socorro):** Café, caña de azúcar, maíz.
**Vélez:** Café de altura, tomate de árbol.
**García Rovira (Málaga):** Papa, maíz, trigo. Clima frío.
**Yariguíes:** Cacao y café de montaña.`,
  },
  {
    id: "general-suelo-mejora",
    category: "suelo",
    keywords: [
      "suelo",
      "mejorar",
      "enmienda",
      "abono",
      "compost",
      "organico",
      "tierra",
      "fertilidad",
    ],
    question: "¿Cómo mejorar la calidad del suelo en mi finca?",
    answer: `**Mejora de Suelo Agrícola**
**Materia orgánica:** Aplicar compost (10-15 ton/ha), estiércol curado, abonos verdes.
**Corrección de pH:** Cal dolomítica (1-2 ton/ha) si pH <5.5.
**Cobertura:** Mantener suelo cubierto con mulch, cultivos de cobertura o leguminosas.
**Rotación:** Alternar cultivos para evitar agotamiento de nutrientes específicos.`,
  },
  {
    id: "platano-siembra",
    category: "siembra",
    keywords: ["platano", "siembra", "sembrar", "plantar", "cormo", "hijo"],
    question: "¿Como sembrar platano en Santander?",
    crop: "platano",
    answer: `**Siembra de Platano en Santander**
**Epoca:** Todo el ano, ideal abril o septiembre, aprovechar lluvias.
**Material:** Hijos (cormos) de 500 g minimo de plantas sanas, desinfectar con fungicida.
**Distanciamiento:** 3 m x 2 m (1,667 plantas/ha) o 3.5 m x 2.5 m en zonas altas, surcos en curva de nivel.
**Preparacion:** Arado profundo (30-40 cm), hoyos 40x40x40 cm, 10 kg estiercol curado por hoyo.
**Siembra:** Profundidad 15-20 cm, compactar suavemente, aplicar mulch.`,
  },
  {
    id: "platano-rendimiento",
    category: "cultivo",
    keywords: ["platano", "rendimiento", "produccion", "racimo", "toneladas", "cosecha"],
    question: "¿Cual es el rendimiento del platano en Santander?",
    crop: "platano",
    answer: `**Rendimiento del Platano en Santander**
**Por planta:** 8-12 kg sin tecnologia, 15-25 kg con buena tecnologia, hasta 35 kg con alta tecnologia.
**Por hectarea:** 10-15 ton/ha regular, 20-30 ton/ha buena, 35-45 ton/ha excelente.
**Ciclo:** Primer corte a 12-14 meses, cortes cada 3-4 meses.
**Variedades:** Harton 15-25 kg/racimo, Bocadillo 8-12 kg, Guineo 10-15 kg, Dominico 12-20 kg.`,
  },
  {
    id: "platano-plagas",
    category: "plaga",
    keywords: ["platano", "plaga", "sigatoka", "moko", "pulgon", "enfermedad", "nematodo"],
    question: "¿Que plagas afectan al platano en Santander?",
    crop: "platano",
    answer: `**Plagas del Platano en Santander**
**Sigatoka Negra:** Marchitez de hojas, poda cada 2 meses, fungicida preventivo.
**Moko:** Marchitez aguda, eliminar plantas enfermas, desinfectar herramientas.
**Pulgon:** Vector del virus bunchy top, control con aceite neem y plaguicidas sistemicos.
**Gusano cogollero:** Defoliacion severa, trampas con luz, Bacillus thuringiensis.
**Nematodos:** Dano en raiz, rotacion de cultivos, abono verde.
**Prevencion:** Poda sanitaria cada 2 meses, monitoreo semanal, desinfeccion de herramientas.`,
  },
  {
    id: "yuca-siembra",
    category: "siembra",
    keywords: ["yuca", "siembra", "sembrar", "plantar", "mandioca", "estacas"],
    question: "¿Como sembrar yuca en Santander?",
    crop: "yuca",
    answer: `**Siembra de Yuca en Santander**
**Epoca:** Febrero a abril (primera quincena) o septiembre-octubre.
**Material:** Estacas de 20-25 cm de tallo adulto (6-12 meses), 4-5 nudos minimo, desinfectar con fungicida.
**Distanciamiento:** 1 m x 0.80 m (12,500 plantas/ha) o 1.20 m x 0.80 m (10,416 plantas/ha), surcos en curva de nivel.
**Preparacion:** Arado profundo (30-40 cm), incorporar estiercol o compost 10-15 ton/ha.
**Siembra:** Colocar estaca en angulo de 45° o vertical, dejar 5-7 cm sobre el suelo, no regar excesivamente.`,
  },
  {
    id: "yuca-rendimiento",
    category: "cultivo",
    keywords: ["yuca", "rendimiento", "produccion", "toneladas", "tuberculo", "cosecha"],
    question: "¿Cual es el rendimiento de la yuca en Santander?",
    crop: "yuca",
    answer: `**Rendimiento de Yuca en Santander**
**Por hectarea:** 8-12 ton/ha sin tecnologia, 15-25 ton/ha con buena tecnologia, hasta 35 ton/ha con alta tecnologia.
**Ciclo:** Cosecha temprana 8-10 meses, comercial 12-18 meses, maximo 18-24 meses.
**Por planta:** 6-10 tuberculos, 0.5-1.5 kg cada uno, total 3-8 kg por planta.
**Variedades:** Manihot (almidon alto), Col 2215 (resistente), Valenciana (dulce consumo fresco), Meco (rapido crecimiento).`,
  },
  {
    id: "yuca-usos",
    category: "cultivo",
    keywords: ["yuca", "usos", "consumo", "almidon", "harina", "industrial"],
    question: "¿Para que se usa la yuca en Santander?",
    crop: "yuca",
    answer: `**Usos de la Yuca en Santander**
**Consumo fresco:** Yuca hervida (alimento basico), yuca frita (chips), mazamorra con leche.
**Industrial:** Almidon de yuca (industria alimentaria), harina de yuca (panaderia), fecula (farmaceutica), bocadillo.
**Ganaderia:** Forraje de hojas y tallos, harina para concentrados, pulpas para porcinos y aves.
**Negocio:** Cassava chips exportacion, harina sin gluten, bioetanol, plasticos biodegradables.
**Mercado:** Demanda constante, precio $800-1,500/kg, potencial exportacion a Centroamerica y Caribe.`,
  },
  {
    id: "arroz-siembra",
    category: "siembra",
    keywords: ["arroz", "siembra", "sembrar", "grano", "cereal", "arrocero"],
    question: "¿Como sembrar arroz en Santander?",
    crop: "arroz",
    answer: `**Siembra de Arroz en Santander**
**Epoca:** Primera quincena de abril (principal) o septiembre-octubre, temperatura ideal 20-30°C.
**Metodos:** Siembra directa, trasplante de semillero, siembra mecanizada.
**Distanciamiento:** 20 cm entre lineas (directa), 20x15 cm (trasplante), 80-100 semillas/m².
**Preparacion:** Arado profundo 20-30 cm, rastreo, bordos para control de agua, nivelacion.
**Agua:** Encharcamiento 3-5 cm durante crecimiento, drenaje 15 dias antes de cosecha.
**Semillas:** CT-201 (zonas calidas), Fedearroz 50 (alto rendimiento), Cica-8 (tolerante enfermedades).`,
  },
  {
    id: "arroz-variedades",
    category: "cultivo",
    keywords: ["arroz", "variedad", "semilla", "variedades", "ciclo"],
    question: "¿Que variedades de arroz hay para Santander?",
    crop: "arroz",
    answer: `**Variedades de Arroz para Santander**
**CT-201:** Ciclo corto 120-130 dias, rendimiento 5-6 ton/ha, tolerante encharcamiento, grano largo.
**Fedearroz 50:** Ciclo medio 130-140 dias, rendimiento 6-7 ton/ha, alta resistencia a plagas, grano mediano.
**Cica-8:** Ciclo largo 140-150 dias, rendimiento 5.5-6.5 ton/ha, tolerante a enfermedades, grano largo.`,
  },
  {
    id: "maiz-siembra",
    category: "siembra",
    keywords: ["maiz", "siembra", "sembrar", "plantar", "elote", "choclo", "semilla", "grano"],
    question: "¿Como sembrar maiz en Santander?",
    crop: "maiz",
    answer: `**Siembra de Maiz en Santander**
**Epoca:** Primera quincena de abril (principal) o septiembre-octubre, temperatura ideal 18-32°C.
**Distanciamiento:** 90 cm entre lineas x 20 cm entre plantas, 55,000-70,000 plantas/ha.
**Preparacion:** Arado profundo 25-35 cm, rastreo, incorporar estiercol 10-15 ton/ha.
**Siembra:** 2-3 semillas por punto a 3-5 cm profundidad, raleo a los 20 dias, escardar a los 15 y 30 dias.
**Semillas:** CB-5 (hibrido alto rendimiento), Cali-723 (zonas calidas), Criollo mejorado, DEKALB.
**Fertilizacion:** 200 kg/ha NPK 15-15-15 en siembra, 150 kg/ha urea a los 30 dias, 100 kg/ha KCl en floracion.
**Cosecha:** 120-150 dias, grano duro y seco, rendimiento 3-6 ton/ha.`,
  },
  {
    id: "maiz-rendimiento",
    category: "cultivo",
    keywords: ["maiz", "rendimiento", "produccion", "toneladas", "mazorca", "grano", "cosecha"],
    question: "¿Cual es el rendimiento del maiz en Santander?",
    crop: "maiz",
    answer: `**Rendimiento del Maiz en Santander**
**Por categoria:** 1.5-2.5 ton/ha sin tecnologia, 3-5 ton/ha tecnologia media, 6-8 ton/ha alta tecnologia.
**Ciclo:** Precoz 90-110 dias, medio 110-130 dias, tardio 130-160 dias.
**Por planta:** 1-2 mazorcas, 200-400 g cada una, 500-800 granos por mazorca.
**Por tipo:** Maiz grano duro 4-6 ton/ha, maiz elote 3-5 ton/ha, maiz criollo 2-3 ton/ha.
**Factores:** Hibrido +40%, fertilizacion oportuna +30%, control malezas +25%, riego +20%.`,
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

function scoreEntry(query: string, entry: RagEntry): number {
  const qTokens = tokenize(query);
  const qNorm = normalize(query);
  if (qTokens.length === 0) return 0;

  const keywordMatches = entry.keywords.filter((kw) => qNorm.includes(normalize(kw))).length;
  const questionMatch = normalize(entry.question).includes(qNorm) ? 5 : 0;
  const answerTokens = tokenize(entry.answer);
  const tokenOverlap =
    answerTokens.filter((t) => qTokens.includes(t)).length / Math.max(answerTokens.length, 1);

  return keywordMatches * 3 + questionMatch * 2 + tokenOverlap * 10;
}

export const MIN_RAG_RELEVANCE_SCORE = 3.0;

export function searchKnowledgeBase(
  query: string,
  topK = 2,
  minScore = MIN_RAG_RELEVANCE_SCORE,
): RagResult[] {
  const results: RagResult[] = KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: scoreEntry(query, entry),
  }));

  return results
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function getCropRequirements(crop: string): RagEntry | undefined {
  const key = normalize(crop);
  return KNOWLEDGE_BASE.find(
    (e) => e.id.startsWith("requisitos-") && normalize(e.crop ?? "") === key,
  );
}

export function getEntriesByCategory(category: string): RagEntry[] {
  return KNOWLEDGE_BASE.filter((e) => e.category === category);
}

export function formatRagContext(results: RagResult[]): string {
  if (results.length === 0) return "";
  return results
    .map(
      (r, i) =>
        `[Documento Agronómico ${i + 1} | Fuente: Manual Técnico ICA / Fedecacao / Cenicafé (v2.0)]\nPregunta: ${r.entry.question}\nContenido: ${r.entry.answer}`,
    )
    .join("\n\n");
}
