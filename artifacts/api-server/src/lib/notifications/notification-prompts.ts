import type { TrackedApplication, ApplicationReminder, ApplicationInterview, ApplicationEmailDraft, InterviewPrep } from "@workspace/db";

// ─── buildSmartActionSuggestionPrompt ─────────────────────────────────────────

export function buildSmartActionSuggestionPrompt(ctx: {
  application: TrackedApplication;
  stage: string;
  appliedAt: string | null;
  interviews: ApplicationInterview[];
  reminders: ApplicationReminder[];
  existingDrafts: ApplicationEmailDraft[];
  latestInterviewPrep: InterviewPrep | null;
}): string {
  const now = new Date().toISOString();
  const completedInterviews = ctx.interviews.filter((i) => i.status === "completed");
  const upcomingInterviews = ctx.interviews.filter((i) => i.status === "scheduled");
  const hasThankYouDraft = ctx.existingDrafts.some((d) => d.draftType === "thank_you");
  const hasFollowUpDraft = ctx.existingDrafts.some((d) => d.draftType === "follow_up");
  const hasInterviewPrep = !!ctx.latestInterviewPrep;

  return `You are Resuone AI, a smart job application assistant.

Generate practical, grounded smart action suggestions for this job application.
Return ONLY valid JSON. No markdown, no explanation.

Application context:
- Job: ${ctx.application.applicationTitle} at ${ctx.application.company ?? "Unknown company"}
- Stage: ${ctx.stage}
- Applied at: ${ctx.appliedAt ?? "not yet applied"}
- Current time: ${now}
- Upcoming interviews: ${upcomingInterviews.length}
  ${upcomingInterviews.map((i) => `  • ${i.title} on ${new Date(i.scheduledAt).toLocaleString()}`).join("\n")}
- Completed interviews: ${completedInterviews.length}
- Has interview prep: ${hasInterviewPrep ? "yes" : "no"}
- Has follow-up draft: ${hasFollowUpDraft ? "yes" : "no"}
- Has thank-you draft: ${hasThankYouDraft ? "yes" : "no"}
- Active reminders: ${ctx.reminders.filter((r) => !r.isCompleted).length}

Suggestion type options: follow_up_time | thank_you_time | interview_prep_time | mock_interview_time | deadline_warning | asset_missing

Rules:
- Only suggest things genuinely useful right now based on the context
- Do not suggest follow-up if applied less than 3 days ago
- Suggest thank_you only if there are completed interviews and no thank-you draft
- Suggest interview_prep_time if upcoming interview within 5 days and no prep exists
- Suggest mock_interview_time if upcoming interview within 7 days
- Suggest asset_missing if stage is "preparing" and no tailored CV exists
- suggested_at must be a realistic ISO8601 datetime (when the action should happen)
- Return between 1 and 4 suggestions
- payload can include "reminderAt", "dueDate", "context" as needed

Return exactly this JSON structure:
{
  "suggestions": [
    {
      "suggestion_type": "follow_up_time",
      "title": "string",
      "description": "string — why this matters right now",
      "suggested_at": "ISO8601 datetime",
      "payload": {}
    }
  ]
}`;
}
