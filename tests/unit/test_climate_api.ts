import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCurrentClimate,
  fetchHistoricalClimate,
  clearClimateCache,
  aggregateMonthlyPrecipitation,
  type DailyClimate,
} from "../../src/services/climate-api";

const rawDailyData = {
  time: ["2024-01-01", "2024-01-02", "2024-01-03"],
  temperature_2m_max: [28, 30, 26],
  temperature_2m_min: [18, 20, 16],
  precipitation_sum: [5, 0, 12],
  relative_humidity_2m_mean: [70, 65, 80],
  wind_speed_10m_mean: [10, 15, 8],
  shortwave_radiation_sum: [200, 220, 180],
  uv_index_max: [8, 9, 7],
};

const mockCurrentApiResponse = {
  current: {
    temperature_2m: 24,
    relative_humidity_2m: 72,
    precipitation: 5,
    wind_speed_10m: 12,
    wind_direction_180: 180,
    shortwave_radiation: 200,
    uv_index: 7,
    cloud_cover: 40,
    surface_pressure: 1013,
  },
  daily: rawDailyData,
};

const mockHistoricalApiResponse = {
  daily: rawDailyData,
};

beforeEach(() => {
  vi.restoreAllMocks();
  clearClimateCache();
});

describe("fetchCurrentClimate", () => {
  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(fetchCurrentClimate(6.25, -75.58)).rejects.toThrow("Climate API error: 500");
  });

  it("returns ClimateData with correct structure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCurrentApiResponse,
    } as Response);

    const result = await fetchCurrentClimate(6.25, -75.58);

    expect(result.temperature).toBe(24);
    expect(result.humidity).toBe(72);
    expect(result.precipitation).toBeCloseTo(5.667, 1);
    expect(result.windSpeed).toBe(12);
    expect(result.solarRadiation).toBe(200);
    expect(result.uvIndex).toBe(7);
    expect(result.cloudCover).toBe(40);
    expect(result.pressure).toBe(1013);
    expect(result.evapotranspiration).toBeGreaterThanOrEqual(0);
    expect(result.monthlyPrecipitation).toBeDefined();
    expect(Array.isArray(result.monthlyPrecipitation)).toBe(true);
    expect(result.monthlyPrecipitation.length).toBeGreaterThan(0);
  });

  it("parses daily data correctly (3 days)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCurrentApiResponse,
    } as Response);

    const result = await fetchCurrentClimate(6.25, -75.58);
    expect(result.dailyData).toHaveLength(3);
    expect(result.dailyData[0].date).toBe("2024-01-01");
    expect(result.dailyData[0].tempMax).toBe(28);
    expect(result.dailyData[0].tempMin).toBe(18);
    expect(result.dailyData[0].precip).toBe(5);
    expect(result.dailyData[0].humidity).toBe(70);
    expect(result.dailyData[0].windSpeed).toBe(10);
    expect(result.dailyData[0].solarRad).toBe(200);
    expect(result.dailyData[0].uvIndex).toBe(8);
  });

  it("computes temperatureMax and temperatureMin from daily data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCurrentApiResponse,
    } as Response);

    const result = await fetchCurrentClimate(6.25, -75.58);
    expect(result.temperatureMax).toBe(30);
    expect(result.temperatureMin).toBe(16);
  });

  it("computes agricultural indices", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCurrentApiResponse,
    } as Response);

    const result = await fetchCurrentClimate(6.25, -75.58);
    const idx = result.agriculturalIndex;

    expect(idx.GrowingDegreeDays).toBeGreaterThanOrEqual(0);
    expect(idx.aridityIndex).toBeGreaterThanOrEqual(0);
    expect(idx.moistureStressIndex).toBeGreaterThanOrEqual(0);
    expect(idx.moistureStressIndex).toBeLessThanOrEqual(1);
    expect(idx.frostRisk).toBeGreaterThanOrEqual(0);
    expect(idx.frostRisk).toBeLessThanOrEqual(0.8);
    expect(idx.droughtRisk).toBeGreaterThanOrEqual(0);
    expect(idx.droughtRisk).toBeLessThanOrEqual(0.9);
  });

  it("builds correct URL with parameters", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCurrentApiResponse,
    } as Response);

    await fetchCurrentClimate(6.25, -75.58);
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("latitude=6.25");
    expect(calledUrl).toContain("longitude=-75.58");
    expect(calledUrl).toContain("forecast_days=7");
    expect(calledUrl).toContain("timezone=America%2FBogota");
    expect(calledUrl).toContain("api.open-meteo.com");
  });
});

describe("fetchHistoricalClimate", () => {
  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-12-31")).rejects.toThrow(
      "Historical climate API error: 404",
    );
  });

  it("returns ClimateData on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockHistoricalApiResponse,
    } as Response);

    const result = await fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-12-31");
    expect(result.temperature).toBeGreaterThan(0);
    expect(result.dailyData).toHaveLength(3);
    expect(result.windDirection).toBe(0);
    expect(result.cloudCover).toBe(0);
    expect(result.pressure).toBe(1013);
  });

  it("builds correct URL for archive API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockHistoricalApiResponse,
    } as Response);

    await fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-12-31");
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("archive-api.open-meteo.com");
    expect(calledUrl).toContain("start_date=2023-01-01");
    expect(calledUrl).toContain("end_date=2023-12-31");
  });

  it("computes evapotranspiration from avg temp", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockHistoricalApiResponse,
    } as Response);

    const result = await fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-12-31");
    expect(result.evapotranspiration).toBeGreaterThanOrEqual(0);
  });

  it("computes agricultural indices for historical data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockHistoricalApiResponse,
    } as Response);

    const result = await fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-12-31");
    const idx = result.agriculturalIndex;
    expect(idx).toBeDefined();
    expect(typeof idx.GrowingDegreeDays).toBe("number");
    expect(typeof idx.aridityIndex).toBe("number");
    expect(typeof idx.moistureStressIndex).toBe("number");
    expect(typeof idx.frostRisk).toBe("number");
    expect(typeof idx.droughtRisk).toBe("number");
  });

  it("frost risk is detected when any daily tempMin < 2", async () => {
    const frostData = {
      daily: {
        time: ["2023-06-01"],
        temperature_2m_max: [25],
        temperature_2m_min: [1],
        precipitation_sum: [10],
        relative_humidity_2m_mean: [60],
        wind_speed_10m_mean: [5],
        shortwave_radiation_sum: [180],
        uv_index_max: [7],
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => frostData,
    } as Response);

    const result = await fetchHistoricalClimate(6.25, -75.58, "2023-06-01", "2023-06-01");
    expect(result.agriculturalIndex.frostRisk).toBe(0.8);
  });

  it("drought risk is high when precipitation is very low", async () => {
    const droughtData = {
      daily: {
        time: ["2023-01-01", "2023-01-02"],
        temperature_2m_max: [30, 32],
        temperature_2m_min: [20, 22],
        precipitation_sum: [0.5, 0.8],
        relative_humidity_2m_mean: [35, 30],
        wind_speed_10m_mean: [15, 18],
        shortwave_radiation_sum: [250, 260],
        uv_index_max: [9, 10],
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => droughtData,
    } as Response);

    const result = await fetchHistoricalClimate(6.25, -75.58, "2023-01-01", "2023-01-02");
    expect(result.agriculturalIndex.droughtRisk).toBe(0.9);
  });
});

describe("fetchCurrentClimate - edge cases in daily data", () => {
  it("handles extreme temperature spread", async () => {
    const extremeData = {
      current: {
        temperature_2m: 35,
        relative_humidity_2m: 20,
        precipitation: 0,
        wind_speed_10m: 30,
        wind_direction_10m: 270,
        shortwave_radiation: 350,
        uv_index: 11,
        cloud_cover: 5,
        surface_pressure: 1000,
      },
      daily: {
        time: ["2024-01-01"],
        temperature_2m_max: [45],
        temperature_2m_min: [5],
        precipitation_sum: [0],
        relative_humidity_2m_mean: [15],
        wind_speed_10m_mean: [25],
        shortwave_radiation_sum: [350],
        uv_index_max: [11],
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => extremeData,
    } as Response);

    const result = await fetchCurrentClimate(6.25, -75.58);
    expect(result.temperatureMax).toBe(45);
    expect(result.temperatureMin).toBe(5);
    expect(result.agriculturalIndex.frostRisk).toBe(0);
    expect(result.agriculturalIndex.droughtRisk).toBe(0.9);
    expect(result.agriculturalIndex.moistureStressIndex).toBe(1);
  });
});

describe("aggregateMonthlyPrecipitation", () => {
  it("Case 1: sums daily precip within a single month", () => {
    const daily: DailyClimate[] = [
      {
        date: "2026-08-01",
        tempMax: 28,
        tempMin: 18,
        precip: 10,
        humidity: 70,
        windSpeed: 10,
        solarRad: 20,
        uvIndex: 8,
      },
      {
        date: "2026-08-02",
        tempMax: 30,
        tempMin: 19,
        precip: 20,
        humidity: 65,
        windSpeed: 12,
        solarRad: 22,
        uvIndex: 9,
      },
      {
        date: "2026-08-03",
        tempMax: 27,
        tempMin: 17,
        precip: 5,
        humidity: 75,
        windSpeed: 8,
        solarRad: 18,
        uvIndex: 7,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ year: 2026, month: 8, precipitation: 35 });
  });

  it("Case 2: splits daily precip across two months", () => {
    const daily: DailyClimate[] = [
      {
        date: "2026-07-31",
        tempMax: 28,
        tempMin: 18,
        precip: 10,
        humidity: 70,
        windSpeed: 10,
        solarRad: 20,
        uvIndex: 8,
      },
      {
        date: "2026-08-01",
        tempMax: 30,
        tempMin: 19,
        precip: 20,
        humidity: 65,
        windSpeed: 12,
        solarRad: 22,
        uvIndex: 9,
      },
      {
        date: "2026-08-02",
        tempMax: 27,
        tempMin: 17,
        precip: 5,
        humidity: 75,
        windSpeed: 8,
        solarRad: 18,
        uvIndex: 7,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ year: 2026, month: 7, precipitation: 10 });
    expect(result[1]).toEqual({ year: 2026, month: 8, precipitation: 25 });
  });

  it("Case 3: handles year boundary correctly", () => {
    const daily: DailyClimate[] = [
      {
        date: "2025-12-31",
        tempMax: 25,
        tempMin: 15,
        precip: 15,
        humidity: 60,
        windSpeed: 10,
        solarRad: 20,
        uvIndex: 7,
      },
      {
        date: "2026-01-01",
        tempMax: 28,
        tempMin: 18,
        precip: 20,
        humidity: 70,
        windSpeed: 12,
        solarRad: 22,
        uvIndex: 8,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ year: 2025, month: 12, precipitation: 15 });
    expect(result[1]).toEqual({ year: 2026, month: 1, precipitation: 20 });
  });

  it("Case 4: handles zero precipitation values", () => {
    const daily: DailyClimate[] = [
      {
        date: "2026-08-01",
        tempMax: 28,
        tempMin: 18,
        precip: 0,
        humidity: 50,
        windSpeed: 10,
        solarRad: 25,
        uvIndex: 9,
      },
      {
        date: "2026-08-02",
        tempMax: 30,
        tempMin: 19,
        precip: 0,
        humidity: 45,
        windSpeed: 12,
        solarRad: 26,
        uvIndex: 10,
      },
      {
        date: "2026-08-03",
        tempMax: 27,
        tempMin: 17,
        precip: 10,
        humidity: 70,
        windSpeed: 8,
        solarRad: 18,
        uvIndex: 7,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(1);
    expect(result[0].precipitation).toBe(10);
  });

  it("Case 5: incomplete month — returns actual accumulated value without extrapolation", () => {
    const daily: DailyClimate[] = Array.from({ length: 15 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      tempMax: 28,
      tempMin: 18,
      precip: 10,
      humidity: 70,
      windSpeed: 10,
      solarRad: 20,
      uvIndex: 8,
    }));
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(1);
    expect(result[0].precipitation).toBe(150);
    expect(result[0].month).toBe(8);
  });

  it("returns empty array for empty input", () => {
    expect(aggregateMonthlyPrecipitation([])).toEqual([]);
  });

  it("sorts results chronologically", () => {
    const daily: DailyClimate[] = [
      {
        date: "2026-03-01",
        tempMax: 28,
        tempMin: 18,
        precip: 5,
        humidity: 70,
        windSpeed: 10,
        solarRad: 20,
        uvIndex: 8,
      },
      {
        date: "2026-01-15",
        tempMax: 26,
        tempMin: 16,
        precip: 8,
        humidity: 65,
        windSpeed: 12,
        solarRad: 22,
        uvIndex: 7,
      },
      {
        date: "2026-02-20",
        tempMax: 27,
        tempMin: 17,
        precip: 12,
        humidity: 68,
        windSpeed: 11,
        solarRad: 21,
        uvIndex: 8,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result).toHaveLength(3);
    expect(result[0].month).toBe(1);
    expect(result[1].month).toBe(2);
    expect(result[2].month).toBe(3);
  });

  it("handles null/undefined precip values gracefully", () => {
    const daily: DailyClimate[] = [
      {
        date: "2026-08-01",
        tempMax: 28,
        tempMin: 18,
        precip: 5,
        humidity: 70,
        windSpeed: 10,
        solarRad: 20,
        uvIndex: 8,
      },
      {
        date: "2026-08-02",
        tempMax: 30,
        tempMin: 19,
        precip: 0,
        humidity: 65,
        windSpeed: 12,
        solarRad: 22,
        uvIndex: 9,
      },
    ];
    const result = aggregateMonthlyPrecipitation(daily);
    expect(result[0].precipitation).toBe(5);
  });
});
