import { and, eq } from "drizzle-orm";
import {
  db,
  applicationTimelineEventsTable,
  trackedApplicationsTable,
} from "@workspace/db";
import type { ApplicationStage } from "./tracker-schemas.js";

// ─── buildApplicationTitle ────────────────────────────────────────────────────

export function buildApplicationTitle(roleTitle: string, company: string | null | undefined): string {
  return company ? `${roleTitle} at ${company}` : roleTitle;
}

// ─── shouldSetAppliedAt ───────────────────────────────────────────────────────

export function shouldSetAppliedAt(stage: ApplicationStage): boolean {
  return stage === "applied";
}

// ─── normalizeApplicationStage ────────────────────────────────────────────────

const VALID_STAGES = new Set<ApplicationStage>([
  "saved", "preparing", "applied", "screening",
  "interview", "final_round", "offer", "rejected", "withdrawn",
]);

export function normalizeApplicationStage(raw: string): ApplicationStage {
  if (VALID_STAGES.has(raw as ApplicationStage)) return raw as ApplicationStage;
  return "saved";
}

// ─── createTimelineEvent ─────────────────────────────────────────────────────

export async function createTimelineEvent(opts: {
  applicationId: string;
  userId: string;
  eventType: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { applicationId, userId, eventType, title, description, metadata } = opts;
  await db.insert(applicationTimelineEventsTable).values({
    applicationId,
    userId,
    eventType,
    title,
    description: description ?? null,
    metadata: metadata ?? {},
  });
}

// ─── buildJobSnapshot ────────────────────────────────────────────────────────

export function buildJobSnapshot(fields: {
  title: string;
  company?: string | null;
  location?: string | null;
  employmentType?: string | null;
  remoteType?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  currency?: string | null;
  applyUrl?: string | null;
  description?: string | null;
}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v != null && v !== ""),
  );
}

// ─── assertAppOwnership ──────────────────────────────────────────────────────

export async function assertAppOwnership(appId: string, userId: string) {
  const [app] = await db
    .select()
    .from(trackedApplicationsTable)
    .where(and(eq(trackedApplicationsTable.id, appId), eq(trackedApplicationsTable.userId, userId)))
    .limit(1);
  if (!app) throw { status: 404, message: "Application not found" };
  return app;
}
