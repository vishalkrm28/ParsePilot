import { useState } from "react";
import { useLocation } from "wouter";
import { LogoBrand } from "@/components/brand/logo";
import { authedFetch } from "@/lib/authed-fetch";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { Briefcase, Users, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { refetch } = useBillingStatus();
  const [loading, setLoading] = useState<"job_seeker" | "recruiter" | null>(null);

  async function chooseMode(mode: "job_seeker" | "recruiter") {
    setLoading(mode);
    try {
      const res = await authedFetch("/api/user/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Failed to save");
      // Bust the billing status cache so the new mode is reflected everywhere
      refetch();
      if (mode === "recruiter") {
        navigate("/recruiter/pricing");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-6 h-14 flex items-center">
        <LogoBrand size="md" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Welcome to ResuOne
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you'll be using ResuOne so we can set up the right experience for you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Job Seeker */}
          <button
            onClick={() => chooseMode("job_seeker")}
            disabled={!!loading}
            className="group relative flex flex-col items-start gap-5 rounded-2xl border-2 border-border/40 bg-card p-8 text-left hover:border-primary/50 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">I'm looking for a job</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Build ATS-optimised CVs, track applications, get AI-powered job recommendations, and ace your interviews.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mt-auto">
              {loading === "job_seeker"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                : <><ArrowRight className="w-4 h-4" /> Get started free</>}
            </div>
          </button>

          {/* Recruiter */}
          <button
            onClick={() => chooseMode("recruiter")}
            disabled={!!loading}
            className="group relative flex flex-col items-start gap-5 rounded-2xl border-2 border-border/40 bg-card p-8 text-left hover:border-primary/50 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              ADD-ON
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">I'm hiring</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manage candidates, post exclusive jobs, send interview invites, and run your full hiring pipeline in one place.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mt-auto">
              {loading === "recruiter"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                : <><ArrowRight className="w-4 h-4" /> View recruiter plans</>}
            </div>
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
          You can always contact support if you need to change your account type later.
        </p>
      </main>
    </div>
  );
}
