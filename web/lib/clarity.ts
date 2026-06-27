export type ClarityBand = {
  label: string;
  className: string;
  color: string;
};

export function clarityBand(score: number): ClarityBand {
  if (score >= 85) {
    return {
      label: "Clear & natural",
      className: "bg-[#f0fdf4] text-[#16a34a]",
      color: "#16a34a",
    };
  }
  if (score >= 70) {
    return {
      label: "Mostly clear",
      className: "bg-[#fff7ed] text-[#ea580c]",
      color: "#ea580c",
    };
  }
  if (score >= 50) {
    return {
      label: "Getting there",
      className: "bg-[#fffbeb] text-[#d97706]",
      color: "#d97706",
    };
  }
  return {
    label: "Keep practicing",
    className: "bg-zinc-100 text-zinc-600",
    color: "#9aa0a6",
  };
}
