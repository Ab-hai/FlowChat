"use client";

import { useState } from "react";
import Link from "next/link";

type Conversation = { id: string; title: string };

export function ChatSidebar({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-3 pt-5">
        <Link
          href="/dashboard"
          onClick={close}
          className="block rounded-lg border border-black/15 px-3 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5"
        >
          ← Dashboard
        </Link>
        <Link
          href="/chat"
          onClick={close}
          className="block rounded-lg bg-secondary px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-secondary-hover"
        >
          + New chat
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs text-zinc-500">No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              onClick={close}
              className="block truncate rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5"
            >
              {c.title}
            </Link>
          ))
        )}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-black/[0.03] sm:block">
        {nav}
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-2 z-20 rounded-md border border-black/15 bg-white p-2 text-zinc-700 shadow-sm sm:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <aside
            className="absolute left-0 top-0 h-full w-64 border-r border-black/10 shadow-xl"
            style={{ backgroundColor: "#f5f3f7" }}
          >
            <button
              onClick={close}
              aria-label="Close menu"
              className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-zinc-500 hover:bg-black/5"
            >
              ✕
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
