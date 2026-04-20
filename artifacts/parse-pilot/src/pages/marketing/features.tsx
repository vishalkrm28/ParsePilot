import { Link } from "wouter";
import {
  ArrowRight, BarChart3, Sparkles, FileText, Target,
  LayoutGrid, BookOpen, Mic, Mail, Users, Star,
  BriefcaseBusiness, Shield, Zap, Download, Search,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { SectionShell, SectionHeading } from "@/components/marketing/section-shell";
import { CtaBand } from "@/components/marketing/cta-band";

const CANDIDATE_FEATURES = [
  {
    slug: "cv-analysis",
    icon: BarChart3,
    title: "CV Analysis & Match Score",
    body: "Instant ATS match score against any job description. See exactly how your CV performs before employers do.",
    badge: "Free",
    badgeColor: "bg-gray-100 text-gray-600",
  },
  {
    slug: "tailored-cv",
    icon: Sparkles,
    title: "AI-Tailored CV Generation",
    body: "Your real experience, rewritten and restructured to match each job's keywords and priorities. ATS-safe formatting every time.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "cover-letter",
    icon: FileText,
    title: "Cover Letter Generation",
    body: "Personalised, job-specific cover letters generated in seconds — perfectly paired with your tailored CV.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "job-recommendations",
    icon: Target,
    title: "Open Job Recommendations",
    body: "Browse AI-matched live job openings and import them directly into your tracker with one click.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "application-tracker",
    icon: LayoutGrid,
    title: "Application Tracker",
    body: "Visual pipeline for every application. Track status, deadlines, contacts, and notes — all in one place.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "interview-prep",
    icon: BookOpen,
    title: "Interview Preparation",
    body: "Personalised interview questions and answer frameworks based on your tailored CV and the specific job.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "mock-interview",
    icon: Mic,
    title: "Mock Interview Sessions",
    body: "Practice answering real-style questions with AI feedback. Build muscle memory before the real interview.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "follow-up-emails",
    icon: Mail,
    title: "Follow-Up Email Drafts",
    body: "Post-interview thank-you and follow-up emails drafted in one click. Always professional, never generic.",
    badge: "Pro",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "export",
    icon: Download,
    title: "PDF & DOCX Export",
    body: "Export your tailored CV in ATS-safe PDF or DOCX format. Fully editable before download.",
    badge: "All plans",
    badgeColor: "bg-green-100 text-green-700",
  },
];

const RECRUITER_FEATURES = [
  {
    slug: "candidate-ranking",
    icon: Star,
    title: "AI Candidate Ranking",
    body: "Upload CVs against a job description. ResuOne scores and ranks every candidate instantly — no manual reading required.",
    badge: "Recruiter",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    slug: "candidate-comparison",
    icon: Search,
    title: "Candidate Comparison",
    body: "Side-by-side candidate comparison with skill gaps, match scores, and keyword alignment at a glance.",
    badge: "Recruiter",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    slug: "job-postings",
    icon: BriefcaseBusiness,
    title: "Recruiter Job Postings",
    body: "Post jobs and receive structured applications directly. No ATS setup needed.",
    badge: "Recruiter",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    slug: "candidate-invite",
    icon: Mail,
    title: "Candidate Invite by Email",
    body: "Shortlist candidates and send personalised invite emails from inside ResuOne with one click.",
    badge: "Recruiter",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    slug: "pipeline",
    icon: LayoutGrid,
    title: "Recruiter Pipeline",
    body: "Full candidate pipeline management from screen to offer. Move, annotate, and track all in one view.",
    badge: "Recruiter",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    slug: "team-workspace",
    icon: Users,
    title: "Team Workspace",
    body: "Invite up to 5 team members with shared pipelines, candidates, and job postings.",
    badge: "Team",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    slug: "permissions",
    icon: Shield,
    title: "Role-Based Permissions",
    body: "Owner, admin, recruiter, and viewer roles. Control exactly who can see and edit what.",
    badge: "Team",
    badgeColor: "bg-green-100 text-green-700",
  },
];

function FeatureCard({ feature }: { feature: typeof CANDIDATE_FEATURES[0] }) {
  const Icon = feature.icon;
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${feature.badgeColor}`}>
          {feature.badge}
        </span>
      </div>
      <h3 className="font-semibold text-sm text-foreground mb-2">{feature.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{feature.body}</p>
      <Link href={`/features/${feature.slug}`}>
        <a className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
          Learn more <ArrowRight className="w-3 h-3" />
        </a>
      </Link>
    </div>
  );
}

export default function FeaturesPage() {
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
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-4">Features</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Every tool you need to get hired<br className="hidden sm:block" /> (or to hire better)
        </h1>
        <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          ResuOne covers the full job search and hiring lifecycle. Here's everything included across all plans.
        </p>
      </div>

      {/* Credit model callout */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="bg-muted/30 border border-border/40 rounded-2xl px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Simple credit model</span>
            <span className="text-muted-foreground">— each AI action (tailored CV, cover letter, interview prep, mock interview) uses 1 credit.</span>
          </div>
          <Link href="/pricing" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
            See all plans and credits <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Candidate features */}
      <SectionShell>
        <SectionHeading
          label="For job seekers"
          title="Everything to land the interview"
          subtitle="From analysis to export — your full job search toolkit."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CANDIDATE_FEATURES.map(f => <FeatureCard key={f.slug} feature={f} />)}
        </div>
      </SectionShell>

      {/* Recruiter features */}
      <SectionShell muted>
        <SectionHeading
          label="For recruiters & hiring teams"
          title="Screen faster. Hire smarter."
          subtitle="AI-powered candidate screening and team pipeline management."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RECRUITER_FEATURES.map(f => <FeatureCard key={f.slug} feature={f} />)}
        </div>
        <div className="mt-10 text-center">
          <Link href="/for-recruiters" className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-5 py-2.5 rounded-xl hover:bg-foreground/90 transition-colors text-sm">
            Learn about recruiter features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionShell>

      <CtaBand
        title="Start with what you need today"
        subtitle="Free plan available. Upgrade when you're ready."
        primaryLabel="Start for free"
        primaryHref="/dashboard"
        secondaryLabel="Compare plans"
        secondaryHref="/pricing"
      />

      <Footer />
    </div>
  );
}
