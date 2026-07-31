export interface ExtractedEntities {
  municipio?: string;
  cultivo?: string;
  departamento?: string;
}

const CROP_NAMES = [
  "cafe",
  "café",
  "cacao",
  "granadilla",
  "platano",
  "plátano",
  "arroz",
  "maiz",
  "maíz",
  "yuca",
  "frijol",
  "fríjol",
];

const SANTANDER_MUNIS = [
  "bucaramanga",
  "floridablanca",
  "giron",
  "girón",
  "piedecuesta",
  "barrancabermeja",
  "san gil",
  "socorro",
  "velez",
  "vélez",
  "puente nacional",
  "landazuri",
  "landázuri",
  "bolivar",
  "bolívar",
  "simacota",
  "santa helena del opon",
  "cimitarra",
  "el playon",
  "rio negro",
  "río negro",
  "tona",
  "vetas",
  "sabana de torres",
  "suaita",
  "guadalupe",
  "contratacion",
  "contratación",
  "aguada",
  "albania",
  "arboleda",
  "barbosa",
  "barichara",
  "cabra",
  "california",
  "capitanejo",
  "carcasi",
  "carcasí",
  "cerrito",
  "charala",
  "charalá",
  "chucuri",
  "chucurí",
  "confines",
  "coromoro",
  "curiti",
  "curití",
  "encino",
  "enciso",
  "florian",
  "florián",
  "galan",
  "galán",
  "gambita",
  "gámbita",
  "guepsa",
  "güepsa",
  "hato",
  "jordan",
  "jordán",
  "la belleza",
  "la paz",
  "lebrija",
  "los santos",
  "macaravita",
  "malaga",
  "málaga",
  "matanza",
  "mogotes",
  "molagavita",
  "ocamonte",
  "oiti",
  "oití",
  "onzaga",
  "onzága",
  "paramo",
  "páramo",
  "pinchote",
  "puerto parra",
  "puerto wilches",
  "san benito",
  "san joaquin",
  "san miguel",
  "san vicente",
  "santa barbara",
  "santa bárbara",
  "santana",
  "surata",
  "suratá",
  "valle de san jose",
  "valle de san josé",
];

const DEPT_NAMES = ["santander"];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractEntities(message: string): ExtractedEntities {
  const q = normalize(message);

  const cultivo = CROP_NAMES.find((c) => q.includes(normalize(c)));

  const matchedMuni = SANTANDER_MUNIS.find((m) => q.includes(normalize(m)));
  const municipio = matchedMuni ? matchedMuni.replace(/\b\w/g, (l) => l.toUpperCase()) : undefined;

  const departamento = DEPT_NAMES.find((d) => q.includes(normalize(d))) ? "Santander" : undefined;

  return { municipio, cultivo, departamento };
}
