import type { NotificationType, NotificationPriority } from "./notification-schemas.js";
import type { NotificationItem } from "@workspace/db";

// ─── buildNotificationTitle ────────────────────────────────────────────────────

export function buildNotificationTitle(
  type: NotificationType,
  context: { company?: string | null; jobTitle?: string | null },
): string {
  const label = context.company ?? context.jobTitle ?? "Application";
  switch (type) {
    case "reminder_due": return `Reminder due — ${label}`;
    case "follow_up_due": return `Follow up with ${label}`;
    case "interview_upcoming": return `Interview coming up — ${label}`;
    case "thank_you_needed": return `Send thank-you to ${label}`;
    case "deadline_approaching": return `Deadline approaching — ${label}`;
    case "prep_recommended": return `Prepare for ${label} interview`;
    case "draft_ready": return `Email draft ready — ${label}`;
  }
}

// ─── priorityFromType ──────────────────────────────────────────────────────────

export function priorityFromType(type: NotificationType): NotificationPriority {
  switch (type) {
    case "interview_upcoming": return "high";
    case "follow_up_due": return "high";
    case "thank_you_needed": return "high";
    case "deadline_approaching": return "urgent";
    case "reminder_due": return "medium";
    case "prep_recommended": return "medium";
    case "draft_ready": return "low";
  }
}

// ─── isOverdue ────────────────────────────────────────────────────────────────

export function isOverdue(item: NotificationItem): boolean {
  if (!item.dueAt) return false;
  return new Date(item.dueAt) < new Date();
}

// ─── groupNotificationsByDateBucket ───────────────────────────────────────────

export type DateBucket = "overdue" | "today" | "upcoming" | "completed";

export function groupNotificationsByDateBucket(
  items: NotificationItem[],
): Record<DateBucket, NotificationItem[]> {
  const groups: Record<DateBucket, NotificationItem[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);

  for (const item of items) {
    if (item.status === "completed" || item.status === "dismissed") {
      groups.completed.push(item);
      continue;
    }
    if (!item.dueAt) {
      groups.upcoming.push(item);
      continue;
    }
    const due = new Date(item.dueAt);
    if (due < startOfToday) {
      groups.overdue.push(item);
    } else if (due < endOfToday) {
      groups.today.push(item);
    } else {
      groups.upcoming.push(item);
    }
  }

  return groups;
}

// ─── nextRelevantActionLabel ──────────────────────────────────────────────────

export function nextRelevantActionLabel(type: NotificationType): string {
  switch (type) {
    case "follow_up_due": return "Draft follow-up email";
    case "thank_you_needed": return "Draft thank-you email";
    case "interview_upcoming": return "View prep";
    case "prep_recommended": return "Generate interview prep";
    case "reminder_due": return "View application";
    case "deadline_approaching": return "View application";
    case "draft_ready": return "View draft";
  }
}

// ─── urgencyPriorityFromInterviewTime ─────────────────────────────────────────

export function urgencyFromInterviewTime(scheduledAt: Date): NotificationPriority {
  const hoursUntil = (scheduledAt.getTime() - Date.now()) / 3_600_000;
  if (hoursUntil <= 6) return "urgent";
  if (hoursUntil <= 24) return "high";
  if (hoursUntil <= 48) return "medium";
  return "low";
}
