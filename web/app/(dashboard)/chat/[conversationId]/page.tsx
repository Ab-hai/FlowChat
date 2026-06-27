import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { clockTime } from "@/lib/time";
import { Chat } from "@/components/Chat";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const user = await getOrCreateDbUser();
  if (!user) notFound();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });
  if (!conversation) notFound();

  const initialMessages = conversation.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    time: clockTime(m.createdAt),
  }));

  return (
    <Chat
      key={conversation.id}
      initialConversationId={conversation.id}
      initialMessages={initialMessages}
      initialTitle={conversation.title}
    />
  );
}
