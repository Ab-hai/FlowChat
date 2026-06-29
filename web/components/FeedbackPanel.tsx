"use client";

import { clarityBand } from "@/lib/clarity";

type Phrasing = { original: string; suggestion: string };

export type Debrief = {
  clarityScore: number;
  summary: string;
  overusedWords: string[];
  betterPhrasings: Phrasing[];
  focusArea: string;
};

export type Pronunciation = {
  accuracy: number | null;
  fluency: number | null;
  prosody: number | null;
  words: string[];
};

const label = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 11,
} as const;

const divider = { height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 22px 0" };

export function FeedbackPanel({
  feedback,
  pronunciation,
  onClose,
}: {
  feedback: Debrief;
  pronunciation?: Pronunciation | null;
  onClose: () => void;
}) {
  const band = clarityBand(feedback.clarityScore);
  const hasPron =
    pronunciation != null &&
    (pronunciation.accuracy != null ||
      pronunciation.fluency != null ||
      pronunciation.prosody != null);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: "rgba(14,7,3,0.5)",
        backdropFilter: "blur(5px)",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 24,
          width: "100%",
          maxWidth: 508,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 72px rgba(0,0,0,0.24)",
          animation: "slideModal 0.22s ease both",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between" style={{ padding: "22px 22px 0" }}>
          <div>
            <div style={{ ...label, marginBottom: 10, letterSpacing: "0.7px", color: "#9ca3af" }}>
              Session feedback
            </div>
            <div
              className={`inline-flex items-center ${band.className}`}
              style={{ gap: 7, padding: "5px 13px", borderRadius: 100, marginBottom: 12 }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: band.color }} />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{band.label}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#262626", lineHeight: 1.2 }}>
              Here&apos;s your session feedback
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#f5f5f5",
              marginTop: 2,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div style={{ padding: "14px 22px 0" }}>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.72 }}>{feedback.summary}</p>
        </div>

        {/* Pronunciation (voice mode only) */}
        {hasPron && pronunciation && (
          <>
            <div style={divider} />
            <div style={{ padding: "18px 22px 0" }}>
              <div style={label}>How you sounded</div>
              <div className="flex" style={{ gap: 8 }}>
                {[
                  { l: "Accuracy", v: pronunciation.accuracy },
                  { l: "Fluency", v: pronunciation.fluency },
                  { l: "Prosody", v: pronunciation.prosody },
                ].map((x) => (
                  <div
                    key={x.l}
                    style={{ flex: 1, background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: x.v == null ? "#9ca3af" : clarityBand(x.v).color }}>
                      {x.v == null ? "—" : Math.round(x.v)}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{x.l}</div>
                  </div>
                ))}
              </div>
              {pronunciation.words.length > 0 && (
                <>
                  <div style={{ ...label, marginTop: 14 }}>Sounds to work on</div>
                  <div className="flex flex-wrap" style={{ gap: 7 }}>
                    {pronunciation.words.map((w, i) => (
                      <span
                        key={i}
                        style={{ padding: "6px 13px", background: "#fee2e2", color: "#b91c1c", borderRadius: 100, fontSize: 13, fontWeight: 600 }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Filler words */}
        {feedback.overusedWords.length > 0 && (
          <>
            <div style={divider} />
            <div style={{ padding: "18px 22px 0" }}>
              <div style={label}>Filler words detected</div>
              <div className="flex flex-wrap" style={{ gap: 7 }}>
                {feedback.overusedWords.map((word, i) => (
                  <span
                    key={i}
                    style={{ padding: "6px 13px", background: "#fee2e2", color: "#b91c1c", borderRadius: 100, fontSize: 13, fontWeight: 600 }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Better phrasings */}
        {feedback.betterPhrasings.length > 0 && (
          <>
            <div style={divider} />
            <div style={{ padding: "18px 22px 0" }}>
              <div style={label}>Better phrasings</div>
              {feedback.betterPhrasings.map((p, i) => (
                <div
                  key={i}
                  style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
                    <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>
                      {p.original}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--fc)", fontWeight: 700 }}>→</span>
                    <span style={{ fontSize: 13, color: "#262626", fontWeight: 600 }}>
                      {p.suggestion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Focus area + CTA */}
        <div style={{ ...divider, margin: "6px 22px 0" }} />
        <div style={{ padding: "18px 22px 22px" }}>
          <div style={label}>Focus area for next time</div>
          <div
            style={{
              background: "rgba(var(--fc-rgb),0.07)",
              border: "1.5px solid rgba(var(--fc-rgb),0.22)",
              borderRadius: 14,
              padding: "15px 17px",
              marginBottom: 18,
            }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fc)", flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fc)", lineHeight: 1.5 }}>
                {feedback.focusArea}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 100,
              border: "none",
              background: "var(--fc)",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              boxShadow: "0 3px 14px rgba(var(--fc-rgb),0.4)",
              letterSpacing: "-0.2px",
            }}
          >
            Got it — keep practicing
          </button>
        </div>
      </div>
    </div>
  );
}
