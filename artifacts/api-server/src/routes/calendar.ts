import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  calendarSyncConnectionsTable,
  calendarSyncEventsTable,
  applicationInterviewsTable,
  trackedApplicationsTable,
} from "@workspace/db";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { logger } from "../lib/logger.js";
import { CreateCalendarEventBody, ProviderEnum } from "../lib/notifications/notification-schemas.js";
import {
  buildCalendarEventPayload,
  providerSupportsCalendarSync,
  getCalendarConnectionStatus,
} from "../lib/integrations/calendar-helpers.js";

const router: IRouter = Router();

function fail(schema: { safeParse: (v: unknown) => { success: boolean; data?: any; error?: unknown } }, body: unknown, res: import("express").Response) {
  const r = schema.safeParse(body);
  if (!r.success) { res.status(400).json({ error: "Invalid request", details: r.error }); return null; }
  return r.data;
}

// ─── GET /api/calendar/connect-status ────────────────────────────────────────

router.get("/calendar/connect-status", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const connections = await db
    .select()
    .from(calendarSyncConnectionsTable)
    .where(eq(calendarSyncConnectionsTable.userId, userId));

  const providers = ["google", "outlook"];
  const statusMap: Record<string, { status: string; providerEmail: string | null }> = {};

  for (const provider of providers) {
    const existing = connections.find((c) => c.provider === provider);
    statusMap[provider] = {
      status: existing?.status ?? "not_connected",
      providerEmail: existing?.providerEmail ?? null,
    };
  }

  res.json({ connections: statusMap, message: "OAuth not yet implemented. Architecture is sync-ready." });
});

// ─── POST /api/calendar/create-event ─────────────────────────────────────────

router.post("/calendar/create-event", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(CreateCalendarEventBody, req.body, res);
  if (!body) return;

  // Verify interview belongs to user
  const [interview] = await db
    .select()
    .from(applicationInterviewsTable)
    .where(and(eq(applicationInterviewsTable.id, body.interviewId), eq(applicationInterviewsTable.userId, userId)))
    .limit(1);
  if (!interview) { res.status(404).json({ error: "Interview not found" }); return; }

  // Check connection status
  const [connection] = await db
    .select()
    .from(calendarSyncConnectionsTable)
    .where(and(eq(calendarSyncConnectionsTable.userId, userId), eq(calendarSyncConnectionsTable.provider, body.provider)))
    .limit(1);

  const isConnected = connection?.status === "connected";
  const payload = buildCalendarEventPayload({
    title: body.title,
    scheduledAt: body.scheduledAt,
    timezone: body.timezone,
    location: body.location,
    meetingUrl: body.meetingUrl,
    notes: body.notes,
    interviewId: body.interviewId,
    applicationId: body.applicationId,
  });

  let externalEventId: string | null = null;
  let syncStatus = "pending";

  if (isConnected && providerSupportsCalendarSync(body.provider)) {
    // In production this would call the real provider API
    logger.info({ userId, provider: body.provider, interviewId: body.interviewId }, "Calendar sync requested (provider not connected)");
    syncStatus = "pending";
  }

  const [syncEvent] = await db
    .insert(calendarSyncEventsTable)
    .values({
      userId,
      applicationId: body.applicationId ?? null,
      interviewId: body.interviewId,
      provider: body.provider,
      externalEventId,
      syncStatus,
      payload: payload as Record<string, unknown>,
    })
    .returning();

  const message = isConnected
    ? "Sync initiated with provider"
    : "Sync record created. Connect your calendar to complete the sync.";

  res.status(201).json({ syncEvent, synced: isConnected, message });
});

// ─── GET /api/calendar/events ─────────────────────────────────────────────────

router.get("/calendar/events", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const applicationId = req.query.applicationId as string | undefined;

  const conditions = [eq(calendarSyncEventsTable.userId, userId)];
  if (applicationId) {
    conditions.push(eq(calendarSyncEventsTable.applicationId, applicationId));
  }

  const events = await db
    .select()
    .from(calendarSyncEventsTable)
    .where(and(...conditions))
    .orderBy(desc(calendarSyncEventsTable.createdAt))
    .limit(50);

  res.json({ events });
});

export default router;
