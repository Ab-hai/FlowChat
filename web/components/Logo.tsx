export function Logo({
  size = 30,
  icon = 16,
  round = false,
}: {
  size?: number;
  icon?: number;
  round?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "var(--fc)",
        borderRadius: round ? "50%" : Math.round(size * 0.3),
        boxShadow: "0 2px 8px rgba(var(--fc-rgb),0.32)",
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 16 16" fill="none">
        <path
          d="M2 2h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5.5L2 15V3a1 1 0 0 1 0-1z"
          fill="white"
        />
      </svg>
    </div>
  );
}
