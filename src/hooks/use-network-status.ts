import { useEffect, useState, useCallback } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook to reactively detect browser connectivity status.
 * Replaces offline caching with strict online status management.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Comprehensive network status hook with reconnections tracking and manual probe.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(() =>
    typeof navigator !== "undefined" && navigator.onLine ? new Date() : null,
  );

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
      return false;
    }

    try {
      // Lightweight HTTP HEAD/GET check to verify actual internet connectivity
      const res = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
      });
      const online = res.ok || res.status < 500;
      setIsOnline(online);
      if (online) {
        setLastOnlineAt(new Date());
      } else {
        setWasOffline(true);
      }
      return online;
    } catch {
      setIsOnline(false);
      setWasOffline(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    checkConnection,
  };
}
