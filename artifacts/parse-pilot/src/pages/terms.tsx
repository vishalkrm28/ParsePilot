import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";

const sections: { title: string; content: React.ReactNode }[] = [
  {
    title: "Introduction",
    content: (
      <p>
        ResuOne provides AI-assisted resume analysis, optimisation, and recruiter workflow tools.
        By using this service, you agree to these terms. If you don't agree, please don't use
        the service.
      </p>
    ),
  },
  {
    title: "Use of Service",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>Use ResuOne for lawful purposes only — whether for personal job seeking or legitimate professional recruiting activities.</li>
        <li>Do not copy, resell, or exploit the platform or its outputs commercially without our consent.</li>
        <li>Do not attempt to reverse-engineer, scrape, or overload the service.</li>
        <li>Do not upload or process data belonging to individuals without their knowledge and consent.</li>
      </ul>
    ),
  },
  {
    title: "No Guarantees",
    content: (
      <>
        <p>
          ResuOne provides suggestions and analysis only. We don't guarantee any specific outcome —
          including interviews, job offers, application success, or recruitment placements.
        </p>
        <p className="mt-3">
          AI-generated content is a starting point. Always review and personalise what's produced
          before submitting it.
        </p>
      </>
    ),
  },
  {
    title: "Your Responsibility",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>You are responsible for reviewing all generated content before use.</li>
        <li>Do not include false, misleading, or fabricated information in any application or candidate record.</li>
        <li>ResuOne will never invent experience — but you must verify what's produced.</li>
        <li>If you use Recruiter Mode, you are responsible for ensuring that any candidate data you upload or manage complies with applicable employment and data protection laws.</li>
      </ul>
    ),
  },
  {
    title: "Output & Formatting",
    content: (
      <>
        <p>
          ResuOne is designed as a CV analysis and optimisation tool.
        </p>
        <p className="mt-3">
          While we aim to preserve the structure and clarity of your CV, formatting and layout may
          vary depending on the content and processing. ResuOne does not guarantee exact formatting
          replication and is not intended to function as a resume builder.
        </p>
        <p className="mt-3">
          Users are responsible for reviewing and finalizing the formatting before using their CV
          for applications.
        </p>
      </>
    ),
  },
  {
    title: "Payments",
    content: (
      <>
        <p>
          One-time unlocks, subscription fees, and add-on purchases are non-refundable unless
          required by applicable law. Pricing may change over time — we'll communicate any changes
          in advance.
        </p>
        <p className="mt-3">
          Payments are processed securely by Stripe. ResuOne does not store your payment card
          details.
        </p>
      </>
    ),
  },
  {
    title: "Plans, Credits & Restrictions",
    content: (
      <>
        <p className="mb-4">
          ResuOne operates on a credit-based system. Each AI analysis consumes one credit.
          Pro plan credits are allocated monthly and do not roll over to the next billing period.
          Free plan credits are a one-time sign-up allowance and do not reset.
        </p>

        {/* Free Plan */}
        <div className="mb-5">
          <p className="font-semibold text-foreground mb-2">Free Plan</p>
          <ul className="list-disc list-inside space-y-1">
            <li>3 AI analyses included as a one-time allowance when you sign up — these do not reset monthly.</li>
            <li>Results are locked behind a one-time $6.99 per-result unlock fee.</li>
            <li>Access to ATS match score and keyword gap preview only without unlocking.</li>
            <li>Bulk Mode and Recruiter Mode are not available on the Free plan.</li>
            <li>Cover letter generation is not available on the Free plan.</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="mb-5">
          <p className="font-semibold text-foreground mb-2">Pro Plan — $14.99/month</p>
          <ul className="list-disc list-inside space-y-1">
            <li>100 AI analyses per month.</li>
            <li>All results fully unlocked — no per-result fees.</li>
            <li>Full access to ATS-optimised CV output, keyword analysis, cover letter generation, and section suggestions.</li>
            <li>Pro is intended for personal use — you may re-analyse your own CV against different job descriptions as many times as you like within your monthly credit allowance.</li>
            <li>Analysing CVs belonging to other individuals is not permitted under the Pro plan. Use Bulk Mode or Recruiter Mode for multi-candidate workflows.</li>
            <li>Unused monthly credits expire at the end of each billing cycle and do not carry over.</li>
            <li>Pro subscription renews automatically each month until cancelled.</li>
            <li>You may cancel at any time; access continues until the end of the current billing period.</li>
            <li>Pro credits cannot be transferred, gifted, or applied to Bulk Mode passes.</li>
          </ul>
        </div>

        {/* Bulk Mode */}
        <div className="mb-5">
          <p className="font-semibold text-foreground mb-2">Bulk Mode — One-Time Passes</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Available in three tiers: analyse 10 CVs for $19.99, 25 CVs for $29.99, or 50 CVs for $39.99 — a one-time charge per pack.</li>
            <li>Each CV in the pack receives a full analysis: ATS match score, missing keyword gaps, and a fully optimised CV output ready to export.</li>
            <li>No per-result unlock fees apply within a Bulk pass.</li>
            <li>Passes are one-time purchases and do not renew automatically.</li>
            <li>Unused slots within a pass do not expire and remain available until consumed.</li>
            <li>Multiple passes may be purchased and will stack — slots are consumed from the most recently purchased pass first.</li>
            <li>Bulk passes are non-transferable and are tied to the purchasing account.</li>
          </ul>
        </div>

        {/* Recruiter Mode */}
        <div className="mb-5">
          <p className="font-semibold text-foreground mb-2">Recruiter Mode</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Available as an add-on subscription: Solo ($29.99/month) or Team ($79/month).</li>
            <li>Provides access to a candidate pipeline, notes timeline, pipeline stage management, and bulk CSV import of candidates.</li>
            <li>Solo plan is intended for individual recruiters managing their own pipeline.</li>
            <li>Team plan extends access for collaborative use within a single organisation.</li>
            <li>Recruiter subscriptions renew automatically each month until cancelled.</li>
            <li>You may cancel at any time; access continues until the end of the current billing period.</li>
            <li>You are responsible for ensuring that any personal data of candidates you process through Recruiter Mode is handled in compliance with applicable laws, including GDPR where relevant.</li>
            <li>Recruiter Mode is not a replacement for professional HR or legal advice.</li>
          </ul>
        </div>

        {/* General */}
        <div>
          <p className="font-semibold text-foreground mb-2">General Credit Restrictions</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Credits and passes are non-refundable once consumed.</li>
            <li>Unused credits or passes are non-refundable upon account deletion.</li>
            <li>ResuOne reserves the right to adjust plan limits or pricing with advance notice.</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <p>
        ResuOne is not responsible for decisions made based on generated output, hiring or
        employment decisions, or for any direct or indirect losses arising from use of the
        service. Use it as a tool, not as professional career or HR advice.
      </p>
    ),
  },
  {
    title: "Changes to These Terms",
    content: (
      <p>
        We may update these terms over time. Continued use of ResuOne after changes are
        published constitutes acceptance of the revised terms. Material changes will be
        communicated via email or an in-app notice where reasonably practicable.
      </p>
    ),
  },
  {
    title: "Contact",
    content: (
      <p>
        For questions about these terms, please contact us at{" "}
        <a href="mailto:help@resuone.com" className="text-primary underline underline-offset-2">
          help@resuone.com
        </a>
        .
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to ResuOne
          </Link>
          <Link href="/" className="flex items-center">
            <img src="/resuone-logo.png" alt="ResuOne" className="h-7 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <div className="mb-12">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Terms of Service
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
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
            Privacy Policy
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
