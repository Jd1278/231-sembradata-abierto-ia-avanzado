import { describe, it, expect } from "vitest";
import { isSupabaseConfigured } from "@/services/supabase";

describe("isSupabaseConfigured", () => {
  it("returns a boolean", () => {
    const result = isSupabaseConfigured();
    expect(typeof result).toBe("boolean");
  });
});
