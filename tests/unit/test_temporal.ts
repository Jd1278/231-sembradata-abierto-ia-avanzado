import { describe, it, expect } from "vitest";
import { MONTH_LABELS } from "@/services/temporal-optimizer";

describe("MONTH_LABELS", () => {
  it("has 12 months", () => {
    expect(MONTH_LABELS.length).toBe(12);
  });

  it("starts with Ene and ends with Dic", () => {
    expect(MONTH_LABELS[0]).toBe("Ene");
    expect(MONTH_LABELS[11]).toBe("Dic");
  });

  it("all labels are non-empty strings", () => {
    MONTH_LABELS.forEach((label) => {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
