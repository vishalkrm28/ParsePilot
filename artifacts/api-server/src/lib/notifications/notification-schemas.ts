import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const NotificationTypeEnum = z.enum([
  "reminder_due",
  "follow_up_due",
  "interview_upcoming",
  "thank_you_needed",
  "deadline_approaching",
  "prep_recommended",
  "draft_ready",
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const NotificationPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export type NotificationPriority = z.infer<typeof NotificationPriorityEnum>;

export const NotificationStatusEnum = z.enum(["pending", "completed", "dismissed", "snoozed"]);
export type NotificationStatus = z.infer<typeof NotificationStatusEnum>;

export const ProviderEnum = z.enum(["google", "gmail", "outlook", "internal"]);
export type Provider = z.infer<typeof ProviderEnum>;

export const ConnectionStatusEnum = z.enum(["not_connected", "connected", "expired", "error"]);
export type ConnectionStatus = z.infer<typeof ConnectionStatusEnum>;

export const SyncStatusEnum = z.enum(["pending", "synced", "failed", "draft_only"]);
export type SyncStatus = z.infer<typeof SyncStatusEnum>;

export const SuggestionTypeEnum = z.enum([
  "follow_up_time",
  "thank_you_time",
  "interview_prep_time",
  "mock_interview_time",
  "deadline_warning",
  "asset_missing",
]);
export type SuggestionType = z.infer<typeof SuggestionTypeEnum>;

// ─── Request schemas ──────────────────────────────────────────────────────────

export const UpdateNotificationPreferencesBody = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  reminderLeadHours: z.number().int().min(1).max(168).optional(),
  interviewLeadHours: z.number().int().min(1).max(168).optional(),
  followUpDefaultDays: z.number().int().min(1).max(30).optional(),
});

export const CreateNotificationItemBody = z.object({
  applicationId: z.string().optional().nullable(),
  reminderId: z.string().optional().nullable(),
  interviewId: z.string().optional().nullable(),
  type: NotificationTypeEnum,
  title: z.string().min(1).max(300),
  body: z.string().max(1000).optional().nullable(),
  actionLabel: z.string().max(100).optional().nullable(),
  actionUrl: z.string().max(500).optional().nullable(),
  priority: NotificationPriorityEnum.default("medium"),
  dueAt: z.string().datetime().optional().nullable(),
});

export const UpdateNotificationStatusBody = z.object({
  status: NotificationStatusEnum,
});

export const SnoozeNotificationBody = z.object({
  snoozedUntil: z.string().datetime(),
});

export const ListNotificationsQuery = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Smart action schemas ─────────────────────────────────────────────────────

export const GenerateSmartActionsBody = z.object({
  applicationId: z.string().min(1),
});

export const AcceptSmartActionBody = z.object({
  suggestionId: z.string().min(1),
});

export const DismissSmartActionBody = z.object({
  suggestionId: z.string().min(1),
});

// ─── Calendar schemas ─────────────────────────────────────────────────────────

export const CreateCalendarEventBody = z.object({
  provider: ProviderEnum,
  applicationId: z.string().optional().nullable(),
  interviewId: z.string().min(1),
  title: z.string().min(1).max(300),
  scheduledAt: z.string().datetime(),
  timezone: z.string().default("UTC"),
  location: z.string().max(500).optional().nullable(),
  meetingUrl: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// ─── Email sync schemas ───────────────────────────────────────────────────────

export const CreateOutboundEmailBody = z.object({
  applicationId: z.string().optional().nullable(),
  emailDraftId: z.string().optional().nullable(),
  provider: ProviderEnum.optional().nullable(),
  recipientEmail: z.string().email().optional().nullable(),
  subject: z.string().min(1).max(500),
  bodyText: z.string().min(1),
});
