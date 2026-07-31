import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DATA_URL =
  "https://raw.githubusercontent.com/TakaraDasein/JSON-Colombia/main/colombia-por-municipios.geojson";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../src/data");

async function main() {
  console.log("Descargando GeoJSON nacional...");
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  const national = await res.json();

  const { features } = national;
  console.log(`Total features: ${features.length}`);

  const groups = {};
  for (const f of features) {
    const deptCode = f.properties.DPTO_CCDGO;
    const deptName = f.properties.DPTO_CNMBR;
    const muniName = f.properties.MPIO_CNMBR;

    if (!groups[deptCode]) {
      groups[deptCode] = { name: deptName, features: [] };
    }

    groups[deptCode].features.push({
      type: "Feature",
      properties: {
        dpt: deptName,
        name: muniName,
      },
      geometry: f.geometry,
    });
  }

  const codes = Object.keys(groups).sort();
  console.log(`Departamentos encontrados: ${codes.length}`);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const code of codes) {
    const { name, features: deptFeatures } = groups[code];
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const filename = `${slug}.geo.json`;
    const filepath = path.join(OUT_DIR, filename);

    const fc = {
      type: "FeatureCollection",
      features: deptFeatures,
    };

    fs.writeFileSync(filepath, JSON.stringify(fc, null, 2), "utf-8");
    console.log(`  ${code} → ${filename} (${deptFeatures.length} municipios)`);
  }

  console.log("\nCompletado.");
}

main().catch(console.error);
