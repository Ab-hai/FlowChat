import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { relativeTime } from "@/lib/time";
import { ChatSidebar } from "@/components/ChatSidebar";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateDbUser();
  const rows = user
    ? await prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
        take: 50,
      })
    : [];

  const conversations = rows.map((c) => ({
    id: c.id,
    title: c.title,
    time: relativeTime(c.createdAt),
  }));
  const userName = user?.name || user?.email?.split("@")[0] || "You";

  return (
    <div className="flex h-dvh overflow-hidden">
      <ChatSidebar conversations={conversations} userName={userName} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
