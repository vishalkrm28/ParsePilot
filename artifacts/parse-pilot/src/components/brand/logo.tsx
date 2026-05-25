interface LogoBrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoBrand({ size = "md", className }: LogoBrandProps) {
  const iconPx  = size === "sm" ? 20 : size === "lg" ? 30 : 24;
  const wordmarkH = size === "sm" ? 28 : size === "lg" ? 42 : 34;
  const gap = size === "sm" ? "6px" : size === "lg" ? "10px" : "8px";

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 1 }}
    >
      <img
        src="/images/resuone-icon.png"
        alt=""
        style={{
          width: `${iconPx}px`,
          height: `${iconPx}px`,
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />
      <img
        src="/images/resuone-wordmark.png"
        alt="ResuOne"
        style={{
          height: `${wordmarkH}px`,
          width: "auto",
          flexShrink: 0,
          display: "block",
        }}
      />
    </div>
  );
}

export function LogoWordmark({ className, height = 48 }: { className?: string; height?: number }) {
  return (
    <img
      src="/images/resuone-wordmark.png"
      alt="ResuOne — Reimagine. Resolve. Rise."
      className={className}
      style={{
        height: `${height}px`,
        width: "auto",
        display: "block",
      }}
    />
  );
}
