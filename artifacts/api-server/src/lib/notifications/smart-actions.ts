import type { TrackedApplication, ApplicationReminder, ApplicationInterview, ApplicationEmailDraft } from "@workspace/db";

// ─── shouldSuggestFollowUp ────────────────────────────────────────────────────

export function shouldSuggestFollowUp(
  app: TrackedApplication,
  existingDrafts: ApplicationEmailDraft[],
  followUpDays: number,
): boolean {
  if (app.stage !== "applied" && app.stage !== "screening") return false;
  if (!app.appliedAt) return false;
  const daysSinceApplied = (Date.now() - new Date(app.appliedAt).getTime()) / 86_400_000;
  if (daysSinceApplied < followUpDays - 1) return false;
  const hasFollowUp = existingDrafts.some((d) => d.draftType === "follow_up");
  return !hasFollowUp;
}

// ─── shouldSuggestThankYou ────────────────────────────────────────────────────

export function shouldSuggestThankYou(
  interviews: ApplicationInterview[],
  existingDrafts: ApplicationEmailDraft[],
): boolean {
  const hasCompletedInterview = interviews.some((i) => i.status === "completed");
  if (!hasCompletedInterview) return false;
  return !existingDrafts.some((d) => d.draftType === "thank_you");
}

// ─── shouldSuggestMockInterview ───────────────────────────────────────────────

export function shouldSuggestMockInterview(interviews: ApplicationInterview[]): boolean {
  const upcoming = interviews.filter((i) => i.status === "scheduled");
  if (upcoming.length === 0) return false;
  const next = upcoming.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )[0];
  const daysUntil = (new Date(next.scheduledAt).getTime() - Date.now()) / 86_400_000;
  return daysUntil <= 7;
}

// ─── buildSuggestionPayload ───────────────────────────────────────────────────

export function buildSuggestionPayload(
  type: string,
  context: Record<string, unknown>,
): Record<string, unknown> {
  return { type, ...context, generatedAt: new Date().toISOString() };
}

// ─── acceptSuggestionToReminder ───────────────────────────────────────────────

export function reminderTypeFromSuggestion(
  suggestionType: string,
): "follow_up" | "interview" | "deadline" | "personal_note" {
  switch (suggestionType) {
    case "follow_up_time": return "follow_up";
    case "thank_you_time": return "follow_up";
    case "interview_prep_time": return "interview";
    case "mock_interview_time": return "interview";
    case "deadline_warning": return "deadline";
    default: return "personal_note";
  }
}

// ─── suggestedAtFromPayload ───────────────────────────────────────────────────

export function suggestedAtFromPayload(
  payload: Record<string, unknown>,
  fallbackHours = 24,
): Date {
  if (payload.reminderAt && typeof payload.reminderAt === "string") {
    const d = new Date(payload.reminderAt);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(Date.now() + fallbackHours * 3_600_000);
}
