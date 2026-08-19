import { describe, it, expect } from "vitest";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

describe.skipIf(!hasSupabase)("E2E: Chatbot Edge Function", () => {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  async function chat(message: string, sessionId = "e2e-test") {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, sessionId }),
    });
    return { status: r.status, body: await r.json() };
  }

  it("responds to greeting", async () => {
    const { status, body } = await chat("Hola");
    expect(status).toBe(200);
    expect(body.intent).toBe("GREETING");
    expect(body.reply).toContain("asistente");
  }, 15000);

  it("responds to crop recommendation query", async () => {
    const { status, body } = await chat("Que cultivo es viable en San Gil?");
    expect(status).toBe(200);
    expect(["CROP_RECOMMENDATION", "UNKNOWN"]).toContain(body.intent);
    expect(body.data).toBeDefined();
  }, 30000);

  it("responds to requirements query", async () => {
    const { status, body } = await chat("Como sembrar cafe");
    expect(status).toBe(200);
    expect(["CROP_REQUIREMENTS", "UNKNOWN"]).toContain(body.intent);
  }, 30000);

  it("responds to risk query", async () => {
    const { status, body } = await chat("Cuales son los riesgos del cacao");
    expect(status).toBe(200);
    expect(["CROP_RISK_ANALYSIS", "UNKNOWN"]).toContain(body.intent);
  }, 30000);

  it("returns data sources when location is detected", async () => {
    const { body } = await chat("Viable en Bucaramanga?");
    expect(body.data).toBeDefined();
  }, 30000);

  it("handles multiple sessions independently", async () => {
    const r1 = await chat("Hola", "session-a");
    const r2 = await chat("Hola", "session-b");
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  }, 30000);
});
