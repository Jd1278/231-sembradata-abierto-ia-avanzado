import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  WifiOff,
  X,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSuggestions } from "@/services/chatbot";
import { useOnlineStatus } from "@/hooks/use-network-status";

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

export interface ChatClaim {
  text: string;
  claimType:
    "observed" | "forecast" | "model_estimate" | "agronomic_requirement" | "general_guidance";
  source: string;
  observedAt?: string | null;
  value?: number | null;
  unit?: string | null;
  confidence?: number | null;
}

export interface ChatRecommendation {
  action: string;
  basis: string[];
  priority: "high" | "medium" | "low";
}

export interface ChatMessageItem {
  id: number;
  role: "user" | "assistant";
  text: string;
  summary?: string;
  provider?: "groq" | "rag_fallback" | "static";
  degraded?: boolean;
  errorCode?: string;
  requestId?: string;
  latencyMs?: number;
  source?: "system" | "error" | "groq" | "rag_fallback";
  claims?: ChatClaim[];
  recommendations?: ChatRecommendation[];
  uncertainties?: string[];
  insufficientData?: boolean;
  needsHumanReview?: boolean;
  metadata?: {
    municipio?: string | null;
    cultivo?: string | null;
    sources?: string[];
    intent?: string;
  };
  retryQuery?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CHAT_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : "";

const CHAT_HEADERS = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY || "",
  Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
};

export function ChatbotPanel({ municipio, crop }: { municipio?: string; crop?: string }) {
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 1,
      role: "assistant",
      text: "¡Hola! Soy el asistente agroclimático oficial de SembraData. ¿En qué municipio de Santander o cultivo deseas asesoría hoy?",
      source: "system",
      provider: "static",
      degraded: false,
      insufficientData: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useId();
  const suggestions = useMemo(() => getSuggestions(crop, municipio), [crop, municipio]);

  useEffect(() => {
    if (scrollRef.current) {
      if (typeof scrollRef.current.scrollTo === "function") {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages, loading]);

  function clearChat() {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "¡Hola! Soy el asistente agroclimático oficial de SembraData. ¿En qué municipio de Santander o cultivo deseas asesoría hoy?",
        source: "system",
        provider: "static",
        degraded: false,
      },
    ]);
  }

  function toggleClaims(msgId: number) {
    setExpandedClaims((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  }

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;

    if (!CHAT_ENDPOINT || !SUPABASE_ANON_KEY) {
      setMessages((m) => [
        ...m,
        { id: Date.now(), role: "user", text: q },
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "⚠️ La URL de Supabase o la clave pública no están configuradas en el entorno.",
          source: "error",
          errorCode: "CONFIG_ERROR",
        },
      ]);
      return;
    }

    setInput("");
    const userMsgId = Date.now();
    setMessages((m) => [...m, { id: userMsgId, role: "user", text: q }]);
    setLoading(true);

    const clientRequestId = crypto.randomUUID();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000); // 25s client timeout

      let res: Response;
      try {
        res = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: {
            ...CHAT_HEADERS,
            "x-request-id": clientRequestId,
          },
          body: JSON.stringify({
            message: q,
            sessionId,
            selectedContext: {
              municipio: municipio || null,
              cultivo: crop || null,
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const serverError = errBody?.error || `HTTP ${res.status}`;
        const serverCode =
          errBody?.code || (res.status === 403 ? "CORS_FORBIDDEN" : `HTTP_${res.status}`);

        let userFriendlyMsg = `Error del servidor (${serverError}). Intenta de nuevo.`;
        if (res.status === 403) {
          userFriendlyMsg =
            "Acceso no permitido por política de origen (CORS) o credenciales no autorizadas.";
        } else if (res.status === 429) {
          userFriendlyMsg =
            "Límite de peticiones de IA alcanzado temporalmente. Espera unos segundos e intenta de nuevo.";
        } else if (res.status === 503) {
          userFriendlyMsg =
            "El servicio de IA de Groq está en mantenimiento o no disponible temporalmente.";
        }

        console.error(`[Chatbot Error] Request ${clientRequestId}:`, errBody || res.status);

        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: userFriendlyMsg,
            source: "error",
            errorCode: serverCode,
            requestId: errBody?.requestId || clientRequestId,
            retryQuery: q,
          },
        ]);
        return;
      }

      const data = await res.json();
      const latencySec = data.latencyMs ? (data.latencyMs / 1000).toFixed(1) : undefined;

      console.debug(
        `[Chatbot Response] ID: ${data.requestId || clientRequestId}, Provider: ${data.provider}, Degraded: ${data.degraded}, Latency: ${latencySec}s`,
      );

      const mainText = data.answer ?? data.reply ?? "Lo siento, no pude generar una respuesta.";

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: mainText,
          summary: data.summary,
          provider: data.provider,
          degraded: data.degraded,
          errorCode: data.errorCode,
          requestId: data.requestId || clientRequestId,
          latencyMs: data.latencyMs,
          claims: data.claims || [],
          recommendations: data.recommendations || [],
          uncertainties: data.uncertainties || [],
          insufficientData: Boolean(data.insufficientData),
          needsHumanReview: Boolean(data.needsHumanReview),
          metadata: data.data
            ? {
                municipio: data.data.municipio,
                cultivo: data.data.cultivo,
                sources: data.data.sources,
                intent: data.intent,
              }
            : undefined,
        },
      ]);
    } catch (err: unknown) {
      console.error(`[Chatbot Exception] Request ${clientRequestId}:`, err);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const isFetchError = err instanceof Error && err.message.includes("Failed to fetch");

      let msg = "Ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.";
      let code = "UNKNOWN_ERROR";

      if (isTimeout) {
        msg =
          "Tiempo de espera agotado al consultar los servicios agroclimáticos. Intenta de nuevo.";
        code = "CLIENT_TIMEOUT";
      } else if (isFetchError) {
        msg =
          "No se pudo conectar con el servidor de IA. Verifica tu conexión a internet o configuración CORS.";
        code = "NETWORK_OR_CORS_ERROR";
      }

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: msg,
          source: "error",
          errorCode: code,
          requestId: clientRequestId,
          retryQuery: q,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-3 z-50 flex w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 sm:right-6 sm:w-[420px]",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        {/* Header */}
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">Asistente SembraData</h3>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-medium text-primary">
                    Verificable
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Datos oficiales y modelos agroclimáticos
                </p>
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

        {/* Message stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: 420 }}
          aria-live="polite"
        >
          {messages.map((m) => (
            <div key={m.id} className="space-y-1.5">
              <div
                className={cn(
                  "max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground font-normal"
                    : m.source === "error"
                      ? "bg-destructive/10 border border-destructive/20 text-destructive dark:text-destructive-foreground"
                      : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" ? renderMarkdown(m.text) : m.text}
              </div>

              {/* Verified Claims & Evidence Accordion */}
              {m.role === "assistant" && m.claims && m.claims.length > 0 && (
                <div className="rounded-lg border border-border/70 bg-background/50 p-2 text-xs">
                  <button
                    onClick={() => toggleClaims(m.id)}
                    className="flex w-full items-center justify-between font-medium text-foreground/80 hover:text-foreground"
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {m.claims.length} afirmación(es) verificada(s)
                    </span>
                    {expandedClaims[m.id] ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {expandedClaims[m.id] && (
                    <div className="mt-2 space-y-1.5 border-t border-border/40 pt-2 text-[10px]">
                      {m.claims.map((claim, idx) => (
                        <div key={idx} className="rounded bg-muted/40 p-1.5">
                          <p className="font-medium text-foreground">{claim.text}</p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                            <span className="font-semibold text-primary">
                              Fuente: {claim.source}
                            </span>
                            {claim.claimType && (
                              <span className="rounded bg-muted px-1">Tipo: {claim.claimType}</span>
                            )}
                            {claim.observedAt && <span>Fecha: {claim.observedAt}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Insufficient Data Warning */}
              {m.role === "assistant" && m.insufficientData && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] text-amber-800 dark:text-amber-300">
                  <HelpCircle className="h-3 w-3 shrink-0" />
                  <span>Datos insuficientes en base local para conclusiones concluyentes.</span>
                </div>
              )}

              {/* Badges / Provider metadata */}
              {m.role === "assistant" && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  {m.provider === "groq" && !m.degraded && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-primary">
                      <Sparkles className="h-2.5 w-2.5" />
                      Groq IA
                      {m.latencyMs && ` · ${(m.latencyMs / 1000).toFixed(1)}s`}
                    </span>
                  )}

                  {m.degraded && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Modo Asistido (RAG)
                    </span>
                  )}

                  {m.metadata?.municipio && <span>📍 {m.metadata.municipio}</span>}

                  {m.metadata?.sources?.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-1.5 py-0.2 text-[9px] border border-border"
                    >
                      {s}
                    </span>
                  ))}

                  {m.retryQuery && (
                    <button
                      onClick={() => send(m.retryQuery)}
                      disabled={loading || !isOnline}
                      className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted text-foreground disabled:opacity-50"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Reintentar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Suggestions when initial */}
          {messages.length === 1 && suggestions.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                Preguntas frecuentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    disabled={!isOnline || loading}
                    onClick={() => send(s)}
                    aria-label={`Enviar: ${s}`}
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 animate-pulse">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Consultando datos agroclimáticos y verificando fuentes...</span>
            </div>
          )}

          {/* Offline banner */}
          {!isOnline && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>
                Se requiere conexión a internet para consultar al asistente agroclimático.
              </span>
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="border-t border-border p-3 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isOnline && !loading) send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isOnline
                  ? "Sin conexión a internet..."
                  : loading
                    ? "Esperando respuesta..."
                    : "Pregunta sobre cultivos, clima o suelo..."
              }
              disabled={loading || !isOnline}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              disabled={!input.trim() || loading || !isOnline}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
