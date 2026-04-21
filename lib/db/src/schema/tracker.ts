import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { externalJobsCacheTable, discoveredJobsTable } from "./jobs";
import { tailoredCvsTable, coverLettersTable } from "./tailoring";

// ─── Saved Jobs ───────────────────────────────────────────────────────────────
// A lightweight bookmark of a job the user wants to track.
// Can come from an external recommendation OR a manually pasted job description.

export const savedJobsTable = pgTable("saved_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),

  // Optional link back to the cached external job (from Find Jobs / Adzuna / Muse)
  externalJobCacheId: varchar("external_job_cache_id").references(
    () => externalJobsCacheTable.id,
    { onDelete: "set null" },
  ),

  // Optional link to a globally discovered job (from Global Jobs / jobs table)
  discoveredJobId: varchar("discovered_job_id").references(
    () => discoveredJobsTable.id,
    { onDelete: "set null" },
  ),

  // Optional link back to the original CV analysis application that contained a pasted JD
  sourceApplicationId: varchar("source_application_id"),

  jobTitle: text("job_title").notNull(),
  company: text("company"),
  location: text("location"),
  employmentType: text("employment_type"),
  remoteType: text("remote_type"),
  salaryMin: numeric("salary_min"),
  salaryMax: numeric("salary_max"),
  currency: text("currency"),
  applyUrl: text("apply_url"),

  // Full snapshot of job data at save time so external changes don't break records
  jobSnapshot: jsonb("job_snapshot").notNull().default(sql`'{}'::jsonb`),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tracked Applications ─────────────────────────────────────────────────────
// A first-class application tracking record.
// NOTE: Named "tracked_applications" in DB to avoid collision with the
// existing "applications" table (CV analysis workspaces).

export const trackedApplicationsTable = pgTable("tracked_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),

  // Optional link back to a saved job bookmark
  savedJobId: varchar("saved_job_id").references(
    () => savedJobsTable.id,
    { onDelete: "set null" },
  ),

  // Optional link to external job cache (if applied directly from Find Jobs)
  externalJobCacheId: varchar("external_job_cache_id").references(
    () => externalJobsCacheTable.id,
    { onDelete: "set null" },
  ),

  // Optional link back to the original CV analysis application
  sourceApplicationId: varchar("source_application_id"),

  // AI-generated assets linked to this application
  tailoredCvId: varchar("tailored_cv_id").references(
    () => tailoredCvsTable.id,
    { onDelete: "set null" },
  ),
  coverLetterId: varchar("cover_letter_id").references(
    () => coverLettersTable.id,
    { onDelete: "set null" },
  ),

  applicationTitle: text("application_title").notNull(),
  company: text("company"),
  location: text("location"),
  applyUrl: text("apply_url"),

  // Stage: where the application is in the hiring funnel
  stage: text("stage").notNull().default("saved"),
  // Status: lifecycle state (active vs archived/closed)
  status: text("status").notNull().default("active"),

  // Dates
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  nextStepAt: timestamp("next_step_at", { withTimezone: true }),

  // Snapshot of job data at application creation time
  jobSnapshot: jsonb("job_snapshot").notNull().default(sql`'{}'::jsonb`),

  // User notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Application Timeline Events ──────────────────────────────────────────────
// Audit log of meaningful events on an application.

export const applicationTimelineEventsTable = pgTable("application_timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),
  userId: text("user_id").notNull(),

  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventAt: timestamp("event_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Interview Preps ──────────────────────────────────────────────────────────
// AI-generated interview preparation pack for a specific application.

export const interviewPrepsTable = pgTable("interview_preps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),
  tailoredCvId: varchar("tailored_cv_id").references(
    () => tailoredCvsTable.id,
    { onDelete: "set null" },
  ),
  coverLetterId: varchar("cover_letter_id").references(
    () => coverLettersTable.id,
    { onDelete: "set null" },
  ),

  prepSummary: text("prep_summary"),
  prepJson: jsonb("prep_json").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Interview Question Answers ───────────────────────────────────────────────
// Per-question rows extracted from interview prep JSON, with editable answer drafts.

export const interviewQuestionAnswersTable = pgTable("interview_question_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  interviewPrepId: varchar("interview_prep_id").references(
    () => interviewPrepsTable.id,
    { onDelete: "cascade" },
  ),

  question: text("question").notNull(),
  whyItMatters: text("why_it_matters"),
  answerStrategy: text("answer_strategy"),
  answerDraft: text("answer_draft"),
  answerType: text("answer_type").notNull().default("general"),
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Application Reminders ────────────────────────────────────────────────────
// User-set reminders attached to a tracked application.

export const applicationRemindersTable = pgTable("application_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  applicationId: varchar("application_id").references(
    () => trackedApplicationsTable.id,
    { onDelete: "cascade" },
  ),

  // follow_up | interview | deadline | personal_note
  reminderType: text("reminder_type").notNull(),
  reminderAt: timestamp("reminder_at", { withTimezone: true }).notNull(),
  reminderNote: text("reminder_note"),
  isCompleted: boolean("is_completed").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type SavedJob = typeof savedJobsTable.$inferSelect;
export type InsertSavedJob = typeof savedJobsTable.$inferInsert;
export type TrackedApplication = typeof trackedApplicationsTable.$inferSelect;
export type InsertTrackedApplication = typeof trackedApplicationsTable.$inferInsert;
export type ApplicationTimelineEvent = typeof applicationTimelineEventsTable.$inferSelect;
export type InsertApplicationTimelineEvent = typeof applicationTimelineEventsTable.$inferInsert;
export type InterviewPrep = typeof interviewPrepsTable.$inferSelect;
export type InsertInterviewPrep = typeof interviewPrepsTable.$inferInsert;
export type InterviewQuestionAnswer = typeof interviewQuestionAnswersTable.$inferSelect;
export type InsertInterviewQuestionAnswer = typeof interviewQuestionAnswersTable.$inferInsert;
export type ApplicationReminder = typeof applicationRemindersTable.$inferSelect;
export type InsertApplicationReminder = typeof applicationRemindersTable.$inferInsert;
