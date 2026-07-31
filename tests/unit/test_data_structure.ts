import { describe, it, expect } from "vitest";
import { CROP_DATA, MUNICIPIOS } from "../../src/components/sembradata/data";

describe("CROP_DATA", () => {
  it("should have data for all three crops", () => {
    expect(CROP_DATA).toHaveProperty("cacao");
    expect(CROP_DATA).toHaveProperty("cafe");
    expect(CROP_DATA).toHaveProperty("granadilla");
  });

  it("each crop should have required fields", () => {
    for (const [, crop] of Object.entries(CROP_DATA)) {
      expect(crop).toHaveProperty("label");
      expect(crop).toHaveProperty("baseYield");
      expect(crop).toHaveProperty("window");
      expect(crop).toHaveProperty("description");
      expect(typeof crop.baseYield).toBe("number");
      expect(crop.baseYield).toBeGreaterThan(0);
    }
  });
});

describe("MUNICIPIOS", () => {
  it("should contain municipalities for analysis", () => {
    expect(MUNICIPIOS.length).toBeGreaterThan(0);
  });

  it("each municipality should have required fields", () => {
    for (const m of MUNICIPIOS) {
      expect(m).toHaveProperty("name");
      expect(m).toHaveProperty("factor");
      expect(m).toHaveProperty("risk");
      expect(typeof m.factor).toBe("number");
      expect(m.factor).toBeGreaterThan(0);
    }
  });
});
