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
  upstream.append("audio", audio, "audio.wav");

  const res = await fetch(`${API_URL}/pronounce`, {
    method: "POST",
    body: upstream,
  });
  if (!res.ok) {
    return new Response("Pronunciation service unavailable", { status: 502 });
  }

  return Response.json(await res.json());
}
