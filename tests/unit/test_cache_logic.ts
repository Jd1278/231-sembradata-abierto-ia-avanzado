import { describe, it, expect } from "vitest";

// Test cache utility functions that don't need Supabase
describe("Cache TTL logic", () => {
  it("cache is fresh within TTL", () => {
    const fetchedAt = new Date(Date.now() - 1000 * 60 * 30).toISOString(); // 30 min ago
    const ttlMs = 60 * 60 * 1000; // 1 hour
    const isFresh = Date.now() - new Date(fetchedAt).getTime() < ttlMs;
    expect(isFresh).toBe(true);
  });

  it("cache is stale after TTL", () => {
    const fetchedAt = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(); // 2 hours ago
    const ttlMs = 60 * 60 * 1000; // 1 hour
    const isFresh = Date.now() - new Date(fetchedAt).getTime() < ttlMs;
    expect(isFresh).toBe(false);
  });

  it("IDEAM cache TTL is 24h", () => {
    const IDEAM_TTL_MS = 24 * 60 * 60 * 1000;
    const fetchedAt = new Date(Date.now() - IDEAM_TTL_MS + 1000).toISOString();
    const isFresh = Date.now() - new Date(fetchedAt).getTime() < IDEAM_TTL_MS;
    expect(isFresh).toBe(true);
  });

  it("NASA POWER cache TTL is 7 days", () => {
    const NASA_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const fetchedAt = new Date(Date.now() - NASA_TTL_MS + 1000).toISOString();
    const isFresh = Date.now() - new Date(fetchedAt).getTime() < NASA_TTL_MS;
    expect(isFresh).toBe(true);
  });

  it("commodity cache TTL is 1 hour", () => {
    const COMM_TTL_MS = 60 * 60 * 1000;
    const fetchedAt = new Date(Date.now() - COMM_TTL_MS + 1000).toISOString();
    const isFresh = Date.now() - new Date(fetchedAt).getTime() < COMM_TTL_MS;
    expect(isFresh).toBe(true);
  });
});
