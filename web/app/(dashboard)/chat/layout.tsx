import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateDbUser();
  const conversations = user
    ? await prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
        take: 50,
      })
    : [];

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 sm:flex dark:border-zinc-800">
        <div className="p-3">
          <Link
            href="/chat"
            className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
                className="block truncate rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {c.title}
              </Link>
            ))
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
