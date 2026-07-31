import { useOnlineStatus } from "@/hooks/use-offline";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="h-3.5 w-3.5" />
      Sin conexión — mostrando datos guardados
    </div>
  );
}
