export type ClarityBand = {
  label: string;
  className: string;
  color: string;
};

export function clarityBand(score: number): ClarityBand {
  if (score >= 85) {
    return {
      label: "Clear & natural",
      className: "bg-green-100 text-green-800",
      color: "#2f9e6e",
    };
  }
  if (score >= 70) {
    return {
      label: "Mostly clear",
      className: "bg-secondary/15 text-secondary",
      color: "#d14925",
    };
  }
  if (score >= 50) {
    return {
      label: "Getting there",
      className: "bg-amber-100 text-amber-800",
      color: "#d9a441",
    };
  }
  return {
    label: "Keep practicing",
    className: "bg-zinc-200 text-zinc-700",
    color: "#9a9a9a",
  };
}
