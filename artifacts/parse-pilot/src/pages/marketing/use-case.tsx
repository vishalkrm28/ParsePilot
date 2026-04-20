import { useRoute, Link } from "wouter";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionShell } from "@/components/marketing/section-shell";

interface UseCase {
  title: string;
  subtitle: string;
  persona: string;
  description: string[];
  steps: { n: string; title: string; body: string }[];
  outcome: string;
  ctaLabel: string;
  ctaHref: string;
}

const USE_CASES: Record<string, UseCase> = {
  "graduate-job-search": {
    title: "Graduate job search",
    subtitle: "Start your career with applications that actually stand out.",
    persona: "Recent graduate",
    description: [
      "As a recent graduate, you have limited experience but strong potential. The challenge is making your CV compete against candidates with years of experience — by showing exactly the right keywords and framing your academic achievements correctly.",
      "ResuOne helps you translate your projects, placements, and skills into language that ATS systems recognise and recruiters respond to.",
    ],
    steps: [
      { n: "01", title: "Upload your graduate CV", body: "Even with limited experience, your CV is the starting point." },
      { n: "02", title: "Analyse each role you apply for", body: "See your match score and which keywords your CV is missing." },
      { n: "03", title: "Generate a tailored version per role", body: "Reframe your projects, coursework, and skills around each job's language." },
      { n: "04", title: "Track your applications", body: "Keep every application, status, and interview in one place." },
    ],
    outcome: "Graduate candidates who tailor their CV to each role consistently see higher response rates — because ATS systems score keyword alignment, not just years of experience.",
    ctaLabel: "Start your graduate job search",
    ctaHref: "/dashboard",
  },
  "career-change": {
    title: "Changing careers",
    subtitle: "Reframe your experience for a new industry — without starting from scratch.",
    persona: "Career changer",
    description: [
      "Changing careers doesn't mean your experience is irrelevant. It means the challenge is framing what you've done in language that resonates in a new industry.",
      "ResuOne identifies which parts of your existing CV translate into each new role, surfaces the transferable skills, and rewrites your experience to align with what the new industry values — all without inventing anything.",
    ],
    steps: [
      { n: "01", title: "Upload your existing CV", body: "Doesn't matter what industry it's from — start with what you have." },
      { n: "02", title: "Paste a job description from your target industry", body: "See how your existing experience maps against the new role." },
      { n: "03", title: "Generate a tailored CV", body: "ResuOne reframes your experience in the language of the new industry." },
      { n: "04", title: "Prep for the \"why are you changing?\" question", body: "Use interview prep to build a compelling career change narrative." },
    ],
    outcome: "Career changers using ResuOne create CVs that lead with transferable value instead of apologising for a different background.",
    ctaLabel: "Reframe your career change",
    ctaHref: "/dashboard",
  },
  "multiple-applications": {
    title: "Applying to multiple roles at once",
    subtitle: "Scale your job search without scaling your effort.",
    persona: "Active job seeker",
    description: [
      "Applying to 10 or 20 roles a week is exhausting if you're tailoring each one manually. Most people send the same generic CV — and wonder why they don't hear back.",
      "ResuOne lets you generate a tailored CV and cover letter for each role in minutes, track every application, and never lose track of where you are in any process.",
    ],
    steps: [
      { n: "01", title: "Add jobs to your tracker", body: "Import from ResuOne's job recommendations or paste any job URL." },
      { n: "02", title: "Generate tailored CV and cover letter for each", body: "One click per role — each output is unique to that job." },
      { n: "03", title: "Track applications by status", body: "Applied, interview, offer, rejected — everything visible at once." },
      { n: "04", title: "Prep for each interview separately", body: "Role-specific interview prep and mock sessions per application." },
    ],
    outcome: "Active job seekers apply more, tailor better, and track smarter — without burning out on manual work for every role.",
    ctaLabel: "Scale your job search",
    ctaHref: "/dashboard",
  },
  "recruiter-high-volume": {
    title: "High-volume recruiting",
    subtitle: "Screen 100 CVs with the speed of screening 10.",
    persona: "Recruiter",
    description: [
      "High-volume hiring creates a screening bottleneck. Reading 100 CVs takes days — and decisions still come down to gut feel when you're tired and rushed.",
      "ResuOne automates the first screen. Every CV is scored against your job description in seconds, so your time goes to the top matches — not to reading every application from scratch.",
    ],
    steps: [
      { n: "01", title: "Create your job posting", body: "Add your job description to ResuOne." },
      { n: "02", title: "Upload candidate CVs in bulk", body: "Drop a batch — every CV is scored automatically." },
      { n: "03", title: "Review the ranked shortlist", body: "Focus on the top 10% from the start." },
      { n: "04", title: "Invite, track, and decide", body: "Move candidates through your pipeline to offer." },
    ],
    outcome: "Recruiting teams using ResuOne cut first-screen time significantly and reduce the risk of overlooking a strong candidate buried in the pile.",
    ctaLabel: "Start screening faster",
    ctaHref: "/recruiter/pricing",
  },
  "executive-job-search": {
    title: "Executive job search",
    subtitle: "Position your leadership experience to compete at the top.",
    persona: "Senior professional",
    description: [
      "Executive job searches are different. Roles are fewer, competition is intense, and every application needs to speak the precise language of the board, the search firm, or the hiring committee.",
      "ResuOne analyses executive job descriptions and reframes your leadership achievements, strategic impact, and commercial results around the language each senior role actually uses.",
    ],
    steps: [
      { n: "01", title: "Upload your executive CV", body: "Start with your current document — achievements, scope, impact." },
      { n: "02", title: "Analyse against target roles", body: "See exactly how your framing compares against each executive job's requirements." },
      { n: "03", title: "Generate a role-specific CV", body: "Reframe your strategic impact, P&L scope, and leadership language per role." },
      { n: "04", title: "Prepare for executive interviews", body: "Role-specific prep at the level of detail senior hiring requires." },
    ],
    outcome: "Senior candidates gain the same keyword precision in their tailored CVs that junior candidates have been leveraging for years — with the strategic depth their experience deserves.",
    ctaLabel: "Start your executive job search",
    ctaHref: "/dashboard",
  },
};

export default function UseCasePage() {
  const [, params] = useRoute("/use-cases/:slug");
  const slug = params?.slug ?? "";
  const useCase = USE_CASES[slug];

  if (!useCase) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Use case not found</h1>
        <Link href="/features" className="text-primary hover:underline">← Back to features</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/for-candidates" className="hover:text-foreground transition-colors">For Candidates</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link href="/features" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Features & use cases
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-5">
          Use case · {useCase.persona}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl leading-tight">
          {useCase.title}
        </h1>
        <p className="mt-5 text-muted-foreground text-xl max-w-xl leading-relaxed">{useCase.subtitle}</p>
        <div className="mt-8 flex gap-3">
          <Link
            href={useCase.ctaHref}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            {useCase.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Description */}
      <SectionShell muted narrow>
        <div className="space-y-5">
          {useCase.description.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed text-base">{p}</p>
          ))}
        </div>
      </SectionShell>

      {/* Steps */}
      <SectionShell narrow>
        <h2 className="text-2xl font-bold text-foreground mb-8">How ResuOne helps</h2>
        <div className="space-y-6">
          {useCase.steps.map(step => (
            <div key={step.n} className="flex gap-4 bg-card border border-border/60 rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">{step.n}</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Outcome */}
      <SectionShell muted narrow>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-primary mb-3">The outcome</h2>
          <p className="text-foreground leading-relaxed">{useCase.outcome}</p>
        </div>
      </SectionShell>

      {/* More use cases */}
      <SectionShell narrow>
        <h2 className="text-lg font-bold text-foreground mb-5">More use cases</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(USE_CASES)
            .filter(([s]) => s !== slug)
            .slice(0, 4)
            .map(([s, uc]) => (
              <Link
                key={s}
                href={`/use-cases/${s}`}
                className="inline-flex items-center gap-1.5 border border-border bg-card text-sm font-medium px-4 py-2 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {uc.title} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
        </div>
      </SectionShell>

      <CtaBand
        title={useCase.ctaLabel}
        subtitle="Free plan available — no credit card required."
        primaryLabel={useCase.ctaLabel}
        primaryHref={useCase.ctaHref}
        secondaryLabel="See all features"
        secondaryHref="/features"
      />

      <Footer />
    </div>
  );
}
