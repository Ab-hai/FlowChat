"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

type Conversation = { id: string; title: string; time: string };

export function ChatSidebar({
  conversations,
  userName,
}: {
  conversations: Conversation[];
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const initial = (userName.trim()[0] || "Y").toUpperCase();
  const dashActive = pathname === "/dashboard";

  const nav = (
    <div className="flex h-full flex-col">
      <div style={{ padding: "18px 14px 12px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 18 }}>
          <Logo size={27} icon={13} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.4px" }}>
            FlowChat
          </span>
        </div>
        <Link
          href="/dashboard"
          onClick={close}
          className={dashActive ? "flex w-full items-center" : "flex w-full items-center hover:bg-black/5"}
          style={{
            gap: 8,
            padding: "9px 10px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: dashActive ? 600 : 500,
            color: dashActive ? "var(--fc)" : "#4b5563",
            background: dashActive ? "rgba(var(--fc-rgb),0.09)" : "transparent",
            border: dashActive ? "1px solid rgba(var(--fc-rgb),0.18)" : "1px solid transparent",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" fill={dashActive ? "var(--fc)" : "#9ca3af"} />
            <rect x="8.5" y="1.5" width="5" height="5" rx="1.5" fill={dashActive ? "var(--fc)" : "#9ca3af"} />
            <rect x="1.5" y="8.5" width="5" height="5" rx="1.5" fill={dashActive ? "var(--fc)" : "#9ca3af"} />
            <rect x="8.5" y="8.5" width="5" height="5" rx="1.5" fill={dashActive ? "var(--fc)" : "#9ca3af"} />
          </svg>
          Dashboard
        </Link>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
        <Link
          href="/chat"
          onClick={close}
          className="flex w-full items-center justify-center"
          style={{
            gap: 6,
            padding: 10,
            borderRadius: 10,
            border: "1.5px dashed rgba(var(--fc-rgb),0.32)",
            background: "rgba(var(--fc-rgb),0.04)",
            color: "var(--fc)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="var(--fc)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "0 10px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            padding: "0 4px 10px",
          }}
        >
          Recent
        </div>
        {conversations.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9ca3af", padding: 4 }}>
            No conversations yet.
          </div>
        ) : (
          conversations.map((c) => {
            const active = pathname === `/chat/${c.id}`;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                onClick={close}
                className="block"
                style={{
                  padding: "9px 11px",
                  borderRadius: 10,
                  marginBottom: 2,
                  background: active ? "rgba(var(--fc-rgb),0.09)" : "transparent",
                  border: active ? "1px solid rgba(var(--fc-rgb),0.17)" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--fc)" : "#374151",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 2,
                  }}
                >
                  {c.title}
                </div>
                <div style={{ fontSize: 11, color: active ? "#e07050" : "#9ca3af" }}>
                  {c.time}
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div style={{ padding: "13px 14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center" style={{ gap: 9 }}>
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg,var(--fc),#f07050)",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{initial}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#262626",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {conversations.length} session{conversations.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden shrink-0 sm:block"
        style={{
          width: 248,
          background: "white",
          borderRight: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
        }}
      >
        {nav}
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-2.5 z-20 flex items-center justify-center sm:hidden"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.1)",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <aside
            className="absolute left-0 top-0 h-full"
            style={{
              width: 248,
              background: "white",
              borderRight: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 0 40px rgba(0,0,0,0.25)",
            }}
          >
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
