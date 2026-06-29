import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { clarityBand } from "@/lib/clarity";
import { relativeTime } from "@/lib/time";
import { ClarityChart } from "@/components/ClarityChart";
import { UserMenu } from "@/components/UserMenu";

const cardStyle = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
} as const;

const sectionLabel = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
} as const;

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();

  const [conversationCount, feedbacks] = await Promise.all([
    user ? prisma.conversation.count({ where: { userId: user.id } }) : 0,
    user
      ? prisma.feedback.findMany({
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
      : [],
  ]);

  const chartData = feedbacks.slice(-7).map((f) => ({
    score: f.clarityScore,
    label: new Date(f.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const recent = [...feedbacks].reverse().slice(0, 5);
  const latestFocus = feedbacks.length
    ? feedbacks[feedbacks.length - 1].focusArea
    : null;

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
    .slice(0, 6)
    .map(([w]) => w);

  const monthYear = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const userName = user?.name || user?.email?.split("@")[0] || "You";

  return (
    <main className="flex-1 overflow-y-auto" style={{ padding: "28px 26px 48px" }}>
      <div className="mx-auto" style={{ maxWidth: 980 }}>
        <div className="mb-[22px] flex items-center justify-between pl-12">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", color: "#262626", marginBottom: 3 }}>
              Your progress
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {conversationCount} session{conversationCount === 1 ? "" : "s"} tracked · {monthYear}
            </p>
          </div>
          <div className="flex shrink-0 items-center" style={{ gap: 10 }}>
            <Link
              href="/chat"
              className="flex items-center"
              style={{
                gap: 6,
                padding: "10px 20px",
                borderRadius: 100,
                background: "var(--fc)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 10px rgba(var(--fc-rgb),0.35)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v5.5L8.5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New session
            </Link>
            <UserMenu userName={userName} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_308px]">
          {/* Chart card */}
          <div style={{ ...cardStyle, padding: 22 }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", color: "#262626", marginBottom: 2 }}>
                  Clarity over time
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Last 7 sessions</div>
              </div>
              <div className="flex" style={{ gap: 10 }}>
                {[
                  { c: "#16a34a", l: "Clear" },
                  { c: "#ea580c", l: "Mostly" },
                  { c: "#d97706", l: "Getting there" },
                ].map((x) => (
                  <div key={x.l} className="flex items-center" style={{ gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                    <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ClarityChart data={chartData} />
          </div>

          {/* Right column */}
          <div className="flex flex-col" style={{ gap: 14 }}>
            {/* Recent sessions */}
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 14, color: "#262626" }}>
                Recent sessions
              </div>
              {recent.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                  No analyzed sessions yet.
                </p>
              ) : (
                recent.map((f) => {
                  const band = clarityBand(f.clarityScore);
                  return (
                    <Link
                      key={f.conversation.id}
                      href={`/chat/${f.conversation.id}`}
                      className="flex items-center justify-between"
                      style={{ padding: "9px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "#262626",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 2,
                          }}
                        >
                          {f.conversation.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {relativeTime(f.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 ${band.className}`}
                        style={{ padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        {band.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Patterns */}
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 3, color: "#262626" }}>
                Your patterns
              </div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 14 }}>
                Based on all sessions
              </div>
              <div style={{ ...sectionLabel, marginBottom: 9 }}>Most-used filler words</div>
              {topFillers.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 16 }}>None yet.</p>
              ) : (
                <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 16 }}>
                  {topFillers.map((word) => (
                    <span
                      key={word}
                      style={{ padding: "4px 11px", background: "#fee2e2", color: "#b91c1c", borderRadius: 100, fontSize: 12, fontWeight: 600 }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ ...sectionLabel, marginBottom: 9 }}>Latest focus area</div>
              <div
                style={{
                  background: "rgba(var(--fc-rgb),0.07)",
                  border: "1px solid rgba(var(--fc-rgb),0.2)",
                  borderRadius: 12,
                  padding: "12px 13px",
                }}
              >
                <div style={{ fontSize: 12.5, color: latestFocus ? "#5f5f5f" : "#9ca3af", lineHeight: 1.55 }}>
                  {latestFocus ?? "Finish a chat and tap “Get feedback” to see your focus area."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
