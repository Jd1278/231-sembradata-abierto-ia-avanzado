import { describe, it, expect } from "vitest";
import {
  computeAltitude,
  estimateTemperature,
  estimatePrecipitation,
  MUNICIPIOS,
} from "../../src/components/sembradata/data";
import type { AdvancedFilterValues } from "../../src/components/sembradata/AdvancedFilters";

function filterMunicipios(filters: AdvancedFilterValues) {
  return MUNICIPIOS.filter((m) => {
    const alt = computeAltitude(m.factor);
    if (alt < filters.altitudeRange[0] || alt > filters.altitudeRange[1]) return false;

    const estTemp = estimateTemperature(alt);
    if (estTemp < filters.tempRange[0] || estTemp > filters.tempRange[1]) return false;

    const estPrecip = estimatePrecipitation(alt);
    if (estPrecip < filters.precipRange[0] || estPrecip > filters.precipRange[1]) return false;

    if (filters.soilType !== "all") {
      const soilByAlt =
        alt < 800 ? "arcilla" : alt < 1500 ? "franco" : alt < 2200 ? "limo" : "arena";
      if (soilByAlt !== filters.soilType) return false;
    }

    return true;
  });
}

const DEFAULT_FILTERS: AdvancedFilterValues = {
  altitudeRange: [0, 4000],
  tempRange: [10, 35],
  precipRange: [0, 4000],
  soilType: "all",
};

describe("computeAltitude", () => {
  it("returns 500 for undefined factor", () => {
    expect(computeAltitude(undefined)).toBe(500);
  });

  it("returns higher altitude for higher factor", () => {
    const low = computeAltitude(0.8);
    const high = computeAltitude(1.0);
    expect(high).toBeGreaterThan(low);
  });

  it("returns values in valid range", () => {
    for (const factor of [0.72, 0.8, 0.9, 1.0, 1.2]) {
      const alt = computeAltitude(factor);
      expect(alt).toBeGreaterThanOrEqual(0);
      expect(alt).toBeLessThanOrEqual(4000);
    }
  });
});

describe("estimateTemperature", () => {
  it("returns higher temperature for lower altitude", () => {
    const lowAlt = estimateTemperature(500);
    const highAlt = estimateTemperature(2500);
    expect(lowAlt).toBeGreaterThan(highAlt);
  });

  it("returns reasonable values", () => {
    expect(estimateTemperature(0)).toBeCloseTo(28, 0);
    expect(estimateTemperature(1000)).toBeCloseTo(21.5, 0);
    expect(estimateTemperature(2000)).toBeCloseTo(15, 0);
  });
});

describe("estimatePrecipitation", () => {
  it("returns values within bounds", () => {
    for (const alt of [0, 500, 1000, 1500, 2000, 2500, 3000]) {
      const precip = estimatePrecipitation(alt);
      expect(precip).toBeGreaterThanOrEqual(800);
      expect(precip).toBeLessThanOrEqual(3500);
    }
  });

  it("decreases with altitude", () => {
    const low = estimatePrecipitation(500);
    const high = estimatePrecipitation(2500);
    expect(low).toBeGreaterThan(high);
  });
});

describe("Filter municipalities", () => {
  it("returns all municipalities with default filters", () => {
    const result = filterMunicipios(DEFAULT_FILTERS);
    expect(result.length).toBe(MUNICIPIOS.length);
  });

  it("filters by altitude range", () => {
    const narrow = filterMunicipios({
      ...DEFAULT_FILTERS,
      altitudeRange: [1000, 1500],
    });
    expect(narrow.length).toBeLessThan(MUNICIPIOS.length);
    for (const m of narrow) {
      const alt = computeAltitude(m.factor);
      expect(alt).toBeGreaterThanOrEqual(1000);
      expect(alt).toBeLessThanOrEqual(1500);
    }
  });

  it("filters by temperature range", () => {
    const narrow = filterMunicipios({
      ...DEFAULT_FILTERS,
      tempRange: [18, 22],
    });
    expect(narrow.length).toBeLessThan(MUNICIPIOS.length);
    for (const m of narrow) {
      const alt = computeAltitude(m.factor);
      const temp = estimateTemperature(alt);
      expect(temp).toBeGreaterThanOrEqual(18);
      expect(temp).toBeLessThanOrEqual(22);
    }
  });

  it("filters by precipitation range", () => {
    const narrow = filterMunicipios({
      ...DEFAULT_FILTERS,
      precipRange: [1500, 2000],
    });
    expect(narrow.length).toBeLessThan(MUNICIPIOS.length);
  });

  it("filters by soil type", () => {
    const arcilla = filterMunicipios({
      ...DEFAULT_FILTERS,
      soilType: "arcilla",
    });
    for (const m of arcilla) {
      const alt = computeAltitude(m.factor);
      expect(alt).toBeLessThan(800);
    }
  });

  it("returns empty for impossible filter combination", () => {
    const impossible = filterMunicipios({
      altitudeRange: [3000, 4000],
      tempRange: [25, 35],
      precipRange: [0, 1000],
      soilType: "arcilla",
    });
    expect(impossible.length).toBe(0);
  });

  it("combined filters narrow results progressively", () => {
    const step1 = filterMunicipios(DEFAULT_FILTERS);
    const step2 = filterMunicipios({ ...DEFAULT_FILTERS, altitudeRange: [500, 2500] });
    const step3 = filterMunicipios({
      ...DEFAULT_FILTERS,
      altitudeRange: [500, 2500],
      tempRange: [18, 25],
    });
    expect(step2.length).toBeLessThanOrEqual(step1.length);
    expect(step3.length).toBeLessThanOrEqual(step2.length);
  });
});
