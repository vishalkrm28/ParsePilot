import { Router } from "express";
import { z } from "zod";
import { db, candidateVisaPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { analyzeInternalJob, analyzeDiscoveredJob } from "../lib/visa/pipeline.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── POST /visa/analyze-internal-job ─────────────────────────────────────────
// Runs the full visa intelligence pipeline for a recruiter-posted job.

router.post("/visa/analyze-internal-job", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { internalJobId } = req.body;
  if (!internalJobId) { res.status(400).json({ error: "internalJobId is required" }); return; }

  try {
    const result = await analyzeInternalJob(internalJobId);
    if (!result) { res.status(404).json({ error: "Job not found" }); return; }
    res.json({ result });
  } catch (err) {
    logger.error({ err }, "Visa analysis failed for internal job");
    res.status(500).json({ error: "Visa analysis failed" });
  }
});

// ─── POST /visa/analyze-discovered-job ───────────────────────────────────────
// Runs visa intelligence on a scraped/discovered job.

router.post("/visa/analyze-discovered-job", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { jobId } = req.body;
  if (!jobId) { res.status(400).json({ error: "jobId is required" }); return; }

  try {
    const result = await analyzeDiscoveredJob(jobId);
    if (!result) { res.status(404).json({ error: "Job not found" }); return; }
    res.json({ result });
  } catch (err) {
    logger.error({ err }, "Visa analysis failed for discovered job");
    res.status(500).json({ error: "Visa analysis failed" });
  }
});

// ─── GET /visa/preferences ────────────────────────────────────────────────────
// Returns the current user's visa / work-rights preferences.

router.get("/visa/preferences", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [prefs] = await db
      .select()
      .from(candidateVisaPreferencesTable)
      .where(eq(candidateVisaPreferencesTable.userId, req.user.id))
      .limit(1);

    res.json({ preferences: prefs ?? null });
  } catch (err) {
    logger.error({ err }, "Failed to load visa preferences");
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

// ─── POST /visa/preferences ───────────────────────────────────────────────────
// Upserts the current user's visa / work-rights preferences.

const VisaPreferencesSchema = z.object({
  needsVisaSponsorship: z.boolean().optional(),
  currentCountry: z.string().max(100).optional(),
  targetCountries: z.array(z.string()).optional(),
  hasEuWorkRights: z.boolean().optional(),
  hasUkWorkRights: z.boolean().optional(),
  hasUsWorkRights: z.boolean().optional(),
  preferredRelocation: z.boolean().optional(),
  relocationNotes: z.string().max(500).optional(),
});

router.post("/visa/preferences", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const parsed = VisaPreferencesSchema.safeParse(req.body);
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
    logger.error({ err }, "Failed to save visa preferences");
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;
