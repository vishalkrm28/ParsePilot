interface LogoBrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoBrand({ size = "md", className }: LogoBrandProps) {
  const iconPx = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const wordmarkH = size === "sm" ? 16 : size === "lg" ? 26 : 20;
  const gap = size === "sm" ? "7px" : size === "lg" ? "10px" : "8px";

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 1 }}
    >
      <img
        src="/images/resuone-icon.png"
        alt=""
        width={iconPx}
        height={iconPx}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
      <img
        src="/images/resuone-wordmark.png"
        alt="ResuOne"
        height={wordmarkH}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
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
