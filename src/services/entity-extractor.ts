export interface ExtractedEntities {
  municipio?: string;
  cultivo?: string;
  departamento?: string;
}

const CROP_NAMES = [
  "café",
  "cacao",
  "granadilla",
  "platano",
  "plátano",
  "arroz",
  "maíz",
  "maiz",
  "yuca",
  "fríjol",
  "frijol",
];

const SANTANDER_MUNIS = [
  "bucaramanga",
  "floridablanca",
  "girón",
  "piedecuesta",
  "barrancabermeja",
  "san gil",
  "socorro",
  "vélez",
  "puente nacional",
  "landázuri",
  "bolívar",
  "simacota",
  "santa helena del opón",
  "cimitarra",
  "el playón",
  "río negro",
  "tona",
  "vetas",
  "sabana de torres",
  "suaita",
  "guadalupe",
  "contratación",
  "aguada",
  "albania",
  "arboleda",
  "barbosa",
  "barichara",
  "cabra",
  "california",
  "capitanejo",
  "carcasí",
  "cerrito",
  "charalá",
  "chipatá",
  "carcasi",
  "confines",
  "coromoro",
  "curití",
  "el carmen de chucurí",
  "encino",
  "enciso",
  "florián",
  "galán",
  "gámbita",
  "güepsa",
  "hato",
  "jordán",
  "la belleza",
  "la paz",
  "lebrija",
  "los santos",
  "macaravita",
  "málaga",
  "matanza",
  "mogotes",
  "molagavita",
  "ocamonte",
  "oití",
  "onzága",
  "páramo",
  "pinchote",
  "puente nacional",
  "puerto parra",
  "puerto wilches",
  "riouegro",
  "san benito",
  "san joaquín",
  "san miguel",
  "san vicente de chucurí",
  "santa bárbara",
  "santana",
  "suratá",
  "valle de san josé",
  "vetas",
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

export function extractEntities(message: string): ExtractedEntities {
  const q = normalize(message);

  const cultivo = CROP_NAMES.find((c) => q.includes(normalize(c)));

  const matched = SANTANDER_MUNIS.find((m) => q.includes(m));
  const municipio = matched ? matched.replace(/\b\w/g, (l) => l.toUpperCase()) : undefined;

  const departamento = q.includes("santander") ? "Santander" : undefined;

  return { municipio, cultivo, departamento };
}
