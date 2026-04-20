import { Link } from "wouter";
import {
  ArrowRight, FileText, Sparkles, Target, BarChart3,
  LayoutGrid, BookOpen, CheckCircle2, Mic, Zap,
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
    title: "CV Analysis & ATS Match Score",
    body: "Upload your CV and a job description. Get an instant match score and a list of keywords your CV is missing before employers even see it.",
  },
  {
    icon: Sparkles,
    title: "AI-Tailored CVs",
    body: "ResuOne rewrites and restructures your existing experience to emphasise the exact keywords and achievements each role calls for. No experience invented — ever.",
  },
  {
    icon: FileText,
    title: "Cover Letter Generation",
    body: "Produce a professional, personalised cover letter for any role in seconds — matched to your tailored CV and the job description.",
  },
  {
    icon: Target,
    title: "Open Job Recommendations",
    body: "Browse live job openings matched to your skills and experience. Import directly into the tracker and start tailoring your application.",
  },
  {
    icon: LayoutGrid,
    title: "Application Tracker",
    body: "Keep every application, status, note, and follow-up in one place. Never lose track of where you are in any process.",
  },
  {
    icon: BookOpen,
    title: "Interview Prep",
    body: "Generate personalised interview questions and answer strategies based on the specific job and your tailored CV. Go into every interview prepared.",
  },
  {
    icon: Mic,
    title: "Mock Interview Sessions",
    body: "Practice answering real-style interview questions with AI feedback on your answers. Build confidence before the real thing.",
  },
  {
    icon: Zap,
    title: "Follow-up Email Drafts",
    body: "Draft thank-you and follow-up emails post-interview with one click — always professional, always timely.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your CV and paste the job",
    body: "Drop your CV and the job description. ResuOne analyses the match instantly.",
  },
  {
    n: "02",
    title: "See your match score and gaps",
    body: "Understand exactly which keywords and achievements are missing from your current CV.",
  },
  {
    n: "03",
    title: "Generate a tailored version",
    body: "ResuOne restructures your CV around the job — no made-up experience, just your real story told better.",
  },
  {
    n: "04",
    title: "Apply, track, and prep",
    body: "Export your CV, track your application, and prepare for interviews — all from one dashboard.",
  },
];

const FAQS = [
  {
    q: "Does ResuOne change my experience or make things up?",
    a: "Never. ResuOne only uses what's already in your CV. It restructures and reframes how your experience is presented to match the job. Nothing is invented.",
  },
  {
    q: "Is the tailored CV ready to send?",
    a: "Yes. After generation you can review and edit in the built-in editor before exporting as DOCX or PDF in standard ATS-safe formatting.",
  },
  {
    q: "How many applications can I track?",
    a: "Unlimited on the Pro plan. The Free plan gives you access to analysis — tracking and tailoring require credits.",
  },
  {
    q: "What's included in the Free plan?",
    a: "CV analysis, match score, and a keyword gap list — all free, always. You get 3 credits to try tailoring and cover letters before subscribing.",
  },
  {
    q: "Can I use ResuOne if I'm changing careers?",
    a: "Yes. Career switchers benefit most from tailoring — ResuOne helps surface transferable skills and reframe experience for a new direction.",
  },
];

export default function ForCandidatesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/for-recruiters" className="hover:text-foreground transition-colors">For Recruiters</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-5">For job seekers</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Your CV is good.<br />
            <span className="text-primary">Make it land the interview.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
            ResuOne analyses every job you apply for and tailors your CV and cover letter to match — using your real experience, never invented content.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              Analyse your CV free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-xl hover:bg-muted transition-colors text-sm">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free to start · No credit card required</p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-y border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-6 text-xs text-muted-foreground">
          {["ATS-safe formatting", "Your real experience only", "CV editor before export", "DOCX + PDF export", "Application tracker included"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <SectionShell>
        <SectionHeading
          label="Everything you need"
          title="One platform for your entire job search"
          subtitle="From the first CV scan to offer acceptance — ResuOne supports every step."
        />
        <FeatureGrid features={FEATURES} cols={4} />
      </SectionShell>

      {/* How it works */}
      <SectionShell muted>
        <SectionHeading label="How it works" title="From upload to offer in four steps" center />
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

      {/* Lead capture */}
      <SectionShell narrow>
        <div className="bg-card border border-border/60 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Get notified about new features</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We're constantly adding new tools for job seekers. Drop your email and be the first to know.
          </p>
          <LeadForm
            leadType="candidate"
            source="for_candidates_page"
            placeholder="Your email address"
            buttonLabel="Keep me updated"
            successMessage="You're on the list — we'll keep you updated!"
            className="max-w-sm mx-auto"
            compact
          />
        </div>
      </SectionShell>

      <FaqSection items={FAQS} title="Questions about the candidate experience" />

      <CtaBand
        title="Start your next application stronger"
        subtitle="Free CV analysis. No credit card. See your match score in seconds."
        primaryLabel="Analyse my CV free"
        primaryHref="/dashboard"
        secondaryLabel="See pricing"
        secondaryHref="/pricing"
      />

      <Footer />
    </div>
  );
}
