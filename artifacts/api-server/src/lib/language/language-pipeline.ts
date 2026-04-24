import { db, internalJobsTable, discoveredJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { detectLanguageKeywords } from "./language-keyword-detector.js";
import { getCountryLanguageRules } from "./language-country-rules.js";
import { computeLanguageScore, type LanguageScoringResult } from "./language-scoring.js";
import { logger } from "../logger.js";

export interface LanguagePipelineResult extends LanguageScoringResult {
  positiveSignals: string[];
}

// ─── Internal Jobs (recruiter-posted) ─────────────────────────────────────────

export async function analyzeLanguageSignalForInternalJob(jobId: string): Promise<LanguagePipelineResult | null> {
  const [job] = await db.select().from(internalJobsTable).where(eq(internalJobsTable.id, jobId)).limit(1);
  if (!job) return null;

  const text = `${job.title ?? ""} ${job.description ?? ""} ${(job.requirements as string[] ?? []).join(" ")}`;
  const keywords = detectLanguageKeywords(text, job.country);
  const countryRules = getCountryLanguageRules(job.country);

  const scoring = computeLanguageScore({
    keywords,
    countryRules,
    recruiterDeclared: {
      requiredLanguages: (job as any).languageRequired as string[] ?? null,
      preferredLanguages: (job as any).languagePreferred as string[] ?? null,
      workingLanguage: (job as any).workingLanguage as string ?? null,
      languageNotes: (job as any).languageNotes as string ?? null,
    },
  });

  await db
    .update(internalJobsTable)
    .set({
      languageRequirementSignal: scoring.signal,
      languageConfidence: scoring.confidence,
      updatedAt: new Date(),
    } as any)
    .where(eq(internalJobsTable.id, jobId));

  logger.debug({ jobId, signal: scoring.signal, confidence: scoring.confidence }, "Language signal computed for internal job");

  return { ...scoring, positiveSignals: keywords.positiveSignals };
}

// ─── Discovered Jobs (scraped) ────────────────────────────────────────────────

export async function analyzeLanguageSignalForDiscoveredJob(jobId: string): Promise<LanguagePipelineResult | null> {
  const [job] = await db.select().from(discoveredJobsTable).where(eq(discoveredJobsTable.id, jobId)).limit(1);
  if (!job) return null;

  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.location ?? ""}`;
  const keywords = detectLanguageKeywords(text, job.country);
  const countryRules = getCountryLanguageRules(job.country);

  const scoring = computeLanguageScore({ keywords, countryRules });

  await db
    .update(discoveredJobsTable)
    .set({
      languageRequirementSignal: scoring.signal,
      languageConfidence: scoring.confidence,
      languageRequiredLanguages: scoring.requiredLanguages,
      languagePreferredLanguages: scoring.preferredLanguages,
      languageEvidenceSummary: scoring.evidenceSummary,
      updatedAt: new Date(),
    } as any)
    .where(eq(discoveredJobsTable.id, jobId));

  logger.debug({ jobId, signal: scoring.signal, confidence: scoring.confidence }, "Language signal computed for discovered job");

  return { ...scoring, positiveSignals: keywords.positiveSignals };
}

// ─── Rescore from already-available data (no extra DB read) ─────────────────

export async function rescoreLanguageSignalForInternalJob(jobData: {
  id: string;
  title: string;
  description: string;
  requirements?: string[] | null;
  country?: string | null;
  languageRequired?: string[] | null;
  languagePreferred?: string[] | null;
  workingLanguage?: string | null;
  languageNotes?: string | null;
}): Promise<LanguagePipelineResult> {
  const text = `${jobData.title} ${jobData.description} ${(jobData.requirements ?? []).join(" ")}`;
  const keywords = detectLanguageKeywords(text, jobData.country);
  const countryRules = getCountryLanguageRules(jobData.country);

  const scoring = computeLanguageScore({
    keywords,
    countryRules,
    recruiterDeclared: {
      requiredLanguages: jobData.languageRequired ?? null,
      preferredLanguages: jobData.languagePreferred ?? null,
      workingLanguage: jobData.workingLanguage ?? null,
      languageNotes: jobData.languageNotes ?? null,
    },
  });

  try {
    await db
      .update(internalJobsTable)
      .set({
        languageRequirementSignal: scoring.signal,
        languageConfidence: scoring.confidence,
        updatedAt: new Date(),
      } as any)
      .where(eq(internalJobsTable.id, jobData.id));
  } catch (err) {
    logger.warn({ err }, "Failed to persist language signal after rescore");
  }

  return { ...scoring, positiveSignals: keywords.positiveSignals };
}
