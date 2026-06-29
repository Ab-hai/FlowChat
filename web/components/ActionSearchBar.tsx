"use client";

import { useState } from "react";
import { topics } from "@/lib/topics";

export function ActionSearchBar({
  onPickTopic,
  onSubmitText,
  disabled,
}: {
  onPickTopic: (id: string) => void;
  onSubmitText: (text: string) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const query = q.trim();
  const filtered = topics.filter(
    (t) =>
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.desc.toLowerCase().includes(query.toLowerCase())
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query && !disabled) {
      e.preventDefault();
      onSubmitText(query);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: "#262626", textAlign: "center", letterSpacing: "-0.4px", marginBottom: 5 }}>
        What would you like to practice?
      </h2>
      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 18 }}>
        Pick a scenario, or type your own opening line.
      </p>

      <div style={{ position: "relative" }}>
        <div
          className="flex items-center"
          style={{
            background: "white",
            border: `1.5px solid ${focused ? "var(--fc)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            padding: "0 12px 0 14px",
            gap: 10,
            transition: "border-color 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={handleKeyDown}
            placeholder="Search scenarios or type a message…"
            disabled={disabled}
            autoFocus
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14.5,
              color: "#262626",
              padding: "13px 0",
              caretColor: "var(--fc)",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <kbd style={{ fontSize: 11, color: "#9ca3af", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "2px 6px" }}>
              ↵
            </kbd>
          )}
        </div>

        {focused && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "white",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              overflow: "hidden",
              maxHeight: 320,
              overflowY: "auto",
              zIndex: 30,
              animation: "fadeUp 0.15s ease both",
            }}
          >
            {filtered.map((t) => (
              <button
                key={t.id}
                onMouseDown={() => onPickTopic(t.id)}
                disabled={disabled}
                className="flex w-full items-center hover:bg-black/[0.03]"
                style={{ gap: 11, padding: "11px 13px", background: "transparent", border: "none", textAlign: "left" }}
              >
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(var(--fc-rgb),0.1)", fontSize: 16 }}
                >
                  {t.emoji}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#262626" }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.desc}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>
                  Scenario
                </span>
              </button>
            ))}

            {query && (
              <button
                onMouseDown={() => onSubmitText(query)}
                disabled={disabled}
                className="flex w-full items-center hover:bg-black/[0.03]"
                style={{
                  gap: 11,
                  padding: "11px 13px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  borderTop: filtered.length ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                <div className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(var(--fc-rgb),0.1)" }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="var(--fc)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Start a chat: “{query}”
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Send this as your first message</div>
                </div>
              </button>
            )}

            {!filtered.length && !query && (
              <div style={{ padding: 14, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>No scenarios.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
