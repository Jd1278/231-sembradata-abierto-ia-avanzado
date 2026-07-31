import raw from "@/data/colombia-municipios.geo.json";
import type { CropKey } from "@/types/crops";
import {
  processGeoCollection,
  VIEW_W,
  VIEW_H,
  type FeatureResult,
  type GeoCollection,
} from "./geo-utils";

export type MunicipioFeature = FeatureResult;
export { VIEW_W, VIEW_H };

const collection = raw as unknown as GeoCollection;
const CROPS: CropKey[] = ["cacao", "cafe", "granadilla"];

export const MUNICIPIO_FEATURES: MunicipioFeature[] = processGeoCollection(
  collection,
  CROPS,
  "name",
);

let featuresByDept: Record<string, MunicipioFeature[]> | null = null;

function ensureIndex(): Record<string, MunicipioFeature[]> {
  if (!featuresByDept) {
    featuresByDept = {};
    for (const feat of MUNICIPIO_FEATURES) {
      const dpt = String(feat.properties.dpt ?? "").toUpperCase();
      if (!featuresByDept[dpt]) featuresByDept[dpt] = [];
      featuresByDept[dpt].push(feat);
    }
  }
  return featuresByDept;
}

export function getFeaturesForDepartment(deptName: string): MunicipioFeature[] {
  return ensureIndex()[deptName.toUpperCase()] ?? [];
}

export {
  processGeoCollection,
  computeProjectionFromCollection,
  extractRings,
  toPath,
  centroid,
  polygonArea,
  hash,
  pick,
  titleCase,
} from "./geo-utils";
export type { GeoCollection, GeoFeature, ProjectResult, FeatureResult } from "./geo-utils";
