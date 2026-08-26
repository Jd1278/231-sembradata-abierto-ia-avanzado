import { describe, it, expect } from "vitest";
import { getSuggestions } from "@/services/chatbot";

describe("getSuggestions", () => {
  it("returns cacao suggestions when crop is cacao", () => {
    const s = getSuggestions("Cacao");
    expect(s.some((x) => x.includes("cacao"))).toBe(true);
  });

  it("returns cafe suggestions when crop is café", () => {
    const s = getSuggestions("Café");
    expect(s.some((x) => x.includes("café") || x.includes("cafe"))).toBe(true);
  });

  it("returns granadilla suggestions when crop is granadilla", () => {
    const s = getSuggestions("Granadilla");
    expect(s.some((x) => x.includes("granadilla"))).toBe(true);
  });

  it("includes municipio-specific suggestions", () => {
    const s = getSuggestions(undefined, "San Gil");
    expect(s.some((x) => x.includes("San Gil"))).toBe(true);
  });

  it("returns max 5 suggestions", () => {
    const s = getSuggestions("Café", "Bucaramanga");
    expect(s.length).toBeLessThanOrEqual(5);
  });

  it("always includes general suggestions", () => {
    const s = getSuggestions();
    expect(s.length).toBeGreaterThan(0);
  });

  it("handles accented crop names", () => {
    const s = getSuggestions("café");
    expect(s.some((x) => x.includes("café") || x.includes("cafe"))).toBe(true);
  });
});
