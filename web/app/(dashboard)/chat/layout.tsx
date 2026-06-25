import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { ChatSidebar } from "@/components/ChatSidebar";

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
      <ChatSidebar conversations={conversations} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
