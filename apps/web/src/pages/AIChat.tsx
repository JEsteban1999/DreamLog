import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { pageTitle } from "../lib/ui";

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="mb-2 list-inside list-disc space-y-1" {...props} />,
  ol: (props: React.ComponentProps<"ol">) => <ol className="mb-2 list-inside list-decimal space-y-1" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold" {...props} />,
};

const MESSAGE_LIMIT = 20;

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = messages.length >= MESSAGE_LIMIT;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || limitReached) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await apiClient.post<{ reply: string }>("/ai/chat", { messages: nextMessages });
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-11rem)] max-w-2xl flex-col md:h-[calc(100svh-7rem)]">
      <h2 className={`mb-1 ${pageTitle}`}>Chat con tus datos</h2>
      <p className="mb-4 text-xs text-faint">
        Pregúntale a Claude sobre tu historial. Ej: "¿En qué días duermo mejor?" · Límite de {MESSAGE_LIMIT} mensajes
        por sesión.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-hair bg-card p-4">
        {messages.length === 0 && <p className="text-sm text-faint">Escribe una pregunta para empezar.</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-primary text-primaryfg"
                : "border border-hairsoft bg-card2 text-ink"
            }`}
          >
            {m.role === "assistant" ? (
              <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-faint">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cool" />
            Claude está pensando…
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {limitReached && (
        <p className="mt-2 text-sm text-faint">
          Llegaste al límite de mensajes de esta sesión. Recarga la página para empezar una nueva.
        </p>
      )}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || limitReached}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-[11px] border border-hair bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-cool focus:outline-none focus:ring-2 focus:ring-cool/30"
        />
        <button
          type="submit"
          disabled={sending || limitReached || !input.trim()}
          className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold text-primaryfg transition hover:opacity-90 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
