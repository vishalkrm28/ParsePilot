import { boolean, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const candidateVisaPreferencesTable = pgTable(
  "candidate_visa_preferences",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().unique(),
    needsVisaSponsorship: boolean("needs_visa_sponsorship").default(false),
    currentCountry: text("current_country"),
    targetCountries: jsonb("target_countries").default(sql`'[]'::jsonb`),
    hasEuWorkRights: boolean("has_eu_work_rights").default(false),
    hasUkWorkRights: boolean("has_uk_work_rights").default(false),
    hasUsWorkRights: boolean("has_us_work_rights").default(false),
    preferredRelocation: boolean("preferred_relocation").default(false),
    relocationNotes: text("relocation_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("candidate_visa_prefs_user_idx").on(t.userId)],
);

export type CandidateVisaPreference = typeof candidateVisaPreferencesTable.$inferSelect;
export type InsertCandidateVisaPreference = typeof candidateVisaPreferencesTable.$inferInsert;
