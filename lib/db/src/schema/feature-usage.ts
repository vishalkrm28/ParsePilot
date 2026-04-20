import { sql } from "drizzle-orm";
import { date, index, integer, jsonb, numeric, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// ─── Feature Usage Events ─────────────────────────────────────────────────────
// Append-only log of every significant product action taken by a user.
// More granular than usage_events — includes AI cost estimation and workspace scope.

export const featureUsageEventsTable = pgTable(
  "feature_usage_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    workspaceId: varchar("workspace_id"),
    featureKey: text("feature_key").notNull(),
    referenceType: text("reference_type"),
    referenceId: varchar("reference_id"),
    creditsUsed: integer("credits_used").default(0),
    estimatedAiCost: numeric("estimated_ai_cost", { precision: 10, scale: 6 }).default("0"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_feature_usage_events_user_id").on(t.userId),
    index("idx_feature_usage_events_workspace_id").on(t.workspaceId),
    index("idx_feature_usage_events_feature_key").on(t.featureKey),
    index("idx_feature_usage_events_created_at").on(t.createdAt),
  ],
);

export type FeatureUsageEvent = typeof featureUsageEventsTable.$inferSelect;
export type InsertFeatureUsageEvent = typeof featureUsageEventsTable.$inferInsert;

// ─── Admin Metrics Daily ──────────────────────────────────────────────────────
// One row per calendar day — snapshot of platform-wide KPIs.
// Written by the admin metrics computation job / on-demand route.

export const adminMetricsDailyTable = pgTable(
  "admin_metrics_daily",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    metricDate: date("metric_date").notNull(),
    totalUsers: integer("total_users").default(0),
    newUsers: integer("new_users").default(0),
    activeUsers: integer("active_users").default(0),
    totalWorkspaces: integer("total_workspaces").default(0),
    activeWorkspaces: integer("active_workspaces").default(0),
    totalSubscriptions: integer("total_subscriptions").default(0),
    activeSubscriptions: integer("active_subscriptions").default(0),
    totalCreditsUsed: integer("total_credits_used").default(0),
    totalAiRequests: integer("total_ai_requests").default(0),
    estimatedAiCost: numeric("estimated_ai_cost", { precision: 12, scale: 4 }).default("0"),
    totalRevenueMrr: numeric("total_revenue_mrr", { precision: 12, scale: 2 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("admin_metrics_daily_metric_date_unique").on(t.metricDate),
    index("idx_admin_metrics_daily_date").on(t.metricDate),
  ],
);

export type AdminMetricsDaily = typeof adminMetricsDailyTable.$inferSelect;
export type InsertAdminMetricsDaily = typeof adminMetricsDailyTable.$inferInsert;
