import { describe, expect, it } from "vitest";
import { recommendAlternativeCrops } from "../../src/services/crop-recommendations";
import { classifyMunicipalityClimate } from "../../src/services/climate-state";
import type { ClimateData } from "../../src/services/climate-api";

const climate = (temperature: number, precipitation: number, humidity: number): ClimateData => ({
  temperature,
  precipitation,
  humidity,
  temperatureMax: temperature + 3,
  temperatureMin: temperature - 3,
  windSpeed: 5,
  windDirection: 0,
  solarRadiation: 15,
  uvIndex: 4,
  cloudCover: 40,
  pressure: 1013,
  evapotranspiration: 2,
  dailyData: [],
  monthlyPrecipitation: [],
  agriculturalIndex: {
    GrowingDegreeDays: 0,
    aridityIndex: 1,
    moistureStressIndex: 0,
    frostRisk: 0,
    droughtRisk: 0,
  },
});

describe("recommendations by municipality conditions", () => {
  it("changes the ranking between warm lowland and cool highland contexts", () => {
    const warm = recommendAlternativeCrops({
      temperature: 27,
      precipitationDaily: 5,
      humidity: 78,
      altitude: 400,
    });
    const cool = recommendAlternativeCrops({
      temperature: 17,
      precipitationDaily: 4,
      humidity: 70,
      altitude: 2200,
    });
    expect(warm.map((crop) => crop.name)).not.toEqual(cool.map((crop) => crop.name));
    expect(warm[0].name).toBe("Cacao");
    expect(cool.some((crop) => ["Granadilla", "Lulo", "Tomate de árbol"].includes(crop.name))).toBe(
      true,
    );
    expect(warm.every((crop) => crop.score !== undefined && crop.compatibility !== undefined)).toBe(
      true,
    );
  });

  it("produces a deterministic climate category for the same source data", () => {
    const source = climate(24, 5, 80);
    const first = classifyMunicipalityClimate("Prueba", "cacao", source, 400);
    const second = classifyMunicipalityClimate("Prueba", "cacao", source, 400);
    expect(first.score).toBe(second.score);
    expect(first.level).toBe(second.level);
  });
});
