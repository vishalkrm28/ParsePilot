import { Router, type IRouter } from "express";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import {
  db,
  applicationsTable,
  candidateProfilesTable,
  externalJobsCacheTable,
  jobRecommendationsTable,
} from "@workspace/db";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { logger } from "../lib/logger.js";
import {
  getJobRecCredits,
  spendJobRecCredit,
  resetDailyJobRecCreditsIfNeeded,
} from "../lib/credits.js";
import { normalizeCandidateProfile, rerankJobsWithAI } from "../services/ai.js";
import { fetchAdzunaJobs } from "../lib/jobs/providers/adzuna.js";
import { fetchMuseJobs } from "../lib/jobs/providers/muse.js";
import { normalizeAdzunaJob, normalizeMuseJob } from "../lib/jobs/normalize.js";
import { prefilterJobs } from "../lib/jobs/ranking.js";

const router: IRouter = Router();

// ─── GET /api/jobs/credits ────────────────────────────────────────────────────
// Returns the user's remaining job recommendation credits.

router.get("/jobs/credits", authMiddleware, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await resetDailyJobRecCreditsIfNeeded(userId);
  const credits = await getJobRecCredits(userId);
  res.json({ jobRecCredits: credits });
});

// ─── GET /api/jobs/recommendations ────────────────────────────────────────────
// Returns the user's saved recommendations, grouped by candidate_profile_id.

router.get("/jobs/recommendations", authMiddleware, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db
    .select({
      rec: jobRecommendationsTable,
      job: externalJobsCacheTable,
      profile: {
        id: candidateProfilesTable.id,
        normalizedProfile: candidateProfilesTable.normalizedProfile,
        preferences: candidateProfilesTable.preferences,
        createdAt: candidateProfilesTable.createdAt,
        sourceApplicationId: candidateProfilesTable.sourceApplicationId,
      },
    })
    .from(jobRecommendationsTable)
    .innerJoin(
      externalJobsCacheTable,
      eq(jobRecommendationsTable.externalJobCacheId, externalJobsCacheTable.id),
    )
    .innerJoin(
      candidateProfilesTable,
      eq(jobRecommendationsTable.candidateProfileId, candidateProfilesTable.id),
    )
    .where(eq(jobRecommendationsTable.userId, userId))
    .orderBy(
      desc(candidateProfilesTable.createdAt),
      desc(jobRecommendationsTable.matchScore),
    )
    .limit(100);

  // Group by profile
  const grouped: Record<string, {
    profile: typeof rows[0]["profile"];
    recommendations: Array<typeof rows[0]["rec"] & { job: typeof rows[0]["job"] }>;
  }> = {};

  for (const row of rows) {
    const pid = row.profile.id;
    if (!grouped[pid]) grouped[pid] = { profile: row.profile, recommendations: [] };
    grouped[pid].recommendations.push({ ...row.rec, job: row.job });
  }

  res.json({ groups: Object.values(grouped) });
});

// ─── POST /api/jobs/recommend ─────────────────────────────────────────────────
// Main recommendation endpoint.
// 1. Verify job rec credits
// 2. Build / reuse candidate profile
// 3. Fetch + cache jobs from Adzuna (+ Muse fallback)
// 4. Pre-filter locally, AI-rerank top 20 → top 10
// 5. Persist recommendations
// 6. Deduct 1 job rec credit
// 7. Return top 10

router.post("/jobs/recommend", authMiddleware, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    applicationId,
    preferredLocation,
    country = "gb",
    remotePreference,
    roleType,
  } = req.body as {
    applicationId?: string;
    preferredLocation?: string;
    country?: string;
    remotePreference?: string;
    roleType?: string;
  };

  // ── Daily Pro reset (no-op for non-Pro users) ────────────────────────────────
  await resetDailyJobRecCreditsIfNeeded(userId);

  // ── Credit check ────────────────────────────────────────────────────────────
  const credits = await getJobRecCredits(userId);
  if (credits < 1) {
    res.status(402).json({
      error: "No job recommendation credits remaining for today. Pro users get 10 fresh credits every day. Non-Pro users can unlock credits by purchasing a CV analysis.",
      code: "NO_JOB_REC_CREDITS",
    });
    return;
  }

  // ── Resolve source application ───────────────────────────────────────────────
  let parsedCvJson: unknown = null;

  if (applicationId) {
    const [app] = await db
      .select({ parsedCvJson: applicationsTable.parsedCvJson, userId: applicationsTable.userId })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.id, applicationId),
          eq(applicationsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    parsedCvJson = app.parsedCvJson;
  } else {
    // Use the most recent analyzed application for this user
    const [latest] = await db
      .select({ parsedCvJson: applicationsTable.parsedCvJson })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.userId, userId),
          isNotNull(applicationsTable.parsedCvJson),
        ),
      )
      .orderBy(desc(applicationsTable.createdAt))
      .limit(1);

    if (!latest) {
      res.status(422).json({
        error: "No analyzed applications found. Please analyze a CV first.",
        code: "NO_CV",
      });
      return;
    }
    parsedCvJson = latest.parsedCvJson;
  }

  // ── Build normalized candidate profile ──────────────────────────────────────
  let normalizedProfile: Awaited<ReturnType<typeof normalizeCandidateProfile>>;
  try {
    normalizedProfile = await normalizeCandidateProfile(JSON.stringify(parsedCvJson));
  } catch (err) {
    logger.error({ err, userId }, "Failed to normalize candidate profile");
    res.status(500).json({ error: "Failed to build candidate profile from CV" });
    return;
  }

  // Merge user-provided preferences into the profile
  if (preferredLocation) {
    normalizedProfile.preferred_locations = [
      preferredLocation,
      ...normalizedProfile.preferred_locations,
    ];
  }
  if (remotePreference) normalizedProfile.remote_preference = remotePreference;
  if (roleType) {
    normalizedProfile.target_roles = [roleType, ...normalizedProfile.target_roles];
  }

  const preferences = { preferredLocation, country, remotePreference, roleType };

  // ── Persist candidate profile ────────────────────────────────────────────────
  const [savedProfile] = await db
    .insert(candidateProfilesTable)
    .values({
      userId,
      sourceApplicationId: applicationId ?? null,
      parsedCv: parsedCvJson as Record<string, unknown>,
      normalizedProfile: normalizedProfile as unknown as Record<string, unknown>,
      preferences: preferences as Record<string, unknown>,
    })
    .returning({ id: candidateProfilesTable.id });

  // ── Fetch external jobs ──────────────────────────────────────────────────────
  const topRoles = normalizedProfile.target_roles.slice(0, 3);
  const searchTerms = topRoles.length > 0
    ? topRoles
    : [normalizedProfile.keywords.slice(0, 2).join(" ") || "software engineer"];

  const rawJobs: ReturnType<typeof normalizeAdzunaJob>[] = [];

  for (const term of searchTerms) {
    try {
      const results = await fetchAdzunaJobs({
        what: term,
        where: preferredLocation,
        country,
        resultsPerPage: 20,
      });
      rawJobs.push(...results.map(normalizeAdzunaJob));
    } catch (err) {
      logger.warn({ err, term }, "Adzuna fetch failed for term — skipping");
    }
  }

  // Muse fallback / supplement (no location filter in Muse)
  if (rawJobs.length < 20 && topRoles.length > 0) {
    try {
      const museResults = await fetchMuseJobs({ category: topRoles[0], page: 1 });
      rawJobs.push(...museResults.map(normalizeMuseJob));
    } catch (err) {
      logger.warn({ err }, "The Muse fetch failed — skipping");
    }
  }

  if (rawJobs.length === 0) {
    res.status(502).json({
      error: "Could not fetch any jobs from external providers. Please check API credentials.",
      code: "NO_JOBS_FETCHED",
    });
    return;
  }

  // ── Cache jobs (upsert) ──────────────────────────────────────────────────────
  // Deduplicate locally before inserting
  const seen = new Set<string>();
  const uniqueJobs = rawJobs.filter((j) => {
    const key = `${j.source}:${j.external_job_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Upsert jobs — update fetched_at on conflict so 12-hour staleness check works
  const TWELVE_HOURS_AGO = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const cachedIds: Record<string, string> = {}; // "source:ext_id" → DB id

  for (const job of uniqueJobs) {
    const [row] = await db
      .insert(externalJobsCacheTable)
      .values({
        source: job.source,
        externalJobId: job.external_job_id,
        title: job.title,
        company: job.company ?? null,
        location: job.location ?? null,
        employmentType: job.employment_type ?? null,
        remoteType: job.remote_type ?? null,
        salaryMin: job.salary_min != null ? String(job.salary_min) : null,
        salaryMax: job.salary_max != null ? String(job.salary_max) : null,
        currency: job.currency ?? null,
        description: job.description ?? null,
        applyUrl: job.apply_url ?? null,
        sourcePayload: job.source_payload as Record<string, unknown>,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [externalJobsCacheTable.source, externalJobsCacheTable.externalJobId],
        set: {
          title: job.title,
          company: job.company ?? null,
          location: job.location ?? null,
          description: job.description ?? null,
          applyUrl: job.apply_url ?? null,
          fetchedAt: new Date(),
        },
      })
      .returning({ id: externalJobsCacheTable.id });

    if (row) cachedIds[`${job.source}:${job.external_job_id}`] = row.id;
  }

  // ── Pre-filter ───────────────────────────────────────────────────────────────
  const prefiltered = prefilterJobs(normalizedProfile, uniqueJobs).slice(0, 20);

  // ── AI reranking ─────────────────────────────────────────────────────────────
  let aiRankings: Awaited<ReturnType<typeof rerankJobsWithAI>>;
  try {
    aiRankings = await rerankJobsWithAI(normalizedProfile, prefiltered);
  } catch (err) {
    logger.error({ err, userId }, "AI reranking failed");
    res.status(500).json({ error: "AI ranking failed. Please try again." });
    return;
  }

  // ── Spend 1 job rec credit ───────────────────────────────────────────────────
  const { success: creditSpent } = await spendJobRecCredit(userId);
  if (!creditSpent) {
    res.status(402).json({
      error: "No job recommendation credits remaining.",
      code: "NO_JOB_REC_CREDITS",
    });
    return;
  }

  // ── Persist recommendations ──────────────────────────────────────────────────
  const top10 = aiRankings.slice(0, 10);
  const savedRecs: Array<{
    id: string;
    matchScore: number;
    fitReasons: unknown;
    missingRequirements: unknown;
    recommendationSummary: string | null;
    job: typeof uniqueJobs[0];
    cacheId: string;
  }> = [];

  for (const ranking of top10) {
    const cacheKey = `${ranking.source}:${ranking.external_job_id}`;
    const cacheId = cachedIds[cacheKey];
    if (!cacheId) continue;

    const jobData = uniqueJobs.find(
      (j) => j.source === ranking.source && j.external_job_id === ranking.external_job_id,
    );
    if (!jobData) continue;

    const [rec] = await db
      .insert(jobRecommendationsTable)
      .values({
        userId,
        candidateProfileId: savedProfile.id,
        externalJobCacheId: cacheId,
        matchScore: ranking.match_score,
        fitReasons: ranking.fit_reasons as string[],
        missingRequirements: ranking.missing_requirements as string[],
        recommendationSummary: ranking.recommendation_summary ?? null,
      })
      .returning({ id: jobRecommendationsTable.id });

    if (rec) {
      savedRecs.push({
        id: rec.id,
        matchScore: ranking.match_score,
        fitReasons: ranking.fit_reasons,
        missingRequirements: ranking.missing_requirements,
        recommendationSummary: ranking.recommendation_summary ?? null,
        job: jobData,
        cacheId,
      });
    }
  }

  const remainingCredits = await getJobRecCredits(userId);

  res.json({
    profileId: savedProfile.id,
    candidateName: normalizedProfile.candidate_name,
    targetRoles: normalizedProfile.target_roles,
    recommendations: savedRecs,
    totalJobsFetched: uniqueJobs.length,
    remainingCredits,
  });
});

export default router;
