import { boolean, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { trackedApplicationsTable, applicationRemindersTable } from "./tracker";
import { applicationInterviewsTable } from "./mock-interview";
import { applicationEmailDraftsTable } from "./emails";

// ─── Notification Preferences ─────────────────────────────────────────────────

export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  reminderLeadHours: integer("reminder_lead_hours").notNull().default(24),
  interviewLeadHours: integer("interview_lead_hours").notNull().default(24),
  followUpDefaultDays: integer("follow_up_default_days").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Notification Items ────────────────────────────────────────────────────────

export const notificationItemsTable = pgTable("notification_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),
  reminderId: varchar("reminder_id").references(
    () => applicationRemindersTable.id,
    { onDelete: "set null" },
  ),
  interviewId: varchar("interview_id").references(
    () => applicationInterviewsTable.id,
    { onDelete: "set null" },
  ),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  actionLabel: text("action_label"),
  actionUrl: text("action_url"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Calendar Sync Connections ────────────────────────────────────────────────

export const calendarSyncConnectionsTable = pgTable("calendar_sync_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerEmail: text("provider_email"),
  status: text("status").notNull().default("not_connected"),
  externalCalendarId: text("external_calendar_id"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Calendar Sync Events ─────────────────────────────────────────────────────

export const calendarSyncEventsTable = pgTable("calendar_sync_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "set null" },
  ),
  interviewId: varchar("interview_id").references(
    () => applicationInterviewsTable.id,
    { onDelete: "cascade" },
  ),
  provider: text("provider").notNull(),
  externalEventId: text("external_event_id"),
  syncStatus: text("sync_status").notNull().default("pending"),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Email Sync Connections ───────────────────────────────────────────────────

export const emailSyncConnectionsTable = pgTable("email_sync_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerEmail: text("provider_email"),
  status: text("status").notNull().default("not_connected"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Email Outbound Records ───────────────────────────────────────────────────

export const emailOutboundRecordsTable = pgTable("email_outbound_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),
  emailDraftId: varchar("email_draft_id").references(
    () => applicationEmailDraftsTable.id,
    { onDelete: "set null" },
  ),
  provider: text("provider"),
  syncStatus: text("sync_status").notNull().default("draft_only"),
  recipientEmail: text("recipient_email"),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Smart Action Suggestions ─────────────────────────────────────────────────

export const smartActionSuggestionsTable = pgTable("smart_action_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),
  suggestionType: text("suggestion_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  suggestedAt: timestamp("suggested_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferencesTable.$inferInsert;
export type NotificationItem = typeof notificationItemsTable.$inferSelect;
export type InsertNotificationItem = typeof notificationItemsTable.$inferInsert;
export type CalendarSyncConnection = typeof calendarSyncConnectionsTable.$inferSelect;
export type InsertCalendarSyncConnection = typeof calendarSyncConnectionsTable.$inferInsert;
export type CalendarSyncEvent = typeof calendarSyncEventsTable.$inferSelect;
export type InsertCalendarSyncEvent = typeof calendarSyncEventsTable.$inferInsert;
export type EmailSyncConnection = typeof emailSyncConnectionsTable.$inferSelect;
export type InsertEmailSyncConnection = typeof emailSyncConnectionsTable.$inferInsert;
export type EmailOutboundRecord = typeof emailOutboundRecordsTable.$inferSelect;
export type InsertEmailOutboundRecord = typeof emailOutboundRecordsTable.$inferInsert;
export type SmartActionSuggestion = typeof smartActionSuggestionsTable.$inferSelect;
export type InsertSmartActionSuggestion = typeof smartActionSuggestionsTable.$inferInsert;
