import { describe, it, expect } from "vitest";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

describe.skipIf(!hasSupabase)("E2E: Supabase DB queries", () => {
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  it("fetches municipios from REST API", async () => {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/municipios?select=id,nombre,departamento,latitud,longitud&limit=5`,
      { headers },
    );
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("nombre");
    expect(data[0]).toHaveProperty("latitud");
  });

  it("fetches cultivos from REST API", async () => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cultivos?select=id,nombre,rendimiento_base`, {
      headers,
    });
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.length).toBe(3);
    const names = data.map((c: { nombre: string }) => c.nombre);
    expect(names).toContain("Café");
    expect(names).toContain("Cacao");
    expect(names).toContain("Granadilla");
  });

  it("fetches clima_mensual with municipio join", async () => {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/clima_mensual?select=*,municipio_id&municipio_id=eq.bucaramanga&order=anio,mes&limit=12`,
      { headers },
    );
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.length).toBe(12);
    expect(data[0]).toHaveProperty("temp_promedio");
    expect(data[0]).toHaveProperty("precipitacion_mm");
  });

  it("fetches rendimiento_historico for a crop", async () => {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/rendimiento_historico?select=*&municipio_id=eq.san_gil&cultivo_id=eq.cafe&order=anio`,
      { headers },
    );
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("rendimiento_ton_ha");
  });

  it("fetches riesgo_agroclimatico filtered by year", async () => {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/riesgo_agroclimatico?select=nivel_riesgo,mes&municipio_id=eq.barrancabermeja&cultivo_id=eq.cacao&anio=eq.2024&order=mes`,
      { headers },
    );
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.length).toBe(12);
    expect(["Bajo", "Medio", "Alto"]).toContain(data[0].nivel_riesgo);
  });

  it("verifies RLS allows anon read on all domain tables", async () => {
    const tables = [
      "municipios",
      "cultivos",
      "clima_mensual",
      "rendimiento_historico",
      "riesgo_agroclimatico",
    ];
    for (const t of tables) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`, { headers });
      expect(r.ok).toBe(true);
    }
  });
});
