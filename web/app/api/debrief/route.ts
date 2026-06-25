import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = await req.json();
  if (typeof conversationId !== "string") {
    return new Response("conversationId is required", { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
    },
  });
  if (!conversation) return new Response("Not found", { status: 404 });
  if (conversation.messages.length === 0) {
    return new Response("Nothing to analyze yet", { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/debrief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversation.messages }),
  });
  if (!upstream.ok) {
    return new Response("The feedback service is unavailable.", { status: 502 });
  }

  const d = await upstream.json();

  const feedback = await prisma.feedback.upsert({
    where: { conversationId },
    update: {
      clarityScore: d.clarity_score,
      summary: d.summary,
      overusedWords: d.overused_words,
      betterPhrasings: d.better_phrasings,
      focusArea: d.focus_area,
    },
    create: {
      conversationId,
      clarityScore: d.clarity_score,
      summary: d.summary,
      overusedWords: d.overused_words,
      betterPhrasings: d.better_phrasings,
      focusArea: d.focus_area,
    },
  });

  return Response.json({
    clarityScore: feedback.clarityScore,
    summary: feedback.summary,
    overusedWords: feedback.overusedWords,
    betterPhrasings: feedback.betterPhrasings,
    focusArea: feedback.focusArea,
  });
}
