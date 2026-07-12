import raw from "@/data/santander.geo.json";
import type { CropKey, Risk } from "./data";

interface GeoFeature {
  type: "Feature";
  properties: { name: string; dpt: string };
  geometry: { type: "Polygon"; coordinates: number[][][] };
}
interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

const collection = raw as unknown as GeoCollection;

export const VIEW_W = 500;
export const VIEW_H = 400;
const PAD = 18;

// Compute bbox and uniform projection to viewBox.
function computeProjection() {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const f of collection.features) {
    for (const ring of f.geometry.coordinates) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  const dx = maxLng - minLng;
  const dy = maxLat - minLat;
  const scale = Math.min((VIEW_W - PAD * 2) / dx, (VIEW_H - PAD * 2) / dy);
  const offsetX = (VIEW_W - dx * scale) / 2;
  const offsetY = (VIEW_H - dy * scale) / 2;
  return (lng: number, lat: number): [number, number] => [
    (lng - minLng) * scale + offsetX,
    // flip Y (SVG y grows down, lat grows up)
    (maxLat - lat) * scale + offsetY,
  ];
}

const project = computeProjection();

function toPath(coords: number[][][]): string {
  return coords
    .map((ring) => {
      const pts = ring.map(([lng, lat]) => project(lng, lat));
      const [x0, y0] = pts[0];
      const body = pts
        .slice(1)
        .map(([x, y]) => `L${x.toFixed(2)} ${y.toFixed(2)}`)
        .join("");
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}${body}Z`;
    })
    .join(" ");
}

function centroid(coords: number[][][]): [number, number] {
  // Area-weighted centroid of outer ring, in projected space.
  const pts = coords[0].map(([lng, lat]) => project(lng, lat));
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    // Fallback: simple average.
    const sx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
    const sy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
    return [sx, sy];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

// Deterministic pseudo-random from string.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const RISK_POOL: Risk[] = ["Bajo", "Bajo", "Medio", "Medio", "Alto"];
const CROPS: CropKey[] = ["cacao", "cafe", "granadilla"];

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) =>
      w.length <= 2 && ["de", "la", "el", "del"].includes(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

export interface MunicipioFeature {
  id: string;
  name: string; // pretty
  rawName: string; // original UPPER
  path: string;
  cx: number;
  cy: number;
  area: number;
  factor: number;
  risk: Record<CropKey, Risk>;
}

function polygonArea(coords: number[][][]): number {
  const pts = coords[0];
  let a = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  }
  return Math.abs(a * 0.5);
}

export const MUNICIPIO_FEATURES: MunicipioFeature[] = collection.features
  .map((f) => {
    const raw = f.properties.name;
    const seed = hash(raw);
    const risk = Object.fromEntries(
      CROPS.map((c) => [c, pick(RISK_POOL, hash(raw + ":" + c))]),
    ) as Record<CropKey, Risk>;
    const factor = 0.72 + ((seed >>> 4) % 100) / 100 / 2; // 0.72 - 1.22
    const [cx, cy] = centroid(f.geometry.coordinates);
    return {
      id: raw.replace(/\s+/g, "-").toLowerCase(),
      name: titleCase(raw),
      rawName: raw,
      path: toPath(f.geometry.coordinates),
      cx,
      cy,
      area: polygonArea(f.geometry.coordinates),
      factor: +factor.toFixed(2),
      risk,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "es"));

export function findMunicipio(name: string): MunicipioFeature | undefined {
  return MUNICIPIO_FEATURES.find(
    (m) => m.name === name || m.rawName === name.toUpperCase(),
  );
}
