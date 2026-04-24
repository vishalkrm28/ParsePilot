import { db, internalJobsTable, discoveredJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { detectKeywords } from "./keyword-detector.js";
import { getCountryRules } from "./country-rules.js";
import { computeScore, type ScoringResult, type SponsorshipSignal } from "./scoring.js";
import { validateWithClaude } from "./ai-validation.js";
import { logger } from "../logger.js";

export interface VisaPipelineResult {
  signal: SponsorshipSignal;
  confidence: number;
  positiveSignals: string[];
  negativeSignals: string[];
  evidenceSummary: string;
  isAmbiguous: boolean;
  usedAi: boolean;
}

// ─── Internal Jobs (recruiter-posted, trust recruiter declarations) ────────────

export async function analyzeInternalJob(jobId: string): Promise<VisaPipelineResult | null> {
  const [job] = await db.select().from(internalJobsTable).where(eq(internalJobsTable.id, jobId)).limit(1);
  if (!job) return null;

  const text = `${job.title ?? ""} ${job.description ?? ""} ${(job.requirements as string[] ?? []).join(" ")}`;

  const keywords = detectKeywords(text);
  const countryRules = getCountryRules(job.country);

  const scoring = computeScore({
    keywords,
    countryRules,
    recruiterDeclared: {
      visaSponsorshipAvailable: job.visaSponsorshipAvailable,
      relocationSupport: job.relocationSupport,
      workAuthorizationRequirement: job.workAuthorizationRequirement,
    },
  });

  let final: ScoringResult = scoring;
  let usedAi = false;

  // Only call Claude when the recruiter hasn't clearly declared and signals are ambiguous
  const recruiterDeclared = job.visaSponsorshipAvailable != null;
  if (!recruiterDeclared && scoring.isAmbiguous) {
    const aiResult = await validateWithClaude(text, {
      country: job.country,
      company: job.company,
      existingPositive: keywords.positiveSignals,
      existingNegative: keywords.negativeSignals,
    });
    if (aiResult) {
      final = aiResult;
      usedAi = true;
    }
  }

  // Persist to DB
  await db
    .update(internalJobsTable)
    .set({
      sponsorshipSignal: final.signal,
      sponsorshipConfidence: final.confidence,
      updatedAt: new Date(),
    })
    .where(eq(internalJobsTable.id, jobId));

  return {
    signal: final.signal,
    confidence: final.confidence,
    positiveSignals: final.positiveSignals,
    negativeSignals: final.negativeSignals,
    evidenceSummary: final.evidenceSummary,
    isAmbiguous: final.isAmbiguous,
    usedAi,
  };
}

// ─── Discovered Jobs (scraped, rely on keyword analysis + AI) ─────────────────

export async function analyzeDiscoveredJob(jobId: string): Promise<VisaPipelineResult | null> {
  const [job] = await db.select().from(discoveredJobsTable).where(eq(discoveredJobsTable.id, jobId)).limit(1);
  if (!job) return null;

  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.location ?? ""}`;

  const keywords = detectKeywords(text);
  const countryRules = getCountryRules(job.country);

  const scoring = computeScore({ keywords, countryRules });

  let final: ScoringResult = scoring;
  let usedAi = false;

  if (scoring.isAmbiguous) {
    const aiResult = await validateWithClaude(text, {
      country: job.country,
      company: job.company,
      existingPositive: keywords.positiveSignals,
      existingNegative: keywords.negativeSignals,
    });
    if (aiResult) {
      final = aiResult;
      usedAi = true;
    }
  }

  // Persist to DB
  await db
    .update(discoveredJobsTable)
    .set({
      sponsorshipSignal: final.signal,
      sponsorshipConfidence: final.confidence,
      updatedAt: new Date(),
    })
    .where(eq(discoveredJobsTable.id, jobId));

  return {
    signal: final.signal,
    confidence: final.confidence,
    positiveSignals: final.positiveSignals,
    negativeSignals: final.negativeSignals,
    evidenceSummary: final.evidenceSummary,
    isAmbiguous: final.isAmbiguous,
    usedAi,
  };
}

// ─── Lightweight re-score from already-available data (no DB read) ─────────────
// Used after recruiter updates visa fields — avoids an extra DB round-trip.

export async function rescoreInternalJobFromData(jobData: {
  id: string;
  title: string;
  description: string;
  requirements?: string[] | null;
  country?: string | null;
  company?: string;
  visaSponsorshipAvailable?: boolean | null;
  relocationSupport?: boolean | null;
  workAuthorizationRequirement?: string | null;
}): Promise<VisaPipelineResult> {
  const text = `${jobData.title} ${jobData.description} ${(jobData.requirements ?? []).join(" ")}`;
  const keywords = detectKeywords(text);
  const countryRules = getCountryRules(jobData.country);
  const scoring = computeScore({
    keywords,
    countryRules,
    recruiterDeclared: {
      visaSponsorshipAvailable: jobData.visaSponsorshipAvailable,
      relocationSupport: jobData.relocationSupport,
      workAuthorizationRequirement: jobData.workAuthorizationRequirement,
    },
  });

  let final: ScoringResult = scoring;
  let usedAi = false;

  const recruiterDeclared = jobData.visaSponsorshipAvailable != null;
  if (!recruiterDeclared && scoring.isAmbiguous) {
    const aiResult = await validateWithClaude(text, {
      country: jobData.country,
      company: jobData.company,
      existingPositive: keywords.positiveSignals,
      existingNegative: keywords.negativeSignals,
    });
    if (aiResult) {
      final = aiResult;
      usedAi = true;
    }
  }

  try {
    await db
      .update(internalJobsTable)
      .set({ sponsorshipSignal: final.signal, sponsorshipConfidence: final.confidence, updatedAt: new Date() })
      .where(eq(internalJobsTable.id, jobData.id));
  } catch (err) {
    logger.warn({ err }, "Failed to persist visa signal after rescore");
  }

  return {
    signal: final.signal,
    confidence: final.confidence,
    positiveSignals: final.positiveSignals,
    negativeSignals: final.negativeSignals,
    evidenceSummary: final.evidenceSummary,
    isAmbiguous: final.isAmbiguous,
    usedAi,
  };
}
