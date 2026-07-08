import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { cn, formatCNY } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/services";
import { useItems } from "@/hooks/use-data";
import { ItemImage } from "@/components/shared/ItemImage";
import type { Item } from "@/types";

const SUGGESTIONS = [
  "What should I cop next?",
  "Is my Spring Haul worth shipping yet?",
  "Which of my sellers is safest for outerwear?",
];

export function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: items = [] } = useItems();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      await streamChat(next, (delta) => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + delta };
          return copy;
        });
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Something went wrong: ${e instanceof Error ? e.message : "unknown error"}`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        aria-label="Open Haul AI"
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
      >
        <Sparkles className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className="flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:h-[70vh] sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm font-semibold uppercase tracking-editorial">
                    Haul AI
                  </span>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="space-y-3 pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Ask anything about your archive, sellers, or hauls.
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="rounded-full border border-border px-4 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} items={items} onNavigate={() => setOpen(false)} />
                ))}
                {busy && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">thinking…</span>
                  </div>
                )}
              </div>

              <footer className="border-t border-border p-3">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Haul AI…"
                    className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({
  message,
  items,
  onNavigate,
}: {
  message: ChatMessage;
  items: Item[];
  onNavigate: () => void;
}) {
  const isUser = message.role === "user";
  const mentioned = isUser ? [] : findMentionedItems(message.content, items);

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-foreground"
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {mentioned.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap gap-2">
          {mentioned.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg border border-border bg-background p-1.5 pr-3 transition-colors hover:border-primary"
            >
              <ItemImage item={item} className="h-9 w-9 rounded-md" />
              <div>
                <p className="max-w-[160px] truncate text-xs font-medium">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.priceCNY != null ? formatCNY(item.priceCNY) : item.sellerName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** matches **Bold Title** mentions in AI output against the user's items */
function findMentionedItems(content: string, items: Item[]): Item[] {
  const bolds = [...content.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].toLowerCase().trim());
  if (bolds.length === 0) return [];
  const found: Item[] = [];
  for (const item of items) {
    const t = item.title.toLowerCase();
    if (bolds.some((b) => t.includes(b) || b.includes(t))) {
      if (!found.some((f) => f.id === item.id)) found.push(item);
    }
  }
  return found.slice(0, 4);
}
