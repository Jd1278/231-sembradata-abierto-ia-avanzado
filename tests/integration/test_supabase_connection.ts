import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const hasCredentials = !!(SUPABASE_URL && SUPABASE_KEY);

describe.skipIf(!hasCredentials)("Supabase Connection", () => {
  it("should connect to Supabase", async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from("municipios").select("id").limit(1);
    if (error && error.code === "PGRST205") {
      return;
    }
    expect(error).toBeNull();
  });
});
