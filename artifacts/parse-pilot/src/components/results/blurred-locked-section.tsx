import { cn } from "@/lib/utils";

interface BlurredLockedSectionProps {
  /** Number of fake placeholder lines to render */
  lineCount?: number;
  /** Line widths as percentage strings — cycles if fewer than lineCount */
  lineWidths?: string[];
  className?: string;
}

const DEFAULT_WIDTHS = ["100%", "88%", "74%", "92%", "60%", "83%", "70%", "95%", "78%", "64%"];

/**
 * Pure blur layer — no lock badge here.
 * The parent card or overlay handles the lock badge and CTA.
 * This component is responsible only for the blurred placeholder lines + gradient fade.
 */
export function BlurredLockedSection({
  lineCount = 10,
  lineWidths,
  className,
}: BlurredLockedSectionProps) {
  const widths = lineWidths ?? DEFAULT_WIDTHS;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blurred placeholder lines — no interactive content */}
      <div
        className="space-y-2.5 p-6 blur-[7px] pointer-events-none select-none opacity-70"
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-foreground/12 rounded-full"
            style={{ width: widths[i % widths.length] }}
          />
        ))}
      </div>

      {/* Gradient fade — blends blurred content into card bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% to-background pointer-events-none" />
    </div>
  );
}
