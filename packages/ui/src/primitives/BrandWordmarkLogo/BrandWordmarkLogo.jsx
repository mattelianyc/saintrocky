export function BrandWordmarkLogo({
  className = "",
  style,
  width = "150%",
  height = "auto",
  variant = "stacked"
}) {
  if (variant === "inline") {
    return (
      <svg
        aria-label="$TANDARD / DEVIANT$"
        className={className}
        focusable="false"
        height={height}
        role="img"
        viewBox="0 0 2600 220"
        width={width}
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        <text
          x="40"
          y="155"
          fontFamily="var(--font-silka-mono, monospace)"
          fontSize="150"
          fontWeight="400"
          letterSpacing="0.05em"
          fill="var(--ui-shell-accent-strong)"
        >
          $
        </text>
        <text
          x="150"
          y="155"
          fontFamily="var(--font-silka-mono, monospace)"
          fontSize="136"
          fontWeight="400"
          letterSpacing="0.05em"
          fill="currentColor"
        >
          TANDARD
        </text>
        <text
          x="1180"
          y="155"
          fontFamily="var(--font-silka-mono, monospace)"
          fontSize="136"
          fontWeight="400"
          letterSpacing="0.03em"
          fill="var(--ui-shell-brand-divider)"
        >
          /
        </text>
        <text
          x="1340"
          y="155"
          fontFamily="var(--font-silka-mono, monospace)"
          fontSize="136"
          fontWeight="400"
          letterSpacing="0.05em"
          fill="currentColor"
        >
          DEVIANT
        </text>
        <text
          x="2415"
          y="155"
          fontFamily="var(--font-silka-mono, monospace)"
          fontSize="150"
          fontWeight="400"
          letterSpacing="0.05em"
          fill="var(--ui-shell-accent)"
        >
          $
        </text>
      </svg>
    );
  }

  return (
    <svg
      aria-label="$TANDARD / DEVIANT$"
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
        x="800"
        y="170"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="200"
        fontWeight="400"
        letterSpacing="0.05em"
        textAnchor="middle"
        fill="currentColor"
      >
        <tspan fill="var(--ui-shell-accent-strong)">$</tspan>
        <tspan>TANDARD</tspan>
      </text>
      <text
        x="800"
        y="350"
        fontFamily="var(--font-silka-mono, monospace)"
        fontSize="200"
        fontWeight="400"
        letterSpacing="0.05em"
        textAnchor="middle"
        fill="currentColor"
      >
        <tspan>DEVIANT</tspan>
        <tspan fill="var(--ui-mint)">$</tspan>
      </text>
    </svg>
  );
}
