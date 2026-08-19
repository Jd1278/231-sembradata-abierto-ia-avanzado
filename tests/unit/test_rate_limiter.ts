import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Reset the module store between tests by re-importing fresh modules
let canMakeRequest: typeof import("../../src/services/rate-limiter").canMakeRequest;
let getRemainingRequests: typeof import("../../src/services/rate-limiter").getRemainingRequests;
let getResetTime: typeof import("../../src/services/rate-limiter").getResetTime;
let rateLimitedFetch: typeof import("../../src/services/rate-limiter").rateLimitedFetch;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.restoreAllMocks();
  vi.resetModules();
  const mod = await import("../../src/services/rate-limiter");
  canMakeRequest = mod.canMakeRequest;
  getRemainingRequests = mod.getRemainingRequests;
  getResetTime = mod.getResetTime;
  rateLimitedFetch = mod.rateLimitedFetch;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("canMakeRequest", () => {
  it("allows requests for an unknown service", () => {
    expect(canMakeRequest("unknown_service")).toBe(true);
  });

  it("allows requests within the limit for nasa_power (10 req/window)", () => {
    for (let i = 0; i < 10; i++) {
      expect(canMakeRequest("nasa_power")).toBe(true);
    }
  });

  it("blocks requests exceeding the limit for nasa_power", () => {
    for (let i = 0; i < 10; i++) {
      canMakeRequest("nasa_power");
    }
    expect(canMakeRequest("nasa_power")).toBe(false);
  });

  it("allows requests within the limit for ideam (30 req/window)", () => {
    for (let i = 0; i < 30; i++) {
      expect(canMakeRequest("ideam")).toBe(true);
    }
  });

  it("blocks requests exceeding the limit for ideam", () => {
    for (let i = 0; i < 30; i++) {
      canMakeRequest("ideam");
    }
    expect(canMakeRequest("ideam")).toBe(false);
  });

  it("isolates identifiers independently", () => {
    for (let i = 0; i < 10; i++) {
      canMakeRequest("nasa_power", "user-a");
    }
    expect(canMakeRequest("nasa_power", "user-a")).toBe(false);
    expect(canMakeRequest("nasa_power", "user-b")).toBe(true);
  });

  it("allows requests for commodity (20 req/window)", () => {
    for (let i = 0; i < 20; i++) {
      expect(canMakeRequest("commodity")).toBe(true);
    }
    expect(canMakeRequest("commodity")).toBe(false);
  });

  it("allows requests for soilgrids (30 req/window)", () => {
    for (let i = 0; i < 30; i++) {
      expect(canMakeRequest("soilgrids")).toBe(true);
    }
    expect(canMakeRequest("soilgrids")).toBe(false);
  });
});

describe("getRemainingRequests", () => {
  it("returns max requests for unknown service", () => {
    expect(getRemainingRequests("unknown")).toBe(Infinity);
  });

  it("returns full quota for nasa_power initially", () => {
    expect(getRemainingRequests("nasa_power")).toBe(10);
  });

  it("decrements as requests are made", () => {
    canMakeRequest("nasa_power");
    canMakeRequest("nasa_power");
    expect(getRemainingRequests("nasa_power")).toBe(8);
  });

  it("returns 0 after limit is reached", () => {
    for (let i = 0; i < 10; i++) canMakeRequest("nasa_power");
    expect(getRemainingRequests("nasa_power")).toBe(0);
  });

  it("returns full quota after window reset", () => {
    for (let i = 0; i < 10; i++) canMakeRequest("nasa_power");
    vi.advanceTimersByTime(60_001);
    expect(getRemainingRequests("nasa_power")).toBe(10);
  });
});

describe("getResetTime", () => {
  it("returns null when no requests have been made", () => {
    expect(getResetTime("ideam")).toBeNull();
  });

  it("returns a future timestamp after requests are made", () => {
    canMakeRequest("ideam");
    const resetTime = getResetTime("ideam");
    expect(resetTime).not.toBeNull();
    expect(resetTime!).toBeGreaterThan(Date.now());
  });
});

describe("sliding window reset", () => {
  it("resets the window after windowMs expires", () => {
    for (let i = 0; i < 10; i++) {
      canMakeRequest("nasa_power");
    }
    expect(canMakeRequest("nasa_power")).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(canMakeRequest("nasa_power")).toBe(true);
    expect(getRemainingRequests("nasa_power")).toBe(9);
  });

  it("partially resets if only some time has passed", () => {
    for (let i = 0; i < 10; i++) {
      canMakeRequest("nasa_power");
    }
    vi.advanceTimersByTime(30_000);
    expect(canMakeRequest("nasa_power")).toBe(false);
  });

  it("resets identifer independently", () => {
    for (let i = 0; i < 10; i++) canMakeRequest("nasa_power", "a");
    vi.advanceTimersByTime(60_001);
    expect(canMakeRequest("nasa_power", "a")).toBe(true);
  });
});

describe("rateLimitedFetch", () => {
  it("throws when rate limit is exceeded", async () => {
    const mockResponse = { ok: true } as Response;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    for (let i = 0; i < 10; i++) {
      await rateLimitedFetch("nasa_power", "https://example.com");
    }

    await expect(rateLimitedFetch("nasa_power", "https://example.com")).rejects.toThrow(
      /Rate limit exceeded for nasa_power/,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(10);
  });

  it("calls fetch when under the limit", async () => {
    const mockResponse = { ok: true } as Response;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const result = await rateLimitedFetch("nasa_power", "https://example.com");
    expect(result).toBe(mockResponse);
  });

  it("passes fetchInit through to fetch", async () => {
    const mockResponse = { ok: true } as Response;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const init: RequestInit = { method: "POST", headers: { "Content-Type": "application/json" } };
    await rateLimitedFetch("nasa_power", "https://example.com", "global", init);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }),
    );
  });

  it("works for open_meteo with high limit (60)", async () => {
    const mockResponse = { ok: true } as Response;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    for (let i = 0; i < 60; i++) {
      await rateLimitedFetch("open_meteo", "https://api.open-meteo.com");
    }

    await expect(rateLimitedFetch("open_meteo", "https://api.open-meteo.com")).rejects.toThrow(
      /Rate limit exceeded/,
    );
  });

  it("unknown service always allows requests", async () => {
    const mockResponse = { ok: true } as Response;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    for (let i = 0; i < 100; i++) {
      const result = await rateLimitedFetch("unknown_svc", "https://example.com");
      expect(result).toBe(mockResponse);
    }
  });
});
