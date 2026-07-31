interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  ideam: { maxRequests: 30, windowMs: 60_000 },
  nasa_power: { maxRequests: 10, windowMs: 60_000 },
  commodity: { maxRequests: 20, windowMs: 60_000 },
  open_meteo: { maxRequests: 60, windowMs: 60_000 },
  soilgrids: { maxRequests: 30, windowMs: 60_000 },
};

function getKey(service: string, identifier: string): string {
  return `${service}::${identifier}`;
}

export function canMakeRequest(service: string, identifier = "global"): boolean {
  const config = DEFAULTS[service];
  if (!config) return true;

  const key = getKey(service, identifier);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return true;
  }

  return false;
}

export function getRemainingRequests(service: string, identifier = "global"): number {
  const config = DEFAULTS[service];
  if (!config) return Infinity;

  const key = getKey(service, identifier);
  const entry = store.get(key);

  if (!entry || Date.now() > entry.resetAt) return config.maxRequests;
  return Math.max(0, config.maxRequests - entry.count);
}

export function getResetTime(service: string, identifier = "global"): number | null {
  const key = getKey(service, identifier);
  const entry = store.get(key);
  if (!entry) return null;
  return entry.resetAt;
}

export async function rateLimitedFetch(
  service: string,
  url: string,
  identifier = "global",
  fetchInit?: RequestInit,
): Promise<Response> {
  if (!canMakeRequest(service, identifier)) {
    const resetAt = getResetTime(service, identifier);
    const waitMs = resetAt ? Math.max(0, resetAt - Date.now()) + 100 : 1000;
    throw new Error(`Rate limit exceeded for ${service}. Retry in ${Math.ceil(waitMs / 1000)}s.`);
  }

  return fetch(url, fetchInit);
}
