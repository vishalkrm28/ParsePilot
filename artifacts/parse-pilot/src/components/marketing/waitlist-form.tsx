import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface WaitlistFormProps {
  userType?: "candidate" | "recruiter" | "institution";
  source?: string;
  pagePath?: string;
  showNameField?: boolean;
  showCompanyField?: boolean;
}

export function WaitlistForm({
  userType = "candidate",
  source = "waitlist_page",
  pagePath,
  showNameField = true,
  showCompanyField = false,
}: WaitlistFormProps) {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    company: "",
    interestArea: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/marketing/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          fullName: form.fullName.trim() || undefined,
          company: form.company.trim() || undefined,
          interestArea: form.interestArea || undefined,
          userType,
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
      <div className="flex flex-col items-center gap-3 text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <p className="font-semibold text-foreground">You're on the list!</p>
        <p className="text-sm text-muted-foreground">We'll let you know as soon as your spot is ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showNameField && (
        <input
          type="text"
          placeholder="Your name"
          value={form.fullName}
          onChange={e => set("fullName", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      )}
      <input
        type="email"
        placeholder="Your email address"
        value={form.email}
        onChange={e => set("email", e.target.value)}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
      />
      {showCompanyField && (
        <input
          type="text"
          placeholder="Company (optional)"
          value={form.company}
          onChange={e => set("company", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join the waitlist"}
      </button>
      {status === "error" && (
        <p className="text-xs text-destructive text-center">{errorMsg}</p>
      )}
    </form>
  );
}
