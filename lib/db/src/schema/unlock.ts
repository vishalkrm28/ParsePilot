import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { applicationsTable } from "./applications";

// ─── Unlock Purchases ─────────────────────────────────────────────────────────
// One row per one-time unlock purchase.
// A user can pay $4 to unlock the full tailored CV + exports for a single result.
// This is per-result — a separate purchase is required for each new result.
// Pro users never need this; they have full access for all results.

export const unlockPurchasesTable = pgTable("unlock_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // The user who made the purchase
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  // The specific application (result) being unlocked — FK to applications.id (uuid)
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),

  // Stripe identifiers — both are unique to prevent duplicate processing
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),

  // Payment details recorded from Stripe
  amountPaid: integer("amount_paid"),
  currency: varchar("currency"),

  // Stripe payment status (e.g. "paid", "unpaid", "no_payment_required")
  status: varchar("status"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UnlockPurchase = typeof unlockPurchasesTable.$inferSelect;
export type InsertUnlockPurchase = typeof unlockPurchasesTable.$inferInsert;
