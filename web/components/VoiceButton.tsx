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
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        border: recording
          ? "1px solid rgba(var(--fc-rgb),0.4)"
          : "1px solid rgba(0,0,0,0.09)",
        background: recording ? "rgba(var(--fc-rgb),0.1)" : "#f7f7f7",
        opacity: disabled || transcribing ? 0.5 : 1,
      }}
    >
      {transcribing ? (
        <span style={{ fontSize: 13, color: "#6b7280" }}>…</span>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="5" y="1.5" width="5" height="7" rx="2.5" stroke="#6b7280" strokeWidth="1.3" />
          <path d="M2.5 8c0 2.76 2.24 5 5 5s5-2.24 5-5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M7.5 13v1.5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
