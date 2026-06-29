"use client";

import { useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function UserMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const ref = useRef<HTMLDivElement>(null);
  const initial = (userName.trim()[0] || "Y").toUpperCase();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex items-center justify-center"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(135deg,var(--fc),#f07050)",
          border: "none",
          boxShadow: "0 1px 6px rgba(var(--fc-rgb),0.3)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{initial}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 42,
            width: 210,
            background: "white",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.13)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Signed in as</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#262626",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </div>
          </div>
          <button
            onClick={() => {
              void signOut({ redirectUrl: "/" });
            }}
            className="flex w-full items-center hover:bg-[#fef2f2]"
            style={{
              gap: 8,
              padding: "11px 14px",
              background: "transparent",
              border: "none",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M5.5 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.5M10 10.5 13 7.5 10 4.5M13 7.5H6"
                stroke="#dc2626"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
