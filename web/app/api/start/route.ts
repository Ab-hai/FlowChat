import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { topics } from "@/lib/topics";

export async function POST(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { topicId } = await req.json();
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return new Response("Unknown topic", { status: 400 });

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: topic.title,
      messages: { create: { role: "assistant", content: topic.opener } },
    },
  });

  return Response.json({ conversationId: conversation.id });
}
