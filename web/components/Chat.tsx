"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackPanel, type Debrief } from "@/components/FeedbackPanel";
import { VoiceButton } from "@/components/VoiceButton";
import { Logo } from "@/components/Logo";

type Msg = { role: "user" | "assistant"; content: string; time?: string };

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

function nowClock() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const VOICE_COPY: Record<VoiceStatus, { label: string; sub: string }> = {
  idle: { label: "Starting…", sub: "" },
  listening: { label: "Listening…", sub: "Speak naturally — I'm all ears" },
  thinking: { label: "Thinking…", sub: "Give me just a moment" },
  speaking: { label: "Speaking…", sub: "FlowChat is responding" },
};

function AiAvatar() {
  return <Logo size={28} icon={13} round />;
}

function TypingDots() {
  return (
    <div className="flex items-center" style={{ gap: 5 }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--fc)",
            animation: `dotPop 1.1s ease-in-out infinite ${d}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Chat({
  initialMessages = [],
  initialConversationId = null,
  initialTitle = "New conversation",
}: {
  initialMessages?: Msg[];
  initialConversationId?: string | null;
  initialTitle?: string;
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
  }, [messages, isStreaming]);

  async function runTurn(text: string): Promise<string> {
    const isNewConversation = conversationId.current === null;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, time: nowClock() },
      { role: "assistant", content: "", time: nowClock() },
    ]);
    setIsStreaming(true);

    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: conversationId.current }),
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
        copy[copy.length - 1] = { role: "assistant", content: assistantText, time: nowClock() };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
    return assistantText;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await runTurn(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  const subtitle = voiceError || feedbackError;

  return (
    <div className="flex h-full flex-col" style={{ overflow: "hidden", position: "relative" }}>
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center justify-between px-[22px] py-[14px] max-sm:pl-16"
        style={{
          background: "rgba(245,243,247,0.96)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: "#262626",
              letterSpacing: "-0.3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {initialTitle}
          </div>
          <div
            style={{
              fontSize: 11.5,
              marginTop: 1,
              color: subtitle ? "#dc2626" : "#9ca3af",
            }}
          >
            {subtitle || "Practice session"}
          </div>
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 8 }}>
          {!voiceMode && (
            <button
              onClick={startVoiceMode}
              disabled={isStreaming}
              className="flex items-center"
              style={{
                gap: 6,
                padding: "8px 14px",
                borderRadius: 100,
                border: "1.5px solid rgba(0,0,0,0.1)",
                background: "white",
                color: "#4b5563",
                fontSize: 13,
                fontWeight: 500,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                opacity: isStreaming ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="4" y="1" width="5" height="7" rx="2.5" stroke="#6b7280" strokeWidth="1.3" />
                <path d="M2 7c0 2.48 2.02 4.5 4.5 4.5S11 9.48 11 7" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M6.5 11.5V13" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="max-sm:hidden">Voice mode</span>
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={getFeedback}
              disabled={loadingFeedback || isStreaming || voiceMode}
              className="flex items-center"
              style={{
                gap: 6,
                padding: "8px 16px",
                borderRadius: 100,
                border: "none",
                background: "var(--fc)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 10px rgba(var(--fc-rgb),0.35)",
                opacity: loadingFeedback || isStreaming || voiceMode ? 0.6 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.3" />
                <path d="M6 4v3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="6" cy="8.5" r="0.6" fill="white" />
              </svg>
              {loadingFeedback ? "Analyzing…" : "Get feedback"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "22px 0" }}>
        {messages.length === 0 ? (
          <div
            className="flex h-full items-center justify-center text-center"
            style={{ color: "#9ca3af", padding: "0 24px" }}
          >
            <p style={{ maxWidth: 360, fontSize: 14.5, lineHeight: 1.6 }}>
              Say hi to start practicing. Talk about anything — your day, a movie,
              your work. I&apos;ll keep the conversation going.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            const waiting = isLast && m.role === "assistant" && m.content === "" && isStreaming;
            if (m.role === "assistant") {
              return (
                <div
                  key={i}
                  className="flex justify-start"
                  style={{ padding: "0 22px", marginBottom: 16, animation: "fadeUp 0.2s ease both" }}
                >
                  <div className="flex items-start" style={{ gap: 9, maxWidth: "74%" }}>
                    <div style={{ marginTop: 2 }}>
                      <AiAvatar />
                    </div>
                    <div>
                      <div
                        style={{
                          background: "white",
                          color: "#262626",
                          padding: waiting ? "15px 17px" : "12px 15px",
                          borderRadius: "18px 18px 18px 4px",
                          fontSize: 14.5,
                          lineHeight: 1.65,
                          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                          border: "1px solid rgba(0,0,0,0.05)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {waiting ? <TypingDots /> : m.content}
                      </div>
                      {!waiting && m.time && (
                        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4, paddingLeft: 4 }}>
                          {m.time}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={i}
                className="flex justify-end"
                style={{ padding: "0 22px", marginBottom: 16, animation: "fadeUp 0.2s ease both" }}
              >
                <div style={{ maxWidth: "74%" }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg,var(--fc) 0%,#e05a33 100%)",
                      color: "white",
                      padding: "12px 15px",
                      borderRadius: "18px 18px 4px 18px",
                      fontSize: 14.5,
                      lineHeight: 1.65,
                      boxShadow: "0 2px 14px rgba(var(--fc-rgb),0.32)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}
                  </div>
                  {m.time && (
                    <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4, textAlign: "right", paddingRight: 4 }}>
                      {m.time}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Voice overlay */}
      {voiceMode && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            inset: 0,
            top: 59,
            background: "rgba(245,243,247,0.97)",
            backdropFilter: "blur(10px)",
            zIndex: 20,
            animation: "fadeUp 0.2s ease both",
          }}
        >
          <div className="flex flex-col items-center" style={{ gap: 28 }}>
            <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "rgba(var(--fc-rgb),0.1)",
                  animation: "pulseRing 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  borderRadius: "50%",
                  background: "rgba(var(--fc-rgb),0.16)",
                  animation: "pulseRing 2s ease-in-out infinite 0.38s",
                }}
              />
              <div
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  inset: 20,
                  borderRadius: "50%",
                  background: "var(--fc)",
                  boxShadow: "0 4px 20px rgba(var(--fc-rgb),0.44)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="7.5" y="2" width="7" height="11" rx="3.5" fill="white" />
                  <path d="M4 11c0 3.87 3.13 7 7 7s7-3.13 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 18v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 5, height: 44 }}>
              {[30, 44, 24, 38, 20, 40, 18].map((hgt, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: hgt,
                    borderRadius: 3,
                    background: "var(--fc)",
                    transformOrigin: "center",
                    animation: `waveAnim 1s ease-in-out infinite ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "#262626" }}>
                {VOICE_COPY[voiceStatus].label}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 5 }}>
                {VOICE_COPY[voiceStatus].sub}
              </div>
            </div>
            <button
              onClick={stopVoiceMode}
              style={{
                padding: "10px 24px",
                borderRadius: 100,
                border: "1.5px solid rgba(0,0,0,0.12)",
                background: "white",
                color: "#262626",
                fontSize: 14,
                fontWeight: 500,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              End voice session
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0" style={{ padding: "14px 22px 18px", background: "rgba(245,243,247,0.96)" }}>
        <div
          className="flex items-end"
          style={{
            background: "white",
            borderRadius: 15,
            border: "1.5px solid rgba(0,0,0,0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            gap: 8,
            padding: "9px 9px 9px 15px",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 14.5,
              color: "#262626",
              resize: "none",
              maxHeight: 110,
              padding: "4px 0",
              lineHeight: 1.55,
              outline: "none",
              caretColor: "var(--fc)",
            }}
          />
          <VoiceButton
            onTranscript={(t) => setInput((prev) => (prev ? prev.trim() + " " + t : t))}
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            aria-label="Send"
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "none",
              background: "var(--fc)",
              boxShadow: "0 2px 8px rgba(var(--fc-rgb),0.35)",
              opacity: isStreaming || !input.trim() ? 0.5 : 1,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="text-center" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#b5b5b5" }}>
            FlowChat won&apos;t correct you mid-chat — just speak naturally
          </span>
        </div>
      </div>

      {feedback && <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />}
    </div>
  );
}
