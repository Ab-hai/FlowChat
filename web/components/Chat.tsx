"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackPanel, type Debrief } from "@/components/FeedbackPanel";
import { VoiceButton } from "@/components/VoiceButton";

type Msg = { role: "user" | "assistant"; content: string };

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechResultLike = {
  results: { length: number; [i: number]: { [j: number]: { transcript: string } } };
};

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-60" />
    </span>
  );
}

export function Chat({
  initialMessages = [],
  initialConversationId = null,
}: {
  initialMessages?: Msg[];
  initialConversationId?: string | null;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<Debrief | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const conversationId = useRef<string | null>(initialConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceModeRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runTurn(text: string): Promise<string> {
    const isNewConversation = conversationId.current === null;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId.current,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const cid = res.headers.get("X-Conversation-Id");
      if (cid) conversationId.current = cid;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }

      if (isNewConversation) router.refresh();
    } catch {
      assistantText =
        "⚠️ Couldn't reach the chat service. Make sure the FastAPI server is running.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: assistantText };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
    return assistantText;
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await runTurn(text);
  }

  async function getFeedback() {
    const cid = conversationId.current;
    if (!cid || loadingFeedback || isStreaming) return;

    setFeedbackError(null);
    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cid }),
      });
      if (!res.ok) throw new Error();
      setFeedback((await res.json()) as Debrief);
    } catch {
      setFeedbackError("Couldn't generate feedback. Try again.");
    } finally {
      setLoadingFeedback(false);
    }
  }

  function listenTurn() {
    const rec = recognitionRef.current;
    if (!rec || !voiceModeRef.current) return;

    setVoiceStatus("listening");
    let heard = "";

    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      heard = last[0].transcript;
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceError("Microphone access is blocked in your browser settings.");
        voiceModeRef.current = false;
      }
    };
    rec.onend = async () => {
      if (!voiceModeRef.current) {
        setVoiceMode(false);
        setVoiceStatus("idle");
        return;
      }
      const text = heard.trim();
      if (!text) {
        listenTurn();
        return;
      }
      setVoiceStatus("thinking");
      const reply = await runTurn(text);
      if (!voiceModeRef.current) {
        setVoiceMode(false);
        setVoiceStatus("idle");
        return;
      }
      setVoiceStatus("speaking");
      await speak(reply);
      if (!voiceModeRef.current) {
        setVoiceMode(false);
        setVoiceStatus("idle");
        return;
      }
      listenTurn();
    };

    try {
      rec.start();
    } catch {
      // already started
    }
  }

  function startVoiceMode() {
    const rec = createRecognition();
    if (!rec) {
      setVoiceError("Voice mode needs Chrome or Edge.");
      return;
    }
    setVoiceError(null);
    recognitionRef.current = rec;
    voiceModeRef.current = true;
    setVoiceMode(true);
    listenTurn();
  }

  function stopVoiceMode() {
    voiceModeRef.current = false;
    setVoiceMode(false);
    setVoiceStatus("idle");
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  const voiceLabel: Record<VoiceStatus, string> = {
    idle: "Starting…",
    listening: "Listening… just talk",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-end gap-3 px-4 py-2">
        {voiceError && <span className="text-xs text-red-500">{voiceError}</span>}
        {messages.length > 0 && feedbackError && (
          <span className="text-xs text-red-500">{feedbackError}</span>
        )}
        {messages.length > 0 && (
          <button
            onClick={getFeedback}
            disabled={loadingFeedback || isStreaming || voiceMode}
            className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            {loadingFeedback ? "Analyzing…" : "Get feedback"}
          </button>
        )}
        {!voiceMode && (
          <button
            onClick={startVoiceMode}
            disabled={isStreaming}
            className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            🎙 Voice mode
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-zinc-500">
            <p className="max-w-sm">
              Say hi to start practicing. Type, dictate with the mic, or hit
              Voice mode to just talk.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            const waiting =
              isLast && m.role === "assistant" && m.content === "" && isStreaming;
            return (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    "max-w-[75%] whitespace-pre-wrap rounded-2xl border px-4 py-2 text-sm shadow-[0_3px_12px_rgba(0,0,0,0.07)] " +
                    (m.role === "user"
                      ? "border-white/10 text-white"
                      : "border-black/5 text-zinc-800")
                  }
                  style={{
                    backgroundImage:
                      m.role === "user"
                        ? "linear-gradient(135deg, #e35a30 0%, #be3f1c 100%)"
                        : "linear-gradient(135deg, #ffffff 0%, #f1eef5 100%)",
                  }}
                >
                  {waiting ? <TypingDots /> : m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {voiceMode ? (
        <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800">
          <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {voiceStatus === "listening" && (
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            )}
            {voiceLabel[voiceStatus]}
          </span>
          <button
            onClick={stopVoiceMode}
            className="rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            End voice mode
          </button>
        </div>
      ) : (
        <form
          onSubmit={sendMessage}
          className="border-t border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex gap-2">
            <VoiceButton
              onTranscript={(t) =>
                setInput((prev) => (prev ? prev.trim() + " " + t : t))
              }
              disabled={isStreaming}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-secondary dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="rounded-full bg-secondary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary-hover disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />
      )}
    </div>
  );
}
