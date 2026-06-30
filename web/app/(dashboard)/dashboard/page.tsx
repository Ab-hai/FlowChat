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

const statValueBox = {
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

const statCaption = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  marginTop: 4,
} as const;

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();

  const [conversations, feedbacks] = await Promise.all([
    user
      ? prisma.conversation.findMany({
          where: { userId: user.id },
          select: { createdAt: true },
        })
      : [],
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

  const totalSessions = conversations.length;

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

  // Clarity aggregates — shown as bands (raw scores stay hidden by design).
  const scores = feedbacks.map((f) => f.clarityScore);
  const avgBand = scores.length
    ? clarityBand(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
    : null;
  const bestBand = scores.length ? clarityBand(Math.max(...scores)) : null;

  // Day streak: consecutive calendar days (ending today/yesterday) with a session.
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const activeDays = new Set(conversations.map((c) => dayKey(new Date(c.createdAt))));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // a streak that ended yesterday still counts
  }
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const userName = user?.name || user?.email?.split("@")[0] || "You";
  const initial = userName.trim()[0]?.toUpperCase() || "Y";

  return (
    <main className="flex-1 overflow-y-auto" style={{ padding: "10px 26px 48px" }}>
      <div className="mx-auto" style={{ maxWidth: 980 }}>
        <div className="mb-4 pl-12">
          <div className="flex items-center justify-between" style={{ minHeight: 38 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", color: "#262626" }}>
              Profile
            </h1>
            <div className="flex shrink-0 items-center" style={{ gap: 10 }}>
              <Link
                href="/chat"
                className="flex items-center"
                style={{
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 100,
                  background: "var(--fc)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 2px 10px rgba(var(--fc-rgb),0.35)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.6" stroke="white" strokeWidth="1.6" />
                  <path d="M7 3.8V7l2.1 1.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New session
              </Link>
              <UserMenu userName={userName} />
            </div>
          </div>
        </div>

        {/* Identity + headline stats */}
        <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "linear-gradient(135deg,var(--fc),#f07050)",
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{initial}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                  color: "#262626",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              {user?.email && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.email}
                </div>
              )}
              {memberSince && (
                <div style={{ fontSize: 12, color: "#b0b4bb", marginTop: 3 }}>
                  Member since {memberSince}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }} />

          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={statValueBox}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#262626" }}>{totalSessions}</span>
              </div>
              <div style={statCaption}>Sessions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={statValueBox}>
                <span style={{ fontSize: 22, fontWeight: 800, color: streak > 0 ? "var(--fc)" : "#262626" }}>
                  {streak}
                </span>
              </div>
              <div style={statCaption}>Day streak</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={statValueBox}>
                <span style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.15, color: avgBand ? avgBand.color : "#9ca3af" }}>
                  {avgBand ? avgBand.label : "—"}
                </span>
              </div>
              <div style={statCaption}>Avg clarity</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={statValueBox}>
                <span style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.15, color: bestBand ? bestBand.color : "#9ca3af" }}>
                  {bestBand ? bestBand.label : "—"}
                </span>
              </div>
              <div style={statCaption}>Best clarity</div>
            </div>
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
