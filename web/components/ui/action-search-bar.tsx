"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2 } from "lucide-react";

export function ActionSearchBar({
  value,
  onChange,
  onSubmit,
  pending = false,
  placeholder = "Type your own opening line…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (query: string) => void;
  pending?: boolean;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  function submit(text: string) {
    const t = text.trim();
    if (pending || !t) return;
    onSubmit(t);
  }

  return (
    <div className="w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(value);
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
            ) : value.length > 0 ? (
              <motion.div
                key="send"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onMouseDown={() => submit(value)}
                style={{ cursor: "pointer" }}
              >
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
    </div>
  );
}
