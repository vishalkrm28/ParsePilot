import { authedFetch } from "@/lib/authed-fetch";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function getJobRecCredits(): Promise<{ jobRecCredits: number }> {
  const res = await authedFetch(`${BASE}/jobs/credits`);
  if (!res.ok) throw new Error("Failed to load job rec credits");
  return res.json();
}

export async function getSavedRecommendations() {
  const res = await authedFetch(`${BASE}/jobs/recommendations`);
  if (!res.ok) throw new Error("Failed to load recommendations");
  return res.json();
}

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

export interface RecommendResponse {
  profileId: string;
  candidateName: string;
  targetRoles: string[];
  recommendations: JobResult[];
  totalJobsFetched: number;
  remainingCredits: number;
}

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
