import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

describe("Supabase Connection", () => {
  it("should have valid credentials", () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_KEY).toBeTruthy();
  });

  it("should connect to Supabase", async () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from("municipios").select("id").limit(1);
    if (error && error.code === "PGRST205") {
      return;
    }
    expect(error).toBeNull();
  });
});
