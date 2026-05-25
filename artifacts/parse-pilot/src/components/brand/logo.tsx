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
      {/* Icon mark — dark bg ensures white strokes are always visible */}
      <div
        style={{
          width: iconPx,
          height: iconPx,
          borderRadius: "6px",
          background: "#0f0a1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src="/images/resuone-icon.png"
          alt="ResuOne"
          width={iconPx}
          height={iconPx}
          style={{ objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Wordmark text — adapts to dark/light via currentColor */}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.025em",
        }}
      >
        Resu<span style={{ color: "hsl(255 85% 60%)" }}>One</span>
      </span>
    </div>
  );
}

export function LogoWordmark({ className, height = 40 }: { className?: string; height?: number }) {
  return (
    <img
      src="/images/resuone-wordmark.png"
      alt="ResuOne — Reimagine. Resolve. Rise."
      height={height}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
