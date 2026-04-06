export function BrandWordmarkLogo({
  className = "",
  style,
  width = "100%",
  height = "auto"
}) {
  return (
    <svg
      aria-label="Standard Deviants"
      className={className}
      focusable="false"
      height={height}
      role="img"
      viewBox="0 0 1600 500"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <text
        x="80"
        y="170"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="160"
        fontWeight="400"
        letterSpacing="0.05em"
        fill="var(--ui-shell-accent-strong)"
      >
        $
      </text>
      <text
        x="200"
        y="170"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="140"
        fontWeight="400"
        letterSpacing="0.05em"
        fill="currentColor"
      >
        TANDARD
      </text>
      <text
        x="200"
        y="340"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="140"
        fontWeight="400"
        letterSpacing="0.05em"
        fill="currentColor"
      >
        DEVIANT
      </text>
      <text
        x="1400"
        y="340"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="160"
        fontWeight="400"
        letterSpacing="0.05em"
        fill="var(--ui-shell-accent)"
      >
        $
      </text>
    </svg>
  );
}
