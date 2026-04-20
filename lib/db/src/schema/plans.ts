import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ─── Plans ────────────────────────────────────────────────────────────────────
// Canonical plan catalogue — decoupled from Stripe so pricing can evolve without
// touching Stripe config. Stripe price IDs are stored in the metadata column.

export const plansTable = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  billingType: text("billing_type").notNull().default("subscription"),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }).default("0"),
  yearlyPrice: numeric("yearly_price", { precision: 10, scale: 2 }).default("0"),
  includedCredits: integer("included_credits").default(0),
  maxTeamMembers: integer("max_team_members").default(1),
  features: jsonb("features").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Plan = typeof plansTable.$inferSelect;
export type InsertPlan = typeof plansTable.$inferInsert;

// ─── Feature Entitlements ─────────────────────────────────────────────────────
// Per-plan feature flags/limits. One row per (plan, feature_key) pair.
// feature_value is a JSON blob — e.g. { "enabled": true } or { "limit": 5 }

export const featureEntitlementsTable = pgTable(
  "feature_entitlements",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    planId: varchar("plan_id")
      .notNull()
      .references(() => plansTable.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    featureValue: jsonb("feature_value").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_feature_entitlements_plan_id").on(t.planId),
    index("idx_feature_entitlements_feature_key").on(t.featureKey),
  ],
);

export type FeatureEntitlement = typeof featureEntitlementsTable.$inferSelect;
export type InsertFeatureEntitlement = typeof featureEntitlementsTable.$inferInsert;
