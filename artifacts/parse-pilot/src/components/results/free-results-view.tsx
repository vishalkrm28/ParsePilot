import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  Loader2,
  FileText,
  FileDown,
  PenTool,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/ui/textarea";
import { BlurredLockedSection } from "./blurred-locked-section";
import { UnlockButton } from "@/components/billing/unlock-button";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { UpgradeCTACard } from "./upgrade-cta-card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FreePreview {
  summaryPreview: string;
  firstBullet: string;
  lockedSectionsCount: number;
}

interface ApplicationLike {
  keywordMatchScore?: number | null;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  missingInfoQuestions?: string[];
  sectionSuggestions?: string[];
  status: string;
}

interface FreeResultsViewProps {
  app: ApplicationLike;
  freePreview: FreePreview;
  applicationId: string;
  /** Called to (re-)analyze. Pass answers object for missing info context. */
  onReanalyze: (answers?: Record<string, string>) => void;
  isAnalyzing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNLOCK_INCLUDES = [
  { icon: FileText, text: "Full optimized resume — every section rewritten" },
  { icon: FileDown, text: "Download as DOCX or PDF" },
  { icon: PenTool, text: "Copy and edit before you apply" },
];

const TRUST_SIGNALS = [
  "No fake experience added",
  "ATS-friendly formatting",
  "Edit before export",
];

// Show at most this many keyword chips before truncating
const MAX_VISIBLE_KEYWORDS = 7;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-destructive";

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted opacity-20" />
        <circle
          cx="56"
          cy="56"
          r="48"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={302}
          strokeDashoffset={302 - (302 * score) / 100}
          className={cn("transition-all duration-1000 ease-out", color)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold leading-none", color)}>{score}%</span>
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">Match</span>
      </div>
    </div>
  );
}

function KeywordChip({ text, variant }: { text: string; variant: "matched" | "missing" }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-lg text-xs font-medium border",
        variant === "matched"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200",
      )}
    >
      {text}
    </span>
  );
}

function LockedBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
      <Lock className="w-2.5 h-2.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionDivider() {
  return <div className="h-px bg-border my-1" aria-hidden="true" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Full-page conversion experience shown to free users after analysis.
 *
 * Layout (scrollable):
 *   1. Match Score + Keywords
 *   2. CTA-1: compact inline banner
 *   3. AI Insights (suggestions / missing info preview)
 *   4. Optimized Summary (gradient-faded preview)
 *   5. Experience Rewrite (1 bullet + blurred)
 *   6. CTA-2: detailed unlock block
 *   7. Cover Letter Teaser (blurred)
 *   8. CTA-3: dark bottom banner
 *   9. Missing Info (answerable, drives re-analysis)
 *
 * Security: all premium content (tailoredCvText, coverLetterText) is stripped
 * server-side. This component only renders what the server intentionally sent.
 */
export function FreeResultsView({
  app,
  freePreview,
  applicationId,
  onReanalyze,
  isAnalyzing,
}: FreeResultsViewProps) {
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>({});
  // Auto-expand when there are 1–3 questions so the "AI found gaps" signal is immediately visible
  const [showMissingInfo, setShowMissingInfo] = useState(
    () => (app.missingInfoQuestions?.length ?? 0) > 0 && (app.missingInfoQuestions?.length ?? 0) <= 3,
  );

  const score = app.keywordMatchScore ?? 0;
  const matched = app.matchedKeywords ?? [];
  const missing = app.missingKeywords ?? [];
  const questions = app.missingInfoQuestions ?? [];
  const suggestions = app.sectionSuggestions ?? [];

  // Prefer suggestions for insights; fall back to question text (trimmed to label form)
  const insights =
    suggestions.length > 0
      ? suggestions.slice(0, 3)
      : questions.slice(0, 3);

  const scoreLabel =
    score >= 80
      ? "Strong match — your CV is well aligned with this role."
      : score >= 60
        ? "Partial match — the rewrite closes the remaining gaps."
        : "Low match — the full rewrite significantly improves your chances.";

  // ── Analyzing overlay ──────────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        <h3 className="text-xl font-bold">Optimizing your CV…</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          The AI is rewriting your resume to match this role. This takes around 15–30 seconds.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >

      {/* ══ STATUS HEADER ════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Analysis complete
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            Your rewritten resume is ready
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {freePreview.lockedSectionsCount + 1} section{freePreview.lockedSectionsCount !== 0 ? "s" : ""} optimized for this role — unlock to access the full output.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <UnlockButton
            applicationId={applicationId}
            label="Unlock — $4"
            className="h-9 px-4 text-xs font-semibold"
          />
        </div>
      </div>

      {/* ══ SECTION 1: Match Score + Keywords ═══════════════════════════════ */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Score circle */}
            <ScoreCircle score={score} />

            {/* Score label + keyword chips */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">{scoreLabel}</p>
                {score < 80 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    The full rewrite uses your existing experience to close these gaps — without adding anything that isn't true.
                  </p>
                )}
                {score < 85 && missing.length > 0 && (
                  <p className="text-xs font-medium text-violet-600 mt-2">
                    The rewrite works in {Math.min(missing.length, 5)} missing keyword{Math.min(missing.length, 5) !== 1 ? "s" : ""} — your effective match score improves when recruiters see the optimized version.
                  </p>
                )}
              </div>

              {/* Matched keywords */}
              {matched.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Already present ({matched.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matched.slice(0, MAX_VISIBLE_KEYWORDS).map((kw) => (
                      <KeywordChip key={kw} text={kw} variant="matched" />
                    ))}
                    {matched.length > MAX_VISIBLE_KEYWORDS && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{matched.length - MAX_VISIBLE_KEYWORDS} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {missing.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-destructive" />
                    Missing from your CV ({missing.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.slice(0, MAX_VISIBLE_KEYWORDS).map((kw) => (
                      <KeywordChip key={kw} text={kw} variant="missing" />
                    ))}
                    {missing.length > MAX_VISIBLE_KEYWORDS && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{missing.length - MAX_VISIBLE_KEYWORDS} more
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    These are used by ATS filters for this role. The full rewrite works them into your existing experience.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══ CTA-1: Compact inline banner ════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50/60 border border-violet-200/80">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Your optimized resume is ready</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unlock this result for $4, or get unlimited access with Pro
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UnlockButton
            applicationId={applicationId}
            label="Unlock — $4"
            className="h-8 px-4 text-xs font-semibold"
          />
          <UpgradeButton
            label="Start Pro free"
            className="h-8 px-4 text-xs font-semibold"
          />
        </div>
      </div>

      {/* ══ SECTION 2: AI Insights ══════════════════════════════════════════ */}
      {insights.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              What the AI found in your CV
            </h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-violet-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══ SECTION 3: Optimized Summary Preview ════════════════════════════ */}
      {freePreview.summaryPreview && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted px-5 py-3 border-b border-border flex justify-between items-center rounded-t-2xl">
              <span className="text-sm font-semibold text-foreground">
                Professional Summary — AI Optimized
              </span>
              <LockedBadge>Full summary locked</LockedBadge>
            </div>
            <div className="relative px-5 pt-4 pb-0">
              <p className="font-mono text-sm leading-relaxed text-foreground">
                {freePreview.summaryPreview}
              </p>
              {/* Gradient fade — blends into the blurred section below */}
              <div
                className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--card)))" }}
                aria-hidden="true"
              />
            </div>
            <BlurredLockedSection
              lineCount={3}
              lineWidths={["100%", "88%", "70%"]}
            />
          </CardContent>
        </Card>
      )}

      {/* ══ SECTION 4: Experience Rewrite Preview ═══════════════════════════ */}
      {freePreview.firstBullet && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted px-5 py-3 border-b border-border flex justify-between items-center rounded-t-2xl">
              <span className="text-sm font-semibold text-foreground">
                Experience Rewrite
              </span>
              <LockedBadge>Full rewrite locked</LockedBadge>
            </div>

            {/* One visible bullet */}
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                Work Experience — First Rewritten Bullet
              </p>
              <div className="flex items-start gap-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {freePreview.firstBullet}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {freePreview.lockedSectionsCount} more section{freePreview.lockedSectionsCount !== 1 ? "s" : ""} rewritten below
              </p>
            </div>

            {/* Blurred remaining bullets */}
            <BlurredLockedSection
              lineCount={5}
              lineWidths={["100%", "84%", "92%", "75%", "88%"]}
            />
          </CardContent>
        </Card>
      )}

      {/* ══ CTA-2: Detailed conversion block ════════════════════════════════ */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {freePreview.lockedSectionsCount + 1} section{freePreview.lockedSectionsCount !== 0 ? "s" : ""} rewritten &amp; waiting
          </p>
          <h3 className="text-lg font-bold text-foreground leading-snug">
            Get the complete rewrite, tailored for this role
          </h3>
        </div>

        {/* Primary: $4 one-time unlock */}
        <div className="px-6 py-5">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-bold text-foreground">Unlock this result</span>
            <span className="text-xl font-bold text-foreground">
              $4{" "}
              <span className="text-xs font-normal text-muted-foreground">one-time</span>
            </span>
          </div>

          <ul className="space-y-2 mb-4">
            {UNLOCK_INCLUDES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-foreground/85">
                <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {text}
              </li>
            ))}
          </ul>

          <UnlockButton
            applicationId={applicationId}
            label="Unlock now — $4"
            className="w-full h-11 text-sm font-semibold"
          />

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
            {TRUST_SIGNALS.map((t) => (
              <span key={t} className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                {t}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            No subscription · No recurring charge · Instant access
          </p>
        </div>

        {/* Secondary: Pro */}
        <div className="px-6 pb-5 pt-4 border-t border-border/60 bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground">
                ParsePilot Pro — $12/mo
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Unlimited results · Cover letters · Better value for multiple applications
              </p>
            </div>
            <UpgradeButton
              label="Try free →"
              className="shrink-0 h-8 px-3 text-[11px]"
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5">
            7-day free trial · No card charged today
          </p>
        </div>
      </div>

      {/* ══ SECTION 5: Cover Letter Teaser ══════════════════════════════════ */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-muted px-5 py-3 border-b border-border flex justify-between items-center rounded-t-2xl">
            <span className="text-sm font-semibold text-foreground">Cover Letter</span>
            <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
              Pro feature
            </span>
          </div>
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs text-muted-foreground mb-3">
              A personalized letter written around your rewritten CV and this job description. Three tone options: professional, enthusiastic, concise.
            </p>
          </div>
          <BlurredLockedSection
            lineCount={6}
            lineWidths={["100%", "92%", "85%", "100%", "78%", "60%"]}
          />
        </CardContent>
      </Card>

      {/* ══ CTA-3: Dark bottom banner ════════════════════════════════════════ */}
      <UpgradeCTACard
        dark
        headline="Your tailored resume is ready to use"
        description="Start Pro for unlimited results and cover letters — or unlock just this one for $4."
        variant="bottom"
        ctaLabel="Start your 7-day free trial"
        applicationId={applicationId}
      />

      {/* ══ SECTION 6: Missing Info — drives re-analysis ════════════════════ */}
      {questions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => setShowMissingInfo((v) => !v)}
            aria-expanded={showMissingInfo}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                Improve your match score
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Answer {questions.length} question{questions.length !== 1 ? "s" : ""} to give the AI more context — then re-analyze
              </p>
            </div>
            {showMissingInfo ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {showMissingInfo && (
            <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Only answer questions where you have relevant experience. Leave others blank — the AI won't invent anything.
              </p>
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{q}</label>
                  <Textarea
                    placeholder="Describe your experience if relevant, otherwise leave blank…"
                    value={missingAnswers[q] ?? ""}
                    onChange={(e) =>
                      setMissingAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                    }
                    className="min-h-[80px] text-sm"
                  />
                </div>
              ))}
              <Button
                className="w-full h-11 gap-2"
                onClick={() => onReanalyze(missingAnswers)}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Re-analyze with New Context
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Uses 1 credit · Your existing answers are carried forward
              </p>
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
}
