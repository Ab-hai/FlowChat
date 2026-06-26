import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { clarityBand } from "@/lib/clarity";
import { ClarityChart } from "@/components/ClarityChart";

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();

  const feedbacks = user
    ? await prisma.feedback.findMany({
        where: { conversation: { userId: user.id } },
        orderBy: { createdAt: "asc" },
        select: {
          clarityScore: true,
          focusArea: true,
          overusedWords: true,
          createdAt: true,
          conversation: { select: { id: true, title: true } },
        },
      })
    : [];

  const analyzed = feedbacks.length;

  const chartData = feedbacks.slice(-12).map((f) => ({
    score: f.clarityScore,
    label: new Date(f.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const recent = [...feedbacks].reverse().slice(0, 6);

  const fillerCounts = new Map<string, number>();
  for (const f of feedbacks) {
    const words = Array.isArray(f.overusedWords)
      ? (f.overusedWords as string[])
      : [];
    for (const w of words) {
      const key = w.toLowerCase();
      fillerCounts.set(key, (fillerCounts.get(key) ?? 0) + 1);
    }
  }
  const topFillers = [...fillerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your progress</h1>
          <p className="text-sm text-zinc-500">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="rounded-full bg-secondary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary-hover"
          >
            Practice
          </Link>
          <UserButton />
        </div>
      </header>

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
        <h2 className="mb-4 text-sm font-semibold">Clarity over time</h2>
        <ClarityChart data={chartData} />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
          <h2 className="mb-4 text-sm font-semibold">Recent sessions</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No analyzed sessions yet. Finish a chat and tap “Get feedback”.
            </p>
          ) : (
            <ul className="space-y-1">
              {recent.map((f) => {
                const band = clarityBand(f.clarityScore);
                return (
                  <li key={f.conversation.id}>
                    <Link
                      href={`/chat/${f.conversation.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/5"
                    >
                      <span className="truncate text-sm">
                        {f.conversation.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${band.className}`}
                      >
                        {band.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
          <h2 className="mb-4 text-sm font-semibold">Your patterns</h2>
          {topFillers.length === 0 ? (
            <p className="text-sm text-zinc-500">No filler-word patterns yet.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                Filler words you reach for most
              </p>
              <div className="flex flex-wrap gap-2">
                {topFillers.map(([word, count]) => (
                  <span
                    key={word}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800"
                  >
                    {word} · {count}
                  </span>
                ))}
              </div>
            </>
          )}
          {analyzed > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs text-zinc-500">Latest focus area</p>
              <p className="rounded-lg bg-secondary/10 p-3 text-sm text-secondary">
                {feedbacks[analyzed - 1].focusArea}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
