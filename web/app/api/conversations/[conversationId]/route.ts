import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = await params;
  const { title } = await req.json();
  if (typeof title !== "string" || !title.trim()) {
    return new Response("Title is required", { status: 400 });
  }

  const result = await prisma.conversation.updateMany({
    where: { id: conversationId, userId: user.id },
    data: { title: title.trim().slice(0, 80) },
  });
  if (result.count === 0) return new Response("Not found", { status: 404 });

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = await params;
  const result = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId: user.id },
  });
  if (result.count === 0) return new Response("Not found", { status: 404 });

  return Response.json({ ok: true });
}
