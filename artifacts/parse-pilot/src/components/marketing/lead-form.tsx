import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface LeadFormProps {
  leadType?: "candidate" | "recruiter" | "general";
  source?: string;
  pagePath?: string;
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
  className?: string;
  compact?: boolean;
}

export function LeadForm({
  leadType = "general",
  source = "homepage_cta",
  pagePath,
  placeholder = "Your work email",
  buttonLabel = "Get early access",
  successMessage = "You're on the list — we'll be in touch!",
  className = "",
  compact = false,
}: LeadFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/marketing/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          leadType,
          source,
          pagePath: pagePath ?? window.location.pathname,
          utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
          utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-700 ${className}`}>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex ${compact ? "flex-row gap-2" : "flex-col gap-3"} ${className}`}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 whitespace-nowrap"
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : buttonLabel}
      </button>
      {status === "error" && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </form>
  );
}
