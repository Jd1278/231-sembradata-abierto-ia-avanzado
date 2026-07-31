import { useEffect, useRef, useState } from "react";
import { History, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAnalysisHistory,
  deleteAnalysis,
  type AnalysisRecord,
} from "@/services/analysis-history";
const CROP_LABELS: Record<string, string> = {
  cacao: "Cacao",
  cafe: "Café",
  granadilla: "Granadilla",
};

interface Props {
  onSelect?: (record: AnalysisRecord) => void;
}

export function HistoryPanel({ onSelect }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      getAnalysisHistory().then(setRecords);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialog!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleDelete(id: string) {
    await deleteAnalysis(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
        aria-label="Historial de Análisis"
      >
        <History className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Historial de análisis"
            className="w-full max-w-lg rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold text-foreground">Historial de Análisis</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                ✕
              </Button>
            </div>
            <CardContent className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {records.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {"Aún no has realizado ningún análisis."}
                </p>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {r.municipio}
                        </p>
                        <Badge
                          variant={r.viable ? "default" : "destructive"}
                          className="text-[9px] shrink-0"
                        >
                          {r.score}/100
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{CROP_LABELS[r.cultivo] ?? r.cultivo}</span>
                        <span>·</span>
                        <span>{r.departamento}</span>
                        <span>·</span>
                        <span>{new Date(r.created_at).toLocaleDateString("es-CO")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {onSelect && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            onSelect(r);
                            setOpen(false);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
