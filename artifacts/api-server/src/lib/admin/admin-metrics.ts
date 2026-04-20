/**
 * Admin metrics computation helpers.
 * Queries aggregate across users, subscriptions, credits, and feature usage.
 * All queries are read-only — safe to call from GET routes.
 */

import { and, count, gte, lte, sql, sum, eq, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  usageEventsTable,
  featureUsageEventsTable,
  workspacesTable,
  workspaceMembersTable,
  adminMetricsDailyTable,
} from "@workspace/db";

// ─── getTotalAndNewUsers ──────────────────────────────────────────────────────

export async function getUserStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totals] = await db.select({ total: count() }).from(usersTable);

  const [newUsersRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(gte(usersTable.createdAt, since));

  // Active = signed up or used a feature in the window
  const [activeRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(gte(usersTable.updatedAt, since));

  const [proRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(
      sql`subscription_status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now())`,
    );

  const [recruiterRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`recruiter_subscription_status IS NOT NULL`);

  return {
    totalUsers: Number(totals?.total ?? 0),
    newUsers: Number(newUsersRow?.cnt ?? 0),
    activeUsers: Number(activeRow?.cnt ?? 0),
    proUsers: Number(proRow?.cnt ?? 0),
    recruiterUsers: Number(recruiterRow?.cnt ?? 0),
  };
}

// ─── getSubscriptionStats ─────────────────────────────────────────────────────

export async function getSubscriptionStats() {
  const [active] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`subscription_status IN ('active','trialing')`);

  const [recruiterActive] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`recruiter_subscription_status IS NOT NULL`);

  return {
    activeSubscriptions: Number(active?.cnt ?? 0) + Number(recruiterActive?.cnt ?? 0),
    proSubscriptions: Number(active?.cnt ?? 0),
    recruiterSubscriptions: Number(recruiterActive?.cnt ?? 0),
  };
}

// ─── getCreditsStats ──────────────────────────────────────────────────────────

export async function getCreditsStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [periodRow] = await db
    .select({ total: sum(sql<number>`ABS(credits_delta)`) })
    .from(usageEventsTable)
    .where(
      and(
        gte(usageEventsTable.createdAt, since),
        sql`credits_delta < 0`,
      ),
    );

  const [allTimeRow] = await db
    .select({ total: sum(sql<number>`ABS(credits_delta)`) })
    .from(usageEventsTable)
    .where(sql`credits_delta < 0`);

  return {
    creditsUsedLast30d: Number(periodRow?.total ?? 0),
    creditsUsedAllTime: Number(allTimeRow?.total ?? 0),
  };
}

// ─── getFeatureUsageBreakdown ─────────────────────────────────────────────────

export async function getFeatureUsageBreakdown(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      featureKey: featureUsageEventsTable.featureKey,
      events: count(),
      creditsSpent: sum(featureUsageEventsTable.creditsUsed),
      estimatedCost: sum(featureUsageEventsTable.estimatedAiCost),
    })
    .from(featureUsageEventsTable)
    .where(gte(featureUsageEventsTable.createdAt, since))
    .groupBy(featureUsageEventsTable.featureKey)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    featureKey: r.featureKey,
    events: Number(r.events),
    creditsSpent: Number(r.creditsSpent ?? 0),
    estimatedCost: Number(r.estimatedCost ?? 0),
  }));
}

// ─── getWorkspaceStats ────────────────────────────────────────────────────────

export async function getWorkspaceStats() {
  const [total] = await db.select({ cnt: count() }).from(workspacesTable);

  const [membersTotal] = await db
    .select({ cnt: count() })
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.status, "active"));

  return {
    totalWorkspaces: Number(total?.cnt ?? 0),
    totalWorkspaceMembers: Number(membersTotal?.cnt ?? 0),
  };
}

// ─── getRecentFeatureUsageEvents ─────────────────────────────────────────────

export async function getRecentFeatureUsageEvents(limit = 50) {
  return db
    .select()
    .from(featureUsageEventsTable)
    .orderBy(desc(featureUsageEventsTable.createdAt))
    .limit(limit);
}

// ─── estimateMrr ─────────────────────────────────────────────────────────────
// Simple MRR estimate from active subscriptions — exact pricing from plans table.

export async function estimateMrr(): Promise<number> {
  const [proRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`subscription_status IN ('active','trialing')`);

  const [recruiterRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`recruiter_subscription_status IS NOT NULL AND recruiter_team_id IS NULL`);

  const [teamOwnerRow] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(sql`recruiter_subscription_status IS NOT NULL AND recruiter_team_id IS NULL`);

  const proMrr = Number(proRow?.cnt ?? 0) * 14.99;
  const recruiterSoloMrr = Number(recruiterRow?.cnt ?? 0) * 29.99;

  return Math.round((proMrr + recruiterSoloMrr) * 100) / 100;
}

// ─── snapshotTodayMetrics ─────────────────────────────────────────────────────
// Compute and upsert today's admin_metrics_daily row.

export async function snapshotTodayMetrics() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [userStats, subStats, creditStats, wsStats, mrr] = await Promise.all([
    getUserStats(1),
    getSubscriptionStats(),
    getCreditsStats(1),
    getWorkspaceStats(),
    estimateMrr(),
  ]);

  await db
    .insert(adminMetricsDailyTable)
    .values({
      metricDate: today,
      totalUsers: userStats.totalUsers,
      newUsers: userStats.newUsers,
      activeUsers: userStats.activeUsers,
      totalWorkspaces: wsStats.totalWorkspaces,
      totalSubscriptions: subStats.activeSubscriptions,
      activeSubscriptions: subStats.activeSubscriptions,
      totalCreditsUsed: creditStats.creditsUsedLast30d,
      totalRevenueMrr: String(mrr),
    })
    .onConflictDoUpdate({
      target: adminMetricsDailyTable.metricDate,
      set: {
        totalUsers: userStats.totalUsers,
        newUsers: userStats.newUsers,
        activeUsers: userStats.activeUsers,
        totalWorkspaces: wsStats.totalWorkspaces,
        totalSubscriptions: subStats.activeSubscriptions,
        activeSubscriptions: subStats.activeSubscriptions,
        totalCreditsUsed: creditStats.creditsUsedLast30d,
        totalRevenueMrr: String(mrr),
        updatedAt: new Date(),
      },
    });

  return { today, userStats, subStats, creditStats, wsStats, mrr };
}
