import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ─── Marketing Leads ──────────────────────────────────────────────────────────

export const marketingLeadsTable = pgTable(
  "marketing_leads",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    fullName: text("full_name"),
    company: text("company"),
    role: text("role"),
    leadType: text("lead_type").notNull().default("general"),
    source: text("source"),
    pagePath: text("page_path"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    notes: text("notes"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_marketing_leads_email").on(t.email),
    index("idx_marketing_leads_lead_type").on(t.leadType),
    index("idx_marketing_leads_created_at").on(t.createdAt),
  ],
);

export type MarketingLead = typeof marketingLeadsTable.$inferSelect;
export type InsertMarketingLead = typeof marketingLeadsTable.$inferInsert;

// ─── Waitlist Signups ─────────────────────────────────────────────────────────

export const waitlistSignupsTable = pgTable(
  "waitlist_signups",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    company: text("company"),
    userType: text("user_type").notNull().default("candidate"),
    interestArea: text("interest_area"),
    source: text("source"),
    pagePath: text("page_path"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_waitlist_signups_email").on(t.email),
    index("idx_waitlist_signups_user_type").on(t.userType),
    index("idx_waitlist_signups_created_at").on(t.createdAt),
  ],
);

export type WaitlistSignup = typeof waitlistSignupsTable.$inferSelect;
export type InsertWaitlistSignup = typeof waitlistSignupsTable.$inferInsert;

// ─── Funnel Events ────────────────────────────────────────────────────────────

export const funnelEventsTable = pgTable(
  "funnel_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    anonymousId: text("anonymous_id"),
    userId: text("user_id"),
    eventName: text("event_name").notNull(),
    pagePath: text("page_path"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_funnel_events_event_name").on(t.eventName),
    index("idx_funnel_events_created_at").on(t.createdAt),
    index("idx_funnel_events_anonymous_id").on(t.anonymousId),
  ],
);

export type FunnelEvent = typeof funnelEventsTable.$inferSelect;
export type InsertFunnelEvent = typeof funnelEventsTable.$inferInsert;

// ─── SEO Pages ────────────────────────────────────────────────────────────────

export const seoPagesTable = pgTable(
  "seo_pages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    pageType: text("page_type").notNull().default("seo_article"),
    heroTitle: text("hero_title"),
    heroSubtitle: text("hero_subtitle"),
    bodyJson: jsonb("body_json").notNull().default({}),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_seo_pages_slug").on(t.slug),
    index("idx_seo_pages_is_published").on(t.isPublished),
    index("idx_seo_pages_page_type").on(t.pageType),
  ],
);

export type SeoPage = typeof seoPagesTable.$inferSelect;
export type InsertSeoPage = typeof seoPagesTable.$inferInsert;
