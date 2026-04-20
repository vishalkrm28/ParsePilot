import { Router, type IRouter } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import {
  db,
  notificationPreferencesTable,
  notificationItemsTable,
} from "@workspace/db";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { logger } from "../lib/logger.js";
import {
  UpdateNotificationPreferencesBody,
  CreateNotificationItemBody,
  UpdateNotificationStatusBody,
  SnoozeNotificationBody,
  ListNotificationsQuery,
} from "../lib/notifications/notification-schemas.js";

const router: IRouter = Router();

function fail(schema: { safeParse: (v: unknown) => { success: boolean; data?: any; error?: unknown } }, body: unknown, res: import("express").Response) {
  const r = schema.safeParse(body);
  if (!r.success) { res.status(400).json({ error: "Invalid request", details: r.error }); return null; }
  return r.data;
}

// ─── GET /api/notifications/preferences ──────────────────────────────────────

router.get("/notifications/preferences", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  let [prefs] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, userId))
    .limit(1);

  if (!prefs) {
    [prefs] = await db
      .insert(notificationPreferencesTable)
      .values({ userId })
      .returning();
  }

  res.json({ preferences: prefs });
});

// ─── POST /api/notifications/preferences ─────────────────────────────────────

router.post("/notifications/preferences", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(UpdateNotificationPreferencesBody, req.body, res);
  if (!body) return;

  const existing = await db
    .select({ id: notificationPreferencesTable.id })
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, userId))
    .limit(1);

  let prefs;
  if (existing.length === 0) {
    [prefs] = await db
      .insert(notificationPreferencesTable)
      .values({ userId, ...body, updatedAt: new Date() })
      .returning();
  } else {
    [prefs] = await db
      .update(notificationPreferencesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(notificationPreferencesTable.userId, userId))
      .returning();
  }

  res.json({ preferences: prefs });
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

router.get("/notifications", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = ListNotificationsQuery.safeParse(req.query);
  const { status, limit } = parsed.success ? parsed.data : { status: undefined, limit: 50 };

  const conditions = [eq(notificationItemsTable.userId, userId)];

  const items = await db
    .select()
    .from(notificationItemsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationItemsTable.dueAt), desc(notificationItemsTable.createdAt))
    .limit(limit);

  const filtered = status
    ? items.filter((i) => i.status === status)
    : items;

  res.json({ notifications: filtered, total: filtered.length });
});

// ─── POST /api/notifications ──────────────────────────────────────────────────

router.post("/notifications", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(CreateNotificationItemBody, req.body, res);
  if (!body) return;

  const [item] = await db
    .insert(notificationItemsTable)
    .values({
      userId,
      applicationId: body.applicationId ?? null,
      reminderId: body.reminderId ?? null,
      interviewId: body.interviewId ?? null,
      type: body.type,
      title: body.title,
      body: body.body ?? null,
      actionLabel: body.actionLabel ?? null,
      actionUrl: body.actionUrl ?? null,
      priority: body.priority,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    .returning();

  res.status(201).json({ notification: item });
});

// ─── PATCH /api/notifications/:id/status ─────────────────────────────────────

router.patch("/notifications/:id/status", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(UpdateNotificationStatusBody, req.body, res);
  if (!body) return;

  const [existing] = await db
    .select({ id: notificationItemsTable.id, userId: notificationItemsTable.userId })
    .from(notificationItemsTable)
    .where(and(eq(notificationItemsTable.id, req.params.id), eq(notificationItemsTable.userId, userId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Notification not found" }); return; }

  const [updated] = await db
    .update(notificationItemsTable)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(notificationItemsTable.id, req.params.id))
    .returning();

  res.json({ notification: updated });
});

// ─── PATCH /api/notifications/:id/snooze ─────────────────────────────────────

router.patch("/notifications/:id/snooze", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(SnoozeNotificationBody, req.body, res);
  if (!body) return;

  const [existing] = await db
    .select({ id: notificationItemsTable.id, userId: notificationItemsTable.userId })
    .from(notificationItemsTable)
    .where(and(eq(notificationItemsTable.id, req.params.id), eq(notificationItemsTable.userId, userId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Notification not found" }); return; }

  const [updated] = await db
    .update(notificationItemsTable)
    .set({
      status: "snoozed",
      snoozedUntil: new Date(body.snoozedUntil),
      updatedAt: new Date(),
    })
    .where(eq(notificationItemsTable.id, req.params.id))
    .returning();

  res.json({ notification: updated });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────

router.delete("/notifications/:id", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await db
    .delete(notificationItemsTable)
    .where(and(eq(notificationItemsTable.id, req.params.id), eq(notificationItemsTable.userId, userId)));

  res.json({ ok: true });
});

export default router;
