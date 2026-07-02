import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";

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
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <h2 className="mb-1 text-2xl font-semibold">Chat con tus datos de sueño</h2>
      <p className="mb-4 text-xs text-slate-500">
        Pregúntale a Claude sobre tu historial. Ej: "¿En qué días duermo mejor?" · Límite de {MESSAGE_LIMIT}{" "}
        mensajes por sesión.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">Escribe una pregunta para empezar.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {m.role === "assistant" ? (
              <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {sending && <p className="text-sm text-slate-500">Claude está pensando...</p>}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {limitReached && (
        <p className="mt-2 text-sm text-slate-500">
          Llegaste al límite de mensajes de esta sesión. Recarga la página para empezar una nueva.
        </p>
      )}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || limitReached}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={sending || limitReached || !input.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
