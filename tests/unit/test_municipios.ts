import { describe, it, expect } from "vitest";
import { MUNICIPIO_FEATURES } from "../../src/components/sembradata/municipios";

describe("MUNICIPIO_FEATURES", () => {
  it("should have SVG paths for all municipalities", () => {
    for (const m of MUNICIPIO_FEATURES) {
      expect(m.path).toBeTruthy();
      expect(m.path.startsWith("M")).toBe(true);
    }
  });

  it("should have valid centroids", () => {
    for (const m of MUNICIPIO_FEATURES) {
      expect(m.cx).toBeGreaterThan(0);
      expect(m.cy).toBeGreaterThan(0);
    }
  });

  it("should have risk levels for all crops", () => {
    const crops = ["cacao", "cafe", "granadilla"] as const;
    for (const m of MUNICIPIO_FEATURES) {
      for (const crop of crops) {
        expect(["Bajo", "Medio", "Alto"]).toContain(m.risk[crop]);
      }
    }
  });

  it("should have factors in valid range", () => {
    for (const m of MUNICIPIO_FEATURES) {
      expect(m.factor).toBeGreaterThanOrEqual(0.7);
      expect(m.factor).toBeLessThanOrEqual(1.3);
    }
  });
});
