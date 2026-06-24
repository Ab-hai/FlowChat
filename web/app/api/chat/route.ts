import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { message, conversationId } = await req.json();
  if (typeof message !== "string" || !message.trim()) {
    return new Response("Message is required", { status: 400 });
  }

  let conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: user.id, title: message.trim().slice(0, 50) },
    });
  }
  const convId = conversation.id;

  await prisma.message.create({
    data: { conversationId: convId, role: "user", content: message.trim() },
  });

  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  const upstream = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("The chat service is unavailable.", { status: 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        assistantText += decoder.decode();
        if (assistantText) {
          await prisma.message.create({
            data: {
              conversationId: convId,
              role: "assistant",
              content: assistantText,
            },
          });
        }
        controller.close();
        return;
      }
      assistantText += decoder.decode(value, { stream: true });
      controller.enqueue(value);
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Conversation-Id": convId,
    },
  });
}
