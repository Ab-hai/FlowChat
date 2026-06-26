"use client";

import { clarityBand } from "@/lib/clarity";

type Phrasing = { original: string; suggestion: string };

export type Debrief = {
  clarityScore: number;
  summary: string;
  overusedWords: string[];
  betterPhrasings: Phrasing[];
  focusArea: string;
};

export function FeedbackPanel({
  feedback,
  onClose,
}: {
  feedback: Debrief;
  onClose: () => void;
}) {
  const band = clarityBand(feedback.clarityScore);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold">Your feedback</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${band.className}`}
          >
            {band.label}
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {feedback.summary}
          </p>
        </div>

        {feedback.overusedWords.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-2 text-sm font-semibold">Filler words</h3>
            <div className="flex flex-wrap gap-2">
              {feedback.overusedWords.map((w, i) => (
                <span
                  key={i}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  {w}
                </span>
              ))}
            </div>
          </section>
        )}

        {feedback.betterPhrasings.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-2 text-sm font-semibold">Better phrasings</h3>
            <ul className="space-y-3">
              {feedback.betterPhrasings.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <p className="text-zinc-400 line-through">{p.original}</p>
                  <p className="text-green-600 dark:text-green-400">
                    {p.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold">Focus on next</h3>
          <p className="rounded-lg bg-secondary/10 p-3 text-sm text-secondary">
            {feedback.focusArea}
          </p>
        </section>
      </div>
    </div>
  );
}
