import { cn } from "@/lib/utils";
import { Globe, Languages, AlertTriangle, HelpCircle, Users } from "lucide-react";

export type LanguageSignal = "english_friendly" | "local_required" | "local_preferred" | "multilingual" | "unknown";
export type LanguageFit = "good" | "risky" | "poor" | "unknown";

interface LanguageSignalBadgeProps {
  signal: LanguageSignal;
  confidence?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const SIGNAL_CONFIG: Record<LanguageSignal, {
  label: string;
  tooltip: string;
  icon: React.ElementType;
  classes: string;
}> = {
  english_friendly: {
    label: "English-Friendly",
    tooltip: "This role appears to operate in English — international candidates welcome",
    icon: Globe,
    classes: "bg-sky-50 text-sky-700 border-sky-200",
  },
  local_required: {
    label: "Local Language Required",
    tooltip: "Job description indicates the local language is required for this role",
    icon: AlertTriangle,
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  local_preferred: {
    label: "Local Language Preferred",
    tooltip: "Local language is listed as preferred or beneficial — not strictly required",
    icon: Languages,
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  multilingual: {
    label: "Multilingual Role",
    tooltip: "Multiple languages are required or expected for this role",
    icon: Users,
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  unknown: {
    label: "Language Unknown",
    tooltip: "No clear language requirement signals found — check the job description",
    icon: HelpCircle,
    classes: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export function LanguageSignalBadge({ signal, confidence, className, showLabel = true, size = "sm" }: LanguageSignalBadgeProps) {
  const config = SIGNAL_CONFIG[signal] ?? SIGNAL_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <span
      title={`${config.tooltip}${confidence ? ` (${confidence}% confidence)` : ""}\n\nEstimated from job text — always confirm language requirements directly with the employer.`}
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

// ─── Language Fit Badge ───────────────────────────────────────────────────────

interface LanguageFitBadgeProps {
  fit: LanguageFit;
  reasoning?: string;
  className?: string;
}

const FIT_CONFIG: Record<LanguageFit, { label: string; classes: string }> = {
  good: { label: "Language Match", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  risky: { label: "Language Risk", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  poor: { label: "Language Mismatch", classes: "bg-red-50 text-red-700 border-red-200" },
  unknown: { label: "Language Unknown", classes: "bg-gray-100 text-gray-500 border-gray-200" },
};

export function LanguageFitBadge({ fit, reasoning, className }: LanguageFitBadgeProps) {
  const config = FIT_CONFIG[fit] ?? FIT_CONFIG.unknown;
  return (
    <span
      title={reasoning}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
