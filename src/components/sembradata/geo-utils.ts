import type { CropKey, Risk } from "@/types/crops";

/* ------------------------------------------------------------------ */
/*  Generic geo types                                                  */
/* ------------------------------------------------------------------ */

export interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

/* ------------------------------------------------------------------ */
/*  Projection utilities                                               */
/* ------------------------------------------------------------------ */

export const VIEW_W = 500;
export const VIEW_H = 400;
const PAD = 18;

export interface ProjectResult {
  project: (lng: number, lat: number) => [number, number];
  bbox: { minLng: number; maxLng: number; minLat: number; maxLat: number };
}

export function computeProjectionFromCollection(collection: GeoCollection): ProjectResult {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const f of collection.features) {
    const rings = extractRings(f.geometry);
    for (const ring of rings) {
      for (const coord of ring) {
        const lng = coord[0] as number;
        const lat = coord[1] as number;
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

  const project = (lng: number, lat: number): [number, number] => [
    (lng - minLng) * scale + offsetX,
    (maxLat - lat) * scale + offsetY,
  ];
  return { project, bbox: { minLng, maxLng, minLat, maxLat } };
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

export function extractRings(geom: {
  type: string;
  coordinates: number[][][] | number[][][][];
}): number[][][] {
  if (geom.type === "MultiPolygon") {
    // MultiPolygon coordinates: each element is a polygon (array of rings)
    // Flatten all rings from all polygons
    const rings: number[][][] = [];
    const coords = geom.coordinates as number[][][][];
    for (const polygon of coords) {
      for (const ring of polygon) {
        rings.push(ring);
      }
    }
    return rings;
  }
  return geom.coordinates as number[][][];
}

export function toPath(
  coords: number[][][],
  project: (lng: number, lat: number) => [number, number],
): string {
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

export function centroid(
  coords: number[][][],
  project: (lng: number, lat: number) => [number, number],
): [number, number] {
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
    const sx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
    const sy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
    return [sx, sy];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

export function geoCentroid(coords: number[][][]): [number, number] {
  const ring = coords[0];
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    const sx = ring.reduce((s, [x]) => s + x, 0) / ring.length;
    const sy = ring.reduce((s, [, y]) => s + y, 0) / ring.length;
    return [sx, sy];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

export function polygonArea(coords: number[][][]): number {
  const pts = coords[0];
  let a = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  }
  return Math.abs(a * 0.5);
}

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function titleCase(name: string): string {
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

/* ------------------------------------------------------------------ */
/*  Generic feature processing                                         */
/* ------------------------------------------------------------------ */

export interface FeatureResult {
  id: string;
  name: string;
  rawName: string;
  path: string;
  cx: number;
  cy: number;
  geolat: number;
  geolng: number;
  area: number;
  factor: number;
  risk: Record<CropKey, Risk>;
  properties: Record<string, unknown>;
}

const RISK_POOL: Risk[] = ["Bajo", "Bajo", "Medio", "Medio", "Alto"];

export function processGeoCollection(
  collection: GeoCollection,
  cropKeys: CropKey[],
  nameField: string = "name",
): FeatureResult[] {
  const { project } = computeProjectionFromCollection(collection);

  return collection.features
    .map((f) => {
      const raw = String(f.properties[nameField] ?? "UNKNOWN");
      const rings = extractRings(f.geometry);
      const seed = hash(raw);
      const risk = Object.fromEntries(
        cropKeys.map((c) => [c, pick(RISK_POOL, hash(raw + ":" + c))]),
      ) as Record<CropKey, Risk>;
      const factor = 0.72 + ((seed >>> 4) % 100) / 100 / 2;
      const [cx, cy] = centroid(rings, project);
      const [geolng, geolat] = geoCentroid(rings);
      return {
        id: raw.replace(/\s+/g, "-").toLowerCase(),
        name: titleCase(raw),
        rawName: raw,
        path: toPath(rings, project),
        cx,
        cy,
        geolat: +geolat.toFixed(4),
        geolng: +geolng.toFixed(4),
        area: polygonArea(rings),
        factor: +factor.toFixed(2),
        risk,
        properties: f.properties,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
