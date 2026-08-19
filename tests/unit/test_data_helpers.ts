import { describe, it, expect } from "vitest";
import {
  computeAltitude,
  estimateTemperature,
  estimatePrecipitation,
} from "@/components/sembradata/data";

describe("computeAltitude", () => {
  it("returns 500 for undefined factor", () => {
    expect(computeAltitude(undefined)).toBe(500);
  });

  it("returns higher altitude for higher factor", () => {
    const low = computeAltitude(0.75);
    const high = computeAltitude(0.95);
    expect(high).toBeGreaterThan(low);
  });

  it("returns values in valid range", () => {
    for (let f = 0.72; f <= 1.2; f += 0.05) {
      const alt = computeAltitude(f);
      expect(alt).toBeGreaterThanOrEqual(500);
      expect(alt).toBeLessThanOrEqual(3000);
    }
  });
});

describe("estimateTemperature", () => {
  it("returns higher temperature for lower altitude", () => {
    const lowAlt = estimateTemperature(500);
    const highAlt = estimateTemperature(2500);
    expect(lowAlt).toBeGreaterThan(highAlt);
  });

  it("returns reasonable values for Santander altitudes", () => {
    expect(estimateTemperature(500)).toBeGreaterThan(20);
    expect(estimateTemperature(2500)).toBeLessThan(15);
  });
});

describe("estimatePrecipitation", () => {
  it("returns values within bounds", () => {
    for (let alt = 0; alt <= 3000; alt += 500) {
      const prec = estimatePrecipitation(alt);
      expect(prec).toBeGreaterThanOrEqual(800);
      expect(prec).toBeLessThanOrEqual(3500);
    }
  });

  it("decreases with altitude", () => {
    const low = estimatePrecipitation(500);
    const high = estimatePrecipitation(2500);
    expect(low).toBeGreaterThan(high);
  });
});
