import { describe, it, expect } from "vitest";
import { evaluateViability } from "../../src/types/prediction-v2";
import type { CropKey } from "../../src/types/crops";

const CAFE_OPTIMAL = {
  crop: "cafe" as CropKey,
  soilPh: 6.0,
  soilOrganicMatter: 3.0,
  soilTexture: "Franco",
  temperature: 20,
  precipitation: 5,
  humidity: 70,
  windSpeed: 10,
  solarRadiation: 20,
  altitude: 1500,
  month: 5,
  hasRealData: true,
};

const CACAO_OPTIMAL = {
  crop: "cacao" as CropKey,
  soilPh: 6.0,
  soilOrganicMatter: 3.5,
  soilTexture: "Franco",
  temperature: 24,
  precipitation: 5,
  humidity: 80,
  windSpeed: 8,
  solarRadiation: 20,
  altitude: 400,
  month: 7,
  hasRealData: true,
};

const GRANADILLA_OPTIMAL = {
  crop: "granadilla" as CropKey,
  soilPh: 6.0,
  soilOrganicMatter: 3.0,
  soilTexture: "Franco",
  temperature: 18,
  precipitation: 5,
  humidity: 75,
  windSpeed: 10,
  solarRadiation: 20,
  altitude: 2200,
  month: 5,
  hasRealData: true,
};

describe("evaluateViability - score range", () => {
  it("returns score between 0 and 100 for Café", () => {
    const result = evaluateViability(
      CAFE_OPTIMAL.crop,
      CAFE_OPTIMAL.soilPh,
      CAFE_OPTIMAL.soilOrganicMatter,
      CAFE_OPTIMAL.soilTexture,
      CAFE_OPTIMAL.temperature,
      CAFE_OPTIMAL.precipitation,
      CAFE_OPTIMAL.humidity,
      CAFE_OPTIMAL.windSpeed,
      CAFE_OPTIMAL.solarRadiation,
      CAFE_OPTIMAL.altitude,
      CAFE_OPTIMAL.month,
      CAFE_OPTIMAL.hasRealData,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns score between 0 and 100 for Cacao", () => {
    const result = evaluateViability(
      CACAO_OPTIMAL.crop,
      CACAO_OPTIMAL.soilPh,
      CACAO_OPTIMAL.soilOrganicMatter,
      CACAO_OPTIMAL.soilTexture,
      CACAO_OPTIMAL.temperature,
      CACAO_OPTIMAL.precipitation,
      CACAO_OPTIMAL.humidity,
      CACAO_OPTIMAL.windSpeed,
      CACAO_OPTIMAL.solarRadiation,
      CACAO_OPTIMAL.altitude,
      CACAO_OPTIMAL.month,
      CACAO_OPTIMAL.hasRealData,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns score between 0 and 100 for Granadilla", () => {
    const result = evaluateViability(
      GRANADILLA_OPTIMAL.crop,
      GRANADILLA_OPTIMAL.soilPh,
      GRANADILLA_OPTIMAL.soilOrganicMatter,
      GRANADILLA_OPTIMAL.soilTexture,
      GRANADILLA_OPTIMAL.temperature,
      GRANADILLA_OPTIMAL.precipitation,
      GRANADILLA_OPTIMAL.humidity,
      GRANADILLA_OPTIMAL.windSpeed,
      GRANADILLA_OPTIMAL.solarRadiation,
      GRANADILLA_OPTIMAL.altitude,
      GRANADILLA_OPTIMAL.month,
      GRANADILLA_OPTIMAL.hasRealData,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns high score for optimal conditions across all crops", () => {
    const opts = [CAFE_OPTIMAL, CACAO_OPTIMAL, GRANADILLA_OPTIMAL];
    for (const o of opts) {
      const result = evaluateViability(
        o.crop,
        o.soilPh,
        o.soilOrganicMatter,
        o.soilTexture,
        o.temperature,
        o.precipitation,
        o.humidity,
        o.windSpeed,
        o.solarRadiation,
        o.altitude,
        o.month,
        o.hasRealData,
      );
      expect(result.score).toBeGreaterThanOrEqual(70);
    }
  });

  it("returns low score for terrible conditions", () => {
    const result = evaluateViability("cafe", 9.0, 0.1, "Arena", 40, 5, 10, 50, 5, 500, 1, true);
    expect(result.score).toBeLessThanOrEqual(30);
  });
});

describe("evaluateViability - viability flag", () => {
  it("marks viable when score >= 50", () => {
    const result = evaluateViability(
      CAFE_OPTIMAL.crop,
      CAFE_OPTIMAL.soilPh,
      CAFE_OPTIMAL.soilOrganicMatter,
      CAFE_OPTIMAL.soilTexture,
      CAFE_OPTIMAL.temperature,
      CAFE_OPTIMAL.precipitation,
      CAFE_OPTIMAL.humidity,
      CAFE_OPTIMAL.windSpeed,
      CAFE_OPTIMAL.solarRadiation,
      CAFE_OPTIMAL.altitude,
      CAFE_OPTIMAL.month,
      CAFE_OPTIMAL.hasRealData,
    );
    expect(result.viable).toBe(true);
  });

  it("marks not viable when score < 50", () => {
    const result = evaluateViability("cafe", 9.0, 0.1, "Arena", 40, 5, 10, 50, 5, 500, 1, true);
    expect(result.viable).toBe(false);
  });
});

describe("evaluateViability - pest risk for extreme conditions", () => {
  it("detects Alto pest risk with high humidity, favorable fungal temps, and drought for cacao", () => {
    // fungal risk (40) + drought stress (25) = 65 → Alto
    // precip=1 < droughtThreshold=2 → drought triggers; humidity=90 > 80 → fungal triggers
    const result = evaluateViability("cacao", 6.0, 3.0, "Franco", 25, 1, 90, 8, 20, 400, 1, true);
    expect(result.pestRisk.level).toBe("Alto");
    expect(result.pestRisk.factors.length).toBeGreaterThan(0);
  });

  it("detects frost risk at very low temperature", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 3, 100, 60, 5, 20, 1500, 7, true);
    expect(result.pestRisk.factors.some((f) => f.includes("heladas"))).toBe(true);
    expect(result.pestRisk.level).toBe("Medio");
  });

  it("detects Alto pest risk when frost + drought combined", () => {
    // frost (35) + drought (25) = 60, no optimal-reduction (humidity=65 >= 60) → Alto
    // precip=1 < droughtThreshold=3 (cafe) → drought triggers
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 3, 1, 65, 5, 20, 1500, 7, true);
    expect(result.pestRisk.level).toBe("Alto");
  });

  it("detects drought-related pest risk", () => {
    // precip=1 < droughtThreshold=3 (cafe) → drought triggers
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 22, 1, 50, 10, 20, 1500, 7, true);
    expect(result.pestRisk.factors.some((f) => f.includes("hídrico"))).toBe(true);
  });

  it("returns Bajo pest risk under optimal conditions", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 65, 10, 25, 1500, 3, true);
    expect(result.pestRisk.level).toBe("Bajo");
  });
});

describe("evaluateViability - crop-specific weights (Café altitude)", () => {
  it("Café penalizes wrong altitude more than Cacao due to higher altitude weight", () => {
    const wrongAlt = 300;
    const cafeResult = evaluateViability(
      "cafe",
      6.0,
      3.0,
      "Franco",
      20,
      5,
      70,
      10,
      20,
      wrongAlt,
      5,
      true,
    );
    const cacaoResult = evaluateViability(
      "cacao",
      6.0,
      3.0,
      "Franco",
      24,
      180,
      80,
      8,
      20,
      wrongAlt,
      7,
      true,
    );

    const cafeAltFactor = cafeResult.factors.find((f) => f.variable === "Altitud")!;
    const cacaoAltFactor = cacaoResult.factors.find((f) => f.variable === "Altitud")!;

    expect(cafeAltFactor.weight).toBeGreaterThan(cacaoAltFactor.weight);
  });
});

describe("evaluateViability - soil type matching", () => {
  it("Franco texture is optimal for all crops", () => {
    const crops: CropKey[] = ["cacao", "cafe", "granadilla"];
    for (const crop of crops) {
      const alt = crop === "cacao" ? 400 : crop === "cafe" ? 1500 : 2200;
      const result = evaluateViability(crop, 6.0, 3.0, "Franco", 22, 5, 75, 10, 20, alt, 5, true);
      const textureFactor = result.factors.find((f) => f.variable === "Textura del suelo")!;
      expect(textureFactor.status).toBe("favorable");
    }
  });

  it("Arena texture is unfavorable for all crops", () => {
    const crops: CropKey[] = ["cacao", "cafe", "granadilla"];
    for (const crop of crops) {
      const alt = crop === "cacao" ? 400 : crop === "cafe" ? 1500 : 2200;
      const result = evaluateViability(crop, 6.0, 3.0, "Arena", 22, 5, 75, 10, 20, alt, 5, true);
      const textureFactor = result.factors.find((f) => f.variable === "Textura del suelo")!;
      expect(textureFactor.status).toBe("unfavorable");
    }
  });

  it("Arcilla is neutral for cacao", () => {
    const result = evaluateViability("cacao", 6.0, 3.0, "Arcilla", 24, 5, 80, 8, 20, 400, 7, true);
    const textureFactor = result.factors.find((f) => f.variable === "Textura del suelo")!;
    expect(textureFactor.status).toBe("neutral");
  });

  it("unknown texture defaults to Franco scores", () => {
    const result = evaluateViability(
      "cacao",
      6.0,
      3.0,
      "TexturaDesconocida",
      24,
      5,
      80,
      8,
      20,
      400,
      7,
      true,
    );
    const textureFactor = result.factors.find((f) => f.variable === "Textura del suelo")!;
    expect(textureFactor.status).toBe("favorable");
  });
});

describe("evaluateViability - seasonal scoring", () => {
  it("produces different seasonal notes by month", () => {
    const notes: string[] = [];
    for (let month = 1; month <= 12; month++) {
      const result = evaluateViability(
        "cafe",
        6.0,
        3.0,
        "Franco",
        20,
        5,
        70,
        10,
        20,
        1500,
        month,
        true,
      );
      notes.push(result.seasonalNote);
    }
    const uniqueNotes = new Set(notes);
    expect(uniqueNotes.size).toBeGreaterThan(1);
  });

  it("produces different scores by month under marginal conditions", () => {
    const scores: number[] = [];
    for (let month = 1; month <= 12; month++) {
      const result = evaluateViability(
        "cafe",
        5.5,
        1.5,
        "Arcilla",
        20,
        5,
        70,
        10,
        20,
        1500,
        month,
        true,
      );
      scores.push(result.score);
    }
    const uniqueScores = new Set(scores);
    expect(uniqueScores.size).toBeGreaterThan(1);
  });

  it("high-sensitivity month (April for Café = Floración) has a note", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 4, true);
    expect(result.seasonalNote).toContain("Floración");
  });

  it("low-sensitivity month (February for Café = Cosecha) has a note", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 2, true);
    expect(result.seasonalNote).toContain("Cosecha");
  });
});

describe("evaluateViability - confidence calculation", () => {
  it("higher confidence with real data than synthetic", () => {
    const withReal = evaluateViability(
      "cafe",
      6.0,
      3.0,
      "Franco",
      20,
      5,
      70,
      10,
      20,
      1500,
      5,
      true,
    );
    const withoutReal = evaluateViability(
      "cafe",
      6.0,
      3.0,
      "Franco",
      20,
      5,
      70,
      10,
      20,
      1500,
      5,
      false,
    );
    expect(withReal.confidence).toBeGreaterThan(withoutReal.confidence);
  });

  it("confidence is clamped between 20 and 95", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 5, true);
    expect(result.confidence).toBeGreaterThanOrEqual(20);
    expect(result.confidence).toBeLessThanOrEqual(95);
  });

  it("more decisive factors increase confidence", () => {
    const optimal = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 5, true);
    const extreme = evaluateViability("cafe", 9.0, 0.1, "Arena", 40, 5, 10, 50, 5, 500, 1, true);
    expect(extreme.confidence).toBeGreaterThanOrEqual(optimal.confidence);
  });
});

describe("evaluateViability - edge cases", () => {
  it("handles very high values", () => {
    const result = evaluateViability(
      "cacao",
      14.0,
      20.0,
      "Franco",
      60,
      5000,
      100,
      100,
      500,
      5000,
      7,
      true,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveLength(9);
  });

  it("handles zero values", () => {
    const result = evaluateViability("cafe", 0, 0, "Franco", 0, 0, 0, 0, 0, 0, 1, true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.viable).toBe(false);
  });

  it("handles negative values gracefully", () => {
    const result = evaluateViability(
      "cafe",
      -1,
      -5,
      "Franco",
      -20,
      -100,
      -10,
      -5,
      -50,
      -500,
      1,
      true,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("always returns exactly 9 factors", () => {
    const result = evaluateViability("cacao", 6.0, 3.0, "Franco", 24, 5, 80, 8, 20, 400, 7, true);
    expect(result.factors).toHaveLength(9);
  });

  it("each factor has required fields", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 5, true);
    for (const f of result.factors) {
      expect(f.variable).toBeTruthy();
      expect(f.value).toBeTruthy();
      expect(["favorable", "unfavorable", "neutral"]).toContain(f.status);
      expect(["alto", "medio", "bajo"]).toContain(f.impact);
      expect(f.explanation).toBeTruthy();
      expect(f.weight).toBeGreaterThan(0);
      expect(f.contribution).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns alternatives for each crop", () => {
    const crops: CropKey[] = ["cacao", "cafe", "granadilla"];
    for (const crop of crops) {
      const alt = crop === "cacao" ? 400 : crop === "cafe" ? 1500 : 2200;
      const result = evaluateViability(crop, 6.0, 3.0, "Franco", 22, 5, 75, 10, 20, alt, 5, true);
      expect(result.alternatives.length).toBeGreaterThan(0);
      for (const alt of result.alternatives) {
        expect(alt.name).toBeTruthy();
        expect(alt.reason).toBeTruthy();
      }
    }
  });

  it("returns recommendations array", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 5, true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe("evaluateViability - interaction effects", () => {
  it("high temp + low humidity causes severe stress", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 30, 5, 40, 10, 20, 1500, 5, true);
    expect(result.factors.length).toBe(9);
    expect(result.score).toBeLessThan(80);
  });

  it("wind + high temp causes evapotranspiration stress", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 28, 5, 70, 30, 20, 1500, 5, true);
    expect(result.score).toBeLessThan(85);
  });

  it("optimal temp + humidity synergy boosts score", () => {
    const result = evaluateViability("cafe", 6.0, 3.0, "Franco", 20, 5, 70, 10, 20, 1500, 5, true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});
