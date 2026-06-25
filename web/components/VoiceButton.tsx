"use client";

import { useRef, useState } from "react";

export function VoiceButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await transcribe(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const { text } = await res.json();
      if (text) onTranscript(text);
    } catch {
      // ignore
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled || transcribing}
      aria-label={recording ? "Stop recording" : "Record voice message"}
      className={
        "flex shrink-0 items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors disabled:opacity-50 " +
        (recording
          ? "animate-pulse border-red-500 bg-red-500 text-white"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900")
      }
    >
      {transcribing ? "…" : recording ? "⏹" : "🎤"}
    </button>
  );
}
