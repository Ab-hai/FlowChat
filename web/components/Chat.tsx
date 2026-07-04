"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackPanel, type Debrief, type Pronunciation } from "@/components/FeedbackPanel";
import { VoiceButton } from "@/components/VoiceButton";
import { Logo } from "@/components/Logo";
import { recordUtterance, webmToWav16k, type Recorder } from "@/lib/audio";
import { topics } from "@/lib/topics";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import RotatingText from "@/components/ui/rotating-text";
import { Briefcase, Coffee, MessageCircle, Plane, Users, Utensils } from "lucide-react";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  interview: <Briefcase className="h-4 w-4" style={{ color: "var(--fc)" }} />,
  restaurant: <Utensils className="h-4 w-4" style={{ color: "var(--fc)" }} />,
  smalltalk: <Coffee className="h-4 w-4" style={{ color: "var(--fc)" }} />,
  standup: <Users className="h-4 w-4" style={{ color: "var(--fc)" }} />,
  travel: <Plane className="h-4 w-4" style={{ color: "var(--fc)" }} />,
  free: <MessageCircle className="h-4 w-4" style={{ color: "var(--fc)" }} />,
};

const ROTATING_PHRASES: string[] = topics.map((t) => t.practiceLabel);

type Msg = { role: "user" | "assistant"; content: string; time?: string };
type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

type PronWord = { word: string | null; accuracy: number | null; error: string | null };
type PronTurn = {
  accuracy: number | null;
  fluency: number | null;
  prosody: number | null;
  words: PronWord[];
};

// Bluetooth earbuds drop to low-quality "call" mode while the mic is open, then
// take ~1-2s to switch back to hi-fi (A2DP) once it closes. Playing a brief,
// near-silent tone spins the output path back up during silence, so the first
// words of the reply don't come out muffled. Best-effort — harmless on wired/
// speaker output.
async function warmUpOutput(ms = 850): Promise<void> {
  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0005; // ~-66dB, effectively inaudible
    osc.frequency.value = 220;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    await new Promise((r) => setTimeout(r, ms));
    osc.stop();
    await ctx.close();
  } catch {
    // ignore if the audio context can't start
  }
}

async function speak(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  return new Promise((resolve) => {
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

function aggregatePron(turns: PronTurn[]): Pronunciation | null {
  if (!turns.length) return null;
  const mean = (vals: (number | null)[]) => {
    const nums = vals.filter((v): v is number => typeof v === "number");
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  };
  const words: string[] = [];
  for (const t of turns) {
    for (const w of t.words ?? []) {
      if (w.word && w.error && w.error !== "None" && !words.includes(w.word)) {
        words.push(w.word);
      }
    }
  }
  return {
    accuracy: mean(turns.map((t) => t.accuracy)),
    fluency: mean(turns.map((t) => t.fluency)),
    prosody: mean(turns.map((t) => t.prosody)),
    words: words.slice(0, 6),
  };
}

const VOICE_COPY: Record<VoiceStatus, { label: string; sub: string }> = {
  idle: { label: "Starting…", sub: "" },
  listening: { label: "Listening…", sub: "Speak, then pause — or tap to finish" },
  thinking: { label: "Thinking…", sub: "Scoring how you sounded" },
  speaking: { label: "Speaking…", sub: "FlowChat is responding" },
};

function AiAvatar() {
  return <Logo size={28} icon={13} round />;
}

function TypingDots() {
  return (
    <div className="flex items-center" style={{ gap: 5, height: 24 }}>
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
  const [pronSummary, setPronSummary] = useState<Pronunciation | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const conversationId = useRef<string | null>(initialConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceModeRef = useRef(false);
  const recorderRef = useRef<Recorder | null>(null);
  const pronScoresRef = useRef<PronTurn[]>([]);
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
      setPronSummary(aggregatePron(pronScoresRef.current));
      setFeedback((await res.json()) as Debrief);
    } catch {
      setFeedbackError("Couldn't generate feedback. Try again.");
    } finally {
      setLoadingFeedback(false);
    }
  }

  async function transcribeBlob(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("audio", blob, "audio.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) return "";
    const { text } = await res.json();
    return (text || "").trim();
  }

  async function pronounceBlob(blob: Blob): Promise<PronTurn | null> {
    try {
      const wav = await webmToWav16k(blob);
      const form = new FormData();
      form.append("audio", wav, "audio.wav");
      const res = await fetch("/api/pronounce", { method: "POST", body: form });
      if (!res.ok) return null;
      return (await res.json()) as PronTurn;
    } catch {
      return null;
    }
  }

  async function voiceLoop() {
    while (voiceModeRef.current) {
      setVoiceStatus("listening");
      let rec: Recorder;
      try {
        rec = await recordUtterance();
      } catch {
        setVoiceError("Microphone access is blocked in your browser settings.");
        break;
      }
      recorderRef.current = rec;
      const blob = await rec.done;
      recorderRef.current = null;
      if (!voiceModeRef.current) break;
      if (!blob) continue;

      setVoiceStatus("thinking");
      // Warm the Bluetooth output back up while we transcribe + generate, so
      // it's ready the instant the reply is — hides the ~850ms behind the wait.
      const warmUp = warmUpOutput();
      // Pronunciation only feeds end-of-session feedback, so score it in the
      // background instead of blocking the reply on the slower Gemini call.
      void pronounceBlob(blob).then((pron) => {
        if (pron) pronScoresRef.current.push(pron);
      });

      const text = await transcribeBlob(blob);
      if (!voiceModeRef.current) break;
      if (!text) {
        await warmUp;
        continue;
      }

      const reply = await runTurn(text);
      await warmUp;
      if (!voiceModeRef.current) break;
      setVoiceStatus("speaking");
      await speak(reply);
    }
    voiceModeRef.current = false;
    setVoiceMode(false);
    setVoiceStatus("idle");
  }

  function startVoiceMode() {
    setVoiceError(null);
    voiceModeRef.current = true;
    setVoiceMode(true);
    voiceLoop();
  }

  function stopVoiceMode() {
    voiceModeRef.current = false;
    setVoiceMode(false);
    setVoiceStatus("idle");
    recorderRef.current?.cancel();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  async function startTopic(topicId: string) {
    if (starting) return;
    setStarting(true);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      if (!res.ok) throw new Error();
      const { conversationId } = await res.json();
      router.push(`/chat/${conversationId}`);
      router.refresh();
    } catch {
      setStarting(false);
    }
  }

  const subtitle = voiceError || feedbackError;

  return (
    <div className="flex h-full flex-col" style={{ overflow: "hidden", position: "relative" }}>
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center justify-between pr-[22px] pl-16"
        style={{
          background: "rgba(245,243,247,0.96)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          paddingTop: 11,
          paddingBottom: 11,
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
          <div style={{ fontSize: 11.5, marginTop: 1, color: subtitle ? "#dc2626" : "#9ca3af" }}>
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
            className="flex h-full flex-col items-center justify-center"
            style={{ padding: "0 24px 56px" }}
          >
            <div style={{ width: "100%", maxWidth: 580 }}>
              <div className="flex flex-col items-center" style={{ marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: "clamp(28px,5.5vw,40px)",
                    fontWeight: 800,
                    color: "#262626",
                    letterSpacing: "-0.8px",
                    lineHeight: 1.1,
                  }}
                >
                  Wanna learn how to
                </span>
                <div style={{ marginTop: 12 }}>
                  <RotatingText
                    texts={ROTATING_PHRASES}
                    mainClassName="inline-flex justify-center overflow-hidden rounded-2xl px-4 py-2"
                    style={{
                      backgroundColor: "rgba(var(--fc-rgb),0.12)",
                      color: "var(--fc)",
                      fontSize: "clamp(28px,5.5vw,40px)",
                      fontWeight: 800,
                      letterSpacing: "-0.8px",
                    }}
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.02}
                    splitLevelClassName="overflow-hidden pb-2"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3800}
                  />
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 22 }}>
                Pick a scenario, or type your own opening line.
              </p>
              <ActionSearchBar
                value={input}
                onChange={setInput}
                onSubmit={(q) => {
                  setInput("");
                  void runTurn(q);
                }}
                pending={starting}
              />
              <div className="flex flex-wrap items-center justify-center" style={{ gap: 8, marginTop: 20 }}>
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setInput(t.practiceLabel);
                      startTopic(t.id);
                    }}
                    disabled={starting}
                    className="flex items-center transition-colors hover:bg-black/[0.04]"
                    style={{
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 100,
                      border: "1px solid rgba(0,0,0,0.1)",
                      background: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      cursor: "pointer",
                      opacity: starting ? 0.6 : 1,
                    }}
                  >
                    {TOPIC_ICONS[t.id]}
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            const waiting = isLast && m.role === "assistant" && m.content === "" && isStreaming;
            if (m.role === "assistant") {
              return (
                <div key={i} className="flex justify-start" style={{ padding: "0 22px", marginBottom: 16, animation: "fadeUp 0.2s ease both" }}>
                  <div style={{ maxWidth: "74%" }}>
                    <div className="flex items-end" style={{ gap: 9 }}>
                      <AiAvatar />
                      <div
                        style={{
                          background: "white",
                          color: "#262626",
                          padding: "12px 15px",
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
                    </div>
                    {!waiting && m.time && (
                      <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4, paddingLeft: 41 }}>{m.time}</div>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex justify-end" style={{ padding: "0 22px", marginBottom: 16, animation: "fadeUp 0.2s ease both" }}>
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
                    <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4, textAlign: "right", paddingRight: 4 }}>{m.time}</div>
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
          style={{ inset: 0, top: 59, background: "rgba(245,243,247,0.97)", backdropFilter: "blur(10px)", zIndex: 20, animation: "fadeUp 0.2s ease both" }}
        >
          <div className="flex flex-col items-center" style={{ gap: 28 }}>
            <button
              onClick={() => recorderRef.current?.stop()}
              aria-label="Finish speaking"
              className="relative flex items-center justify-center"
              style={{ width: 96, height: 96, background: "transparent", border: "none" }}
            >
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(var(--fc-rgb),0.1)", animation: "pulseRing 2s ease-in-out infinite" }} />
              <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "rgba(var(--fc-rgb),0.16)", animation: "pulseRing 2s ease-in-out infinite 0.38s" }} />
              <div className="flex items-center justify-center" style={{ position: "absolute", inset: 20, borderRadius: "50%", background: "var(--fc)", boxShadow: "0 4px 20px rgba(var(--fc-rgb),0.44)" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="7.5" y="2" width="7" height="11" rx="3.5" fill="white" />
                  <path d="M4 11c0 3.87 3.13 7 7 7s7-3.13 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 18v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </button>
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
                    animation: voiceStatus === "listening" ? `waveAnim 1s ease-in-out infinite ${i * 0.1}s` : "none",
                    opacity: voiceStatus === "listening" ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "#262626" }}>
                {VOICE_COPY[voiceStatus].label}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 5 }}>{VOICE_COPY[voiceStatus].sub}</div>
            </div>
            <button
              onClick={stopVoiceMode}
              style={{ padding: "10px 24px", borderRadius: 100, border: "1.5px solid rgba(0,0,0,0.12)", background: "white", color: "#262626", fontSize: 14, fontWeight: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              End voice session
            </button>
          </div>
        </div>
      )}

      {messages.length > 0 && (
      <div className="shrink-0" style={{ padding: "14px 22px 18px", background: "rgba(245,243,247,0.96)" }}>
        <div
          className="flex items-end"
          style={{ background: "white", borderRadius: 15, border: "1.5px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", gap: 8, padding: "9px 9px 9px 15px" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 14.5, color: "#262626", resize: "none", maxHeight: 110, padding: "4px 0", lineHeight: 1.55, outline: "none", caretColor: "var(--fc)" }}
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
            style={{ width: 36, height: 36, borderRadius: 9, border: "none", background: "var(--fc)", boxShadow: "0 2px 8px rgba(var(--fc-rgb),0.35)", opacity: isStreaming || !input.trim() ? 0.5 : 1 }}
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
      )}

      {feedback && (
        <FeedbackPanel feedback={feedback} pronunciation={pronSummary} onClose={() => setFeedback(null)} />
      )}
    </div>
  );
}
