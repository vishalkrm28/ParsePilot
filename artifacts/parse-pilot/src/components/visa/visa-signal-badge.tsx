import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldOff, ShieldQuestion, ShieldAlert, Shield } from "lucide-react";

export type VisaSignal = "high" | "medium" | "low" | "no" | "unknown";

interface VisaSignalBadgeProps {
  signal: VisaSignal;
  confidence?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const SIGNAL_CONFIG: Record<VisaSignal, {
  label: string;
  tooltip: string;
  icon: React.ElementType;
  classes: string;
}> = {
  high: {
    label: "Likely Sponsors Visas",
    tooltip: "Strong signals this employer offers visa sponsorship",
    icon: ShieldCheck,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  medium: {
    label: "May Sponsor Visas",
    tooltip: "Some signals of visa sponsorship — verify with the employer",
    icon: ShieldAlert,
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  low: {
    label: "Sponsorship Unlikely",
    tooltip: "Weak or indirect signals — sponsorship possible but uncertain",
    icon: Shield,
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  no: {
    label: "No Sponsorship",
    tooltip: "Employer has indicated no visa sponsorship available",
    icon: ShieldOff,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  unknown: {
    label: "Sponsorship Unknown",
    tooltip: "Not enough information to determine visa sponsorship likelihood",
    icon: ShieldQuestion,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function VisaSignalBadge({ signal, confidence, className, showLabel = true, size = "sm" }: VisaSignalBadgeProps) {
  const config = SIGNAL_CONFIG[signal] ?? SIGNAL_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <span
      title={`${config.tooltip}${confidence ? ` (${confidence}% confidence)` : ""}\n\nDisclaimer: This is an estimated signal only. ResuOne does not guarantee visa sponsorship.`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.classes,
        className,
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function VisaSignalDisclaimer() {
  return (
    <p className="text-xs text-muted-foreground italic mt-1">
      Visa signals are estimates based on job text analysis. ResuOne does not guarantee sponsorship — always confirm directly with the employer.
    </p>
  );
}
