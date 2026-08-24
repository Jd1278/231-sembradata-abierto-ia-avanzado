export interface ExtractedEntities {
  municipio?: string;
  cultivo?: string;
  departamento?: string;
  sourceOfMunicipality?: "message" | "selected_context";
  sourceOfCrop?: "message" | "selected_context";
  outOfScopeLocation?: string;
  conflictDetected?: boolean;
}

export interface SelectedContextInput {
  municipio?: string | null;
  cultivo?: string | null;
}

const CROP_MAP: Record<string, string> = {
  cafe: "cafe",
  café: "cafe",
  coffee: "cafe",
  cacao: "cacao",
  cocoa: "cacao",
  granadilla: "granadilla",
  platano: "platano",
  plátano: "platano",
  arroz: "arroz",
  maiz: "maiz",
  maíz: "maiz",
  yuca: "yuca",
  frijol: "frijol",
  fríjol: "frijol",
};

// Aliases for Santander municipalities
const SANTANDER_ALIASES: Record<string, string> = {
  "san vicente": "san vicente de chucuri",
  "san vicente chucuri": "san vicente de chucuri",
  chucuri: "san vicente de chucuri",
  "rio negro": "rionegro",
  "río negro": "rionegro",
  "el playon": "el playon",
  "pto nacional": "puente nacional",
  "pte nacional": "puente nacional",
  "pto wilches": "puerto wilches",
  "pte sogamoso": "puerto wilches",
  "sta helena": "santa helena del opon",
  "santa helena": "santa helena del opon",
  "valle de san jose": "valle de san jose",
  "valle san jose": "valle de san jose",
  "san jose de miranda": "san jose de miranda",
  "sabana torres": "sabana de torres",
  "hoyo grande": "giron",
};

// Catalog of all 87 Santander municipalities
const SANTANDER_MUNIS = [
  "aguada",
  "albania",
  "arboledas",
  "barbosa",
  "barichara",
  "barrancabermeja",
  "betulia",
  "bolivar",
  "bucaramanga",
  "cabrera",
  "california",
  "capitanejo",
  "carcasi",
  "cepitá",
  "cerrito",
  "charala",
  "charta",
  "chima",
  "chipata",
  "cimitarra",
  "concepcion",
  "confines",
  "contratacion",
  "coromoro",
  "curiti",
  "el carmen de chucuri",
  "el guacamayo",
  "el penon",
  "el playon",
  "encino",
  "enciso",
  "florian",
  "floridablanca",
  "galan",
  "gambita",
  "giron",
  "guaca",
  "guadalupe",
  "guapota",
  "guavata",
  "guepsa",
  "hato",
  "jesus maria",
  "jordan",
  "la belleza",
  "la paz",
  "landazuri",
  "lebrija",
  "los santos",
  "macaravita",
  "malaga",
  "matanza",
  "mogotes",
  "molagavita",
  "ocamonte",
  "oiba",
  "onzaga",
  "palmar",
  "palmas del socorro",
  "paramo",
  "piedecuesta",
  "pinima",
  "pinchote",
  "puente nacional",
  "puerto parra",
  "puerto wilches",
  "rionegro",
  "sabana de torres",
  "san andres",
  "san benito",
  "san gil",
  "san joaquin",
  "san jose de miranda",
  "san miguel",
  "san vicente de chucuri",
  "santa barbara",
  "santa helena del opon",
  "simacota",
  "socorro",
  "suaita",
  "sucre",
  "surata",
  "tona",
  "valle de san jose",
  "velez",
  "vetas",
  "villanueva",
  "zapatoca",
];

const OUT_OF_SCOPE_LOCATIONS = [
  "medellin",
  "medellín",
  "bogota",
  "bogotá",
  "cali",
  "barranquilla",
  "cartagena",
  "pereira",
  "manizales",
  "armenia",
  "ibague",
  "ibagué",
  "neiva",
  "popayan",
  "popayán",
  "pasto",
  "cucuta",
  "cúcuta",
  "villavicencio",
  "santa marta",
  "valledupar",
  "monteria",
  "montería",
  "sincelejo",
  "tunja",
  "riohacha",
  "quibdo",
  "quibdó",
  "florencia",
  "yopal",
  "antioquia",
  "cundinamarca",
  "valle del cauca",
  "tolima",
  "huila",
  "narino",
  "nariño",
  "caldas",
  "risaralda",
  "quindio",
  "quindío",
  "meta",
  "cesar",
  "cordoba",
  "córdoba",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractEntities(
  msg: string,
  selectedContext?: SelectedContextInput | null,
): ExtractedEntities {
  const norm = normalize(msg);
  const result: ExtractedEntities = {
    departamento: "Santander",
  };

  // 1. Check for out-of-scope Colombian locations in user message
  for (const loc of OUT_OF_SCOPE_LOCATIONS) {
    const locNorm = normalize(loc);
    const regex = new RegExp(`\\b${locNorm}\\b`, "i");
    if (regex.test(norm)) {
      result.outOfScopeLocation = loc;
      return result;
    }
  }

  // 2. Extract Crop from Message (Priority 1)
  let foundCrop: string | undefined;
  for (const [alias, standard] of Object.entries(CROP_MAP)) {
    const aliasNorm = normalize(alias);
    const regex = new RegExp(`\\b${aliasNorm}\\b`, "i");
    if (regex.test(norm)) {
      foundCrop = standard;
      result.sourceOfCrop = "message";
      break;
    }
  }

  // Fallback to selectedContext crop (Priority 2)
  if (!foundCrop && selectedContext?.cultivo) {
    const selectedCropNorm = normalize(selectedContext.cultivo);
    if (CROP_MAP[selectedCropNorm]) {
      foundCrop = CROP_MAP[selectedCropNorm];
      result.sourceOfCrop = "selected_context";
    }
  }
  result.cultivo = foundCrop;

  // 3. Extract Municipality from Message (Priority 1)
  let foundMuni: string | undefined;

  // First check specific aliases
  for (const [alias, standard] of Object.entries(SANTANDER_ALIASES)) {
    const aliasNorm = normalize(alias);
    const regex = new RegExp(`\\b${aliasNorm}\\b`, "i");
    if (regex.test(norm)) {
      foundMuni = standard;
      result.sourceOfMunicipality = "message";
      break;
    }
  }

  // Next check exact Santander list (ordered by name length descending for compound names)
  if (!foundMuni) {
    const sortedMunis = [...SANTANDER_MUNIS].sort((a, b) => b.length - a.length);
    for (const muni of sortedMunis) {
      const muniNorm = normalize(muni);
      const regex = new RegExp(`\\b${muniNorm}\\b`, "i");
      if (regex.test(norm)) {
        foundMuni = muni;
        result.sourceOfMunicipality = "message";
        break;
      }
    }
  }

  // Fallback to selectedContext municipality (Priority 2)
  if (!foundMuni && selectedContext?.municipio) {
    const selectedMuniNorm = normalize(selectedContext.municipio);
    const matched = SANTANDER_MUNIS.find(
      (m) => normalize(m) === selectedMuniNorm || selectedMuniNorm.includes(normalize(m)),
    );
    if (matched) {
      foundMuni = matched;
      result.sourceOfMunicipality = "selected_context";
    }
  }

  // Detect conflict if user specified a different municipality in message than on screen
  if (
    foundMuni &&
    selectedContext?.municipio &&
    result.sourceOfMunicipality === "message" &&
    normalize(foundMuni) !== normalize(selectedContext.municipio)
  ) {
    result.conflictDetected = true;
  }

  result.municipio = foundMuni;
  return result;
}
