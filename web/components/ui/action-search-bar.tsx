"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Send, Loader2 } from "lucide-react";

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  end?: string;
}

function useDebounce<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const container: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
    transition: { height: { duration: 0.35 }, staggerChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { height: { duration: 0.25 }, opacity: { duration: 0.18 } },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export function ActionSearchBar({
  actions,
  onSelect,
  onSubmit,
  pending = false,
  placeholder = "Search scenarios or type a message…",
}: {
  actions: Action[];
  onSelect: (action: Action) => void;
  onSubmit: (query: string) => void;
  pending?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debounced = useDebounce(query, 180);
  const [results, setResults] = useState<Action[]>(actions);

  useEffect(() => {
    const q = debounced.toLowerCase().trim();
    setResults(
      !q
        ? actions
        : actions.filter(
            (a) =>
              a.label.toLowerCase().includes(q) ||
              (a.description ?? "").toLowerCase().includes(q)
          )
    );
  }, [debounced, actions]);

  const trimmed = query.trim();

  function pick(action: Action) {
    if (pending) return;
    setQuery(action.label);
    setIsFocused(false);
    onSelect(action);
  }

  function submit(text: string) {
    if (pending || !text) return;
    setIsFocused(false);
    onSubmit(text);
  }

  return (
    <div className="w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 180)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(trimmed);
            } else if (e.key === "Escape") {
              e.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          disabled={pending}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 14,
            border: `1.5px solid ${isFocused || pending ? "var(--fc)" : "rgba(0,0,0,0.1)"}`,
            background: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            padding: "0 40px 0 16px",
            fontSize: 14.5,
            color: "#262626",
            outline: "none",
            caretColor: "var(--fc)",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
        />
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16 }}>
          <AnimatePresence mode="popLayout">
            {pending ? (
              <motion.div key="loading" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--fc)" }} />
              </motion.div>
            ) : query.length > 0 ? (
              <motion.div key="send" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Send className="h-4 w-4" style={{ color: "var(--fc)" }} />
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Search className="h-4 w-4" style={{ color: "#9ca3af" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && !pending && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              overflow: "hidden",
              marginTop: 8,
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 14,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            }}
          >
            <motion.ul style={{ listStyle: "none", margin: 0, padding: 6 }}>
              {results.map((action) => (
                <motion.li
                  key={action.id}
                  variants={item}
                  layout
                  onMouseDown={() => pick(action)}
                  className="flex items-center justify-between hover:bg-black/[0.04]"
                  style={{ padding: "10px 11px", borderRadius: 10, cursor: "pointer", gap: 10 }}
                >
                  <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                    <span
                      className="flex shrink-0 items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(var(--fc-rgb),0.1)" }}
                    >
                      {action.icon}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#262626" }}>
                        {action.label}
                      </span>
                      {action.description && (
                        <span style={{ display: "block", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {action.description}
                        </span>
                      )}
                    </span>
                  </div>
                  {action.end && (
                    <span style={{ fontSize: 10.5, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>
                      {action.end}
                    </span>
                  )}
                </motion.li>
              ))}

              {trimmed && (
                <motion.li
                  variants={item}
                  layout
                  onMouseDown={() => submit(trimmed)}
                  className="flex items-center hover:bg-black/[0.04]"
                  style={{ padding: "10px 11px", borderRadius: 10, cursor: "pointer", gap: 10, borderTop: results.length ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                >
                  <span className="flex shrink-0 items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(var(--fc-rgb),0.1)" }}>
                    <Send className="h-4 w-4" style={{ color: "var(--fc)" }} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Start a chat: “{trimmed}”
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "#9ca3af" }}>Send as your first message</span>
                  </span>
                </motion.li>
              )}
            </motion.ul>
            <div style={{ padding: "9px 13px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
              <span>Press Enter to start</span>
              <span>Esc to cancel</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
