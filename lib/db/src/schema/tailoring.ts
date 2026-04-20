import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { candidateProfilesTable, externalJobsCacheTable } from "./jobs";

// ─── Tailored CVs ─────────────────────────────────────────────────────────────
// Each row is one AI-tailored version of a user's CV for a specific job.
// The original parsed CV is preserved untouched — tailoring lives here only.

export const tailoredCvsTable = pgTable("tailored_cvs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),

  // Source original CV (applications table — stores parsedCvJson)
  sourceApplicationId: varchar("source_application_id"),

  // Optional links to M33 job recommendation data
  candidateProfileId: varchar("candidate_profile_id").references(
    () => candidateProfilesTable.id,
    { onDelete: "set null" },
  ),
  externalJobCacheId: varchar("external_job_cache_id").references(
    () => externalJobsCacheTable.id,
    { onDelete: "set null" },
  ),

  // User-facing label, e.g. "Tailored for Product Manager @ Spotify"
  versionName: text("version_name"),

  // The original parsed CV JSON — never modified
  originalParsedCv: jsonb("original_parsed_cv").notNull(),

  // The AI-generated tailored CV JSON (TailoredCvJson shape)
  tailoredCvJson: jsonb("tailored_cv_json").notNull(),

  // ATS keywords added or emphasised
  atsKeywordsAdded: jsonb("ats_keywords_added").default(sql`'[]'::jsonb`),

  // Short narrative of what was changed and why
  tailoringSummary: text("tailoring_summary"),

  // Pasted job description (for non-cached job path)
  jobText: text("job_text"),

  // Job context fields (denormalised for display without joins)
  jobTitle: text("job_title"),
  jobCompany: text("job_company"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Cover Letters ────────────────────────────────────────────────────────────
// Stores AI-generated cover letters linked to a tailored CV or original CV.

export const coverLettersTable = pgTable("cover_letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),

  // Linked tailored CV (optional — can generate from raw CV + job)
  tailoredCvId: varchar("tailored_cv_id").references(
    () => tailoredCvsTable.id,
    { onDelete: "set null" },
  ),

  // Source original CV
  sourceApplicationId: varchar("source_application_id"),

  // Linked job context
  externalJobCacheId: varchar("external_job_cache_id").references(
    () => externalJobsCacheTable.id,
    { onDelete: "set null" },
  ),

  // professional | confident | warm | concise
  tone: text("tone").notNull().default("professional"),

  // Full generated cover letter text
  coverLetterText: text("cover_letter_text").notNull(),

  // Denormalised for display
  jobTitle: text("job_title"),
  jobCompany: text("job_company"),

  // Pasted job text (for non-cached path)
  jobText: text("job_text"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TailoredCv = typeof tailoredCvsTable.$inferSelect;
export type InsertTailoredCv = typeof tailoredCvsTable.$inferInsert;
export type CoverLetter = typeof coverLettersTable.$inferSelect;
export type InsertCoverLetter = typeof coverLettersTable.$inferInsert;
