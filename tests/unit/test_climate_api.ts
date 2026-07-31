import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCurrentClimate, fetchHistoricalClimate } from "../../src/services/climate-api";

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
    expect(result.precipitation).toBe(5);
    expect(result.windSpeed).toBe(12);
    expect(result.solarRadiation).toBe(200);
    expect(result.uvIndex).toBe(7);
    expect(result.cloudCover).toBe(40);
    expect(result.pressure).toBe(1013);
    expect(result.evapotranspiration).toBeGreaterThanOrEqual(0);
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
