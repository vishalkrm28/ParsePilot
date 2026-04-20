import { authedFetch } from "@/lib/authed-fetch";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

// ─── Credit / quota info ──────────────────────────────────────────────────────

export interface CreditsResponsePro {
  isProUser: true;
  dailyLimitPerCv: number;
  runsUsedTodayForCv: number;
  remainingForCv: number;
}

export interface CreditsResponseFree {
  isProUser: false;
  jobRecCredits: number;
}

export type CreditsResponse = CreditsResponsePro | CreditsResponseFree;

/** Fetches credit/quota info. Pass `applicationId` for per-CV remaining count (Pro). */
export async function getJobRecCredits(applicationId?: string | null): Promise<CreditsResponse> {
  const qs = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
  const res = await authedFetch(`${BASE}/jobs/credits${qs}`);
  if (!res.ok) throw new Error("Failed to load job rec credits");
  return res.json();
}

export async function getSavedRecommendations() {
  const res = await authedFetch(`${BASE}/jobs/recommendations`);
  if (!res.ok) throw new Error("Failed to load recommendations");
  return res.json();
}

// ─── Recommend endpoint ───────────────────────────────────────────────────────

export interface RecommendParams {
  applicationId?: string;
  preferredLocation?: string;
  country?: string;
  remotePreference?: string;
  roleType?: string;
}

export interface JobResult {
  id: string;
  matchScore: number;
  fitReasons: string[];
  missingRequirements: string[];
  recommendationSummary: string | null;
  job: {
    source: string;
    external_job_id: string;
    title: string;
    company: string;
    location: string;
    employment_type: string;
    remote_type: string;
    salary_min: string | null;
    salary_max: string | null;
    currency: string;
    description: string;
    apply_url: string;
  };
  cacheId: string;
}

export interface RecommendResponseBase {
  profileId: string;
  candidateName: string;
  targetRoles: string[];
  recommendations: JobResult[];
  totalJobsFetched: number;
}

export interface RecommendResponsePro extends RecommendResponseBase {
  isProUser: true;
  runsUsedTodayForCv: number;
  remainingForCv: number;
}

export interface RecommendResponseFree extends RecommendResponseBase {
  isProUser: false;
  remainingCredits: number;
}

export type RecommendResponse = RecommendResponsePro | RecommendResponseFree;

export async function recommendJobs(params: RecommendParams): Promise<RecommendResponse> {
  const res = await authedFetch(`${BASE}/jobs/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? "Failed to get recommendations"), {
      code: err.code,
      status: res.status,
    });
  }
  return res.json();
}
