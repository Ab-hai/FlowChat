import { clarityBand } from "@/lib/clarity";

type Point = { score: number; label: string };

export function ClarityChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-black/10 px-4 text-center text-sm text-zinc-500">
        No feedback yet — finish a chat and tap “Get feedback” to start tracking
        your progress.
      </div>
    );
  }

  const height = 160;
  const barW = 30;
  const gap = 16;
  const labelGap = 22;
  const width = data.length * barW + (data.length - 1) * gap;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + labelGap}`}
        width={width}
        height={height + labelGap}
        role="img"
        aria-label="Clarity score over time"
      >
        {data.map((d, i) => {
          const band = clarityBand(d.score);
          const barH = Math.max((d.score / 100) * height, 2);
          const x = i * (barW + gap);
          const y = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={5} fill={band.color} />
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#555"
              >
                {d.score}
              </text>
              <text
                x={x + barW / 2}
                y={height + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#999"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
