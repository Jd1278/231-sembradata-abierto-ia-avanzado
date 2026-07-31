import { useEffect, useState, useCallback } from "react";

const OFFLINE_KEY = "sembraData:offline";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface OfflineEntry {
  key: string;
  data: unknown;
  timestamp: number;
}

function getStore(): Record<string, OfflineEntry> {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, OfflineEntry>) {
  try {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(store));
  } catch {
    // Storage full — clear oldest entries
    const entries = Object.values(store).sort((a, b) => a.timestamp - b.timestamp);
    const trimmed = entries.slice(Math.floor(entries.length / 2));
    const newStore: Record<string, OfflineEntry> = {};
    for (const e of trimmed) newStore[e.key] = e;
    try {
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(newStore));
    } catch {
      // Give up
    }
  }
}

export function saveOffline(key: string, data: unknown) {
  const store = getStore();
  store[key] = { key, data, timestamp: Date.now() };
  setStore(store);
}

export function getOffline<T>(key: string): T | null {
  const store = getStore();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MAX_AGE_MS) {
    delete store[key];
    setStore(store);
    return null;
  }
  return entry.data as T;
}

export function clearOffline() {
  try {
    localStorage.removeItem(OFFLINE_KEY);
  } catch {
    // Private browsing or storage full
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineAwareFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
): { data: T | null; loading: boolean; isStale: boolean } {
  const [data, setData] = useState<T | null>(() => getOffline<T>(key));
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const load = useCallback(async () => {
    const cached = getOffline<T>(key);
    if (cached) {
      setData(cached);
      setIsStale(true);
    }

    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const fresh = await fetcher();
      setData(fresh);
      setIsStale(false);
      saveOffline(key, fresh);
    } catch {
      if (!cached) setData(null);
    } finally {
      setLoading(false);
    }
  }, [key, isOnline, fetcher]);

  useEffect(() => {
    load().then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, isStale };
}
