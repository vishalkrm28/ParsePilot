import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  emailSyncConnectionsTable,
  emailOutboundRecordsTable,
  applicationEmailDraftsTable,
  trackedApplicationsTable,
} from "@workspace/db";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { logger } from "../lib/logger.js";
import { CreateOutboundEmailBody } from "../lib/notifications/notification-schemas.js";
import {
  buildOutboundEmailPayload,
  providerSupportsDraftSync,
} from "../lib/integrations/email-helpers.js";

const router: IRouter = Router();

function fail(schema: { safeParse: (v: unknown) => { success: boolean; data?: any; error?: unknown } }, body: unknown, res: import("express").Response) {
  const r = schema.safeParse(body);
  if (!r.success) { res.status(400).json({ error: "Invalid request", details: r.error }); return null; }
  return r.data;
}

// ─── GET /api/email-sync/connect-status ──────────────────────────────────────

router.get("/email-sync/connect-status", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Ensure a "connected" row exists for gmail (connected via Replit connectors SDK)
  const [existingGmail] = await db
    .select()
    .from(emailSyncConnectionsTable)
    .where(and(eq(emailSyncConnectionsTable.userId, userId), eq(emailSyncConnectionsTable.provider, "gmail")))
    .limit(1);

  if (!existingGmail) {
    await db.insert(emailSyncConnectionsTable)
      .values({ userId, provider: "gmail", status: "connected", providerEmail: null })
      .onConflictDoNothing();
  } else if (existingGmail.status !== "connected") {
    await db.update(emailSyncConnectionsTable)
      .set({ status: "connected" })
      .where(eq(emailSyncConnectionsTable.id, existingGmail.id));
  }

  res.json({
    connections: {
      gmail: { status: "connected", providerEmail: existingGmail?.providerEmail ?? null },
      outlook: { status: "not_connected", providerEmail: null },
    },
  });
});

// ─── POST /api/email-sync/outbound ───────────────────────────────────────────

router.post("/email-sync/outbound", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(CreateOutboundEmailBody, req.body, res);
  if (!body) return;

  // If applicationId provided, verify ownership
  if (body.applicationId) {
    const [app] = await db
      .select({ id: trackedApplicationsTable.id })
      .from(trackedApplicationsTable)
      .where(and(eq(trackedApplicationsTable.id, body.applicationId), eq(trackedApplicationsTable.userId, userId)))
      .limit(1);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  }

  // Check connection status for provider
  const provider = body.provider ?? "internal";
  let syncStatus = "draft_only";

  if (provider !== "internal" && providerSupportsDraftSync(provider)) {
    const [conn] = await db
      .select()
      .from(emailSyncConnectionsTable)
      .where(and(eq(emailSyncConnectionsTable.userId, userId), eq(emailSyncConnectionsTable.provider, provider)))
      .limit(1);

    if (conn?.status === "connected") {
      syncStatus = "pending";
    }
  }

  const payload = buildOutboundEmailPayload({
    recipientEmail: body.recipientEmail,
    subject: body.subject,
    bodyText: body.bodyText,
    applicationId: body.applicationId,
    emailDraftId: body.emailDraftId,
  });

  const [record] = await db
    .insert(emailOutboundRecordsTable)
    .values({
      userId,
      applicationId: body.applicationId ?? null,
      emailDraftId: body.emailDraftId ?? null,
      provider: provider !== "internal" ? provider : null,
      syncStatus,
      recipientEmail: body.recipientEmail ?? null,
      subject: body.subject,
      bodyText: body.bodyText,
      metadata: payload as Record<string, unknown>,
    })
    .returning();

  const message = syncStatus === "draft_only"
    ? "Outbound record saved. Connect Gmail or Outlook to sync drafts automatically."
    : "Draft sync initiated.";

  res.status(201).json({ record, syncStatus, message });
});

// ─── GET /api/email-sync/outbound ────────────────────────────────────────────

router.get("/email-sync/outbound", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const applicationId = req.query.applicationId as string | undefined;

  const conditions = [eq(emailOutboundRecordsTable.userId, userId)];
  if (applicationId) {
    conditions.push(eq(emailOutboundRecordsTable.applicationId, applicationId));
  }

  const records = await db
    .select()
    .from(emailOutboundRecordsTable)
    .where(and(...conditions))
    .orderBy(desc(emailOutboundRecordsTable.createdAt))
    .limit(50);

  res.json({ records });
});

export default router;
