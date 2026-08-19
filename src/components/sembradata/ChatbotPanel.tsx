import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Lightbulb, MessageSquare, Send, Trash2, X } from "lucide-react";

/* Lightweight markdown: bold, bullet lists, line breaks */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="ml-4 list-disc space-y-1">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (bulletMatch) {
      listItems.push(<li key={i}>{inlineBold(bulletMatch[1])}</li>);
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<br key={`br-${i}`} />);
      } else {
        elements.push(<p key={`p-${i}`}>{inlineBold(line)}</p>);
      }
    }
  }
  flushList();
  return elements;
}

function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSuggestions } from "@/services/chatbot";

const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const CHAT_HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export function ChatbotPanel({ municipio, crop }: { municipio?: string; crop?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    {
      id: number;
      role: "user" | "assistant";
      text: string;
      source?: string;
      confidence?: number;
      metadata?: { municipio?: string; sources?: string[]; intent?: string };
    }[]
  >([
    {
      id: 1,
      role: "assistant",
      text: "¡Hola! Soy el asistente de SembraData. ¿En qué puedo ayudarte hoy?",
      source: "system",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useId();
  const suggestions = useMemo(() => getSuggestions(crop, municipio), [crop, municipio]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function clearChat() {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "¡Hola! Soy el asistente de SembraData. ¿En qué puedo ayudarte hoy?",
        source: "system",
      },
    ]);
  }

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      let res: Response;
      try {
        res = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: CHAT_HEADERS,
          body: JSON.stringify({ message: q, sessionId }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: data.reply ?? "Lo siento, no pude generar una respuesta.",
          metadata: data.data
            ? { municipio: data.data.municipio, sources: data.data.sources, intent: data.intent }
            : undefined,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const msg =
        err instanceof Error && err.message.includes("Failed to fetch")
          ? "No se pudo conectar con el servidor. Verifica tu conexión."
          : err instanceof Error && err.message.includes("HTTP")
            ? `Error del servidor (${err.message}). Intenta de nuevo.`
            : "Ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.";
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", text: msg, source: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-3 z-50 flex w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 sm:right-6 sm:w-[360px]",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Chat</h3>
                <p className="text-[10px] text-muted-foreground">Groq + datos en vivo</p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Limpiar conversación"
                title="Limpiar conversación"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: 360 }}
          aria-live="polite"
        >
          {messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" ? renderMarkdown(m.text) : m.text}
              </div>
              {m.role === "assistant" && m.source && m.source !== "system" && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-[9px] text-muted-foreground",
                    m.source === "error" && "text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      m.source === "knowledge_base"
                        ? "bg-risk-low"
                        : m.source === "data_context"
                          ? "bg-sky"
                          : m.source === "llm"
                            ? "bg-risk-med"
                            : "bg-muted-foreground",
                    )}
                  />
                  {m.source === "knowledge_base" && "Base de conocimiento"}
                  {m.source === "data_context" && "Datos en vivo"}
                  {m.source === "llm" && "IA"}
                  {m.source === "fallback" && "Sin coincidencia"}
                  {m.source === "error" && "Error"}
                  {m.confidence !== undefined && ` · ${Math.round(m.confidence * 100)}% confianza`}
                </div>
              )}
              {m.metadata && (
                <div className="flex gap-1.5 mt-1 text-[10px] text-muted-foreground">
                  {m.metadata.municipio && <span>📍 {m.metadata.municipio}</span>}
                  {m.metadata.sources?.map((s) => (
                    <span
                      key={s}
                      className="bg-sky-100 dark:bg-sky-900/30 px-1.5 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {messages.length === 1 && suggestions.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                Sugerencias
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    aria-label={`Enviar: ${s}`}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Pensando...
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              disabled={!input.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
