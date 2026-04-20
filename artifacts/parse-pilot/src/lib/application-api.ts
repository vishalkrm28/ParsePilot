import { authedFetch } from "@/lib/authed-fetch";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TailoredCvSummary {
  id: string;
  versionName: string | null;
  jobTitle: string | null;
  jobCompany: string | null;
  tailoringSummary: string | null;
  atsKeywordsAdded: string[];
  sourceApplicationId: string | null;
  externalJobCacheId: string | null;
  createdAt: string;
}

export interface TailoredCvDetail extends TailoredCvSummary {
  originalParsedCv: Record<string, unknown>;
  tailoredCvJson: TailoredCvJson;
  jobText: string | null;
}

export interface TailoredCvJson {
  full_name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  professional_summary: string;
  core_skills: string[];
  ats_keywords_added: string[];
  tailored_experience: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string | null;
    bullets: string[];
  }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  certifications: string[];
  projects: string[];
  tailoring_summary: string;
  notes: { tailoring_strategy: string; risk_flags: string[] };
}

export interface CoverLetterSummary {
  id: string;
  tailoredCvId: string | null;
  sourceApplicationId: string | null;
  jobTitle: string | null;
  jobCompany: string | null;
  tone: string;
  coverLetterText: string;
  createdAt: string;
}

export interface ExportPayload {
  tailored_cv_text: string | null;
  cover_letter_text: string | null;
  tailored_cv_json: TailoredCvJson | null;
}

// ─── Tailor CV ────────────────────────────────────────────────────────────────

export interface TailorCvParams {
  sourceApplicationId?: string;
  externalJobCacheId?: string;
  jobText?: string;
  jobTitle?: string;
  jobCompany?: string;
  versionName?: string;
}

export async function tailorCv(params: TailorCvParams): Promise<TailoredCvDetail> {
  const res = await authedFetch(`${BASE}/application/tailor-cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? "Failed to tailor CV"), {
      code: err.code,
      status: res.status,
    });
  }
  return res.json();
}

// ─── Generate Cover Letter ────────────────────────────────────────────────────

export interface GenerateCoverLetterParams {
  tailoredCvId?: string;
  sourceApplicationId?: string;
  externalJobCacheId?: string;
  jobText?: string;
  jobTitle?: string;
  jobCompany?: string;
  tone?: string;
}

export async function generateCoverLetter(
  params: GenerateCoverLetterParams,
): Promise<CoverLetterSummary> {
  const res = await authedFetch(`${BASE}/application/cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? "Failed to generate cover letter"), {
      code: err.code,
      status: res.status,
    });
  }
  return res.json();
}

// ─── List Tailored CVs ────────────────────────────────────────────────────────

export async function listTailoredCvs(): Promise<TailoredCvSummary[]> {
  const res = await authedFetch(`${BASE}/application/tailored-cvs`);
  if (!res.ok) throw new Error("Failed to load tailored CVs");
  const data = await res.json();
  return data.tailoredCvs ?? [];
}

// ─── Get Tailored CV Detail ───────────────────────────────────────────────────

export async function getTailoredCv(id: string): Promise<TailoredCvDetail> {
  const res = await authedFetch(`${BASE}/application/tailored-cvs/${id}`);
  if (!res.ok) throw new Error("Failed to load tailored CV");
  return res.json();
}

// ─── List Cover Letters ───────────────────────────────────────────────────────

export async function listCoverLetters(): Promise<CoverLetterSummary[]> {
  const res = await authedFetch(`${BASE}/application/cover-letters`);
  if (!res.ok) throw new Error("Failed to load cover letters");
  const data = await res.json();
  return data.coverLetters ?? [];
}

// ─── Rename Tailored CV ───────────────────────────────────────────────────────

export async function renameTailoredCv(id: string, versionName: string): Promise<void> {
  const res = await authedFetch(`${BASE}/application/tailored-cvs/${id}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionName }),
  });
  if (!res.ok) throw new Error("Failed to rename");
}

// ─── Duplicate Tailored CV ────────────────────────────────────────────────────

export async function duplicateTailoredCv(id: string): Promise<TailoredCvSummary> {
  const res = await authedFetch(`${BASE}/application/tailored-cvs/${id}/duplicate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to duplicate");
  return res.json();
}

// ─── Export Assets ────────────────────────────────────────────────────────────

export async function exportAssets(params: {
  tailoredCvId?: string;
  coverLetterId?: string;
}): Promise<ExportPayload> {
  const res = await authedFetch(`${BASE}/application/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to export");
  return res.json();
}

// ─── ATS Improvements ────────────────────────────────────────────────────────

export interface AtsImprovements {
  missing_keywords: string[];
  summary_suggestions: string[];
  bullet_improvements: Array<{ original: string; improved: string }>;
  format_notes: string[];
}

export async function getAtsImprovements(params: {
  sourceApplicationId?: string;
  jobText?: string;
}): Promise<AtsImprovements> {
  const res = await authedFetch(`${BASE}/application/ats-improvements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to get ATS improvements");
  return res.json();
}
