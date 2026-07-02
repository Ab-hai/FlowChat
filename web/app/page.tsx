import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/Logo";
import RotatingText from "@/components/ui/rotating-text";

const features = [
  "No mid-chat corrections",
  "Personalized feedback",
  "Track your progress",
];

const steps = [
  {
    title: "Have a natural chat",
    body: "Pick a topic and talk freely. Your AI partner is warm and curious — no corrections mid-session, ever.",
    icon: (
      <path
        d="M2 2h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6.5L2 16.5V3a1 1 0 0 1 0-1z"
        fill="var(--fc)"
      />
    ),
  },
  {
    title: "Text or voice",
    body: "Type or speak — switch any time. Voice mode simulates real conversation pressure in a safe space.",
    icon: (
      <>
        <rect x="6.5" y="1.5" width="5" height="9" rx="2.5" fill="var(--fc)" />
        <path
          d="M3.5 10c0 2.76 2.24 5 5 5s5-2.24 5-5"
          stroke="var(--fc)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M9 15v2" stroke="var(--fc)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Get honest feedback",
    body: 'After each session, tap "Get feedback" for a personalized report: filler words, better phrasings, your focus area.',
    icon: (
      <>
        <rect x="1.5" y="10" width="4" height="7" rx="1" fill="var(--fc)" />
        <rect x="7" y="6" width="4" height="11" rx="1" fill="var(--fc)" />
        <rect x="12.5" y="2" width="4" height="15" rx="1" fill="var(--fc)" />
      </>
    ),
  },
];

export default async function Home() {
  const { userId } = await auth();
  const primaryHref = userId ? "/chat" : "/sign-up";

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "#f5f3f7" }}>
      <nav
        className="sticky top-0 z-40 flex items-center justify-between"
        style={{
          padding: "16px 48px",
          background: "rgba(245,243,247,0.9)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center" style={{ gap: 9 }}>
          <Logo size={30} icon={16} />
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.4px",
              color: "#262626",
            }}
          >
            FlowChat
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 10 }}>
          {userId ? (
            <Link
              href="/chat"
              style={{
                padding: "9px 22px",
                borderRadius: 100,
                background: "var(--fc)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 12px rgba(var(--fc-rgb),0.38)",
              }}
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{
                  padding: "9px 20px",
                  border: "1.5px solid rgba(0,0,0,0.11)",
                  borderRadius: 100,
                  background: "white",
                  color: "#262626",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                style={{
                  padding: "9px 22px",
                  borderRadius: 100,
                  background: "var(--fc)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: "0 2px 12px rgba(var(--fc-rgb),0.38)",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="relative overflow-hidden" style={{ padding: "72px 24px 52px" }}>
        {/* ── Hero animation slot ─────────────────────────────────────────────
            Replace this placeholder block with the animation component you source.
            Keep it absolutely positioned + pointer-events-none so it sits behind
            the hero content (which is z-indexed above it). ──────────────────── */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
          <div
            style={{
              position: "absolute",
              top: -60,
              left: "22%",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(var(--fc-rgb),0.16), transparent 70%)",
              filter: "blur(18px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 40,
              right: "20%",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(var(--fc-rgb),0.1), transparent 70%)",
              filter: "blur(18px)",
            }}
          />
        </div>

        <div
          className="relative flex flex-col items-center text-center"
          style={{
            zIndex: 1,
            animation: "heroIn 0.55s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
        <div
          className="inline-flex items-center"
          style={{
            gap: 7,
            padding: "5px 14px",
            background: "rgba(var(--fc-rgb),0.1)",
            borderRadius: 100,
            marginBottom: 28,
            border: "1px solid rgba(var(--fc-rgb),0.22)",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fc)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fc)" }}>
            AI conversation coach
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(40px,6vw,72px)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-2.2px",
            color: "#262626",
            maxWidth: 820,
            marginBottom: 20,
          }}
        >
          Speak English for
          <br />
          <RotatingText
            texts={[
              "job interviews",
              "small talk",
              "ordering food",
              "travelling abroad",
              "daily standups",
              "meeting new people",
            ]}
            mainClassName="inline-flex justify-center overflow-hidden"
            style={{ color: "var(--fc)" }}
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-115%" }}
            staggerDuration={0.015}
            splitLevelClassName="overflow-hidden pb-2"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2600}
          />
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#5f5f5f",
            maxWidth: 430,
            lineHeight: 1.68,
            marginBottom: 40,
          }}
        >
          Practice spoken English with a friendly AI partner. No pressure, no
          mid-chat corrections — just natural conversation and honest feedback.
        </p>

        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: 12, marginBottom: 48 }}
        >
          <Link
            href={primaryHref}
            style={{
              padding: "15px 34px",
              borderRadius: 100,
              background: "var(--fc)",
              color: "white",
              fontSize: 16,
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(var(--fc-rgb),0.4)",
              letterSpacing: "-0.2px",
            }}
          >
            Start practicing — it&apos;s free
          </Link>
          <a
            href="#how"
            style={{
              padding: "15px 30px",
              border: "1.5px solid rgba(0,0,0,0.1)",
              borderRadius: 100,
              background: "white",
              color: "#262626",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            See how it works
          </a>
        </div>

        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: 28, marginBottom: 60 }}
        >
          {features.map((feat) => (
            <div key={feat} className="flex items-center" style={{ gap: 8 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(var(--fc-rgb),0.1)",
                }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="var(--fc)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#5f5f5f" }}>
                {feat}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 540,
            background: "white",
            borderRadius: 24,
            boxShadow: "0 12px 52px rgba(0,0,0,0.11)",
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#262626" }}>
                Job Interview Practice
              </span>
            </div>
            <span
              style={{
                padding: "3px 10px",
                background: "#fff7ed",
                color: "#ea580c",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 100,
                border: "1px solid #fed7aa",
              }}
            >
              Mostly clear
            </span>
          </div>
          <div className="flex flex-col" style={{ padding: 18, gap: 13 }}>
            <div className="flex items-start" style={{ gap: 9 }}>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--fc)" }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M1.5 1.5h10a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4L1 11.5V2a.5.5 0 0 1 .5-.5z"
                    fill="white"
                  />
                </svg>
              </div>
              <div
                style={{
                  background: "#f5f3f7",
                  padding: "11px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "#262626",
                  maxWidth: 340,
                }}
              >
                Tell me about a time you handled a difficult situation at work.
              </div>
            </div>
            <div className="flex justify-end">
              <div
                style={{
                  background: "linear-gradient(135deg,var(--fc),#e05a33)",
                  color: "white",
                  padding: "11px 14px",
                  borderRadius: "14px 14px 4px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  maxWidth: 340,
                }}
              >
                Last year, um, my team had, like, a big deadline and we was all
                very stress...
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{
              padding: "12px 18px",
              background: "rgba(var(--fc-rgb),0.05)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              gap: 7,
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fc)" }}>
              Session complete — tap <strong>Get feedback</strong> to see your
              report
            </span>
          </div>
        </div>
        </div>
      </div>

      <div id="how" style={{ padding: "0 48px 72px", maxWidth: 1020, margin: "0 auto" }}>
        <h2
          className="text-center"
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.7px",
            marginBottom: 28,
            color: "#262626",
          }}
        >
          How it works
        </h2>
        <div className="grid gap-[18px] sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 26,
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "rgba(var(--fc-rgb),0.1)",
                  marginBottom: 14,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  {s.icon}
                </svg>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 7,
                  letterSpacing: "-0.3px",
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: 13.5, color: "#5f5f5f", lineHeight: 1.62 }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
