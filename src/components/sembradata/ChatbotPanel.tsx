import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  municipio: string;
  crop: string;
}

const SUGGESTIONS = [
  "¿Cuándo sembrar café?",
  "Riesgo para cacao este mes",
  "Pronóstico de lluvias",
];

export function ChatbotPanel({ municipio, crop }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: `¡Hola! Soy AsistenteAgro 🌱. Puedo ayudarte con predicciones de ${crop.toLowerCase()} en ${municipio}. ¿Qué quieres saber?`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Para ${crop.toLowerCase()} en ${municipio}, las condiciones agroclimáticas proyectadas son favorables. La ventana óptima cae entre los próximos 30–45 días con precipitación estable.`,
        },
      ]);
    }, 700);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl transition-all hover:scale-105",
          open && "rotate-90",
        )}
        aria-label="Abrir asistente"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 flex w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ height: "min(560px, calc(100vh - 8rem))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/8 to-sky/8 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">AsistenteAgro</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-low" />
              En línea · SembraData AI
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 pt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pregúntale a SembraData sobre el clima en ${municipio.split(" ")[0]}...`}
            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
