import { describe, it, expect } from "vitest";

describe("E2E: External APIs", () => {
  it("Open-Meteo forecast returns Santander climate data", async () => {
    const r = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=6.8&longitude=-73.1&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America/Bogota&forecast_days=7",
    );
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.current).toBeDefined();
    expect(d.current.temperature_2m).toBeGreaterThan(10);
    expect(d.current.temperature_2m).toBeLessThan(45);
    expect(d.daily.time.length).toBe(7);
  });

  it("Open-Meteo archive returns historical data", async () => {
    const r = await fetch(
      "https://archive-api.open-meteo.com/v1/archive?latitude=6.8&longitude=-73.1&start_date=2024-06-01&end_date=2024-06-07&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America/Bogota",
    );
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.daily.time.length).toBe(7);
  });

  it("Open-Meteo geocoding finds San Gil", async () => {
    const r = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=San+Gil&count=1&language=es",
    );
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.results).toBeDefined();
    expect(d.results.length).toBeGreaterThan(0);
    expect(d.results[0].name).toBe("San Gil");
    expect(d.results[0].latitude).toBeCloseTo(6.56, 0);
  });

  it("SoilGrids returns soil properties for Santander", async () => {
    const r = await fetch(
      "https://rest.isric.org/soilgrids/v2.0/properties/query?lat=6.8&lon=-73.1&property=clay&depth=0-5cm&value=mean",
    );
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.properties).toBeDefined();
    expect(d.properties.layers).toBeDefined();
    expect(d.properties.layers.length).toBeGreaterThan(0);
  }, 15000);

  it("IDEAM Socrata returns station data", async () => {
    const r = await fetch("https://www.datos.gov.co/resource/57sv-p2fu.json?%24limit=2", {
      headers: { "X-App-Token": "fk5z1BAln1JMhy4R1M3l1pRPH" },
    });
    if (r.status === 503) return;
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.length).toBeGreaterThan(0);
    expect(d[0]).toHaveProperty("nombreestacion");
  });

  it("IDEAM Socrata returns observations", async () => {
    const r = await fetch(
      "https://www.datos.gov.co/resource/uext-mhny.json?%24limit=2&%24order=fechaobservacion%20DESC",
      { headers: { "X-App-Token": "fk5z1BAln1JMhy4R1M3l1pRPH" } },
    );
    if (r.status === 503) return;
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.length).toBeGreaterThan(0);
    expect(d[0]).toHaveProperty("fechaobservacion");
  });
});
