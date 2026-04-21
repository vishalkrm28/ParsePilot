import { authedFetch } from "@/lib/authed-fetch";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStage =
  | "saved" | "preparing" | "applied" | "screening"
  | "interview" | "final_round" | "offer" | "rejected" | "withdrawn";

export type ApplicationStatus = "active" | "archived" | "closed";

export type ReminderType = "follow_up" | "interview" | "deadline" | "personal_note";

export interface SavedJob {
  id: string;
  userId: string;
  externalJobCacheId: string | null;
  sourceApplicationId: string | null;
  jobTitle: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  remoteType: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  currency: string | null;
  applyUrl: string | null;
  jobSnapshot: Record<string, unknown>;
  createdAt: string;
}

export interface TrackedApp {
  id: string;
  userId: string;
  savedJobId: string | null;
  externalJobCacheId: string | null;
  sourceApplicationId: string | null;
  tailoredCvId: string | null;
  coverLetterId: string | null;
  applicationTitle: string;
  company: string | null;
  location: string | null;
  applyUrl: string | null;
  stage: ApplicationStage;
  status: ApplicationStatus;
  appliedAt: string | null;
  nextStepAt: string | null;
  jobSnapshot: Record<string, unknown>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  applicationId: string | null;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  eventAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  applicationId: string | null;
  reminderType: ReminderType;
  reminderAt: string;
  reminderNote: string | null;
  isCompleted: boolean;
  createdAt: string;
}

export interface InterviewPrep {
  id: string;
  userId: string;
  applicationId: string | null;
  tailoredCvId: string | null;
  coverLetterId: string | null;
  prepSummary: string | null;
  prepJson: Record<string, unknown>;
  createdAt: string;
  applicationTitle?: string | null;
  company?: string | null;
}

export interface InterviewQuestionAnswer {
  id: string;
  userId: string;
  interviewPrepId: string | null;
  question: string;
  whyItMatters: string | null;
  answerStrategy: string | null;
  answerDraft: string | null;
  answerType: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Stage helpers ────────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  final_round: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const PIPELINE_STAGES: ApplicationStage[] = [
  "saved", "preparing", "applied", "screening",
  "interview", "final_round", "offer",
];

export const TERMINAL_STAGES: ApplicationStage[] = ["rejected", "withdrawn"];

// ─── API functions ────────────────────────────────────────────────────────────

async function apiRequest<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await authedFetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error((err as { error?: string }).error ?? "Request failed"), { status: res.status });
  }
  return res.json() as Promise<T>;
}

// ── Saved Jobs ────────────────────────────────────────────────────────────────

export async function saveJob(params: {
  externalJobCacheId?: string | null;
  discoveredJobId?: string | null;
  sourceApplicationId?: string | null;
  jobTitle: string;
  company?: string | null;
  location?: string | null;
  employmentType?: string | null;
  remoteType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  applyUrl?: string | null;
  jobSnapshot?: Record<string, unknown>;
}): Promise<{ savedJob: SavedJob; alreadySaved: boolean }> {
  return apiRequest(`${BASE}/tracker/saved-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function listSavedJobs(): Promise<{ savedJobs: SavedJob[] }> {
  return apiRequest(`${BASE}/tracker/saved-jobs`);
}

export async function deleteSavedJob(id: string): Promise<void> {
  await authedFetch(`${BASE}/tracker/saved-jobs/${id}`, { method: "DELETE" });
}

// ── Tracked Applications ──────────────────────────────────────────────────────

export async function createTrackedApp(params: {
  savedJobId?: string | null;
  externalJobCacheId?: string | null;
  sourceApplicationId?: string | null;
  applicationTitle: string;
  company?: string | null;
  location?: string | null;
  applyUrl?: string | null;
  tailoredCvId?: string | null;
  coverLetterId?: string | null;
  notes?: string | null;
  jobSnapshot?: Record<string, unknown>;
}): Promise<{ app: TrackedApp }> {
  return apiRequest(`${BASE}/tracker/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function listTrackedApps(status?: ApplicationStatus): Promise<{ apps: TrackedApp[] }> {
  const qs = status ? `?status=${status}` : "";
  return apiRequest(`${BASE}/tracker/apps${qs}`);
}

export async function getTrackedApp(id: string): Promise<{
  app: TrackedApp;
  tailoredCv: { id: string; versionName: string | null } | null;
  coverLetter: { id: string; jobTitle: string | null; tone: string } | null;
  timeline: TimelineEvent[];
  reminders: Reminder[];
}> {
  return apiRequest(`${BASE}/tracker/apps/${id}`);
}

export async function updateStage(appId: string, stage: ApplicationStage): Promise<void> {
  await apiRequest(`${BASE}/tracker/apps/${appId}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
}

export async function updateNotes(appId: string, notes: string): Promise<void> {
  await apiRequest(`${BASE}/tracker/apps/${appId}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
}

export async function linkAssets(appId: string, params: {
  tailoredCvId?: string | null;
  coverLetterId?: string | null;
}): Promise<void> {
  await apiRequest(`${BASE}/tracker/apps/${appId}/assets`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function updateAppStatus(appId: string, status: ApplicationStatus): Promise<void> {
  await apiRequest(`${BASE}/tracker/apps/${appId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function deleteTrackedApp(appId: string): Promise<void> {
  await authedFetch(`${BASE}/tracker/apps/${appId}`, { method: "DELETE" });
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export async function createReminder(appId: string, params: {
  reminderType: ReminderType;
  reminderAt: string;
  reminderNote?: string | null;
}): Promise<{ reminder: Reminder }> {
  return apiRequest(`${BASE}/tracker/apps/${appId}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function getReminders(appId: string): Promise<{ reminders: Reminder[] }> {
  return apiRequest(`${BASE}/tracker/apps/${appId}/reminders`);
}

export async function completeReminder(reminderId: string): Promise<void> {
  await apiRequest(`${BASE}/tracker/reminders/${reminderId}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

// ── Interview Prep ─────────────────────────────────────────────────────────────

export async function generateInterviewPrep(params: {
  applicationId: string;
  tailoredCvId?: string | null;
  coverLetterId?: string | null;
  jobText?: string | null;
}): Promise<{ prep: InterviewPrep; questions: InterviewQuestionAnswer[] }> {
  return apiRequest(`${BASE}/interview-prep/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function listInterviewPreps(): Promise<{ preps: InterviewPrep[] }> {
  return apiRequest(`${BASE}/interview-prep/list`);
}

export async function getInterviewPrep(id: string): Promise<{
  prep: InterviewPrep;
  questions: InterviewQuestionAnswer[];
  application: TrackedApp | null;
}> {
  return apiRequest(`${BASE}/interview-prep/${id}`);
}

export async function saveAnswerDraft(questionId: string, answerDraft: string): Promise<void> {
  await apiRequest(`${BASE}/interview-prep/answers/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answerDraft }),
  });
}
