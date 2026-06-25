import type { NextRequest } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return new Response("Audio file is required", { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("audio", audio, audio.name || "audio.webm");

  const res = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: upstream,
  });
  if (!res.ok) {
    return new Response("Transcription failed", { status: 502 });
  }

  const data = await res.json();
  return Response.json({ text: data.text ?? "" });
}
