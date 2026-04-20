import { Link } from "wouter";
import { ArrowRight, Sparkles, Clock, CheckCircle2, Users, Star } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

const PERKS = [
  { icon: Star, label: "Priority access before general launch" },
  { icon: Sparkles, label: "Extended AI credits at no extra cost" },
  { icon: Users, label: "Early access to recruiter tools" },
  { icon: Clock, label: "Locked-in launch pricing forever" },
];

const TABS = [
  { key: "candidate" as const, label: "Job seeker" },
  { key: "recruiter" as const, label: "Recruiter / HR" },
  { key: "institution" as const, label: "Institution / University" },
];

import { useState } from "react";

export default function WaitlistPage() {
  const [tab, setTab] = useState<"candidate" | "recruiter" | "institution">("candidate");

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/for-candidates" className="hover:text-foreground transition-colors">For Candidates</Link>
            <Link href="/for-recruiters" className="hover:text-foreground transition-colors">For Recruiters</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 border border-border text-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted transition-colors">
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <div>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-5">Early access</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Be first to get<br />
            <span className="text-primary">the full ResuOne experience.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            We're rolling out advanced features in waves. Join the waitlist now and unlock priority access, bonus credits, and locked-in launch pricing.
          </p>

          <ul className="mt-8 space-y-3">
            {PERKS.map(p => {
              const Icon = p.icon;
              return (
                <li key={p.label} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  {p.label}
                </li>
              );
            })}
          </ul>

          <p className="mt-8 text-xs text-muted-foreground">
            No payment required. No spam. Unsubscribe any time.
          </p>
        </div>

        {/* Right form */}
        <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">Join the waitlist</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick the option that fits you best.</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                  tab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <WaitlistForm
            userType={tab}
            source="waitlist_page"
            showNameField
            showCompanyField={tab !== "candidate"}
          />

          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            By joining you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Social proof / count */}
      <div className="border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <CheckCircle2 key={i} className="w-4 h-4 text-green-600" />
            ))}
          </div>
          <p className="text-sm font-medium text-foreground">Trusted by job seekers and recruiters across Europe and beyond</p>
          <p className="text-xs text-muted-foreground mt-1">Be part of the next wave of early access members.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
