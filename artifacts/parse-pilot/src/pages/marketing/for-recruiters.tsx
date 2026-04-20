import { Link } from "wouter";
import {
  ArrowRight, Users, BriefcaseBusiness, BarChart3,
  Star, Building2, Mail, LayoutGrid, CheckCircle2, Shield,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { SectionShell, SectionHeading } from "@/components/marketing/section-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { LeadForm } from "@/components/marketing/lead-form";
import { FeatureGrid } from "@/components/marketing/feature-grid";

const FEATURES = [
  {
    icon: BarChart3,
    title: "AI Candidate Ranking",
    body: "Upload candidate CVs against your job description. ResuOne scores each one and surfaces your top matches instantly.",
  },
  {
    icon: Star,
    title: "Candidate Comparison",
    body: "View candidates side by side with match scores, skill gaps, and keyword alignment — no spreadsheets needed.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Recruiter Job Postings",
    body: "Post jobs and receive structured candidate applications directly in your pipeline. No ATS setup required.",
  },
  {
    icon: Mail,
    title: "Candidate Invite by Email",
    body: "Shortlist candidates with one click and send personalised invite emails from inside ResuOne.",
  },
  {
    icon: LayoutGrid,
    title: "Pipeline Management",
    body: "Track every candidate from initial screen to offer with a visual pipeline that your whole team can access.",
  },
  {
    icon: Users,
    title: "Team Workspace",
    body: "Invite up to 5 team members on the Team plan. Share candidates, notes, and pipeline stages across your recruiting team.",
  },
  {
    icon: Shield,
    title: "Role-Based Permissions",
    body: "Control who can view, edit, or manage candidate data. Owner, admin, recruiter, and viewer roles included.",
  },
  {
    icon: Building2,
    title: "Shared Candidate Pool",
    body: "All team members work from the same candidate pool. No more emailing CVs or maintaining separate spreadsheets.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a job posting",
    body: "Set your job title, description, and requirements. ResuOne knows exactly what to look for.",
  },
  {
    n: "02",
    title: "Upload candidate CVs",
    body: "Bulk upload CVs or let candidates apply directly. Every CV is analysed and scored automatically.",
  },
  {
    n: "03",
    title: "Review ranked results",
    body: "See candidates ranked by match score with breakdown by keywords, experience, and skills.",
  },
  {
    n: "04",
    title: "Invite, track, and hire",
    body: "Move candidates through your pipeline, send invites, and document decisions — all in one place.",
  },
];

const FAQS = [
  {
    q: "How many candidates can I screen at once?",
    a: "You can upload and rank as many CVs as you have credits for. Each CV screening uses 1 credit. The Team plan includes 400 credits per month.",
  },
  {
    q: "Can candidates apply directly through ResuOne?",
    a: "Yes. Post a job and share the link. Candidates submit their CVs, which are automatically scored and added to your pipeline.",
  },
  {
    q: "Do I need to set up an ATS first?",
    a: "No. ResuOne is designed to work standalone. There's no integration or setup required — create an account, post a job, and start screening.",
  },
  {
    q: "Can my whole team use it?",
    a: "Yes. The Recruiter Team plan ($79/month) supports up to 5 seats with shared pipeline and role-based access.",
  },
  {
    q: "Is there a way to try before committing to a plan?",
    a: "Yes. Start with a free account and purchase individual bulk passes to screen candidates, or start a Recruiter Solo subscription for full access.",
  },
];

export default function ForRecruitersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/for-candidates" className="hover:text-foreground transition-colors">For Candidates</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/recruiter/pricing" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Start recruiting <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-5">For recruiters & hiring teams</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Screen faster.<br />
            <span className="text-primary">Hire the right person.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
            ResuOne ranks every candidate CV against your job description using AI — so you spend time on interviews, not spreadsheets.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/recruiter/pricing" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              Start a recruiter plan <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-xl hover:bg-muted transition-colors text-sm">
              Book a demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Solo from $29.99/mo · Team from $79/mo · Cancel any time</p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-y border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-6 text-xs text-muted-foreground">
          {["AI candidate ranking", "No ATS setup required", "Bulk CV upload", "Team pipeline sharing", "Role-based permissions"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <SectionShell>
        <SectionHeading
          label="Built for recruiting teams"
          title="Everything you need to screen faster"
          subtitle="Stop reading CVs manually. ResuOne does the first pass — you focus on the final call."
        />
        <FeatureGrid features={FEATURES} cols={4} />
      </SectionShell>

      {/* How it works */}
      <SectionShell muted>
        <SectionHeading label="How it works" title="From job posting to shortlist in minutes" center />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(step => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-sm">{step.n}</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-2">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Pricing teaser */}
      <SectionShell narrow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              name: "Recruiter Solo",
              price: "$29.99/mo",
              seats: "1 seat",
              credits: "100 credits/mo",
              color: "border-purple-200",
              cta: "Start Solo",
              href: "/recruiter/pricing",
              ctaStyle: "bg-purple-600 text-white hover:bg-purple-700",
            },
            {
              name: "Recruiter Team",
              price: "$79/mo",
              seats: "Up to 5 seats",
              credits: "400 credits/mo",
              color: "border-green-300",
              cta: "Start Team",
              href: "/recruiter/pricing",
              ctaStyle: "bg-green-600 text-white hover:bg-green-700",
            },
          ].map(plan => (
            <div key={plan.name} className={`bg-card border-2 ${plan.color} rounded-2xl p-6 text-center`}>
              <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold text-foreground">{plan.price}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.seats} · {plan.credits}</p>
              <Link
                href={plan.href}
                className={`inline-flex items-center gap-1.5 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm ${plan.ctaStyle}`}
              >
                {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/pricing" className="text-primary hover:underline">Compare all plans →</Link>
        </p>
      </SectionShell>

      {/* Lead capture */}
      <SectionShell muted narrow>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Interested in a live demo?</h2>
          <p className="text-sm text-muted-foreground mt-2">Leave your email and we'll set one up with you.</p>
        </div>
        <LeadForm
          leadType="recruiter"
          source="for_recruiters_page"
          placeholder="Your work email"
          buttonLabel="Request a demo"
          successMessage="Request received — we'll be in touch shortly!"
          className="max-w-sm mx-auto"
          compact
        />
      </SectionShell>

      <FaqSection items={FAQS} title="Recruiter questions answered" />

      <CtaBand
        title="Start screening candidates smarter"
        subtitle="Set up in minutes. No ATS required. Cancel any time."
        primaryLabel="Start recruiting"
        primaryHref="/recruiter/pricing"
        secondaryLabel="Book a demo"
        secondaryHref="/contact"
      />

      <Footer />
    </div>
  );
}
