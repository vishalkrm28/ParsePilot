import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Sparkles,
  FileText,
  Target,
  CheckCircle2,
  Download,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "ATS Keyword Matching",
    description:
      "Instantly see which keywords from the job description are present or missing in your CV, with a match score.",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Rewrite",
    description:
      "Your CV is reorganized and rewritten to highlight the most relevant experience — using only what you've already done.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Zero Fabrication Guarantee",
    description:
      "We never invent experience, skills, or achievements. Only your real background is used — always.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Tailored Cover Letters",
    description:
      "Generate a professional, enthusiastic, or concise cover letter grounded entirely in your actual experience.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Missing Info Prompts",
    description:
      "The AI surfaces what's absent from your CV and asks you to fill in the gaps — so nothing is assumed.",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "DOCX Export",
    description:
      "Download your tailored CV or cover letter as a clean, formatted DOCX file ready to submit.",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload your CV",
    body: "Drag and drop a PDF or DOCX, or paste the text directly. We extract every detail.",
  },
  {
    num: "02",
    title: "Paste the job description",
    body: "Add the full job posting. The more context, the better the analysis.",
  },
  {
    num: "03",
    title: "Get your tailored CV",
    body: "The AI restructures your existing experience to match what the employer is looking for.",
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ParsePilot AI</span>
          </div>
          <button
            onClick={login}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          ATS-optimized CVs in seconds
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
          Land the interview.
          <br />
          <span className="text-primary">Not the rejection.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          ParsePilot AI tailors your CV to each job description — improving keyword
          match, readability, and ATS compatibility. Using only what&apos;s already in
          your CV. Never invented, always honest.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={login}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Optimize my CV — free
          </button>
          <p className="text-sm text-muted-foreground">No credit card needed</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-border/40 bg-muted/30 py-5">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {[
            "ATS-compatible output",
            "Zero fabricated experience",
            "PDF & DOCX upload",
            "DOCX export",
            "Cover letter included",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Three steps to a better application
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From raw CV to tailored, ATS-ready document in under a minute.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="relative">
              <div className="text-6xl font-black text-primary/10 mb-4 leading-none">
                {s.num}
              </div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to compete
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for candidates who take their applications seriously.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to stand out?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Sign in and start optimizing your first application in seconds.
          </p>
          <button
            onClick={login}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Get started free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">ParsePilot AI</span>
          </div>
          <p>Built for job seekers who play to win.</p>
        </div>
      </footer>
    </div>
  );
}
