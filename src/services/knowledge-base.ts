import { CROP_REQUIREMENTS as cropProfiles, type CropProfile } from "@/data/crop-requirements";

export type { CropProfile };

export const cultivosSoportados = Object.keys(cropProfiles);

export interface KnowledgeEntry {
  id: string;
  category:
    | "cultivo"
    | "clima"
    | "riesgo"
    | "siembra"
    | "cosecha"
    | "plaga"
    | "suelo"
    | "general"
    | "tecnico";
  keywords: string[];
  question: string;
  answer: string;
  crop?: string;
}

export const SYNONYMS: Record<string, string[]> = {
  cacao: ["chocolate", "mazorca", "cacao", "theobroma"],
  cafe: ["café", "cafe", "pergamino", "arabica", "arábica", "robusta"],
  granadilla: ["granadilla", "pasiflora", "passiflora"],
  platano: ["plátano", "platano", "banano", "banana", "guineo"],
  yuca: ["yuca", "mandioca", "cassava", "manioca"],
  arroz: ["arroz", "grano", "cereal"],
  maiz: ["maíz", "maiz", "elote", "choclo", "jilguero"],
  sembrar: ["sembrar", "siembra", "plantar", "cultivar", "establecer", "escardar"],
  plaga: ["plaga", "enfermedad", "hongo", "insecto", "patógeno", "bacteria"],
  suelo: ["suelo", "tierra", "terreno", "substrato", "capa"],
  clima: ["clima", "tiempo", "meteorología", "condiciones", "temporada"],
  riego: ["irrigación", "riego", "agua", "humedad", "irrigar", "aspersión"],
  cosecha: ["cosecha", "recolección", "coger", "recoger", "producción", "cosechar"],
  rendimiento: ["rendimiento", "producción", "toneladas", "kilos", "peso", "kg", "cosecha"],
  mercado: ["mercado", "precio", "venta", "comercialización", "exportar", "vender"],
  financiacion: ["crédito", "préstamo", "financiación", "subsidio", "banco", "apoyo"],
  sostenible: ["sostenible", "orgánico", "ecológico", "ambiental", "agroecología"],
  temperatura: ["temperatura", "calor", "frío", "helada", "grados", "frío extremo"],
  lluvia: ["lluvia", "precipitación", "lluvias", "agua", "invierno", "época de lluvias"],
  viento: ["viento", "brisa", "corriente", "aire", "ráfaga"],
  altitud: ["altitud", "altura", "msnm", "elevación", "nivel del mar", "metros"],
  ph: ["ph", "acidez", "alcalinidad", "reacción del suelo", "ácido"],
  fertilizante: ["fertilizante", "fertilización", "abono", "nutrientes", "enmienda"],
  variedad: ["variedad", "culta", "semilla", "línea", "genética", "material genético"],
  poda: ["poda", "corte", "ramas", "desrame", "limpieza"],
  cosecha_cacao: ["cosecha cacao", "cortar mazorcas", "recolección cacao"],
  humedad: ["humedad", "húmedo", "agua", "mojado", "encharcamiento"],
  drenaje: ["drenaje", "escurrimiento", "drenar", "canal"],
  abono: ["abono", "estiércol", "compost", "orgánico", "bocashi"],
  boro: ["boro", "deficiencia boro", "micronutriente"],
  monitoreo: ["monitoreo", "vigilancia", "seguimiento", "inspección"],
  manejo_riesgo: ["manejo", "prevención", "control", "mitigación"],
};

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ═══════════════════════════════════════════════════════════
  // CACAO (7 entradas)
  // ═══════════════════════════════════════════════════════════
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
      "establecer",
      "vivero",
      "semilla",
    ],
    question: "¿Cómo sembrar cacao en Santander?",
    crop: "cacao",
    answer: `**Siembra de Cacao en Santander**

El cacao es un cultivo ideal para zonas bajas y medias de Santander. Aquí los pasos clave:

**Época de siembra:**
- Entre **abril y junio**, aprovechando las primeras lluvias
- Evitar épocas de sequía prolongada para la sobrevivencia de plántulas

**Distanciamiento:**
- **3 m x 3 m** en terreno plano
- **3.5 m x 3.5 m** en laderas para control de erosión
- Densidad: ~1,100 árboles/ha

**Preparación del terreno:**
- Realizar **limpieza de matas** y marcación de líneas
- Cavar hoyos de **60x60x60 cm**
- Mezclar tierra con **estiércol curado** y fertilizante fosforado

**Variedades recomendadas:**
- **CCN-51**: Alta productividad y tolerancia a enfermedades
- **IMC-67**: Buen rendimiento y calidad de almendra
- **Tingo María**: Adaptado a zonas húmedas

**Consejos prácticos:**
- Instalar **materia orgánica** en el fondo del hoyo
- Colocar plántulas a **5 cm de profundidad** de la marca de viento
- **Tuteles o tutor vivo** (erythrina o porote) desde el inicio`,
  },
  {
    id: "cacao-rendimiento",
    category: "cultivo",
    keywords: [
      "cacao",
      "rendimiento",
      "producción",
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

El rendimiento varía según manejo, variedad y condiciones del sitio:

**Rendimientos típicos:**
- **Cacao sin tecnología**: 300-500 kg/ha en almendra seca
- **Cacao con buena tecnología**: 1,500-2,500 kg/ha en almendra seca
- **Cacao con alta tecnología**: hasta **3,500 kg/ha** en almendra seca

**Ciclo de producción:**
- El cacao entra en producción a los **3-4 años**
- Plenitud productiva entre **6-8 años**
- Vida útil del cultivo: **25-30 años** con podas adecuadas

**Factores que incrementan rendimiento:**
- **Poda de formación y mantenimiento** adecuada
- **Fertilización balanceada** (N-P-K + micromedios)
- Control oportuno de **plagas y enfermedades**
- **Sombra regulada** (30-50% de cobertura)

**Rendimiento por almendra fresca:**
- **1 kg de almendra seca ≈ 4 kg de mazorca fresca**
- La relación almendra/mazorca es del **25-30%**

**Recomendación:**
- Promover **transformación artesanal** para mejorar ingresos
- Buscar mercados de **cacao fino de aroma** que pagan primas`,
  },
  {
    id: "cacao-enfermedades",
    category: "plaga",
    keywords: [
      "cacao",
      "enfermedad",
      "monilia",
      "escoba de bruja",
      "frosty pod",
      "mazorca",
      "hongo",
      "plaga",
      "negro",
    ],
    question: "¿Qué enfermedades afectan al cacao en Santander?",
    crop: "cacao",
    answer: `**Enfermedades del Cacao en Santander**

Las principales enfermedades que afectan el cultivo:

**1. Moniliasis (Moniliophthora roreri):**
- Causa pérdidas del **30-80%** de la producción
- Afecta mazorcas jóvenes y maduras
- **Control**: Remoción de mazorcas enfermas cada 15 días, aplicación de **trichoderma**

**2. Escoba de Bruja (Crinipellis perniciosa):**
- Deformación de brotes, flores y frutos
- Se dispersa con **lluvia y viento**
- **Control**: Poda sanitaria, eliminación de escobas, aplicación de **caldo bordelés**

**3. Mazorca Negra (Phytophthora spp.):**
- Pudrición de la mazorca, exudado oscuro
- Favorecida por **alta humedad y temperaturas bajas**
- **Control**: Buen drenaje, aplicación de **oxychloride de cobre**

**4. Antracnosis (Colletotrichum spp.):**
- Manchas oscuras en frutos y hojas
- **Control**: Cobertura de frutos, aplicación de **azufre**

**Prevención general:**
- Mantener **sombra regulada** (40-50%)
- **Remoción semanal** de mazorcas enfermas
- Aplicar **biofertilizantes** y trichoderma en vivero
- Variedades tolerantes como **CCN-51**`,
  },
  {
    id: "cacao-variedades",
    category: "cultivo",
    keywords: [
      "cacao",
      "variedad",
      "CCN-51",
      "IMC",
      "Tingo",
      "variedades",
      "semilla",
      "genética",
      "culta",
    ],
    question: "¿Qué variedades de cacao son adecuadas para Santander?",
    crop: "cacao",
    answer: `**Variedades de Cacao para Santander**

Selección de variedades según zona y condiciones:

**Variedades recomendadas:**

**CCN-51:**
- **Alta productividad** (2,000-3,500 kg/ha)
- Tolerante a **enfermedades** (monilia y escoba de bruja)
- Necesita **buena fertilización** y manejo intensivo
- Sabor más amargo, ideal para procesamiento industrial

**IMC-67:**
- Buen equilibrio entre **producción y calidad**
- Muy cultivada en zonas cálidas de Santander
- Excelente para **cacao fino de aroma**

**Tingo María:**
- Adaptada a zonas **húmedas y semihúmedas**
- Productividad moderada (1,200-1,800 kg/ha)
- Buena tolerancia a sequía temporal

**EET-8 (Trinitario):**
- **Calidad excepcional** para mercados especiales
- Menor rendimiento pero prima de precio
- Ideal para agricultores certificados

**Recomendaciones:**
- En zonas **bajas y cálidas** (Tolima, Huila, Arauca): CCN-51 o IMC-67
- En zonas **medias** (Santander, Norte de Santander): Mezcla de Tingo María y CCN-51
- Para **exportación de fino**: EET-8 o clones selección local
- Siempre usar **material certificado** de viveros autorizados`,
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
    answer: `**Suelo Recomendado para Cacao en Santander**

El cacao tiene exigencias específicas en suelo:

**Características ideales:**
- **Profundidad**: Mínimo **1.5 m** sin capa impermeable
- **Textura**: Franco-arcillosa o franco-arenosa
- **Drenaje**: Bueno, sin encharcamientos
- **pH**: Entre **5.5 y 7.0** (ligeramente ácido a neutro)

**Análisis de suelo recomendado:**
- Realizar análisis cada **2 años**
- Evaluar: **pH, materia orgánica, fósforo, potasio, calcio, magnesio**
- Corregir con **cal dolomítica** si pH < 5.0

**Enmiendas para suelos tropicales:**
- **Cal dolomítica**: 1-2 ton/ha cada 3 años (si pH bajo)
- **Yeso agrícola**: Para corregir deficiencia de calcio
- **Abono orgánico**: **20-30 kg/árbol/año** de estiércol curado

**Manejo de la materia orgánica:**
- Mantener **cobertura viva** (gramíneas, leguminosas)
- Aplicar **mulch** de hojarasca o bagazo de cacao
- **Compostaje** de residuos de poda

**Precaución:**
- Evitar suelos con **alta pendiente** sin terrazas
- No sembrar en suelos con **capa impermeable** a <80 cm
- Los suelos arcillosos necesitan **mejor drenaje**`,
  },
  {
    id: "cacao-cosecha",
    category: "cosecha",
    keywords: [
      "cacao",
      "cosecha",
      "recolección",
      "coger",
      "recoger",
      "mazorca",
      "cosechar",
      "almendra",
    ],
    question: "¿Cómo cosechar cacao correctamente?",
    crop: "cacao",
    answer: `**Cosecha del Cacao en Santander**

Cosecha oportuna es clave para calidad y rendimiento:

**Señales de madurez:**
- Cambio de **color verde a amarillo/rojizo** en la cáscara
- Sonido **sordo al golpear** con machete
- **Grietas superficiales** en la cáscara
- Semillas de color **blanco-crema** al cortar

**Época de cosecha:**
- **Cosecha principal**: Octubre-noviembre (cosecha mayor)
- **Mitaca**: Abril-mayo (cosecha menor)
- Recolectar **cada 15-20 días** en épocas de producción

**Técnica de cosecha:**
- Usar **cuchilla o tijera especial** (nunca machete en mazorcas)
- Cortar con **tallos de 2-3 cm** pegados a la rama
- No dejar restos de mazorca en el árbol
- Colocar mazorcas en **canastas o costales limpios**

**Post-cosecha:**
- **Abrir mazorcas** dentro de las **24 horas** posteriores
- **Fermentación**: 5-6 días en cajones de madera
- **Secado**: En patios o secadores solares hasta **7% de humedad**
- Almacenar en **lotes separados** por calidad

**Cuidados importantes:**
- **No hervir** las semillas antes de secar (pierde calidad)
- Evitar **secado directo sobre concreto** a pleno sol
- Mantener **higiene** en toda la cadena post-cosecha`,
  },
  {
    id: "cacao-fertilizacion",
    category: "cultivo",
    keywords: [
      "cacao",
      "fertilización",
      "fertilizante",
      "abono",
      "nutrientes",
      "nitrógeno",
      "fósforo",
      "potasio",
      "micronutrientes",
    ],
    question: "¿Cómo fertilizar cacao en Santander?",
    crop: "cacao",
    answer: `**Fertilización del Cacao en Santander**

Plan de nutrición balanceada para productividad sostenible:

**Necesidades nutricionales por árbol/año:**
- **Nitrógeno (N)**: 100-150 g
- **Fósforo (P)**: 30-50 g
- **Potasio (K)**: 80-120 g
- **Calcio (Ca)**: 40-60 g
- **Magnesio (Mg)**: 20-30 g
- **Boro (B)**: 5-10 g

**Programa de fertilización:**
1. **Mes 1 (abril)**: Aplicar NPK completo + Mg
2. **Mes 2 (julio)**: Repetir NPK + microelementos
3. **Mes 3 (octubre)**: Nitrógeno + Potasio

**Fuentes recomendadas:**
- **Urea** (46-0-0) para nitrógeno
- **Triple superfosfato** (0-46-0) para fósforo
- **Cloruro de potasio** (0-0-60) para potasio
- **Abono orgánico**: 20-30 kg de compost por árbol

**Aplicación correcta:**
- Colocar en **anillo a 1.5 m** del tronco
- **Profundidad**: 10-15 cm en zanja o barbacoa
- Evitar contacto directo con **raíces principales**
- Aplicar después de **podas y remoción** de mazorcas

**Señales de deficiencia:**
- **Amarillamiento**: Falta de nitrógeno
- **Hojas púrpuras**: Falta de fósforo
- **Quemaduras en hojas viejas**: Falta de potasio
- **Deformación de mazorcas**: Falta de boro`,
  },

  // ═══════════════════════════════════════════════════════════
  // CAFÉ (6 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "cafe-siembra",
    category: "siembra",
    keywords: [
      "café",
      "cafe",
      "siembra",
      "sembrar",
      "plantar",
      "arabica",
      "arábica",
      "robusta",
      "vivero",
    ],
    question: "¿Cómo sembrar café en Santander?",
    crop: "cafe",
    answer: `**Siembra de Café en Santander**

El café de Santander tiene reconocimiento por su calidad:

**Época de siembra:**
- **Entre marzo y junio**, con las primeras lluvias
- Aprovechar la **humedad del suelo** para establecimiento

**Distanciamiento:**
- **2 m x 1.5 m** (3,333 plantas/ha)
- **2 m x 2 m** (2,500 plantas/ha) en laderas
- Surcos en **curva de nivel** para control de erosión

**Preparación del terreno:**
- **Bancos o terrazas** en laderas
- Hoyos de **50x50x50 cm** con abono orgánico
- Marcar líneas con **estacas y cordel**

**Variedades recomendadas:**
- **Caturra**: Alta calidad, baja estatura, buena para mecanización
- **Castillo**: Resistente a **roya**, alto rendimiento
- **Tabi**: Tolerante a sequía, buena para zonas secas
- **Colombia**: Resistente a roya y broca, productiva

**Vivero:**
- Germinar semillas en **semillero protegido**
- Trasplantar a **bolsas con sustrato** a los 30 días
- **Aclimatar** 2 semanas antes de llevar al campo
- Plantar con **2-3 pares de hojas verdaderas**`,
  },
  {
    id: "cafe-rendimiento",
    category: "cultivo",
    keywords: [
      "café",
      "cafe",
      "rendimiento",
      "producción",
      "cosecha",
      "kg",
      "quintales",
      "cereza",
      "pergamino",
    ],
    question: "¿Cuál es el rendimiento del café en Santander?",
    crop: "cafe",
    answer: `**Rendimiento del Café en Santander**

Producción según nivel tecnológico:

**Rendimientos por categoría:**
- **Baja tecnología**: 10-15 qq/ha (cosecha pergamino)
- **Tecnología media**: 20-30 qq/ha
- **Alta tecnología**: 35-50 qq/ha (en cafés especiales)

**Conversión importante:**
- **1 qq cereza ≈ 0.5 qq pergamino ≈ 0.45 qq verde**
- **1 saco de café = 60 kg** de pergamino

**Ciclo productivo:**
- Primer año: Solo **mantequilla** (producción mínima)
- Año 2-3: Producción **parcial** (10-15 qq/ha)
- **Plenitud**: Años 4-8 (30-50 qq/ha)
- **Producción estable**: Años 8-15 con poda

**Factores de incremento:**
- **Poda de renovación** cada 8-10 años
- **Fertilización** basada en análisis de suelo
- **Sombra regulada** con árboles leguminosos
- **Control integrado** de plagas

**Rendimiento por planta:**
- Caturra: **2-3 kg** de cereza por planta
- Castillo: **2.5-3.5 kg** de cereza por planta
- Variedades altas: **4-5 kg** de cereza por planta`,
  },
  {
    id: "cafe-altitud",
    category: "cultivo",
    keywords: [
      "café",
      "cafe",
      "altitud",
      "altura",
      "msnm",
      "elevación",
      "nivel del mar",
      "zona",
      "metros",
    ],
    question: "¿En qué altitud crece mejor el café en Santander?",
    crop: "cafe",
    answer: `**Altitud para Café en Santander**

La altitud determina calidad y tipo de café:

**Zonas de producción por altitud:**
- **1,200-1,500 msnm**: Café **bueno**, rendimiento alto
- **1,500-1,800 msnm**: Café **superior**, equilibrio calidad-rendimiento
- **1,800-2,200 msnm**: Café **especial**, alta acidez y complejidad
- **>2,200 msnm**: Café **premium**, perfil aromático excepcional

**Relación altitud-calidad:**
- Mayor altitud = **maduración más lenta** del grano
- Mayor **densidad** del grano y mejor cuerpo
- Mayor **acidez** y notas frutales
- Menor rendimiento pero **mayor precio**

**Zonas ideales en Santander:**
- **Huila**: 1,200-2,000 msnm (producción y calidad)
- **Nariño**: 1,700-2,200 msnm (café de alta montaña)
- **Antioquia**: 1,300-2,000 msnm (diversidad de microclimas)
- **Caldas, Risaralda, Quindío (Eje Cafetero)**: 1,200-1,800 msnm
- **Tolima**: 1,200-1,900 msnm (altitud y buena infraestructura)

**Temperatura óptima:**
- **17-23°C** para café arábica
- **>25°C**: Maduración rápida, menor calidad
- **<10°C**: Riesgo de heladas y daño en hojas

**Recomendación:**
- Buscar fincas entre **1,500-1,800 msnm** para equilibrio
- Para **café especial**: Priorizar zonas >1,800 msnm
- Verificar **temperatura media anual** antes de invertir`,
  },
  {
    id: "cafe-plagas",
    category: "plaga",
    keywords: [
      "café",
      "cafe",
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
    answer: `**Plagas y Enfermedades del Café en Santander**

Principales amenazas y su manejo:

**1. Roya del Café (Hemileia vastatrix):**
- Manchas **amarillas/naranjas** en hojas
- Causa defoliación y pérdida de producción
- **Control**: Variedades resistentes (Castillo, Colombia), **fungicidas** preventivos

**2. Broca del Café (Hypothenemus hampei):**
- Perfora frutos y deja **orificios** en el grano
- Pierde hasta **30%** de producción
- **Control**: **Recolección de frutos caídos**, trampas con feromonas

**3. Minador del Café (Leucoptera coffeella):**
- Galerías en hojas, aspecto **seco**
- **Control**: **Poda de mantenimiento**, aplicación de **aceites minerales**

**4. Cercospora (Cercospora coffeicola):**
- Manchas oscuras en hojas y frutos
- **Control**: **Fungicidas de cobre**, buena ventilación

**Manejo Integrado de Plagas (MIP):**
- **Mantener sombra regulada** (30-40%)
- **Poda de mantenimiento** regular
- **Control biológico** con **Beauveria bassiana**
- **Monitoreo semanal** de plantas
- **Umbral de acción**: 3-5% de hojas con síntomas`,
  },
  {
    id: "cafe-cosecha",
    category: "cosecha",
    keywords: [
      "café",
      "cafe",
      "cosecha",
      "recolección",
      "cereza",
      "pergamino",
      "despulpado",
      "fermentación",
    ],
    question: "¿Cómo cosechar café en Santander?",
    crop: "cafe",
    answer: `**Cosecha del Café en Santander**

Técnica adecuada para máxima calidad:

**Señales de madurez:**
- Frutos de color **rojo brillante** (cereza)
- Frutos **ligeramente blandos** al tacto
- Al apretar, el grano se **separa fácilmente** del mucílago
- **No esperar** a que se vuelvan morados o secos

**Época de cosecha:**
- **Cosecha principal**: Octubre-diciembre
- **Cosecha secundaria**: Abril-mayo
- **Recolección cada 8-15 días** en temporada

**Método de recolección:**
- **Despulpado a mano** (para cafés especiales): Solo frutos rojos
- **Mecánico**: Despulpadora para grandes volúmenes
- **No mezclar** frutos verdes con rojos

**Procesamiento post-cosecha:**
1. **Despulpado**: Retirar pulpa con despulpadora
2. **Fermentación**: 12-36 horas en tanques (lavado)
3. **Secado**: En patios o secadores mecánicos a **11-12% humedad**
4. **Trillado**: Retirar pergamino

**Cuidados:**
- **No fermentar** más de 36 horas (riesgo de sabor vinoso)
- **Secar uniformemente** sin quemar el grano
- **Almacenar** en costales de yute, lugar fresco y seco`,
  },
  {
    id: "cafe-poda",
    category: "cultivo",
    keywords: ["café", "cafe", "poda", "corte", "ramas", "desrame", "renovación", "limpieza"],
    question: "¿Cómo podar café en Santander?",
    crop: "cafe",
    answer: `**Poda del Café en Santander**

Poda es fundamental para productividad y salud del cultivo:

**Tipos de poda:**

**1. Poda de formación (años 1-3):**
- Eliminar **ramas productivas bajas** (a <30 cm del suelo)
- Mantener **4 ramas principales** bien distribuidas
- Formar **estructura tipo vaso** o enrenchetada

**2. Poda de mantenimiento:**
- Eliminar **ramas secas, enfermas y cruzadas**
- Renovar ramas productivas cada **2-3 años**
- Realizar **cada 6 meses** (junio y diciembre)

**3. Poda de renovación (cada 8-10 años):**
- **Corte a 1 m** del suelo (deschape o corte bajo)
- Dejar brotar **3-4 ramas fuertes**
- Acompañar con **fertilización pesada**

**Herramientas:**
- **Tijera de podar** para ramas <3 cm
- **Sierra** para ramas gruesas
- **Machete afilado** para corte bajo
- **Desinfectar** herramientas con **hipoclorito**

**Beneficios:**
- Aumento del **30-50%** de producción
- Mejor **circulación de aire** (menos enfermedades)
- Facilita **cosecha y monitoreo**
- Vida útil extendida del cultivo`,
  },

  // ═══════════════════════════════════════════════════════════
  // GRANADILLA (5 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "granadilla-siembra",
    category: "siembra",
    keywords: [
      "granadilla",
      "siembra",
      "sembrar",
      "plantar",
      "pasiflora",
      "passiflora",
      "tutor",
      "enredadera",
    ],
    question: "¿Cómo sembrar granadilla en Santander?",
    crop: "granadilla",
    answer: `**Siembra de Granadilla en Santander**

Cultivo de alto valor en zonas montañosas:

**Época de siembra:**
- **Entre marzo y mayo**, aprovechando lluvias
- Temperatura ideal: **18-25°C**

**Distanciamiento:**
- **3 m x 2.5 m** en terreno plano
- **4 m x 3 m** en laderas pronunciadas
- Densidad: **800-1,333 plantas/ha**

**Preparación del terreno:**
- Hoyos de **60x60x60 cm**
- Mezclar con **estiércol curado** (10 kg/hoyo)
- Instalar **tutor o estructura de soporte**

**Sistema de tutorado:**
- **Postes de concreto** (4 m de alto) con cable galvanizado
- **Tutor vivo**: Guadua o bambú (requiere manejo)
- **Cables en cruz** para distribuir enredadera

**Variedades recomendadas:**
- **Bocadillo**: La más cultivada en Boyacá, Cundinamarca y Santander
- **Sweetgrenadine**: Dulce y aromática
- **Gulupa**: Valor agregado alto, demanda en Nariño y Norte de Santander

**Pasos para establecimiento:**
1. Germinar semillas en **semillero**
2. Trasplantar plántulas de **45-60 días**
3. Guiar enredadera hacia el **soporte** con mecate
4. Realizar **poda de formación** a los 3 meses`,
  },
  {
    id: "granadilla-rendimiento",
    category: "cultivo",
    keywords: ["granadilla", "rendimiento", "producción", "kilos", "fruto", "cosecha", "toneladas"],
    question: "¿Cuál es el rendimiento de la granadilla en Santander?",
    crop: "granadilla",
    answer: `**Rendimiento de Granadilla en Santander**

Producción por planta y hectárea:

**Rendimiento típico:**
- **Plantas jóvenes** (año 1-2): 5-10 kg/planta
- **Plantas adultas** (año 3+): **15-25 kg/planta**
- **Promedio por hectárea**: 12,000-25,000 kg/ha/año

**Ciclo productivo:**
- **Primer fruto**: 8-10 meses después de siembra
- **Plenitud productiva**: Años 2-6
- **Producción estable**: 6-8 años con buen manejo

**Factores de rendimiento:**
- **Polinización**: La granadilla necesita **polinización cruzada**
- Instalar **colmenas** (1-2 colmenas/ha)
- Poda de **aireación** para permitir paso de insectos
- **Fertilización** oportuna (NPK + calcio)

**Época de mayor producción:**
- **Marzo-junio**: Cosecha principal (60% de producción)
- **Septiembre-noviembre**: Cosecha secundaria (30%)
- Producción **todo el año** en zonas adecuadas

**Calidad del fruto:**
- Peso promedio: **150-250 g** por fruto
- Porcentaje de pulpa: **30-40%**
- Color naranja intenso = **madurez óptima**`,
  },
  {
    id: "granadilla-cuidados",
    category: "cultivo",
    keywords: [
      "granadilla",
      "cuidados",
      "manejo",
      "poda",
      "fertilización",
      "riego",
      "tutor",
      "abono",
    ],
    question: "¿Qué cuidados necesita la granadilla?",
    crop: "granadilla",
    answer: `**Cuidados de la Granadilla en Santander**

Manejo integral para alta productividad:

**Poda y guía:**
- **Poda de formación**: Mantener 3-4 ramas principales
- **Poda de aireación**: Eliminar ramas secas y enfermas
- **Guía**: Asegurar enredadera al soporte cada 15 días

**Fertilización:**
- **Año 1**: 150 g de NPK 15-15-15 cada 2 meses
- **Año 2+**: 300 g NPK + 100 g de cloruro de potasio
- **Aplicación**: En anillo a 1.5 m del tronco

**Riego:**
- **1-2 riegos por semana** en época seca
- **20-30 litros/planta** por riego
- **No encharcar** (raíces susceptibles a pudrición)

**Polinización:**
- Instalar **1-2 colmenas de abejas** por hectárea
- Mantener **floración nativa** cercana (meliponas)
- **Polinización manual** en épocas de baja actividad de abejas

**Control de plagas:**
- **Mosca de la fruta**: Trampas con **cebo attract**
- **Nematodos**: Rotación de cultivos, **abono verde**
- **Fusarium**: Buen drenaje, **trichoderma** en suelo

**Cosecha:**
- Recolectar cuando el fruto esté **naranja brillante**
- **No arrancar** (cortar con tijera para no dañar rama)
- Manipular con cuidado para **evitar magulladuras**`,
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
      "altitude",
      "zona",
      "condiciones",
    ],
    question: "¿Qué clima necesita la granadilla?",
    crop: "granadilla",
    answer: `**Condiciones Climáticas para Granadilla**

Requisitos ambientales específicos:

**Temperatura:**
- **Óptima**: 18-25°C
- **Mínima tolerada**: 10°C (crecimiento se detiene)
- **Máxima tolerada**: 30°C (estrés y caída de frutos)
- **Heladas**: Muy sensible, puede **morir con -1°C**

**Altitud:**
- **Ideal**: 1,500-2,200 msnm
- **Mínima**: 1,200 msnm (mayor plagas)
- **Máxima**: 2,400 msnm (crecimiento lento)

**Precipitación:**
- **1,200-2,000 mm anuales** distribuidos
- No tolera **sequías prolongadas** (>2 meses sin lluvia)
- No tolera **encharcamiento** permanente

**Humedad relativa:**
- **60-80%** es ideal
- **>90%**: Mayor incidencia de enfermedades fúngicas

**Viento:**
- Proteger con **cortavientos** naturales o artificiales
- El viento fuerte **daña flores** y reduce polinización

**Luminosidad:**
- **Sol pleno** es necesario para floración
- **Sombra excesiva** reduce producción

**Zonas recomendadas en Santander:**
- **Valles interandinos** de Boyacá y Cundinamarca: 1,600-2,000 msnm
- **Zonas altoandinas** de Santander y Norte de Santander: 1,800-2,100 msnm
- **Mesetas altas** de Nariño: 1,500-1,900 msnm

**Precaución:**
- Verificar **historial de heladas** en la zona antes de sembrar
- Instalar **termómetros** en diferentes puntos de la finca`,
  },
  {
    id: "granadilla-enfermedades",
    category: "plaga",
    keywords: [
      "granadilla",
      "enfermedad",
      "fusarium",
      "nematodo",
      "mosca",
      "hongo",
      "plaga",
      "pudrición",
      "virus",
    ],
    question: "¿Qué enfermedades afectan la granadilla en Santander?",
    crop: "granadilla",
    answer: `**Enfermedades de la Granadilla en Santander**

Principales problemas sanitarios:

**1. Fusarium Wilt (Marchitez de Fusarium):**
- **Secado progresivo** de ramas y hojas
- Se disminuye la **producción** drásticamente
- **Control**: Buena **sanidad del suelo**, **trichoderma**, rotación

**2. Nematodos de la raíz (Meloidogyne spp.):**
- **Abultamientos** en raíces (nudo de raíz)
- Plantas débiles, **amarillentas**, bajo rendimiento
- **Control**: **Abono verde** con leguminosas, **nematocidas biológicos**

**3. Mosca de la fruta (Anastrepha spp.):**
- **Larvas** dentro del fruto, pudrición
- Frutos caídos prematuramente
- **Control**: **Trampas McPhail**, **cebo attract**, recolección de frutos caídos

**4. Virus de la granadilla (Passion fruit woodiness):**
- **Deformación** de frutos, coloración anormal
- Transmisión por **pulgones**
- **Control**: **Eliminación de plantas enfermas**, control de vectores

**Prevención general:**
- **Drenaje adecuado** en toda la finca
- **Poda de aireación** constante
- **Monitoreo semanal** de hojas y frutos
- **Desinfección** de herramientas entre plantas
- **Suelo sano**: Mantener **materia orgánica** alta`,
  },

  // ═══════════════════════════════════════════════════════════
  // PLÁTANO (3 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "platano-siembra",
    category: "siembra",
    keywords: [
      "plátano",
      "platano",
      "banano",
      "banana",
      "siembra",
      "sembrar",
      "plantar",
      "cormo",
      "hijo",
      "guineo",
    ],
    question: "¿Cómo sembrar plátano en Santander?",
    crop: "platano",
    answer: `**Siembra de Plátano en Santander**

Cultivo básico y de alta demanda regional:

**Época de siembra:**
- **Todo el año** puede sembrarse en Santander
- **Ideal**: Primera quincena de **abril o septiembre**
- Aprovechar **épocas de lluvia** para establecimiento

**Material de siembra:**
- **Hijos (cormos)** de plantas sanas y productivas
- Peso mínimo: **500 g** por hijo
- **No usar** hijos de plantas con virus (moko, bunchy top)
- **Desinfectar** con **fungicida** antes de sembrar

**Distanciamiento:**
- **3 m x 2 m** (1,667 plantas/ha)
- **3.5 m x 2.5 m** (1,143 plantas/ha) en zonas altas
- Surcos en **curva de nivel** en laderas

**Preparación del terreno:**
- **Arado profundo** (30-40 cm)
- Hoyos de **40x40x40 cm**
- Incorporar **estiércol curado** (10 kg/hoyo)
- Instalar **drenaje** en suelos pesados

**Técnica de siembra:**
1. Colocar hijo a **profundidad de 15-20 cm**
2. Cubrir con tierra hasta la marca de crecimiento
3. **Compactar** suavemente alrededor
4. Aplicar **mulch** de hojarasca o pasto seco

**Densidad por objetivo:**
- **Plátano para ronda**: 1,100-1,300 plantas/ha
- **Plátano para exportación**: 1,500-1,800 plantas/ha
- **Bocadillo o bocadito**: 1,300-1,500 plantas/ha`,
  },
  {
    id: "platano-rendimiento",
    category: "cultivo",
    keywords: [
      "plátano",
      "platano",
      "rendimiento",
      "producción",
      "racimo",
      "kilos",
      "toneladas",
      "cosecha",
    ],
    question: "¿Cuál es el rendimiento del plátano en Santander?",
    crop: "platano",
    answer: `**Rendimiento del Plátano en Santander**

Producción según manejo y variedad:

**Rendimiento por planta:**
- **Sin tecnología**: 8-12 kg de racimo
- **Con buena tecnología**: **15-25 kg** de racimo
- **Alta tecnología**: hasta **35 kg** de racimo

**Producción por hectárea:**
- **Regular**: 10-15 ton/ha/año
- **Buena**: 20-30 ton/ha/año
- **Excelente**: **35-45 ton/ha/año**

**Ciclo de producción:**
- **Primer corte**: 12-14 meses después de siembra
- **Producción continua**: Cortes cada **3-4 meses**
- **Vida útil del cormo**: 18-24 meses (variedad)

**Variedades y rendimiento:**
- **Hartón**: 15-25 kg/racimo (8-14 dedos)
- **Bocadillo**: 8-12 kg/racimo (dedos pequeños)
- **Guineo**: 10-15 kg/racimo (fruta dulce)
- **Dominico**: 12-20 kg/racimo (resistente a viento)

**Producción anual estable:**
- Con **buen manejo de hijo**: 2-3 cortes por año
- Cada corte produce **10,000-15,000 racimos/ha**
- Mantener **5-6 hijas** por cormo para sostenibilidad

**Indicadores de calidad:**
- **Llenado** adecuado del dedo
- **Sin quemaduras** por sol o viento
- **Color uniforme** para mercado`,
  },
  {
    id: "platano-plagas",
    category: "plaga",
    keywords: [
      "plátano",
      "platano",
      "plaga",
      "sigatoka",
      "moko",
      "pulgon",
      "gusano",
      "enfermedad",
      "nematodo",
    ],
    question: "¿Qué plagas afectan al plátano en Santander?",
    crop: "platano",
    answer: `**Plagas del Plátano en Santander**

Manejo de las principales amenazas:

**1. Sigatoka Negra (Mycosphaerella fijiensis):**
- **Marchitez** progresiva de hojas
- Manchas oscuras que reducen **fotosíntesis**
- **Control**: Poda de hojas secas cada **2 meses**, **fungicida preventivo**

**2. Moko (Ralstonia solanacearum):**
- **Marchitez** aguda de toda la planta
- Se disemina con **agua contaminada** y herramientas
- **Control**: **Eliminar plantas enfermas**, desinfectar herramientas

**3. Pulgón del plátano (Pentalonia nigronervosa):**
- Vector del **virus bunchy top**
- Hojas pequeñas, **arrugadas**, crecimiento detenido
- **Control**: **Aceite neem**, **plaguicidas sistémicos**

**4. Gusano cogollero (Spodoptera spp.):**
- **Defoliación** severa en plantas jóvenes
- **Control**: **Trampas con luz**, **Bacillus thuringiensis**

**5. Nematodos:**
- Daño en raíz, **bajo rendimiento**
- **Control**: **Rotación de cultivos**, **abono verde**

**Programa preventivo:**
- **Poda sanitaria** cada 2 meses
- **Monitoreo** semanal de hojas
- **Desinfección** de herramientas con **hipoclorito**
- **Control biológico** con **Beauveria bassiana**
- **No compartir herramientas** entre fincas sin desinfectar`,
  },

  // ═══════════════════════════════════════════════════════════
  // YUCA (3 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "yuca-siembra",
    category: "siembra",
    keywords: [
      "yuca",
      "siembra",
      "sembrar",
      "plantar",
      "mandioca",
      "cassava",
      "estacas",
      "trozos",
      "manioca",
    ],
    question: "¿Cómo sembrar yuca en Santander?",
    crop: "yuca",
    answer: `**Siembra de Yuca en Santander**

Cultivo resistente y de alto rendimiento en Santander:

**Época de siembra:**
- **Entre febrero y abril** (primera quincena)
- Antes del **pico de lluvias** para mejor establecimiento
- También puede sembrarse en **septiembre-octubre**

**Material de siembra:**
- **Estacas de 20-25 cm** de tallo adulto
- Usar tallos de **6-12 meses** de edad
- **4-5 nudos** por estaca como mínimo
- **Desinfectar** con **fungicida** antes de sembrar

**Distanciamiento:**
- **1 m x 0.80 m** (12,500 plantas/ha)
- **1.20 m x 0.80 m** (10,416 plantas/ha)
- Surcos en **curva de nivel** en zonas de ladera

**Preparación del terreno:**
- **Arado profundo** (30-40 cm) o **surcado**
- Incorporar **estiércol o compost** (10-15 ton/ha)
- Marcar líneas con **estacas y cordel**

**Técnica de siembra:**
1. Colocar estaca en **ángulo de 45°** o vertical
2. Dejar **5-7 cm** sobre el suelo
3. **Presionar** suavemente alrededor
4. **No regar** excesivamente (resistente a sequía)

**Densidad por objetivo:**
- **Yuca para consumo fresco**: 10,000-12,500 plantas/ha
- **Yuca industrial (almidón)**: 12,500-15,000 plantas/ha
- **Yuca para bocadillo**: 10,000-11,000 plantas/ha`,
  },
  {
    id: "yuca-rendimiento",
    category: "cultivo",
    keywords: [
      "yuca",
      "rendimiento",
      "producción",
      "toneladas",
      "tubérculo",
      "raíz",
      "cosecha",
      "peso",
    ],
    question: "¿Cuál es el rendimiento de la yuca en Santander?",
    crop: "yuca",
    answer: `**Rendimiento de Yuca en Santander**

Producción según variedad y manejo:

**Rendimiento típico:**
- **Sin tecnología**: 8-12 ton/ha
- **Con buena tecnología**: **15-25 ton/ha**
- **Alta tecnología**: hasta **35 ton/ha**

**Ciclo de producción:**
- **Cosecha temprana**: 8-10 meses (tubérculos jóvenes)
- **Cosecha comercial**: **12-18 meses** (óptimo)
- **Máximo rendimiento**: 18-24 meses (pierde calidad)

**Producción por planta:**
- **6-10 tubérculos** por planta
- **Peso promedio**: 0.5-1.5 kg por tubérculo
- **Peso total por planta**: 3-8 kg

**Variedades en Santander:**
- **Manihot**: Almidón alto, rendimiento estable
- **Col 2215**: Resistente a enfermedades, buen rendimiento
- **Valenciana**: Dulce, ideal para consumo fresco
- **Méco**: Rápido crecimiento, cosecha a 10 meses

**Cosecha óptima:**
- **Secado de hojas** en 30-50% de la planta
- **Corte** con azadón o **pala**
- **No dejar** tubérculos en suelo >24 meses (pierde calidad)

**Producción anual:**
- En zonas tropicales se pueden hacer **dos cosechas por año**
- Con **siembra escalonada**: Producción continua
- **Demanda permanente** en mercados locales y regionales`,
  },
  {
    id: "yuca-usos",
    category: "cultivo",
    keywords: [
      "yuca",
      "usos",
      "consumo",
      "procesamiento",
      "almidón",
      "bocadillo",
      "harina",
      "cassava",
      "industrial",
    ],
    question: "¿Para qué se usa la yuca en Santander?",
    crop: "yuca",
    answer: `**Usos de la Yuca en Santander**

Múltiples aplicaciones y oportunidades de negocio:

**Consumo fresco:**
- **Yuca hervida**: Alimento básico en la dieta santandereana
- **Yuca frita**: Chips y snacks
- **Mazamorra**: Bebida tradicional con leche
- **Yuca con queso**: Plato típico regional

**Procesamiento industrial:**
- **Almidón de yuca**: Materia prima para industria alimentaria
- **Harina de yuca**: Para panadería y repostería
- **Fécula**: Uso en industria farmacéutica y textil
- **Bocadillo**: Producto derivado de alta demanda

**Usos en ganadería:**
- **Forraje**: Hojas y tallos para alimentación animal
- **Harina para concentrados**: Suplemento energético
- **Pulpas**: En alimentación porcina y avícola

**Oportunidades de negocio:**
- **Cassava chips**: Snack premium para exportación
- **Harina sin gluten**: Mercado en crecimiento
- **Bioetanol**: Combustible renovable
- **Plásticos biodegradables**: Uso emergente

**Mercado en Santander:**
- **Demanda constante** en plazas de mercado regionales
- **Precio estable**: $800-1,500/kg según calidad
- **Potencial de exportación** a Centroamérica y el Caribe
- **Alto valor agregado** con transformación artesanal

**Recomendación:**
- **Diversificar** usos para mayor rentabilidad
- **Asociarse** con otros agricultores para procesamiento
- **Buscar certificación orgánica** para mercados premium`,
  },

  // ═══════════════════════════════════════════════════════════
  // ARROZ (2 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "arroz-siembra",
    category: "siembra",
    keywords: [
      "arroz",
      "siembra",
      "sembrar",
      "plantar",
      "grano",
      "cereal",
      "arrocero",
      "chuzos",
      "bordos",
    ],
    question: "¿Cómo sembrar arroz en Santander?",
    crop: "arroz",
    answer: `**Siembra de Arroz en Santander**

Cultivo básico con alta demanda en Santander:

**Época de siembra:**
- **Primera quincena de abril** (principal)
- **Septiembre-octubre** (segunda siembra)
- Temperatura ideal: **20-30°C**

**Métodos de siembra:**
1. **Siembra directa**: Semilla en suelo preparado
2. **Trasplante**: De semillero a campo definitivo
3. **Siembra mecanizada**: Con maquinaria especializada

**Distanciamiento:**
- **Siembra directa**: 20 cm entre líneas
- **Trasplante**: 20 x 15 cm (plantas)
- **Densidad**: 80-100 semillas/m²

**Preparación del terreno:**
- **Arado profundo** (20-30 cm)
- **Rastreo** para nivelar el terreno
- **Alambrado**: Formar bordos o chuzos para control de agua
- **Nivelación** del terreno para distribución uniforme de agua

**Manejo del agua:**
- **Encharcamiento** de 3-5 cm durante crecimiento
- **Drenaje** 15 días antes de cosecha
- **Control de nivel** con compuertas o bordos

**Semilla recomendada:**
- **CT-201**: Adaptada a zonas cálidas
- **Fedearroz 50**: Alto rendimiento
- **Cica-8**: Tolerante a enfermedades

**Fertilización inicial:**
- **40-60 kg/ha de NPK** 15-15-15
- Añadir **15-20 kg/ha de nitrógeno** a los 40 días`,
  },
  {
    id: "arroz-variedades",
    category: "cultivo",
    keywords: ["arroz", "variedad", "semilla", "variedades", "CT", "Fedearroz", "ciclo", "tipo"],
    question: "¿Qué variedades de arroz hay para Santander?",
    crop: "arroz",
    answer: `**Variedades de Arroz para Santander**

Selección según condiciones y mercado:

**Variedades mejoradas:**

**CT-201:**
- **Ciclo corto** (120-130 días)
- Rendimiento: **5-6 ton/ha**
- Tolerante a **encharcamiento**
- Grano largo, buena calidad

**Fedearroz 50:**
- **Ciclo medio** (130-140 días)
- Rendimiento: **6-7 ton/ha**
- Alta **resistencia a plagas**
- Grano mediano, muy demandado

**Cica-8:**
- **Ciclo largo** (140-150 días)
- Rendimiento: **6-8 ton/ha**
- Tolerante a **enfermedades**
- Grano largo, mercado premium

**Variedades tradicionales:**
- **Arroz de montaña**: Ciclo largo, bajo rendimiento pero sabor superior
- **Arroz pelao**: Para consumo local, mercado de nicho

**Factores de selección:**
- **Disponibilidad de agua**: Largo requiere más riego
- **Plagas locales**: Consultar con ICA
- **Mercado**: Grano largo tiene mejor precio
- **Tipo de suelo**: Arcillo arenoso es ideal

**Consejos:**
- Usar **semilla certificada** (90% de germinación)
- **Tratar semilla** con **fungicida** antes de sembrar
- **Almacenar semilla** en lugar fresco y seco
- **Rotar variedades** cada 3-4 ciclos`,
  },

  // ═══════════════════════════════════════════════════════════
  // MAÍZ (2 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "maiz-siembra",
    category: "siembra",
    keywords: [
      "maíz",
      "maiz",
      "siembra",
      "sembrar",
      "plantar",
      "elote",
      "choclo",
      "jilguero",
      "semilla",
      "grano",
    ],
    question: "¿Cómo sembrar maíz en Santander?",
    crop: "maiz",
    answer: `**Siembra de Maíz en Santander**

Cultivo versatile y de alto rendimiento:

**Época de siembra:**
- **Primera quincena de abril** (principal)
- **Septiembre-octubre** (segunda siembra)
- Temperatura ideal: **18-32°C**

**Distanciamiento:**
- **90 cm entre líneas** x **20 cm entre plantas**
- **80 cm x 18 cm** para mayor densidad
- Densidad: **55,000-70,000 plantas/ha**

**Preparación del terreno:**
- **Arado profundo** (25-35 cm)
- **Rastreo** para nivelar
- **Surcos** o líneas marcadas con **estacas y cordel**
- Incorporar **estiércol** (10-15 ton/ha)

**Técnica de siembra:**
1. Colocar **2-3 semillas** por punto
2. Profundidad: **3-5 cm**
3. **Raleo** a los 20 días (dejar 1 planta fuerte)
4. **Escardar** a los 15 y 30 días

**Semilla recomendada:**
- **CB-5**: Híbrido de alto rendimiento
- **Cali-723**: Adaptado a zonas cálidas
- **Criollo mejorado**: Para consumo local
- **DEKALB**: Alta productividad

**Fertilización:**
- **Siembra**: 200 kg/ha de NPK 15-15-15
- **Crecimiento**: 150 kg/ha de **urea** (a los 30 días)
- **Floración**: 100 kg/ha de **cloruro de potasio**

**Cosecha:**
- **120-150 días** después de siembra
- Grano **duro y seco** = listo para cosecha
- **Rendimiento**: 3-6 ton/ha`,
  },
  {
    id: "maiz-rendimiento",
    category: "cultivo",
    keywords: [
      "maíz",
      "maiz",
      "rendimiento",
      "producción",
      "toneladas",
      "kilos",
      "mazorca",
      "grano",
      "cosecha",
    ],
    question: "¿Cuál es el rendimiento del maíz en Santander?",
    crop: "maiz",
    answer: `**Rendimiento del Maíz en Santander**

Producción según tecnología y variedad:

**Rendimiento por categoría:**
- **Sin tecnología**: 1.5-2.5 ton/ha
- **Tecnología media**: **3-5 ton/ha**
- **Alta tecnología**: **6-8 ton/ha**

**Conversión:**
- **1 saco de maíz** = 50 kg
- **1 tonelada** = 20 sacos
- **Promedio por hectárea**: 80-120 sacos (con buena tecnología)

**Ciclo de producción:**
- **Maíces precoces**: 90-110 días
- **Maíz de ciclo medio**: 110-130 días
- **Maíz tardío**: 130-160 días

**Producción por planta:**
- **1-2 mazorcas** por planta
- **Peso por mazorca**: 200-400 g
- **Granos por mazorca**: 500-800

**Rendimiento por tipo de maíz:**
- **Maíz grano duro**: 4-6 ton/ha
- **Maíz para elote**: 3-5 ton/ha (mazorcas frescas)
- **Maíz criollo**: 2-3 ton/ha (calidad premium)

**Factores de incremento:**
- **Variedad híbrida**: +40% sobre criollos
- **Fertilización oportuna**: +30% sobre sin fertilizar
- **Control de malezas**: +25% sobre sin escarda
- **Riego supplemental**: +20% en épocas secas

**Recomendaciones:**
- **Rotar** con leguminosas para mantener suelo
- **Almacenar** grano seco en **silos o costales de yute**`,
  },

  // ═══════════════════════════════════════════════════════════
  // CLIMA (5 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "clima-colombia",
    category: "clima",
    keywords: [
      "clima",
      "colombia",
      "temperatura",
      "lluvia",
      "temporada",
      "condiciones",
      "región",
      "zona",
    ],
    question: "¿Cómo es el clima en Santander para agricultura?",
    answer: `**Clima de Santander para Agricultura**

Condiciones generales del departamento, diversidad de pisos térmicos:

**Temperatura promedio por altitud:**
- **Zona cálida** (<1,000 msnm): 24-28°C
- **Zona templada** (1,000-2,000 msnm): 18-24°C
- **Zona fría** (>2,000 msnm): 12-18°C

**Precipitación anual:**
- **Zona cálida**: 1,500-2,000 mm
- **Zona templada**: 1,200-1,800 mm
- **Zona fría**: 1,000-1,500 mm

**Épocas de lluvia:**
- **Primera**: Abril-junio (más intensa)
- **Segunda**: Septiembre-noviembre (menor intensidad)
- **Secas**: Diciembre-marzo, julio-agosto

**Zonas agroclimáticas de Santander:**
- **Magdalena Medio** (Barrancabermeja, Puerto Wilches): Cálida, húmeda, ideal para cacao y banano
- **Mesetas altoandinas** (Socorro, San Gil, Barichara): Templada, café y granadilla
- **Provincia de Soto** (Bucaramanga, Floridablanca, Piedecuesta): Templada, café y hortalizas
- **Provincia de García Rovira** (Málaga, Cerrito): Fría, papa y maíz

**Riesgos climáticos:**
- **Sequías** en temporada seca (enero-marzo)
- **Inundaciones** en temporada de lluvias
- **Granizadas** en zonas altas (>1,800 msnm)
- **Heladas** en zonas >2,200 msnm

**Recomendación:**
- **Conocer** la zona agroclimática de su finca
- **Instalar** estaciones meteorológicas locales
- **Consultar** pronósticos del **IDEAM** semanalmente
- **Aprovechar** las dos épocas de lluvia para siembra`,
  },
  {
    id: "clima-sequia",
    category: "clima",
    keywords: ["sequía", "sequia", "agua", "riego", "falta", "seco", "irrigación", "conservación"],
    question: "¿Cómo manejar la sequía en agricultura?",
    answer: `**Manejo de Sequía en Agricultura Santandereana**

Estrategias para mitigar el efecto de la sequía:

**Conservación de humedad:**
- **Mulch**: Cubrir suelo con **hojarasca, pasto seco o plástico**
- **Manta de cobertura**: Reduce evaporación un **50-70%**
- **Surcos en curva de nivel**: Retienen agua de lluvia

**Riego eficiente:**
- **Riego por goteo**: **Ahorra 40-60%** de agua
- **Riego por aspersión**: Para cultivos de alto valor
- **Riego por manta**: Para hortalizas y plántulas

**Manejo del suelo:**
- **Aumentar materia orgánica** (2-4% ideal)
- **Labranza mínima** para conservar estructura
- **Terrazas** en laderas para retención de agua

**Selección de variedades:**
- **Tolerantes a sequía**: Tabí (café), CCN-51 (cacao)
- **Ciclo corto**: Maíces precoces, arroz de ciclo corto
- **Raíces profundas**: Yuca, plátano

**Almacenamiento de agua:**
- **Tanques de almacenamiento** (5,000-10,000 litros)
- **Jagüeyes**: Depósitos de agua de lluvia
- **Captación de agua** de quebradas con permisos

**Programa preventivo:**
- **Monitorear** humedad del suelo con **tensiómetro**
- **Riego de emergencia** cuando humedad <40%
- **Planificar** siembra según pronóstico climático
- **Asociarse** con otros agricultores para riego comunal`,
  },
  {
    id: "clima-heladas",
    category: "clima",
    keywords: [
      "helada",
      "heladas",
      "frío",
      "frio",
      "temperatura",
      "congelación",
      "protección",
      "riesgo",
    ],
    question: "¿Cómo proteger cultivos de heladas?",
    answer: `**Protección de Cultivos contra Heladas en Santander**

Estrategias de prevención y mitigación:

**Identificación de riesgo:**
- **Heladas radiativas**: Cielos despejados, viento calmado
- **Heladas de advección**: Masa de aire frío que llega a la zona
- **Zonas de mayor riesgo**: Fondos de valle, depresiones del terreno

**Medidas preventivas:**
- **Calefactores**: Quemadores de kerosene entre plantas
- **Cortavientos**: Barreras naturales o artificiales
- **Riego por aspersión**: Capa de hielo protege plantas (contra-intuitivo)
- **Mulch grueso**: Aísla raíz del frío

**Protección de cultivos sensibles:**
- **Cacao**: Cubrir con **plástico o saco** en noches frías
- **Granadilla**: Mantener **sombra temporal** y calefactores
- **Café**: **Poda de altura** para reducir exposición
- **Plátano**: **Tutelar** y cubrir la base

**Medidas post-helada:**
- **No podar** inmediatamente (esperar 7-10 días)
- **Aplicar** **fertilizante rico en potasio** para recuperación
- **Riego** abundante para descongelar suelo
- **Evaluar** nivel de daño antes de decidir

**Sistema de alerta:**
- **Monitorear** temperatura con **termómetro mínimo/máximo**
- **Verificar pronósticos** del IDEAM
- **Comunicarse** con autoridades locales ante emergencias`,
  },
  {
    id: "clima-cambio-climatico",
    category: "clima",
    keywords: [
      "cambio climático",
      "clima",
      "calentamiento",
      "efecto",
      "adaptación",
      "resiliencia",
      "sequía",
      "temperatura",
    ],
    question: "¿Cómo afecta el cambio climático a la agricultura en Santander?",
    answer: `**Impacto del Cambio Climático en Agricultura Santandereana**

Desafíos y estrategias de adaptación:

**Impactos observados:**
- **Aumento de temperatura**: +0.5-1.5°C en últimos 30 años
- **Cambios en patrones de lluvia**: Lluvias más irregulares
- **Sequías más frecuentes**: Períodos secos más largos
- **Plagas emergentes**: Nuevas plagas por cambio de condiciones

**Efectos en cultivos principales:**
- **Café**: Mayor incidencia de **roya** por humedad alta
- **Cacao**: Más **moniliasis** por temperaturas cálidas
- **Plátano**: Mayor **sigatoka** por lluvias irregulares
- **Yuca**: Menor rendimiento por estrés hídrico

**Estrategias de adaptación:**
- **Variedades tolerantes**: Selección genética adaptada
- **Sistema agroforestal**: Integrar árboles para regulación climática
- **Diversificación**: No depender de un solo cultivo
- **Riego eficiente**: Invertir en tecnología de riego

**Acciones concretas:**
1. **Instalar estaciones meteorológicas** en la finca
2. **Cultivar especies resilientes**: Yuca, plátano son más tolerantes
3. **Mantener cobertura viva** en el suelo
4. **Asociar** con árboles de sombra
5. **Diversificar** portafolio de cultivos

**Oportunidades:**
- **Mercados de carbono**: Por prácticas sostenibles
- **Certificación orgánica**: Mayor valor agregado
- **Tecnología de precisión**: Uso eficiente de insumos`,
  },
  {
    id: "clima-regiones",
    category: "clima",
    keywords: [
      "región",
      "zona",
      "altitud",
      "provincia",
      "Magdalena Medio",
      "Soto",
      "Guanentá",
      "Vélez",
      "García Rovira",
      "Yariguíes",
    ],
    question: "¿Cuáles son las regiones agrícolas de Santander?",
    answer: `**Regiones Agrícolas de Santander**

Santander tiene diversidad de condiciones agroclimáticas gracias a sus pisos térmicos:

**1. Magdalena Medio Santandereano (Barrancabermeja, Puerto Wilches, Sabana de Torres, San Vicente de Chucurí):**
- **Cacao** de alta calidad en zonas cálidas
- **Plátano y banano** para consumo interno
- **Ganadería** semi-intensiva

**2. Provincia de Soto Norte y Sur (Bucaramanga, Floridablanca, Piedecuesta, Girón, Lebrija):**
- **Café** de montaña en altitudes 1,200-1,800 msnm
- **Granadilla** en zonas templadas
- **Hortalizas** y frutales

**3. Provincia de Guanentá (San Gil, Socorro, Barichara, Villanueva, Curití):**
- **Café** tradicional de alta calidad
- **Caña de azúcar** para panela
- **Maíz** y frijol

**4. Provincia de Vélez (Vélez, Bolívar, Puente Nacional, Chipatá):**
- **Café** de altura
- **Tomate de árbol** y frutales

**5. Provincia de García Rovira (Málaga, Cerrito, Concepción, Guaca):**
- **Papa** y hortalizas de clima frío
- **Maíz** y trigo

**6. Provincia de Yariguíes (El Carmen de Chucurí, Zapatoca, Betulia):**
- **Cacao** y **café** de montaña
- **Frutas** tropicales

**Consejo:**
- Identifique su **provincia y municipio** en el mapa agrícola de Santander
- Aproveche las **ventajas comparativas** de su zona
- Considere **diversificación** para mitigar riesgos climáticos`,
  },

  // ═══════════════════════════════════════════════════════════
  // RIESGOS (3 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "riesgo-nivel",
    category: "riesgo",
    keywords: ["riesgo", "nivel", "peligro", "amenaza", "alerta", "emergencia", "desastre"],
    question: "¿Cómo evaluar el nivel de riesgo en mi finca?",
    answer: `**Evaluación de Riesgo en tu Finca**

Metodología para identificar y priorizar amenazas:

**Tipos de riesgo agrícola:**
- **Climático**: Sequía, helada, inundación, granizada
- **Biológico**: Plagas, enfermedades, malezas
- **Económico**: Caída de precios, costos altos
- **Físico**: Erosión, deslizamiento, pérdida de suelo

**Escala de evaluación (1-5):**
- **1 - Muy bajo**: Probabilidad <10%
- **2 - Bajo**: Probabilidad 10-30%
- **3 - Medio**: Probabilidad 30-50%
- **4 - Alto**: Probabilidad 50-70%
- **5 - Muy alto**: Probabilidad >70%

**Fichas de riesgo por cultivo:**
| Cultivo | Sequía | Helada | Plagas | Precio |
|---------|--------|--------|--------|--------|
| Café | 4 | 3 | 5 | 3 |
| Cacao | 3 | 2 | 4 | 3 |
| Plátano | 4 | 2 | 4 | 2 |
| Yuca | 2 | 1 | 2 | 3 |

**Indicadores de alerta:**
- **Temperatura <10°C**: Riesgo de helada
- **Lluvia <50 mm/mes**: Riesgo de sequía
- **>5% hojas con plagas**: Acción inmediata
- **Precios < costo producción**: Riesgo económico

**Plan de acción por nivel:**
- **Nivel 1-2**: Monitoreo normal
- **Nivel 3**: Medidas preventivas
- **Nivel 4**: Acción inmediata
- **Nivel 5**: Emergencia, acudir a autoridades

**Herramientas de evaluación:**
- **Listas de cotejo** para cada cultivo
- **Mapa de riesgo** de la finca
- **Registro histórico** de eventos climáticos`,
  },
  {
    id: "riesgo-monitoreo",
    category: "riesgo",
    keywords: [
      "riesgo",
      "monitoreo",
      "vigilancia",
      "seguimiento",
      "inspección",
      "observación",
      "control",
    ],
    question: "¿Cómo monitorear riesgos en mi cultivo?",
    answer: `**Monitoreo de Riesgos en Cultivos**

Sistema de vigilancia continua para prevenir pérdidas:

**Frecuencia de monitoreo:**
- **Diario**: Condiciones climáticas extremas
- **Semanal**: Plagas y enfermedades
- **Quincenal**: Crecimiento y desarrollo
- **Mensual**: Análisis de suelo y nutrición

**Qué monitorear:**

**1. Clima:**
- **Temperatura**: Mínima y máxima diaria
- **Precipitación**: Lluvia acumulada semanal
- **Humedad relativa**: Con higrómetro
- **Viento**: Dirección e intensidad

**2. Cultivos:**
- **Color de hojas**: Amarillamiento, marchitez
- **Crecimiento**: Altura, número de hojas
- **Plagas**: Presencia y daño
- **Enfermedades**: Manchas, pudrición

**3. Suelo:**
- **Humedad**: Con tensiómetro o mano
- **Compactación**: Con espiga de infiltración
- **Erosión**: Surcos, pérdida de tierra

**Herramientas de monitoreo:**
- **Cuaderno de campo**: Registro diario
- **Fotografías**: Comparación temporal
- **Estación meteorológica**: Datos precisos
- **Aplicaciones móviles**: Alertas automáticas

**Registro y análisis:**
- **Diario**: Temperatura, lluvia, viento
- **Semanal**: Estado de cultivos, plagas
- **Mensual**: Análisis de tendencias
- **Trimestral**: Comparación con años anteriores

**Acciones según hallazgos:**
- **Plaga detectada**: Acción inmediata (MIP)
- **Enfermedad**: Tratamiento preventivo
- **Sequía**: Activar riego
- **Helada**: Medidas de protección`,
  },
  {
    id: "riesgo-manejo",
    category: "riesgo",
    keywords: [
      "riesgo",
      "manejo",
      "prevención",
      "control",
      "mitigación",
      "plan",
      "emergencia",
      "respuesta",
    ],
    question: "¿Cómo manejar riesgos en mi finca?",
    answer: `**Manejo Integral de Riesgos en tu Finca**

Plan de acción para minimizar pérdidas:

**Principios del manejo de riesgo:**
- **Prevención**: Antes de que ocurra el evento
- **Mitigación**: Reducir el impacto
- **Respuesta**: Acción durante el evento
- **Recuperación**: Después del evento

**Estrategias por tipo de riesgo:**

**1. Riesgo climático:**
- **Diversificación** de cultivos (mínimo 3 cultivos)
- **Sistemas agroforestales** para regulación
- **Riego** de emergencia disponible
- **Seguro agrícola** (Aseguradora Agrícola)

**2. Riesgo biológico:**
- **Monitoreo** continuo de plagas
- **Control integrado** de plagas (MIP)
- **Variedades resistentes**
- **Cuarentena** de herramientas

**3. Riesgo económico:**
- **Diversificar** mercados y productos
- **Asociarse** con otros agricultores
- **Transformar** materias primas
- **Almacenamiento** estratégico

**Plan de emergencia:**
1. **Identificar** riesgos principales
2. **Definir** responsables
3. **Establecer** protocolos de acción
4. **Capacitar** al equipo
5. **Ejecutar** y evaluar

**Recursos necesarios:**
- **Fondo de emergencia**: 10-15% de ingresos anuales
- **Herramientas** de protección
- **Contactos** de ayuda (Defensa Civil, ICA)
- **Seguro agrícola** para cultivos principales

**Seguro agrícola:**
- **Aseguradora Agrícola**: Cobertura contra helada, sequía, inundación
- **Prima**: 2-5% del valor asegurado
- **Requisito**: **Registro Agropecuario** (RUA)`,
  },

  // ═══════════════════════════════════════════════════════════
  // GENERAL (5 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "general-mercado",
    category: "general",
    keywords: [
      "mercado",
      "precio",
      "venta",
      "comercialización",
      "exportar",
      "vender",
      "compra",
      "demanda",
    ],
    question: "¿Cómo acceder a mercados para mis productos agrícolas?",
    answer: `**Acceso a Mercados Agrícolas en Santander**

Estrategias para comercializar productos:

**Canales de comercialización:**
- **Plaza de mercado local**: Venta directa al consumidor
- **Intermediarios**: Mayoristas y detallistas
- **Restaurantes y hoteles**: Demanda constante
- **Exportación**: Mercados internacionales (cacao, café, banano)

**Estrategias para mejores precios:**
- **Agruparse** en asociaciones o cooperativas
- **Transformar** productos (cacao a chocolate, café a tostado)
- **Certificar** orgánico o sostenible
- **Diversificar** clientes y productos

**Mercados principales por región:**
- **Bogotá y Cundinamarca**: Mayor demanda de hortalizas y frutas
- **Medellín (Antioquia)**: Consumo de frutas tropicales y café
- **Bucaramanga y el área metropolitana**: Demanda de plátano, yuca y hortalizas
- **Cali (Valle del Cauca)**: Mercado agroindustrial diversificado

**Pasos para acceder a mercados:**
1. **Identificar** qué produce y en qué volumen
2. **Conocer** precios actuales del mercado
3. **Mejorar** calidad y presentación del producto
4. **Establecer** relaciones comerciales
5. **Formalizar** con registros y facturación

**Herramientas digitales:**
- **Redes sociales**: Mercado digital local
- **Plataformas** de compra-venta agrícola
- **WhatsApp Business**: Pedidos directos
- **Ferias agrícolas**: Contacto directo con compradores

**Consejos prácticos:**
- **No depender** de un solo comprador
- **Mantener** relaciones a largo plazo
- **Ofrecer** calidad constante
- **Documentar** cada transacción`,
  },
  {
    id: "general-sostenibilidad",
    category: "general",
    keywords: [
      "sostenibilidad",
      "sostenible",
      "orgánico",
      "ecológico",
      "ambiental",
      "agroecología",
      "ambiental",
      "biodiversidad",
    ],
    question: "¿Cómo hacer agricultura sostenible en Santander?",
    answer: `**Agricultura Sostenible en Santander**

Prácticas para producción responsable:

**Principios de la agricultura sostenible:**
- **Conservación del suelo**: Evitar erosión y degradación
- **Uso eficiente del agua**: Riego por goteo, cosecha de agua
- **Biodiversidad**: Mantener flora y fauna nativa
- **Reducción de químicos**: Uso mínimo de pesticidas

**Prácticas concretas:**
1. **Sistemas agroforestales**: Integrar árboles con cultivos
2. **Cobertura viva**: Mantener suelo cubierto todo el año
3. **Compostaje**: Transformar residuos en abono orgánico
4. **Rotación de cultivos**: Diversificar y descansar el suelo

**Certificaciones disponibles:**
- **Orgánico santandereano**: Certificado por autoridad competente
- **Rainforest Alliance**: Para exportación de café y cacao
- **UTZ**: Prácticas sostenibles para café
- **Comercio justo**: Mejores precios para agricultores

**Beneficios económicos:**
- **Mayor precio** por producto orgánico (20-40% más)
- **Acceso a mercados premium**
- **Reducción de costos** de insumos químicos
- **Mejor salud** del agricultor y su familia

**Incentivos gubernamentales:**
- **Subsidios** para prácticas sostenibles
- **Créditos blandos** para inversión en tecnología
- **Capacitación gratuita** en agroecología
- **Asistencia técnica** del ICA y SENA

**Ejemplos exitosos en Santander:**
- **Café orgánico del Eje Cafetero**: Premium de exportación
- **Cacao de Santander**: Valor agregado alto
- **Frutas orgánicas del Huila**: Demanda creciente en ciudades`,
  },
  {
    id: "general-financiacion",
    category: "general",
    keywords: [
      "financiación",
      "crédito",
      "préstamo",
      "subsidio",
      "banco",
      "apoyo",
      "financiero",
      "recursos",
    ],
    question: "¿Qué opciones de financiación hay para agricultores en Santander?",
    answer: `**Financiación para Agricultores en Santander**

Oportunidades de crédito y apoyo financiero:

**Entidades financieras:**
- **Banco Agrario**: Créditos agrícolas con tasas preferenciales
- **Bancóldex**: Financiación para agricultores y empresarios rurales
- **Banco de Bogotá**: Líneas especiales para agro
- **Finagro**: Fondo de financiación agropecuaria

**Tipos de crédito:**
- **Crédito de producción**: Para insumos y mano de obra
- **Crédito de inversión**: Para maquinaria e infraestructura
- **Crédito de comercio**: Para almacenamiento y comercialización

**Tasas de interés:**
- **Banco Agrario**: 12-18% E.A.
- **Bancóldex**: 14-20% E.A.
- **Finagro**: 10-15% E.A. (con subsidio)

**Requisitos generales:**
- **Registro Agropecuario** (RUA)
- **Plan de negocio** básico
- **Historial crediticio** (o codeudor)
- **Garantías**: Mueble o inmueble

**Subsidios y programas:**
- **Programa de Renovación de Cultivos**: Subsidio del 70%
- **Protección de Cultivos**: Subsidio para semillas mejoradas
- **Programa de Comercialización**: Apoyo para venta

**Pasos para obtener crédito:**
1. **Elaborar** plan de negocio simple
2. **Buscar** asesoría en **Cámara de Comercio** o **Gobernación**
3. **Presentar** solicitud en entidad financiera
4. **Reunir** documentos requeridos
5. **Negociar** condiciones y plazos

**Consejos:**
- **No endeudarse** más del 30% de ingresos esperados
- **Aprovechar** subsidios antes que créditos
- **Asociarse** para mejorar condiciones crediticias
- **Mantener** contabilidad simple pero ordenada`,
  },
  {
    id: "general-cadena-valor",
    category: "general",
    keywords: [
      "cadena de valor",
      "producción",
      "transformación",
      "comercialización",
      "procesamiento",
      "beneficio",
      "agregado",
    ],
    question: "¿Cómo mejorar la cadena de valor de mis productos agrícolas?",
    answer: `**Cadena de Valor Agrícola en Santander**

Estrategias para capturar más valor:

**Etapas de la cadena:**
1. **Producción**: Calidad y eficiencia en el campo
2. **Post-cosecha**: Almacenamiento y conservación
3. **Procesamiento**: Transformación y valor agregado
4. **Comercialización**: Acceso a mercados
5. **Consumo**: Satisfacer demanda del consumidor

**Oportunidades de valor agregado:**
- **Cacao**: Chocolate artesanal, mantequilla de cacao
- **Café**: Tostado, empaquetado, café especial
- **Frutas**: Jugo, mermelada, pulpa congelada
- **Yuca**: Harina, almidón, bocadillo
- **Plátano**: Bocadillo, plátano verde procesado

**Estrategias por producto:**

**Café:**
- **Beneficio húmedo**: Mejora calidad
- **Tostado artesanal**: +100% valor
- **Empaque premium**: Mercados especiales

**Cacao:**
- **Fermentación controlada**: Calidad fino de aroma
- **Chocolate artesanal**: +300% valor
- **Aceite de cacao**: Industria cosmética

**Frutas:**
- **Jugo natural**: Mercado local
- **Pulpa congelada**: Exportación
- **Conservas**: Mercado nacional

**Mejoras en la cadena:**
- **Almacenamiento adecuado**: Reducir pérdidas post-cosecha
- **Transporte eficiente**: Mantener calidad del producto
- **Empaque atractivo**: Mejor presentación
- **Certificación**: Mayor valor y acceso

**Inversión necesaria:**
- **Pequeña escala**: $5-20 millones
- **Mediana escala**: $20-100 millones
- **Retorno**: 2-3 años según producto

**Alianzas estratégicas:**
- **Cooperativas**: Procesamiento conjunto
- **Restaurantes**: Suministro directo
- **Supermercados**: Volumen constante
- **Exportadores**: Mercados internacionales`,
  },
  {
    id: "general-departamentos",
    category: "general",
    keywords: [
      "departamento",
      "región",
      "local",
      "territorio",
      "municipio",
      "zona",
      "geografía",
      "Santander",
    ],
    question: "¿Qué zonas agrícolas hay en Santander?",
    answer: `**Zonas Agrícolas de Santander**

Santander tiene 87 municipios con vocación agropecuaria diversa:

**Principales cultivos por provincia:**

**Café:**
- **Provincia de Soto**: Café de montaña en Piedecuesta, Floridablanca, Lebrija
- **Provincia de Guanentá**: Café tradicional en San Gil, Socorro, Valle de San José
- **Provincia de Vélez**: Café de altura en Vélez, Bolívar, Puente Nacional

**Cacao:**
- **Magdalena Medio**: Cacao de alta calidad en Barrancabermeja, Puerto Wilches, San Vicente de Chucurí
- **Provincia de Yariguíes**: Cacao de montaña en El Carmen de Chucurí

**Plátano y banano:**
- **Magdalena Medio**: Plátano para consumo regional
- **Provincia de Soto**: Producción en zonas cálidas

**Maíz:**
- **Provincia de García Rovira**: Maíz tradicional en Málaga, Cerrito
- **Provincia de Guanentá**: Maíz y frijol asociados

**Caña de azúcar:**
- **Provincia de Vélez**: Panela de alta calidad
- **Provincia de Guanentá**: Tradición panelera

**Papa:**
- **Provincia de García Rovira**: Papa de clima frío

**Consejo:**
- Identifique su **provincia y municipio** en el mapa agrícola de Santander
- Conozca las **ventajas comparativas** de su zona
- Busque **asistencia técnica** en la Gobernación de Santander, UMATA y CIAL`,
  },

  // ═══════════════════════════════════════════════════════════
  // TÉCNICOS (2 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "tecnico-analisis-suelo",
    category: "tecnico",
    keywords: [
      "análisis",
      "suelo",
      "tierra",
      "ph",
      "nutrientes",
      "materia orgánica",
      "fósforo",
      "potasio",
      "laboratorio",
      "análisis de suelo",
    ],
    question: "¿Cómo realizar un análisis de suelo para mi finca?",
    answer: `**Análisis de Suelo para tu Finca**

Guía práctica para conocer la salud de tu suelo:

**Qué evaluar en el análisis:**
- **pH**: Nivel de acidez o alcalinidad
- **Materia orgánica**: Capacidad de retención de nutrientes
- **Nitrógeno (N)**: Crecimiento vegetativo
- **Fósforo (P)**: Desarrollo radicular
- **Potasio (K)**: Resistencia a enfermedades
- **Calcio y Magnesio**: Nutrientes secundarios
- **Micronutrientes**: Boro, zinc, hierro, manganeso

**Cómo tomar muestras:**
1. **Zonificar** la finca por tipo de suelo
2. **Tomar** 10-15 submuestras por zona
3. **Profundidad**: 0-20 cm (zona radicular)
4. **Mezclar** submuestras en balde limpio
5. **Enviar** 500 g al laboratorio

**Dónde enviar:**
- **Laboratorios universitarios**: UIS, UdeA, UdeA, UJTL
- **Empresas privadas**: Agroanálisis, Suelos y Aguas
- **Laboratorios del ICA**: En principales ciudades

**Costo aproximado:**
- **Análisis básico**: $50,000-100,000 COP
- **Análisis completo**: $150,000-250,000 COP
- **Micronutrientes**: +$50,000 COP

**Interpretación de resultados:**

| Parámetro | Bajo | Medio | Alto |
|-----------|------|-------|------|
| pH | <5.5 | 5.5-6.5 | >6.5 |
| MO (%) | <2 | 2-4 | >4 |
| Fósforo (ppm) | <10 | 10-25 | >25 |
| Potasio (ppm) | <100 | 100-250 | >250 |

**Frecuencia recomendada:**
- **Cada 2 años** para cultivos permanentes
- **Cada año** para cultivos anuales
- **Antes de cada** ciclo de siembra

**Acciones según resultados:**
- **pH bajo**: Aplicar **cal dolomítica** (1-2 ton/ha)
- **MO baja**: Incorporar **compost** (10-15 ton/ha)
- **Fósforo bajo**: Aplicar **superfosfato** (200-400 kg/ha)
- **Potasio bajo**: Aplicar **cloruro de potasio** (150-300 kg/ha)`,
  },
  {
    id: "tecnico-riego-eficiente",
    category: "tecnico",
    keywords: [
      "riego",
      "irrigación",
      "goteo",
      "aspersión",
      "agua",
      "eficiencia",
      "sistema",
      "ahorro",
      "riego eficiente",
    ],
    question: "¿Cómo implementar un sistema de riego eficiente?",
    answer: `**Sistema de Riego Eficiente para tu Finca**

Tecnología para ahorrar agua y mejorar producción:

**Tipos de riego eficiente:**

**1. Riego por goteo:**
- **Ahorro**: 40-60% de agua
- **Aplicación**: Hortalizas, café, cacao, frutales
- **Inversión**: $2,000-5,000/metro lineal
- **Vida útil**: 5-10 años

**2. Riego por aspersión:**
- **Ahorro**: 30-50% sobre riego tradicional
- **Aplicación**: Pastos, granos, grandes áreas
- **Inversión**: $1,500-3,000/metro lineal
- **Cobertura**: 60-80% del área

**3. Riego por microaspersión:**
- **Ahorro**: 50-70% sobre riego tradicional
- **Aplicación**: Invernaderos, viveros
- **Inversión**: $3,000-6,000/metro lineal
- **Precisión**: Alta, para plantas individuales

**Componentes del sistema:**
- **Toma de agua**: Bocatoma o pozo
- **Bomba**: Motor eléctrico o diésel
- **Filtros**: Para evitar obstrucción
- **Tuberías**: PVC o polietileno
- **Goteros/aspersores**: Según tipo de riego
- **Controlador**: Automatización (opcional)

**Diseño básico:**
- **Calcular** necesidad hídrica del cultivo
- **Dimensionar** bomba según caudal requerido
- **Distribuir** tuberías según topografía
- **Colocar** filtros en puntos estratégicos
- **Instalar** válvulas de control

**Costo por hectárea:**
- **Goteo básico**: $8-15 millones/ha
- **Aspersión**: $5-10 millones/ha
- **Microaspersión**: $10-18 millones/ha

**Mantenimiento:**
- **Limpieza** de filtros cada semana
- **Revisión** de goteros cada mes
- **Reparación** de fugas inmediata
- **Almacenamiento** en temporada de lluvia

**Retorno de inversión:**
- **Ahorro de agua**: 40-60%
- **Aumento de producción**: 20-40%
- **Reducción de enfermedades**: 30-50%
- **Payback**: 2-3 años

**Pasos para implementar:**
1. **Evaluar** disponibilidad de agua
2. **Diseñar** sistema según cultivo y terreno
3. **Cotizar** materiales y mano de obra
4. **Instalar** con asesoría técnica
5. **Operar** y mantener adecuadamente`,
  },
  // ═══════════════════════════════════════════════════════════
  // REQUISITOS DE CULTIVOS (3 entradas)
  // ═══════════════════════════════════════════════════════════
  {
    id: "requisitos-cacao",
    category: "cultivo",
    keywords: [
      "cacao",
      "requisitos",
      "requerimientos",
      "condiciones",
      "necesita",
      "óptimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
      "precipitación",
      "altitud",
      "suelo",
      "clima",
    ],
    question: "¿Cuáles son los requisitos de cultivo del cacao?",
    crop: "cacao",
    answer: `**Requisitos del Cultivo de Cacao**

El cacao (Theobroma cacao) requiere las siguientes condiciones para un desarrollo óptimo:

**Clima:**
- Temperatura óptima: **20-28°C**
- Temperatura mínima: 15°C (crecimiento se detiene)
- Precipitación anual: **1,500-2,500 mm**
- Humedad relativa: **70-90%**
- Altitud: **0-1,500 msnm**

**Suelo:**
- pH: **5.0-7.0** (óptimo 5.5-6.5)
- Profundidad efectiva: mínimo 1.5 m
- Textura: Franco a franco-arcillosa
- Materia orgánica: >2.5%
- Drenaje: Bueno (no tolera encharcamiento)

**Sombrío:**
- Requiere sombra temporal (plátano, yuca) y permanente (guamo, erythrina)
- Cobertura de sombra ideal: 40-60%

**Época de siembra:**
- Principal: **abril-mayo** (inicio de lluvias)
- Secundaria: septiembre-octubre`,
  },
  {
    id: "requisitos-cafe",
    category: "cultivo",
    keywords: [
      "café",
      "cafe",
      "requisitos",
      "requerimientos",
      "condiciones",
      "necesita",
      "óptimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
      "precipitación",
      "altitud",
      "suelo",
      "clima",
    ],
    question: "¿Cuáles son los requisitos de cultivo del café?",
    crop: "cafe",
    answer: `**Requisitos del Cultivo de Café**

El café arábica (Coffea arabica) requiere las siguientes condiciones:

**Clima:**
- Temperatura óptima: **17-24°C**
- Temperatura máxima: 30°C (estrés térmico)
- Precipitación anual: **1,500-2,200 mm**
- Humedad relativa: **60-80%**
- Altitud: **1,200-1,800 msnm** (arábica)
- Robusta: 0-800 msnm

**Suelo:**
- pH: **5.5-6.5**
- Profundidad efectiva: mínimo 1.0 m
- Textura: Franco a franco-arcillosa
- Materia orgánica: >3%
- Drenaje: Bueno, pendiente 25-50%

**Sombra:**
- Sombra regulada: 30-40%
- Especies recomendadas: guamo, nogal, carbonero
- Beneficios: regula temperatura, aporta materia orgánica

**Época de siembra:**
- Principal: **marzo-abril** (inicio de lluvias)
- Altitud define calidad y precio`,
  },
  {
    id: "requisitos-granadilla",
    category: "cultivo",
    keywords: [
      "granadilla",
      "requisitos",
      "requerimientos",
      "condiciones",
      "necesita",
      "óptimo",
      "rango",
      "ideal",
      "ph",
      "temperatura",
      "precipitación",
      "altitud",
      "suelo",
      "clima",
    ],
    question: "¿Cuáles son los requisitos de cultivo de la granadilla?",
    crop: "granadilla",
    answer: `**Requisitos del Cultivo de Granadilla**

La granadilla (Passiflora ligularis) requiere:

**Clima:**
- Temperatura óptima: **18-25°C**
- Temperatura mínima: 10°C (detiene crecimiento)
- Sensible a heladas (muerte a -1°C)
- Precipitación anual: **1,200-2,000 mm**
- Humedad relativa: **65-85%**
- Altitud: **1,500-2,200 msnm**

**Suelo:**
- pH: **5.5-6.5**
- Profundidad efectiva: mínimo 0.8 m
- Textura: Franco a franco-arenosa
- Materia orgánica: >3%
- Drenaje: Excelente (muy sensible a encharcamiento)

**Tutorado:**
- Sistema de soporte obligatorio
- Postes de concreto o guadua (4 m de alto)
- Cables galvanizados para guía

**Época de siembra:**
- Principal: **marzo-mayo** (inicio de lluvias)
- Producción: 8-10 meses después de siembra`,
  },
];

export const GREETINGS = [
  "¡Hola! Soy tu asistente agrícola de Sembradata. ¿En qué puedo ayudarte hoy sobre cultivos, clima o manejo de tu finca en Santander?",
  "¡Buenos días! Bienvenido a Sembradata. Estoy aquí para resolver tus dudas sobre agricultura santandereana. ¿Qué necesitas saber?",
  "¡Saludos! Soy Sembradata, tu asesor agrícola virtual. Pregúntame sobre cacao, café, plátano, clima o cualquier tema agrícola de Santander.",
];

export const FALLBACK_RESPONSES = [
  "No encontré información específica sobre tu pregunta. ¿Podrías reformularla o ser más específico? Puedo ayudarte con temas de cultivos, clima, riego, plagas, suelos o manejo de tu finca en Santander.",
  "Esa consulta no está en mi base de conocimientos aún. ¿Te gustaría preguntar sobre cacao, café, granadilla, plátano, yuca, arroz, maíz o temas de clima y riesgo agrícola?",
  "No tengo la respuesta a esa pregunta en este momento. Prueba preguntar sobre siembra, rendimiento, enfermedades, fertilización o cualquier aspecto de la agricultura santandereana.",
];

export function exportKnowledgeBaseForRag(): {
  entries: { id: string; text: string; metadata: Record<string, string> }[];
} {
  return {
    entries: KNOWLEDGE_BASE.map((e) => ({
      id: e.id,
      text: `Pregunta: ${e.question}\nRespuesta: ${e.answer}`,
      metadata: {
        category: e.category,
        crop: e.crop ?? "",
        keywords: e.keywords.join(", "),
      },
    })),
  };
}
