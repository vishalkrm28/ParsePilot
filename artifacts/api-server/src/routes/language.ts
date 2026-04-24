import { Router } from "express";
import { z } from "zod";
import { db, candidateVisaPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  analyzeLanguageSignalForInternalJob,
  analyzeLanguageSignalForDiscoveredJob,
} from "../lib/language/language-pipeline.js";
import { calculateLanguageFit } from "../lib/language/language-fit.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── POST /language/analyze-internal-job ─────────────────────────────────────

router.post("/language/analyze-internal-job", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { internalJobId } = req.body;
  if (!internalJobId) { res.status(400).json({ error: "internalJobId is required" }); return; }
  try {
    const result = await analyzeLanguageSignalForInternalJob(internalJobId);
    if (!result) { res.status(404).json({ error: "Job not found" }); return; }
    res.json({ result });
  } catch (err) {
    logger.error({ err }, "Language analysis failed for internal job");
    res.status(500).json({ error: "Language analysis failed" });
  }
});

// ─── POST /language/analyze-discovered-job ───────────────────────────────────

router.post("/language/analyze-discovered-job", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { jobId } = req.body;
  if (!jobId) { res.status(400).json({ error: "jobId is required" }); return; }
  try {
    const result = await analyzeLanguageSignalForDiscoveredJob(jobId);
    if (!result) { res.status(404).json({ error: "Job not found" }); return; }
    res.json({ result });
  } catch (err) {
    logger.error({ err }, "Language analysis failed for discovered job");
    res.status(500).json({ error: "Language analysis failed" });
  }
});

// ─── GET /language/preferences ────────────────────────────────────────────────

router.get("/language/preferences", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [prefs] = await db
      .select({
        knownLanguages: candidateVisaPreferencesTable.knownLanguages,
        preferredWorkingLanguages: candidateVisaPreferencesTable.preferredWorkingLanguages,
      })
      .from(candidateVisaPreferencesTable)
      .where(eq(candidateVisaPreferencesTable.userId, req.user.id))
      .limit(1);
    res.json({ preferences: prefs ?? { knownLanguages: [], preferredWorkingLanguages: [] } });
  } catch (err) {
    logger.error({ err }, "Failed to load language preferences");
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

// ─── POST /language/preferences ───────────────────────────────────────────────

const LanguagePreferencesSchema = z.object({
  knownLanguages: z.array(z.string()).optional(),
  preferredWorkingLanguages: z.array(z.string()).optional(),
});

router.post("/language/preferences", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const parsed = LanguagePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  try {
    const existing = await db
      .select({ id: candidateVisaPreferencesTable.id })
      .from(candidateVisaPreferencesTable)
      .where(eq(candidateVisaPreferencesTable.userId, req.user.id))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(candidateVisaPreferencesTable)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(candidateVisaPreferencesTable.userId, req.user.id))
        .returning();
      res.json({ preferences: updated });
    } else {
      const [created] = await db
        .insert(candidateVisaPreferencesTable)
        .values({ userId: req.user.id, ...parsed.data })
        .returning();
      res.json({ preferences: created });
    }
  } catch (err) {
    logger.error({ err }, "Failed to save language preferences");
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// ─── POST /language/fit ───────────────────────────────────────────────────────
// Stateless: compute language fit for current user against a job's language signal.

router.post("/language/fit", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { requiredLanguages = [], preferredLanguages = [], languageRequirementSignal = "unknown" } = req.body;

  try {
    const [prefs] = await db
      .select({
        knownLanguages: candidateVisaPreferencesTable.knownLanguages,
        preferredWorkingLanguages: candidateVisaPreferencesTable.preferredWorkingLanguages,
      })
      .from(candidateVisaPreferencesTable)
      .where(eq(candidateVisaPreferencesTable.userId, req.user.id))
      .limit(1);

    const fit = calculateLanguageFit({
      candidateKnownLanguages: (prefs?.knownLanguages as string[]) ?? [],
      candidatePreferredWorkingLanguages: (prefs?.preferredWorkingLanguages as string[]) ?? [],
      requiredLanguages,
      preferredLanguages,
      languageRequirementSignal,
    });

    res.json(fit);
  } catch (err) {
    logger.error({ err }, "Failed to compute language fit");
    res.status(500).json({ error: "Failed to compute fit" });
  }
});

export default router;
