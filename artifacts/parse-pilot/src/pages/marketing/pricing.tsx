import { Link } from "wouter";
import { CheckCircle2, XCircle, ArrowRight, Zap, Users, Building2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { SectionShell, SectionHeading } from "@/components/marketing/section-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";

const PLANS = [
  {
    name: "Free",
    price: 0,
    priceLabel: "Free",
    priceNote: "No credit card required",
    credits: 3,
    badge: "Start here",
    badgeColor: "bg-gray-100 text-gray-700",
    border: "border-border",
    ctaLabel: "Start for free",
    ctaHref: "/dashboard",
    ctaStyle: "border border-border text-foreground hover:bg-muted",
    features: [
      { label: "CV analysis & match score", included: true },
      { label: "Missing keyword list", included: true },
      { label: "3 AI credits included", included: true },
      { label: "Tailored CV generation", included: false },
      { label: "Cover letter generation", included: false },
      { label: "Application tracker", included: false },
      { label: "Interview prep", included: false },
      { label: "Job recommendations", included: false },
      { label: "PDF / DOCX export", included: false },
    ],
  },
  {
    name: "Pro",
    price: 14.99,
    priceLabel: "$14.99",
    priceNote: "per month, cancel any time",
    credits: 100,
    badge: "Most popular",
    badgeColor: "bg-primary text-primary-foreground",
    border: "border-primary/40",
    ctaLabel: "Start Pro",
    ctaHref: "/dashboard",
    ctaStyle: "bg-primary text-primary-foreground hover:bg-primary/90",
    features: [
      { label: "CV analysis & match score", included: true },
      { label: "Missing keyword list", included: true },
      { label: "100 AI credits / month", included: true },
      { label: "Tailored CV generation", included: true },
      { label: "Cover letter generation", included: true },
      { label: "Application tracker", included: true },
      { label: "Interview prep", included: true },
      { label: "Job recommendations", included: true },
      { label: "PDF / DOCX export", included: true },
    ],
  },
  {
    name: "Recruiter Solo",
    price: 29.99,
    priceLabel: "$29.99",
    priceNote: "per month, cancel any time",
    credits: 100,
    badge: "For individual recruiters",
    badgeColor: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
    ctaLabel: "Start Recruiter Solo",
    ctaHref: "/recruiter/pricing",
    ctaStyle: "bg-purple-600 text-white hover:bg-purple-700",
    features: [
      { label: "All Pro features", included: true },
      { label: "Candidate CV ranking", included: true },
      { label: "Candidate comparison", included: true },
      { label: "Recruiter job posting", included: true },
      { label: "Candidate invite by email", included: true },
      { label: "100 AI credits / month", included: true },
      { label: "1 seat (solo)", included: true },
      { label: "Team workspace", included: false },
      { label: "Team pipeline sharing", included: false },
    ],
  },
  {
    name: "Recruiter Team",
    price: 79,
    priceLabel: "$79",
    priceNote: "per month, up to 5 seats",
    credits: 400,
    badge: "For recruiting teams",
    badgeColor: "bg-green-100 text-green-700",
    border: "border-green-300",
    ctaLabel: "Start Team Plan",
    ctaHref: "/recruiter/pricing",
    ctaStyle: "bg-green-600 text-white hover:bg-green-700",
    features: [
      { label: "All Recruiter Solo features", included: true },
      { label: "Up to 5 team seats", included: true },
      { label: "Shared candidate pipeline", included: true },
      { label: "400 AI credits / month", included: true },
      { label: "Team workspace management", included: true },
      { label: "Role-based permissions", included: true },
      { label: "Shared job postings", included: true },
      { label: "Team pipeline sharing", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: "CV Analysis & match score", free: true, pro: true, solo: true, team: true },
  { label: "Missing keyword list", free: true, pro: true, solo: true, team: true },
  { label: "AI credits / month", free: "3", pro: "100", solo: "100", team: "400" },
  { label: "Tailored CV generation", free: false, pro: true, solo: true, team: true },
  { label: "Cover letter generation", free: false, pro: true, solo: true, team: true },
  { label: "Application tracker", free: false, pro: true, solo: true, team: true },
  { label: "Interview prep", free: false, pro: true, solo: true, team: true },
  { label: "Job recommendations", free: false, pro: true, solo: true, team: true },
  { label: "PDF / DOCX export", free: false, pro: true, solo: true, team: true },
  { label: "Candidate CV ranking", free: false, pro: false, solo: true, team: true },
  { label: "Candidate comparison", free: false, pro: false, solo: true, team: true },
  { label: "Team workspace", free: false, pro: false, solo: false, team: true },
  { label: "Team seats", free: "1", pro: "1", solo: "1", team: "5" },
];

const FAQS = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade or downgrade from Settings → Billing. Changes take effect immediately on upgrade, and at the end of your billing period on downgrade.",
  },
  {
    q: "What happens to unused credits?",
    a: "Credits reset each billing period and don't roll over. Use them for tailored CVs, cover letters, interview prep, and mock interviews.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan gives you 3 credits to try core features before committing. No trial period, no credit card required to start.",
  },
  {
    q: "What's the $6.99 unlock?",
    a: "If you're on the Free plan, you can pay $6.99 once to unlock the full result for a single CV analysis — no subscription needed.",
  },
  {
    q: "How does the Recruiter Team plan work?",
    a: "You get one workspace with up to 5 members, shared candidate pipeline, 400 credits per month, and role-based permissions.",
  },
  {
    q: "Can I use ResuOne for hiring teams larger than 5?",
    a: "For teams larger than 5, contact us at help@resuone.com for enterprise pricing.",
  },
];

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />;
  if (value === false) return <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/for-candidates" className="hover:text-foreground transition-colors">For Candidates</Link>
            <Link href="/for-recruiters" className="hover:text-foreground transition-colors">For Recruiters</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-4">Pricing</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Start free. Scale when you're ready.
        </h1>
        <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          No surprises. Every AI action costs 1 credit. Pick the plan that fits your workflow.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative bg-card border-2 ${plan.border} rounded-2xl p-6 flex flex-col`}>
              <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-4 ${plan.badgeColor}`}>
                {plan.badge}
              </span>
              <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
              <div className="mt-3 mb-1">
                <span className="text-3xl font-bold">{plan.priceLabel}</span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-5">{plan.priceNote}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
                <Zap className="w-3.5 h-3.5 text-primary" />
                {plan.credits} credits / month
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f.label} className="flex items-center gap-2 text-xs">
                    {f.included ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaHref}
                className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm ${plan.ctaStyle}`}
              >
                {plan.ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          All plans include PDF/DOCX export. Each tailored CV, cover letter, interview prep, or mock interview uses 1 credit.
        </p>
      </div>

      {/* Comparison table */}
      <SectionShell muted>
        <SectionHeading title="Full feature comparison" center />
        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground w-1/2">Feature</th>
                <th className="text-center px-4 py-3 text-xs font-semibold">Free</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Pro</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-purple-600">Recruiter Solo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-green-600">Recruiter Team</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((row) => (
                <tr key={row.label} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-center"><CheckCell value={row.free} /></td>
                  <td className="px-4 py-3 text-center"><CheckCell value={row.pro} /></td>
                  <td className="px-4 py-3 text-center"><CheckCell value={row.solo} /></td>
                  <td className="px-4 py-3 text-center"><CheckCell value={row.team} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>

      {/* Enterprise CTA */}
      <SectionShell narrow>
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Need more seats or custom terms?</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            For teams over 5, institutions, or enterprise customers, contact us for a custom plan.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-5 py-2.5 rounded-xl hover:bg-foreground/90 transition-colors text-sm">
            Contact sales <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionShell>

      <FaqSection items={FAQS} id="pricing-faq" />

      <CtaBand
        title="Start optimising your applications today"
        subtitle="Free plan, no credit card required. Upgrade any time."
        primaryLabel="Get started free"
        primaryHref="/dashboard"
        secondaryLabel="See all features"
        secondaryHref="/features"
      />

      <Footer />
    </div>
  );
}
