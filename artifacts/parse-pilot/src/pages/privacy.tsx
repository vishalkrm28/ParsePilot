import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LogoBrand } from "@/components/brand/logo";
import { Footer } from "@/components/layout/footer";

const sections: { title: string; content: React.ReactNode }[] = [
  {
    title: "Data We Collect",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>CV / resume content you upload or paste for analysis.</li>
        <li>Job descriptions you provide for analysis.</li>
        <li>Account information (name, email address) collected via Clerk authentication, including when you sign in with Google, Apple, or email.</li>
        <li>Billing information (payment method details are handled by Stripe — we do not store card numbers).</li>
        <li>Usage data to understand how the product is used and to improve performance.</li>
        <li>
          <strong className="text-foreground">Recruiter Mode only:</strong> candidate names,
          email addresses, notes, pipeline stage data, and any other information you manually
          enter or import for candidates you manage.
        </li>
      </ul>
    ),
  },
  {
    title: "How We Use Your Data",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>To analyse your CV against the job description you provide and generate tailored suggestions, scores, and optimised outputs.</li>
        <li>To generate cover letters and section suggestions where requested.</li>
        <li>To operate the Recruiter Mode candidate pipeline and related features.</li>
        <li>To process payments and manage your subscription or one-time purchases.</li>
        <li>To send transactional emails (e.g. receipts, billing alerts, contact responses) from help@resuone.com.</li>
        <li>To improve product performance and reliability over time.</li>
        <li>We do not sell your data to third parties.</li>
      </ul>
    ),
  },
  {
    title: "Data Storage",
    content: (
      <p>
        Your results, analysis history, and (for Recruiter Mode) candidate records are stored
        securely so you can access them later. We take reasonable steps to protect data at rest
        and in transit using industry-standard encryption. Data is stored on servers within the
        EU/US region depending on infrastructure availability.
      </p>
    ),
  },
  {
    title: "Third Parties",
    content: (
      <>
        <p className="mb-3">We use a small number of trusted third-party services:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong className="text-foreground">Clerk</strong> — authentication and identity
            management. Clerk handles sign-in, session management, and social login (Google,
            Apple). See Clerk's privacy policy at clerk.com.
          </li>
          <li>
            <strong className="text-foreground">Stripe</strong> — payment processing. They
            handle all card data; we never store payment details. See Stripe's privacy policy
            at stripe.com.
          </li>
          <li>
            <strong className="text-foreground">AI providers</strong> — your CV content and
            job description text are sent to AI models for analysis and generation. We use
            reputable providers and do not permit them to train on your data.
          </li>
          <li>
            <strong className="text-foreground">Zoho Mail</strong> — used to send transactional
            emails (contact responses, billing notifications) from help@resuone.com.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Recruiter Mode & Candidate Data",
    content: (
      <>
        <p className="mb-3">
          If you use Recruiter Mode, you may upload or enter personal data belonging to third
          parties (candidates). As the person uploading this data, you act as the data controller
          for that information. You are responsible for:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Ensuring you have a lawful basis for processing candidate data (e.g. consent or legitimate interest).</li>
          <li>Not uploading sensitive personal data (health, political views, etc.) beyond what is standard for a job application.</li>
          <li>Complying with applicable laws including GDPR where relevant.</li>
        </ul>
        <p className="mt-3">
          ResuOne processes this data on your behalf as a data processor. We do not use candidate
          data for purposes beyond providing the Recruiter Mode service to you.
        </p>
      </>
    ),
  },
  {
    title: "Data Protection",
    content: (
      <p>
        We take reasonable and proportionate steps to protect the data you share with us.
        No system is perfectly secure — please avoid uploading highly sensitive personal
        information beyond what's needed for a job application or candidate record.
      </p>
    ),
  },
  {
    title: "Your Rights & Control",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>You choose what to upload — only share what you're comfortable with.</li>
        <li>Avoid including confidential employer data, NDA-covered information, or sensitive personal details beyond a standard CV.</li>
        <li>You can request access to, correction of, or deletion of your account and associated data by emailing{" "}
          <a href="mailto:help@resuone.com" className="text-primary underline underline-offset-2">
            help@resuone.com
          </a>
          .
        </li>
        <li>EU/UK users have rights under GDPR / UK GDPR including the right to erasure, portability, and objection to processing. Contact us to exercise these rights.</li>
      </ul>
    ),
  },
  {
    title: "Cookies & Tracking",
    content: (
      <p>
        ResuOne uses session cookies required for authentication (via Clerk) and basic
        functionality. We do not use third-party advertising trackers or behavioural profiling
        cookies. Usage analytics are collected in aggregate to improve the product.
      </p>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this privacy policy from time to time. We'll indicate the date of the
        most recent revision at the top of this page. Material changes will be communicated
        via email or an in-app notice where reasonably practicable.
      </p>
    ),
  },
  {
    title: "Contact",
    content: (
      <p>
        For privacy-related questions or data requests, please contact us at{" "}
        <a href="mailto:help@resuone.com" className="text-primary underline underline-offset-2">
          help@resuone.com
        </a>
        .
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to ResuOne
          </Link>
          <Link href="/">
            <LogoBrand size="sm" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <div className="mb-12">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {s.title}
              </h2>
              <div className="text-muted-foreground text-sm leading-relaxed pl-9">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-xs text-muted-foreground/60 flex gap-4">
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-muted-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
