"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { MorphMenuIcon } from "@/components/MorphMenuIcon";

type Conversation = { id: string; title: string; time: string };

export function ChatSidebar({
  conversations,
  userName,
}: {
  conversations: Conversation[];
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const close = () => setOpen(false);
  const initial = (userName.trim()[0] || "Y").toUpperCase();
  const dashActive = pathname === "/dashboard";

  async function commitRename(id: string, value: string) {
    setEditingId(null);
    const title = value.trim();
    const current = conversations.find((c) => c.id === id);
    if (!title || (current && current.title === title)) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setMenuId(null);
    if (!window.confirm("Delete this conversation? This can't be undone.")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (pathname === `/chat/${id}`) router.push("/chat");
    router.refresh();
  }

  const nav = (
    <div className="flex h-full flex-col">
      {menuId && (
        <div onClick={() => setMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      )}

      <div style={{ padding: "15px 14px 12px" }}>
        <div className="flex items-center" style={{ gap: 8, paddingLeft: 50 }}>
          <Logo size={27} icon={13} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.4px" }}>FlowChat</span>
        </div>
      </div>

      <div style={{ padding: "10px 14px 16px" }}>
        <Link
          href="/chat"
          onClick={close}
          className="flex w-full items-center justify-center"
          style={{
            gap: 6,
            padding: 10,
            borderRadius: 10,
            border: "none",
            background: "var(--fc)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 2px 10px rgba(var(--fc-rgb),0.35)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
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
          <div style={{ fontSize: 12, color: "#9ca3af", padding: 4 }}>No conversations yet.</div>
        ) : (
          conversations.map((c) => {
            const active = pathname === `/chat/${c.id}`;
            const editing = editingId === c.id;
            return (
              <div key={c.id} style={{ position: "relative", marginBottom: 2 }}>
                {editing ? (
                  <input
                    autoFocus
                    defaultValue={c.title}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id, e.currentTarget.value);
                      else if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={(e) => commitRename(c.id, e.currentTarget.value)}
                    style={{
                      width: "100%",
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: "#262626",
                      padding: "8px 11px",
                      borderRadius: 10,
                      border: "1.5px solid var(--fc)",
                      outline: "none",
                      background: "white",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <Link
                    href={`/chat/${c.id}`}
                    onClick={close}
                    className="block"
                    style={{
                      padding: "9px 30px 9px 11px",
                      borderRadius: 10,
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
                    <div style={{ fontSize: 11, color: active ? "#e07050" : "#9ca3af" }}>{c.time}</div>
                  </Link>
                )}

                {!editing && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuId(menuId === c.id ? null : c.id);
                    }}
                    aria-label="Conversation options"
                    className="flex items-center justify-center hover:bg-black/10 hover:opacity-100"
                    style={{ position: "absolute", right: 5, top: 7, width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", opacity: 0.6, cursor: "pointer" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="3" cy="7" r="1.2" fill="#6b7280" />
                      <circle cx="7" cy="7" r="1.2" fill="#6b7280" />
                      <circle cx="11" cy="7" r="1.2" fill="#6b7280" />
                    </svg>
                  </button>
                )}

                {menuId === c.id && (
                  <div
                    style={{
                      position: "absolute",
                      right: 4,
                      top: 30,
                      width: 134,
                      background: "white",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setMenuId(null);
                      }}
                      className="flex w-full items-center hover:bg-black/[0.04]"
                      style={{ gap: 8, padding: "9px 12px", border: "none", background: "transparent", fontSize: 12.5, color: "#374151", textAlign: "left", cursor: "pointer" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M8.5 1.7l2.8 2.8L4 11.8l-3 .5.5-3 7-7.6z" stroke="#6b7280" strokeWidth="1.1" strokeLinejoin="round" />
                      </svg>
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="flex w-full items-center hover:bg-[#fef2f2]"
                      style={{ gap: 8, padding: "9px 12px", border: "none", background: "transparent", fontSize: 12.5, color: "#dc2626", textAlign: "left", cursor: "pointer" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2.5 3.5h8M5 3.5V2.4h3v1.1M3.6 3.5l.4 8h5l.4-8" stroke="#dc2626" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link
          href="/dashboard"
          onClick={close}
          className={
            "flex w-full items-center transition-colors " +
            (dashActive ? "" : "hover:bg-black/[0.04]")
          }
          style={{
            gap: 9,
            padding: "8px 9px",
            borderRadius: 12,
            ...(dashActive ? { background: "rgba(var(--fc-rgb),0.09)" } : {}),
          }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--fc),#f07050)" }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "white" }}>{initial}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: dashActive ? "var(--fc)" : "#262626",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 11, color: dashActive ? "#e07050" : "#9ca3af" }}>View profile</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M5 3l4 4-4 4"
              stroke={dashActive ? "var(--fc)" : "#c4c4c4"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="fixed left-3 top-2.5 z-40 flex items-center justify-center"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.1)",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <MorphMenuIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-30" key="drawer">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.aside
              className="absolute left-0 top-0 h-full"
              style={{
                width: 420,
                background: "white",
                borderRight: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 0 40px rgba(0,0,0,0.25)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {nav}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
