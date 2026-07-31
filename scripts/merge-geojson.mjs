import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../src/data");

function main() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".geo.json") && f !== "colombia-departamentos.geo.json");

  const allFeatures = [];

  for (const file of files) {
    const filepath = path.join(DATA_DIR, file);
    const content = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    if (content.features) {
      for (const f of content.features) {
        allFeatures.push(f);
      }
    }
    console.log(`  ${file} → ${content.features?.length ?? 0} municipios`);
  }

  const merged = {
    type: "FeatureCollection",
    features: allFeatures,
  };

  const outpath = path.join(DATA_DIR, "colombia-municipios.geo.json");
  fs.writeFileSync(outpath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`\nTotal: ${allFeatures.length} municipios → colombia-municipios.geo.json`);
}

main();
