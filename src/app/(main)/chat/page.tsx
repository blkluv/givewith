"use client";

import { useRef, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { auth as firebaseAuth } from "@/lib/firebase";
import { LocusLogo } from "@/components/ui/locus-logo";
import { ThemeProvider } from "@crayonai/react-ui";
import { gwlDark, gwlLight } from "@/lib/crayon-theme";
import "@crayonai/react-ui/styles/index.css";
import "@/app/thesys-overrides.css";

const C1Component = dynamic(
  () => import("@thesysai/genui-sdk").then((m) => m.C1Component),
  { ssr: false },
);

const STARTERS = [
  {
    label: "Find climate charities",
    prompt: "Find verified charities working on climate change",
  },
  {
    label: "Check my balance",
    prompt: "What's my current USDC balance?",
  },
  {
    label: "Clean water, SE Asia",
    prompt: "I want to support clean water initiatives in Southeast Asia",
  },
  {
    label: "Recruit a new charity",
    prompt: "How do I invite a charity not yet on BLKLUV.ORG?",
  },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async (): Promise<Record<string, string>> => {
        const token = await firebaseAuth.currentUser?.getIdToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  // Reconcile any stale donation statuses against live Locus state. Fires:
  //   - on chat page mount (catches donations stuck from a previous session)
  //   - after every assistant turn completes (catches donations the agent
  //     just executed where the inline poll didn't see settlement in time)
  // Fire-and-forget — the donations + dashboard pages also reconcile on
  // their own mounts, so a failure here doesn't strand the user.
  useEffect(() => {
    if (!user) return;
    if (status !== "ready") return;
    (async () => {
      try {
        const token = await user.getIdToken();
        await fetch("/api/donations/reconcile", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* best-effort */
      }
    })();
  }, [user, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  // Dispatch clicks/actions inside C1-generated UI back to the agent.
  // The LLM sees the rich `llmFriendlyMessage` (full context); the user's
  // bubble shows only the short `humanFriendlyMessage` via metadata.
  //
  // Navigation actions are intercepted: if the button carries a URL, we open
  // it in a new tab and DO NOT send a chat turn. The agent communicates this
  // intent either via `params.url` (preferred) or by prefixing the
  // llmFriendlyMessage with `OPEN_URL ` (fallback).
  const handleC1Action = (evt: {
    humanFriendlyMessage?: string;
    llmFriendlyMessage?: string;
    params?: Record<string, unknown>;
  }) => {
    // Try every plausible field the C1/Crayon runtime might use. LLMs are
    // imperfect at the button-action contract; this keeps clicks from being
    // swallowed silently just because the agent put the label in a
    // non-canonical slot.
    const p = (evt.params ?? {}) as Record<string, unknown>;
    const pick = (v: unknown) =>
      typeof v === "string" && v.trim().length > 0 ? v : undefined;
    const llmMsg =
      pick(evt.llmFriendlyMessage) ||
      pick(p.llmFriendlyMessage) ||
      pick(p.message) ||
      pick(p.prompt) ||
      pick(p.intent) ||
      pick(evt.humanFriendlyMessage) ||
      pick(p.humanFriendlyMessage) ||
      pick(p.label) ||
      pick(p.text);

    // Navigation interception — opens in new tab, no chat turn.
    const paramUrl = pick(p.url) || pick(p.href) || pick(p.link);
    const openUrlPrefix = llmMsg?.startsWith("OPEN_URL ")
      ? llmMsg.slice("OPEN_URL ".length).trim()
      : null;
    const navUrl = paramUrl || openUrlPrefix;
    if (navUrl && /^https?:\/\//i.test(navUrl)) {
      window.open(navUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!llmMsg) {
      // Last-resort diagnostic: something got clicked but we couldn't extract
      // intent. Log the raw event so we can tighten the system prompt.
      console.warn("[chat] C1 action fired with no usable message:", evt);
      return;
    }

    const humanMsg =
      pick(evt.humanFriendlyMessage) ||
      pick(p.humanFriendlyMessage) ||
      pick(p.label) ||
      llmMsg;

    sendMessage({
      text: llmMsg,
      metadata: { humanFriendlyMessage: humanMsg },
    });
  };

  const isEmpty = messages.length === 0;

  if (!user) return <ChatLoading />;

  return (
    <ThemeProvider mode="dark" theme={gwlLight} darkTheme={gwlDark}>
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-10">
            {isEmpty ? (
              <WelcomeScreen
                onPick={(prompt) => submitMessage(prompt)}
                disabled={isLoading}
              />
            ) : (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((m, idx) => {
                    const text =
                      m.parts
                        ?.filter((p) => p.type === "text")
                        .map((p) => ("text" in p ? p.text : ""))
                        .join("") || "";
                    const metadata = (m as { metadata?: { humanFriendlyMessage?: string } })
                      .metadata;
                    const displayText =
                      m.role === "user" && metadata?.humanFriendlyMessage
                        ? metadata.humanFriendlyMessage
                        : text;
                    const isLast = idx === messages.length - 1;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {m.role === "user" ? (
                          <UserBubble text={displayText} />
                        ) : (
                          <AssistantMessage
                            text={text}
                            isStreaming={isLoading && isLast}
                            onAction={handleC1Action}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {status === "submitted" ? <TypingDots /> : null}

                {error ? (
                  <div className="border border-destructive/40 bg-destructive/10 p-4 type-body-sm text-destructive">
                    {error.message || "Something went wrong."}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background">
          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-3xl items-end gap-2 px-6 py-4"
          >
            <textarea
              id="chat-input"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about a cause, check your balance, or confirm a donation…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none border border-border bg-card px-4 py-3 type-body text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60"
              style={{ minHeight: "48px", maxHeight: "200px" }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
}

function WelcomeScreen({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8 py-12"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 type-caption text-primary">
          <LocusLogo size={12} />
          Giving agent
        </div>
        <h1 className="type-display-xl text-foreground">
          <span className="font-editorial">What moves</span> you?
        </h1>
        <p className="type-body-lg max-w-xl text-muted-foreground">
          Tell me what you care about. I&apos;ll find verified charities, explain
          my reasoning, and execute donations on-chain.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s.prompt)}
            className="group border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:opacity-60"
          >
            <div className="type-subheading text-foreground">{s.label}</div>
            <div className="mt-1 line-clamp-2 type-body-sm text-muted-foreground">
              {s.prompt}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] whitespace-pre-wrap bg-primary px-4 py-3 type-body text-primary-foreground">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({
  text,
  isStreaming,
  onAction,
}: {
  text: string;
  isStreaming: boolean;
  onAction: (evt: {
    humanFriendlyMessage?: string;
    llmFriendlyMessage?: string;
    params?: Record<string, unknown>;
  }) => void;
}) {
  if (!text && !isStreaming) return null;

  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground"
        aria-hidden
      >
        <LocusLogo size={14} />
      </div>
      <div className="min-w-0 flex-1 border border-border bg-card p-4">
        <C1Component
          c1Response={text}
          isStreaming={isStreaming}
          onAction={onAction}
        />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 pl-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function ChatLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-20 overflow-hidden bg-border">
          <div className="h-full w-full animate-pulse bg-primary" />
        </div>
        <p className="type-caption text-muted-foreground">Loading agent</p>
      </div>
    </div>
  );
}
