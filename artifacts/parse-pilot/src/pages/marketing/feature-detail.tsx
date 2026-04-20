import { useRoute, Link } from "wouter";
import {
  ArrowRight, ArrowLeft, BarChart3, Sparkles, FileText,
  Target, LayoutGrid, BookOpen, Mic, Mail, Users, Star,
  BriefcaseBusiness, Shield, Download, Search, Zap,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionShell } from "@/components/marketing/section-shell";

const FEATURE_MAP: Record<string, {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  plan: string;
  planColor: string;
  description: string[];
  steps?: { n: string; title: string; body: string }[];
  bullets: string[];
  relatedSlugs: string[];
}> = {
  "cv-analysis": {
    icon: BarChart3,
    title: "CV Analysis & Match Score",
    subtitle: "See how your CV performs before employers do.",
    plan: "Free",
    planColor: "bg-gray-100 text-gray-700",
    description: [
      "ResuOne reads your CV and the target job description side-by-side, then calculates an ATS match score based on keyword coverage, experience alignment, and formatting signals.",
      "You instantly see your score out of 100, a list of missing keywords, and a breakdown of which job requirements your CV addresses — and which it doesn't.",
    ],
    steps: [
      { n: "01", title: "Upload your CV", body: "Paste or upload your existing CV in any format." },
      { n: "02", title: "Paste the job description", body: "Copy any job ad from any job board." },
      { n: "03", title: "Get your score", body: "Instant match score, gap list, and keyword breakdown." },
    ],
    bullets: [
      "Match score from 0–100",
      "Missing keyword list with priority ranking",
      "Skill gap breakdown by job requirement",
      "Formatting and ATS compatibility check",
      "Free — no subscription required",
    ],
    relatedSlugs: ["tailored-cv", "cover-letter", "interview-prep"],
  },
  "tailored-cv": {
    icon: Sparkles,
    title: "AI-Tailored CV Generation",
    subtitle: "Your real experience — made to match every job.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "ResuOne takes your existing CV and rewrites every section — summary, experience bullets, skills — to align with the specific language and priorities of your target job. Nothing is invented.",
      "The result is a job-specific CV that passes ATS filters and reads naturally to human recruiters, formatted and ready to export.",
    ],
    steps: [
      { n: "01", title: "Run your CV analysis", body: "Start with a match score to see your gaps." },
      { n: "02", title: "Generate tailored version", body: "One click generates a rewritten CV aligned to the job." },
      { n: "03", title: "Review and edit", body: "Make any adjustments in the built-in editor." },
      { n: "04", title: "Export as DOCX or PDF", body: "Download in ATS-safe formatting." },
    ],
    bullets: [
      "Uses your real experience — never invents content",
      "ATS-safe formatting standard",
      "Built-in editor before export",
      "DOCX and PDF export",
      "Uses 1 credit per generation",
    ],
    relatedSlugs: ["cv-analysis", "cover-letter", "export"],
  },
  "cover-letter": {
    icon: FileText,
    title: "Cover Letter Generation",
    subtitle: "A personalised cover letter for every role, in seconds.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "ResuOne generates a professional cover letter tailored to each specific job, drawing from your tailored CV and the job description to produce a letter that feels genuine and specific — not templated.",
      "Cover letters are generated paired with your tailored CV, ensuring consistency between what you say you've done and how you've presented your experience.",
    ],
    bullets: [
      "Job-specific, not generic",
      "Paired with your tailored CV for consistency",
      "Professional tone by default",
      "Edit before download",
      "Uses 1 credit per generation",
    ],
    relatedSlugs: ["tailored-cv", "interview-prep", "follow-up-emails"],
  },
  "job-recommendations": {
    icon: Target,
    title: "Open Job Recommendations",
    subtitle: "Find jobs matched to your skills and experience.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "Browse live job openings matched to your profile. ResuOne analyses your CV against open roles and surfaces the best matches — so you spend time applying, not searching.",
      "Import any role directly into your tracker and immediately run a tailored CV analysis against it.",
    ],
    bullets: [
      "Live job matching across major boards",
      "Match score shown for each opening",
      "One-click import to tracker",
      "Instant tailoring from recommendations",
    ],
    relatedSlugs: ["cv-analysis", "application-tracker", "tailored-cv"],
  },
  "application-tracker": {
    icon: LayoutGrid,
    title: "Application Tracker",
    subtitle: "Your full job search pipeline — always organised.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "Track every application from first submission to offer. ResuOne gives you a visual pipeline with status tracking, notes, deadlines, and contact information for every role.",
      "All your tailored CVs, cover letters, and interview prep materials are linked to each application — so everything stays connected.",
    ],
    bullets: [
      "Visual Kanban-style pipeline",
      "Status tracking per application",
      "Notes and deadline reminders",
      "Linked tailored CVs and cover letters",
      "Interview prep and emails per role",
    ],
    relatedSlugs: ["tailored-cv", "interview-prep", "follow-up-emails"],
  },
  "interview-prep": {
    icon: BookOpen,
    title: "Interview Preparation",
    subtitle: "Personalised prep for every interview.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "ResuOne generates a custom interview prep guide for each role — drawing from your tailored CV and the job description to predict likely questions, suggest answer frameworks, and surface key topics to research.",
      "Prep is always specific to the role, not generic. You go into every interview knowing exactly what to expect and how to answer it.",
    ],
    bullets: [
      "Role-specific predicted questions",
      "Suggested answer frameworks (STAR, etc.)",
      "Key topics and company research prompts",
      "Saved to your tracker per application",
      "Uses 1 credit per generation",
    ],
    relatedSlugs: ["mock-interview", "tailored-cv", "application-tracker"],
  },
  "mock-interview": {
    icon: Mic,
    title: "Mock Interview Sessions",
    subtitle: "Practice before the real thing.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "Run a full simulated interview session with AI-driven questions and real-time feedback on your answers. Sessions are generated from your specific job and tailored CV — so every practice session is relevant.",
      "Review your answers, see scores, and identify areas to improve before the real interview.",
    ],
    bullets: [
      "Simulated Q&A with AI feedback",
      "Questions based on your specific role and CV",
      "Answer scoring and improvement tips",
      "Multiple session styles (behavioral, technical, mixed)",
      "Uses 1 credit per session",
    ],
    relatedSlugs: ["interview-prep", "tailored-cv", "application-tracker"],
  },
  "follow-up-emails": {
    icon: Mail,
    title: "Follow-Up Email Drafts",
    subtitle: "Always follow up. Never spend time writing the email.",
    plan: "Pro",
    planColor: "bg-primary/10 text-primary",
    description: [
      "ResuOne drafts professional thank-you and follow-up emails post-interview. Emails are personalised to each role and company — not recycled templates.",
      "Send within 24 hours with confidence. Never miss an opportunity to reinforce your candidacy.",
    ],
    bullets: [
      "Post-interview thank-you emails",
      "Application follow-up drafts",
      "Personalised to role and company",
      "Professional tone by default",
      "Edit before sending",
    ],
    relatedSlugs: ["application-tracker", "cover-letter", "interview-prep"],
  },
  "export": {
    icon: Download,
    title: "PDF & DOCX Export",
    subtitle: "ATS-safe export in every format recruiters accept.",
    plan: "All plans",
    planColor: "bg-green-100 text-green-700",
    description: [
      "Every tailored CV and cover letter can be exported as a PDF or DOCX file in ATS-safe formatting. The built-in editor lets you make final adjustments before download.",
      "No unusual fonts, graphics, or tables that break ATS parsing. Clean, professional, and ready to submit.",
    ],
    bullets: [
      "DOCX export (fully editable)",
      "PDF export (formatted for print and digital)",
      "ATS-safe: no graphics, tables, or unusual fonts",
      "Built-in editor before export",
      "Available on all plans",
    ],
    relatedSlugs: ["tailored-cv", "cover-letter"],
  },
  "candidate-ranking": {
    icon: Star,
    title: "AI Candidate Ranking",
    subtitle: "Your shortlist, sorted — in seconds.",
    plan: "Recruiter",
    planColor: "bg-purple-100 text-purple-700",
    description: [
      "Upload CVs against your job description and ResuOne scores and ranks every candidate instantly — no reading required. Scores are based on keyword match, experience alignment, and skill fit.",
      "Rank 10 candidates or 100 at the same speed. Focus your time on the top matches.",
    ],
    bullets: [
      "CV scoring against any job description",
      "Ranked shortlist in seconds",
      "Keyword and experience match breakdown",
      "Bulk CV upload supported",
      "Uses 1 credit per candidate CV",
    ],
    relatedSlugs: ["candidate-comparison", "pipeline", "job-postings"],
  },
  "candidate-comparison": {
    icon: Search,
    title: "Candidate Comparison",
    subtitle: "Side-by-side comparison without the spreadsheet.",
    plan: "Recruiter",
    planColor: "bg-purple-100 text-purple-700",
    description: [
      "Compare shortlisted candidates side by side — match scores, skill gaps, keyword alignment, and experience highlights. Make faster decisions with full context.",
    ],
    bullets: [
      "Side-by-side candidate view",
      "Match score comparison",
      "Skill gap and keyword alignment",
      "Available in recruiter pipeline",
    ],
    relatedSlugs: ["candidate-ranking", "pipeline", "candidate-invite"],
  },
  "job-postings": {
    icon: BriefcaseBusiness,
    title: "Recruiter Job Postings",
    subtitle: "Post a job and start receiving scored applications.",
    plan: "Recruiter",
    planColor: "bg-purple-100 text-purple-700",
    description: [
      "Create a job posting inside ResuOne and share the link. Candidates apply directly, and their CVs are automatically scored and added to your pipeline.",
      "No ATS setup, no external integration. Just post, share, and screen.",
    ],
    bullets: [
      "Create and publish job postings",
      "Shareable application link",
      "Automatic CV scoring on submission",
      "Candidates added directly to pipeline",
      "No ATS setup required",
    ],
    relatedSlugs: ["candidate-ranking", "pipeline", "candidate-invite"],
  },
  "candidate-invite": {
    icon: Mail,
    title: "Candidate Invite by Email",
    subtitle: "Shortlist and invite with one click.",
    plan: "Recruiter",
    planColor: "bg-purple-100 text-purple-700",
    description: [
      "Select candidates from your pipeline and send personalised invite emails directly from ResuOne. No copy-pasting addresses or switching to your email client.",
    ],
    bullets: [
      "One-click invite from pipeline",
      "Personalised invite emails",
      "Sent from help@resuone.com",
      "Delivery confirmation tracked",
    ],
    relatedSlugs: ["pipeline", "candidate-ranking", "candidate-comparison"],
  },
  "pipeline": {
    icon: LayoutGrid,
    title: "Recruiter Pipeline",
    subtitle: "Your full hiring pipeline — from screen to offer.",
    plan: "Recruiter",
    planColor: "bg-purple-100 text-purple-700",
    description: [
      "Manage every candidate across every stage of your hiring process. Move candidates between pipeline stages, add notes, set decisions, and track progress — all without a spreadsheet.",
    ],
    bullets: [
      "Visual pipeline stages",
      "Candidate notes and decisions",
      "Status tracking per role",
      "Shared with team (Team plan)",
      "Linked to job postings",
    ],
    relatedSlugs: ["candidate-ranking", "team-workspace", "candidate-invite"],
  },
  "team-workspace": {
    icon: Users,
    title: "Team Workspace",
    subtitle: "Recruit as a team — shared pipeline, shared visibility.",
    plan: "Team",
    planColor: "bg-green-100 text-green-700",
    description: [
      "Invite up to 5 recruiters into a shared workspace. Everyone works from the same candidate pool, the same pipeline, and the same job postings. No more emailing CVs around.",
    ],
    bullets: [
      "Up to 5 team seats",
      "Shared candidate pipeline",
      "Shared job postings",
      "Team activity visible to all members",
      "Workspace management for owners",
    ],
    relatedSlugs: ["permissions", "pipeline", "job-postings"],
  },
  "permissions": {
    icon: Shield,
    title: "Role-Based Permissions",
    subtitle: "Control who can see and do what.",
    plan: "Team",
    planColor: "bg-green-100 text-green-700",
    description: [
      "Assign roles to every team member — Owner, Admin, Recruiter, or Viewer. Control access to candidates, pipeline actions, and settings at a granular level.",
    ],
    bullets: [
      "Owner, Admin, Recruiter, Viewer roles",
      "Candidate data visibility controls",
      "Pipeline action permissions",
      "Workspace settings restricted to Owner/Admin",
    ],
    relatedSlugs: ["team-workspace", "pipeline"],
  },
};

const RELATED_LABELS: Record<string, string> = {
  "cv-analysis": "CV Analysis",
  "tailored-cv": "Tailored CV",
  "cover-letter": "Cover Letter",
  "job-recommendations": "Job Recommendations",
  "application-tracker": "Application Tracker",
  "interview-prep": "Interview Prep",
  "mock-interview": "Mock Interview",
  "follow-up-emails": "Follow-up Emails",
  "export": "Export",
  "candidate-ranking": "Candidate Ranking",
  "candidate-comparison": "Candidate Comparison",
  "job-postings": "Job Postings",
  "candidate-invite": "Candidate Invite",
  "pipeline": "Recruiter Pipeline",
  "team-workspace": "Team Workspace",
  "permissions": "Permissions",
};

export default function FeatureDetailPage() {
  const [, params] = useRoute("/features/:slug");
  const slug = params?.slug ?? "";
  const feature = FEATURE_MAP[slug];

  if (!feature) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Feature not found</h1>
        <Link href="/features" className="text-primary hover:underline">← Back to features</Link>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link href="/features" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> All features
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.planColor}`}>
              {feature.plan} plan
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{feature.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{feature.subtitle}</p>
          <div className="mt-8 flex gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              Try it free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-5 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm">
              See pricing
            </Link>
          </div>
        </div>

        {/* What's included */}
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> What's included
          </h2>
          <ul className="space-y-2">
            {feature.bullets.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Description */}
      <SectionShell muted narrow>
        <div className="space-y-4">
          {feature.description.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
      </SectionShell>

      {/* Steps */}
      {feature.steps && (
        <SectionShell narrow>
          <h2 className="text-xl font-bold text-foreground mb-8">How it works</h2>
          <div className="space-y-6">
            {feature.steps.map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-xs">{step.n}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>
      )}

      {/* Related features */}
      {feature.relatedSlugs.length > 0 && (
        <SectionShell muted>
          <h2 className="text-xl font-bold text-foreground mb-6">Related features</h2>
          <div className="flex flex-wrap gap-3">
            {feature.relatedSlugs.map(s => (
              <Link
                key={s}
                href={`/features/${s}`}
                className="inline-flex items-center gap-1.5 border border-border bg-card text-sm font-medium px-4 py-2 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {RELATED_LABELS[s] ?? s} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </SectionShell>
      )}

      <CtaBand
        title="Ready to try it?"
        subtitle="Start free — no credit card required."
        primaryLabel="Get started free"
        primaryHref="/dashboard"
        secondaryLabel="See all features"
        secondaryHref="/features"
      />

      <Footer />
    </div>
  );
}
