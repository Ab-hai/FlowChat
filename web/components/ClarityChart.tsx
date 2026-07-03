import { clarityBand } from "@/lib/clarity";

type Point = { score: number; label: string };

export function ClarityChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-center"
        style={{
          height: 190,
          borderRadius: 12,
          border: "1px dashed rgba(0,0,0,0.1)",
          color: "#9ca3af",
          fontSize: 13,
          padding: "0 24px",
        }}
      >
        No feedback yet — finish a chat and tap “Get feedback” to start tracking
        your progress.
      </div>
    );
  }

  const maxH = 165;

  return (
    <div className="flex justify-start" style={{ gap: 14, height: 190 }}>
      {data.map((d, i) => {
        const band = clarityBand(d.score);
        const h = Math.max((d.score / 100) * maxH, 6);
        return (
          <div
            key={i}
            className="flex flex-col"
            style={{ flex: 1, maxWidth: 56, justifyContent: "flex-end", gap: 7 }}
          >
            <div
              style={{
                width: "100%",
                height: h,
                background: band.color,
                borderRadius: "6px 6px 0 0",
              }}
            />
            <span style={{ fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
