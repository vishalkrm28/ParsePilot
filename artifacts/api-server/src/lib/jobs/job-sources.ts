import { fetchGoogleJobs } from "./sources/google-jobs-serpapi.js";
import {
  fetchGreenhouseJobs,
  getDefaultGreenhouseBoardTokens,
} from "./sources/greenhouse.js";
import {
  fetchLeverJobs,
  getDefaultLeverCompanies,
} from "./sources/lever.js";
import type { UnifiedJob } from "./job-schema.js";
import { logger } from "../logger.js";

/**
 * Filter jobs from ATS sources (Greenhouse, Lever) by query keywords.
 * These sources return ALL jobs from a company board — we need to narrow
 * down to roles that actually match what the user searched for.
 */
function filterByQuery(jobs: UnifiedJob[], query: string): UnifiedJob[] {
  if (!query.trim()) return jobs;
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (!keywords.length) return jobs;
  return jobs.filter((job) => {
    const haystack = `${job.title} ${job.description ?? ""}`.toLowerCase();
    return keywords.some((kw) => haystack.includes(kw));
  });
}

export interface DiscoveryInput {
  query: string;
  country?: string;
  location?: string;
  remoteOnly?: boolean;
  limit?: number;
}

export interface DiscoveryResult {
  jobs: UnifiedJob[];
  sourceBreakdown: {
    google_jobs: number;
    greenhouse: number;
    lever: number;
  };
  errors: string[];
}

/**
 * Orchestrate all discovery sources.
 *
 * - Calls Google Jobs (SerpApi), Greenhouse, and Lever in parallel
 * - Tolerates partial failures — one source failure never breaks the whole search
 * - Returns merged results plus a per-source breakdown and any error messages
 */
export async function discoverJobsFromSources(
  input: DiscoveryInput,
): Promise<DiscoveryResult> {
  const { query, country = "", location = "", remoteOnly = false, limit = 50 } = input;

  const maxResults = parseInt(
    process.env.JOB_DISCOVERY_MAX_RESULTS ?? "100",
    10,
  );
  const effectiveLimit = Math.min(limit, maxResults);

  const errors: string[] = [];

  // ── Run all sources in parallel ──────────────────────────────────────────

  const [googleResult, greenhouseResult, leverResult] = await Promise.allSettled([
    // Google Jobs via SerpApi
    fetchGoogleJobs({ query, country, location, remoteOnly, limit: effectiveLimit }),

    // Greenhouse ATS (seeded board tokens)
    fetchGreenhouseJobs({
      boardTokens: getDefaultGreenhouseBoardTokens(query, country),
    }),

    // Lever ATS (seeded company handles)
    fetchLeverJobs({
      companies: getDefaultLeverCompanies(query, country),
    }),
  ]);

  const googleJobs: UnifiedJob[] =
    googleResult.status === "fulfilled" ? googleResult.value : [];
  if (googleResult.status === "rejected") {
    const msg = String(googleResult.reason?.message ?? googleResult.reason);
    logger.warn({ err: googleResult.reason }, "Google Jobs source failed");
    errors.push(`google_jobs: ${msg}`);
  }

  const greenhouseRaw: UnifiedJob[] =
    greenhouseResult.status === "fulfilled" ? greenhouseResult.value : [];
  if (greenhouseResult.status === "rejected") {
    const msg = String(greenhouseResult.reason?.message ?? greenhouseResult.reason);
    logger.warn({ err: greenhouseResult.reason }, "Greenhouse source failed");
    errors.push(`greenhouse: ${msg}`);
  }
  const greenhouseJobs = filterByQuery(greenhouseRaw, query);

  const leverRaw: UnifiedJob[] =
    leverResult.status === "fulfilled" ? leverResult.value : [];
  if (leverResult.status === "rejected") {
    const msg = String(leverResult.reason?.message ?? leverResult.reason);
    logger.warn({ err: leverResult.reason }, "Lever source failed");
    errors.push(`lever: ${msg}`);
  }
  const leverJobs = filterByQuery(leverRaw, query);

  const jobs = [...googleJobs, ...greenhouseJobs, ...leverJobs];

  return {
    jobs,
    sourceBreakdown: {
      google_jobs: googleJobs.length,
      greenhouse: greenhouseJobs.length,
      lever: leverJobs.length,
    },
    errors,
  };
}
