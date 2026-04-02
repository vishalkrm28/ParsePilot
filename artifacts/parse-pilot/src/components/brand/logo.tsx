const PURPLE = "hsl(255 85% 60%)";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoBrand({ size = "md", className }: LogoBrandProps) {
  const iconPx = size === "sm" ? 22 : size === "lg" ? 32 : 28;
  const fontSize = size === "sm" ? "13.5px" : size === "lg" ? "18px" : "15.5px";
  const gap = size === "sm" ? "8px" : size === "lg" ? "10px" : "9px";

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 1 }}
    >
      {/* ── Icon ─────────────────────────────────────────────────────────── */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Purple rounded square */}
        <rect width="28" height="28" rx="6.5" fill={PURPLE} />

        {/* Document lines — CV representation */}
        {/* Name / header line — full width, slightly thicker */}
        <rect x="6" y="7" width="16" height="2.5" rx="1.25" fill="white" />
        {/* Body line 1 */}
        <rect x="6" y="12" width="11" height="2" rx="1" fill="white" fillOpacity="0.78" />
        {/* Body line 2 */}
        <rect x="6" y="15.5" width="13.5" height="2" rx="1" fill="white" fillOpacity="0.78" />

        {/* ATS checkmark — bottom area */}
        <path
          d="M 6.5 21.5 L 9.5 24.5 L 15.5 18.5"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.025em",
        }}
      >
        {/* "Resu" inherits currentColor — adapts to light nav or dark sidebar */}
        Resu
        {/* "One" is always brand purple */}
        <span style={{ color: PURPLE }}>One</span>
      </span>
    </div>
  );
}
