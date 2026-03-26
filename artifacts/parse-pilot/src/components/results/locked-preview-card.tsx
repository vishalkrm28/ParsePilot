import { Crown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/Card";
import { BlurredLockedSection } from "./blurred-locked-section";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { UnlockButton } from "@/components/billing/unlock-button";

interface FreePreview {
  summaryPreview: string;
  firstBullet: string;
  lockedSectionsCount: number;
}

interface LockedPreviewCardProps {
  preview: FreePreview;
  applicationId: string;
}

/**
 * Shown in the CV tab when a free user has run analysis.
 *
 * Layout:
 *  - Card header: "Your optimized resume is ready" + Pro badge
 *  - Visible: Professional summary preview + first rewritten bullet
 *  - Blurred: placeholder lines for locked sections
 *  - Overlay: two CTAs — "Unlock this result — $4" and "Start Pro trial"
 *
 * Security: The full tailored CV is never sent by the server to free users.
 * This component only renders the preview data the server intentionally shared.
 */
export function LockedPreviewCard({ preview, applicationId }: LockedPreviewCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* ── Card header ─────────────────────────────────────────── */}
        <div className="bg-muted px-6 py-3 border-b border-border flex justify-between items-center rounded-t-2xl">
          <span className="text-sm font-semibold text-foreground">
            Your optimized resume is ready
          </span>
          <span className="text-xs text-violet-600 font-semibold bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
            <Crown className="w-3 h-3" aria-hidden="true" />
            Full version locked
          </span>
        </div>

        {/* ── Visible preview content ──────────────────────────────── */}
        <div className="px-6 pt-5 pb-0 font-mono text-sm space-y-4">

          {preview.summaryPreview && (
            <section aria-label="Professional summary preview">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Professional Summary
              </p>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {preview.summaryPreview}
              </p>
            </section>
          )}

          {preview.firstBullet && (
            <section aria-label="Work experience — first rewritten bullet">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Work Experience — First Rewritten Bullet
              </p>
              <p className="text-foreground leading-relaxed flex gap-2">
                <span className="text-muted-foreground shrink-0" aria-hidden="true">•</span>
                <span>{preview.firstBullet}</span>
              </p>
            </section>
          )}
        </div>

        {/* ── Blurred locked section + in-card CTA overlay ─────────── */}
        <div className="relative mt-4">
          {/* Blurred placeholder lines */}
          <BlurredLockedSection
            lineCount={preview.lockedSectionsCount > 3 ? 14 : 10}
            lineWidths={["100%", "92%", "82%", "100%", "72%", "88%", "95%", "65%", "100%", "78%", "88%", "60%", "93%", "74%"]}
          />

          {/* In-card dual-CTA overlay — floats over the blurred section */}
          <div className="absolute inset-0 flex items-end justify-center pb-6 px-4">
            <div className="bg-card/95 backdrop-blur-sm border border-border shadow-xl rounded-2xl p-5 w-full max-w-sm">
              {/* Section count context */}
              <p className="text-[11px] font-semibold text-muted-foreground text-center mb-3 uppercase tracking-wider">
                {preview.lockedSectionsCount} more section{preview.lockedSectionsCount !== 1 ? "s" : ""} optimized
              </p>

              {/* Headline */}
              <h4 className="text-base font-bold text-foreground text-center mb-4 leading-snug">
                See exactly how we rewrote<br />your experience for this role
              </h4>

              {/* ── Primary CTA: one-time unlock ── */}
              <UnlockButton
                applicationId={applicationId}
                label="Unlock this result — $4"
                className="w-full h-10 text-sm mb-2"
              />
              <p className="text-[10px] text-muted-foreground text-center mb-3">
                No subscription. Instant access. Includes DOCX & PDF export.
              </p>

              {/* Divider */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* ── Secondary CTA: Pro subscription ── */}
              <UpgradeButton
                label="Start Pro — 7 days free"
                className="w-full h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Unlimited results · Cover letters · Better value for repeat use
              </p>
            </div>
          </div>
        </div>

        {/* Extra bottom padding so the overlay CTA doesn't clip */}
        <div className="h-8" aria-hidden="true" />

        {/* Sparkles footer hint */}
        <div className="border-t border-border px-6 py-3 flex items-center justify-center gap-2 bg-muted/40 rounded-b-2xl">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            AI rewrote your CV to match this role — without changing any facts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
