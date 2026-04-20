import { authedFetch } from "./authed-fetch";

const API = import.meta.env.VITE_API_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "reminder_due" | "follow_up_due" | "interview_upcoming" | "thank_you_needed"
  | "deadline_approaching" | "prep_recommended" | "draft_ready";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationStatus = "pending" | "completed" | "dismissed" | "snoozed";
export type SuggestionType =
  | "follow_up_time" | "thank_you_time" | "interview_prep_time"
  | "mock_interview_time" | "deadline_warning" | "asset_missing";

export interface NotificationItem {
  id: string;
  userId: string;
  applicationId?: string | null;
  reminderId?: string | null;
  interviewId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority: NotificationPriority;
  status: NotificationStatus;
  dueAt?: string | null;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  reminderLeadHours: number;
  interviewLeadHours: number;
  followUpDefaultDays: number;
}

export interface SmartActionSuggestion {
  id: string;
  userId: string;
  applicationId?: string | null;
  suggestionType: SuggestionType;
  title: string;
  description?: string | null;
  suggestedAt: string;
  status: "pending" | "accepted" | "dismissed";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface CalendarSyncEvent {
  id: string;
  interviewId?: string | null;
  applicationId?: string | null;
  provider: string;
  syncStatus: string;
  externalEventId?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface EmailOutboundRecord {
  id: string;
  applicationId?: string | null;
  emailDraftId?: string | null;
  provider?: string | null;
  syncStatus: string;
  recipientEmail?: string | null;
  subject: string;
  bodyText: string;
  sentAt?: string | null;
  createdAt: string;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await authedFetch(`${API}/api/notifications/preferences`);
  if (!res.ok) throw new Error("Failed to fetch preferences");
  const data = await res.json();
  return data.preferences;
}

export async function updateNotificationPreferences(
  prefs: Partial<Omit<NotificationPreferences, "id" | "userId">>,
): Promise<NotificationPreferences> {
  const res = await authedFetch(`${API}/api/notifications/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  const data = await res.json();
  return data.preferences;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function listNotifications(opts?: { status?: string; limit?: number }): Promise<NotificationItem[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const res = await authedFetch(`${API}/api/notifications?${params}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const data = await res.json();
  return data.notifications;
}

export async function createNotification(input: {
  applicationId?: string | null;
  reminderId?: string | null;
  interviewId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: NotificationPriority;
  dueAt?: string | null;
}): Promise<NotificationItem> {
  const res = await authedFetch(`${API}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create notification");
  const data = await res.json();
  return data.notification;
}

export async function updateNotificationStatus(
  id: string,
  status: NotificationStatus,
): Promise<NotificationItem> {
  const res = await authedFetch(`${API}/api/notifications/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update notification");
  const data = await res.json();
  return data.notification;
}

export async function snoozeNotification(
  id: string,
  snoozedUntil: string,
): Promise<NotificationItem> {
  const res = await authedFetch(`${API}/api/notifications/${id}/snooze`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snoozedUntil }),
  });
  if (!res.ok) throw new Error("Failed to snooze notification");
  const data = await res.json();
  return data.notification;
}

export async function deleteNotification(id: string): Promise<void> {
  await authedFetch(`${API}/api/notifications/${id}`, { method: "DELETE" });
}

// ─── Smart Actions ────────────────────────────────────────────────────────────

export async function generateSmartActions(applicationId: string): Promise<SmartActionSuggestion[]> {
  const res = await authedFetch(`${API}/api/smart-actions/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId }),
  });
  if (!res.ok) throw new Error("Failed to generate smart actions");
  const data = await res.json();
  return data.suggestions;
}

export async function listSmartActions(opts?: { applicationId?: string; status?: string }): Promise<SmartActionSuggestion[]> {
  const params = new URLSearchParams();
  if (opts?.applicationId) params.set("applicationId", opts.applicationId);
  if (opts?.status) params.set("status", opts.status);
  const res = await authedFetch(`${API}/api/smart-actions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch smart actions");
  const data = await res.json();
  return data.suggestions;
}

export async function acceptSmartAction(suggestionId: string): Promise<SmartActionSuggestion> {
  const res = await authedFetch(`${API}/api/smart-actions/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId }),
  });
  if (!res.ok) throw new Error("Failed to accept suggestion");
  const data = await res.json();
  return data.suggestion;
}

export async function dismissSmartAction(suggestionId: string): Promise<SmartActionSuggestion> {
  const res = await authedFetch(`${API}/api/smart-actions/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId }),
  });
  if (!res.ok) throw new Error("Failed to dismiss suggestion");
  const data = await res.json();
  return data.suggestion;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export async function getCalendarConnectStatus(): Promise<Record<string, { status: string; providerEmail: string | null }>> {
  const res = await authedFetch(`${API}/api/calendar/connect-status`);
  if (!res.ok) throw new Error("Failed to fetch calendar status");
  const data = await res.json();
  return data.connections;
}

export async function syncInterviewToCalendar(input: {
  provider: string;
  applicationId?: string | null;
  interviewId: string;
  title: string;
  scheduledAt: string;
  timezone?: string;
  location?: string | null;
  meetingUrl?: string | null;
  notes?: string | null;
}): Promise<{ syncEvent: CalendarSyncEvent; synced: boolean; message: string }> {
  const res = await authedFetch(`${API}/api/calendar/create-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timezone: "UTC", ...input }),
  });
  if (!res.ok) throw new Error("Failed to create calendar event");
  return res.json();
}

export async function listCalendarEvents(applicationId?: string): Promise<CalendarSyncEvent[]> {
  const params = applicationId ? `?applicationId=${applicationId}` : "";
  const res = await authedFetch(`${API}/api/calendar/events${params}`);
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  const data = await res.json();
  return data.events;
}

// ─── Email Sync ───────────────────────────────────────────────────────────────

export async function getEmailConnectStatus(): Promise<Record<string, { status: string; providerEmail: string | null }>> {
  const res = await authedFetch(`${API}/api/email-sync/connect-status`);
  if (!res.ok) throw new Error("Failed to fetch email status");
  const data = await res.json();
  return data.connections;
}

export async function createOutboundEmailRecord(input: {
  applicationId?: string | null;
  emailDraftId?: string | null;
  provider?: string | null;
  recipientEmail?: string | null;
  subject: string;
  bodyText: string;
}): Promise<{ record: EmailOutboundRecord; message: string }> {
  const res = await authedFetch(`${API}/api/email-sync/outbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to save outbound record");
  return res.json();
}

export async function listOutboundEmailRecords(applicationId?: string): Promise<EmailOutboundRecord[]> {
  const params = applicationId ? `?applicationId=${applicationId}` : "";
  const res = await authedFetch(`${API}/api/email-sync/outbound${params}`);
  if (!res.ok) throw new Error("Failed to fetch outbound records");
  const data = await res.json();
  return data.records;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  reminder_due: "Reminder",
  follow_up_due: "Follow Up",
  interview_upcoming: "Interview",
  thank_you_needed: "Thank You",
  deadline_approaching: "Deadline",
  prep_recommended: "Prep",
  draft_ready: "Draft Ready",
};

export function isOverdue(item: NotificationItem): boolean {
  if (!item.dueAt) return false;
  return new Date(item.dueAt) < new Date();
}

export function groupByBucket(items: NotificationItem[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);

  const groups: { overdue: NotificationItem[]; today: NotificationItem[]; upcoming: NotificationItem[]; completed: NotificationItem[] } = {
    overdue: [], today: [], upcoming: [], completed: [],
  };

  for (const item of items) {
    if (item.status === "completed" || item.status === "dismissed") {
      groups.completed.push(item);
      continue;
    }
    if (!item.dueAt) { groups.upcoming.push(item); continue; }
    const due = new Date(item.dueAt);
    if (due < startOfToday) groups.overdue.push(item);
    else if (due < endOfToday) groups.today.push(item);
    else groups.upcoming.push(item);
  }
  return groups;
}
