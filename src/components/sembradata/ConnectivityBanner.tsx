import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onRetry?: () => void;
}

export function ConnectivityBanner({ onRetry }: Props) {
  const { isOnline, wasOffline, checkConnection } = useNetworkStatus();
  const [checking, setChecking] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  const handleManualRetry = async () => {
    setChecking(true);
    try {
      const online = await checkConnection();
      if (online && onRetry) {
        onRetry();
      }
    } finally {
      setChecking(false);
    }
  };

  // State 1: Connection restored notification
  if (isOnline && showRestored) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      >
        <Wifi className="h-4 w-4 shrink-0" />
        <span>Conexión a internet restablecida</span>
      </aside>
    );
  }

  // State 2: Fully online normal operation (no banner needed)
  if (isOnline) return null;

  // State 3: Disconnected / Offline required warning
  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-3 border-t border-amber-600/30 bg-amber-600/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-sm transition-all sm:px-6"
    >
      <div className="flex items-center gap-2.5">
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
        <span>
          <strong>Sin conexión activa:</strong> Se requiere conexión a internet para consultar datos
          climáticos y generar predicciones agroclimáticas.
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={checking}
          onClick={handleManualRetry}
          className="h-7 rounded-lg bg-white/20 px-3 text-xs font-medium text-white hover:bg-white/30 border border-white/30"
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Comprobando..." : "Reintentar conexión"}
        </Button>
      </div>
    </aside>
  );
}
