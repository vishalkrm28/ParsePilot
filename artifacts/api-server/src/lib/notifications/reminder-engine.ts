import type { TrackedApplication, ApplicationReminder, ApplicationInterview, ApplicationEmailDraft } from "@workspace/db";
import { priorityFromType, urgencyFromInterviewTime } from "./notification-helpers.js";
import type { InsertNotificationItem } from "@workspace/db";

// ─── buildInterviewReminderNotification ───────────────────────────────────────

export function buildInterviewReminderNotification(
  interview: ApplicationInterview,
  leadHours: number,
): InsertNotificationItem | null {
  const scheduledAt = new Date(interview.scheduledAt);
  const dueAt = new Date(scheduledAt.getTime() - leadHours * 3_600_000);
  if (dueAt < new Date()) return null;

  const priority = urgencyFromInterviewTime(scheduledAt);
  return {
    userId: interview.userId,
    applicationId: interview.applicationId ?? undefined,
    interviewId: interview.id,
    type: "interview_upcoming",
    title: `Interview coming up: ${interview.title}`,
    body: `${interview.interviewType} interview scheduled for ${scheduledAt.toLocaleString()}${interview.location ? ` at ${interview.location}` : ""}`,
    actionLabel: "View prep",
    actionUrl: `/tracker/${interview.applicationId}`,
    priority,
    dueAt: dueAt.toISOString(),
  };
}

// ─── buildFollowUpReminderNotification ────────────────────────────────────────

export function buildFollowUpReminderNotification(
  app: TrackedApplication,
  followUpDefaultDays: number,
): InsertNotificationItem | null {
  if (!app.appliedAt) return null;
  const appliedAt = new Date(app.appliedAt);
  const dueAt = new Date(appliedAt.getTime() + followUpDefaultDays * 86_400_000);
  if (dueAt < new Date()) return null;

  return {
    userId: app.userId,
    applicationId: app.id,
    type: "follow_up_due",
    title: `Follow up with ${app.company ?? app.applicationTitle}`,
    body: `It has been ${followUpDefaultDays} days since you applied. Consider sending a follow-up.`,
    actionLabel: "Draft follow-up email",
    actionUrl: `/tracker/${app.id}`,
    priority: priorityFromType("follow_up_due"),
    dueAt: dueAt.toISOString(),
  };
}

// ─── buildThankYouNotification ────────────────────────────────────────────────

export function buildThankYouNotification(
  app: TrackedApplication,
  interview: ApplicationInterview,
): InsertNotificationItem {
  return {
    userId: app.userId,
    applicationId: app.id,
    interviewId: interview.id,
    type: "thank_you_needed",
    title: `Send thank-you after interview at ${app.company ?? app.applicationTitle}`,
    body: `Your interview "${interview.title}" is completed. A timely thank-you note strengthens your candidacy.`,
    actionLabel: "Draft thank-you email",
    actionUrl: `/tracker/${app.id}`,
    priority: priorityFromType("thank_you_needed"),
    dueAt: new Date(Date.now() + 24 * 3_600_000).toISOString(),
  };
}

// ─── buildDeadlineNotification ────────────────────────────────────────────────

export function buildDeadlineNotification(
  app: TrackedApplication,
  deadlineAt: Date,
): InsertNotificationItem {
  return {
    userId: app.userId,
    applicationId: app.id,
    type: "deadline_approaching",
    title: `Deadline approaching — ${app.company ?? app.applicationTitle}`,
    body: `Application deadline is ${deadlineAt.toLocaleDateString()}. Make sure everything is ready.`,
    actionLabel: "View application",
    actionUrl: `/tracker/${app.id}`,
    priority: priorityFromType("deadline_approaching"),
    dueAt: deadlineAt.toISOString(),
  };
}

// ─── createNotificationFromReminder ──────────────────────────────────────────

export function createNotificationFromReminder(
  reminder: ApplicationReminder,
  app: TrackedApplication,
): InsertNotificationItem {
  return {
    userId: reminder.userId,
    applicationId: reminder.applicationId ?? undefined,
    reminderId: reminder.id,
    type: "reminder_due",
    title: `Reminder: ${reminder.reminderNote ?? reminder.reminderType} — ${app.company ?? app.applicationTitle}`,
    body: reminder.reminderNote ?? `${reminder.reminderType} reminder for your application`,
    actionLabel: "View application",
    actionUrl: `/tracker/${reminder.applicationId}`,
    priority: priorityFromType("reminder_due"),
    dueAt: reminder.reminderAt instanceof Date
      ? reminder.reminderAt.toISOString()
      : String(reminder.reminderAt),
  };
}

// ─── createNotificationFromInterview ─────────────────────────────────────────

export function createNotificationFromInterview(
  interview: ApplicationInterview,
  app: TrackedApplication,
  leadHours: number,
): InsertNotificationItem | null {
  return buildInterviewReminderNotification(interview, leadHours);
}
