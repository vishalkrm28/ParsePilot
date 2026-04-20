import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  smartActionSuggestionsTable,
  trackedApplicationsTable,
  applicationRemindersTable,
  applicationInterviewsTable,
  applicationEmailDraftsTable,
  interviewPrepsTable,
  notificationItemsTable,
  notificationPreferencesTable,
} from "@workspace/db";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { logger } from "../lib/logger.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { AI_MODELS } from "../services/ai.js";
import {
  GenerateSmartActionsBody,
  AcceptSmartActionBody,
  DismissSmartActionBody,
  SuggestionTypeEnum,
} from "../lib/notifications/notification-schemas.js";
import { buildSmartActionSuggestionPrompt } from "../lib/notifications/notification-prompts.js";
import {
  reminderTypeFromSuggestion,
  suggestedAtFromPayload,
} from "../lib/notifications/smart-actions.js";

const router: IRouter = Router();

function fail(schema: { safeParse: (v: unknown) => { success: boolean; data?: any; error?: unknown } }, body: unknown, res: import("express").Response) {
  const r = schema.safeParse(body);
  if (!r.success) { res.status(400).json({ error: "Invalid request", details: r.error }); return null; }
  return r.data;
}

// ─── POST /api/smart-actions/generate ────────────────────────────────────────

router.post("/smart-actions/generate", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(GenerateSmartActionsBody, req.body, res);
  if (!body) return;

  const [app] = await db
    .select()
    .from(trackedApplicationsTable)
    .where(and(eq(trackedApplicationsTable.id, body.applicationId), eq(trackedApplicationsTable.userId, userId)))
    .limit(1);
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  // Rate-limit: max one generation per 6 hours per application
  const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000);
  const recent = await db
    .select({ id: smartActionSuggestionsTable.id })
    .from(smartActionSuggestionsTable)
    .where(
      and(
        eq(smartActionSuggestionsTable.userId, userId),
        eq(smartActionSuggestionsTable.applicationId, body.applicationId),
      ),
    )
    .orderBy(desc(smartActionSuggestionsTable.createdAt))
    .limit(1);

  if (recent.length > 0) {
    const [latestRow] = await db
      .select({ createdAt: smartActionSuggestionsTable.createdAt })
      .from(smartActionSuggestionsTable)
      .where(eq(smartActionSuggestionsTable.id, recent[0].id))
      .limit(1);
    if (latestRow && new Date(latestRow.createdAt) > sixHoursAgo) {
      const existing = await db
        .select()
        .from(smartActionSuggestionsTable)
        .where(
          and(
            eq(smartActionSuggestionsTable.userId, userId),
            eq(smartActionSuggestionsTable.applicationId, body.applicationId),
            eq(smartActionSuggestionsTable.status, "pending"),
          ),
        )
        .orderBy(desc(smartActionSuggestionsTable.createdAt));
      res.json({ suggestions: existing, cached: true });
      return;
    }
  }

  // Gather context
  const [interviews, reminders, drafts, preps] = await Promise.all([
    db.select().from(applicationInterviewsTable)
      .where(and(eq(applicationInterviewsTable.applicationId, body.applicationId), eq(applicationInterviewsTable.userId, userId))),
    db.select().from(applicationRemindersTable)
      .where(and(eq(applicationRemindersTable.applicationId, body.applicationId), eq(applicationRemindersTable.userId, userId))),
    db.select().from(applicationEmailDraftsTable)
      .where(and(eq(applicationEmailDraftsTable.applicationId, body.applicationId), eq(applicationEmailDraftsTable.userId, userId))),
    db.select().from(interviewPrepsTable)
      .where(and(eq(interviewPrepsTable.applicationId, body.applicationId), eq(interviewPrepsTable.userId, userId)))
      .orderBy(desc(interviewPrepsTable.createdAt)).limit(1),
  ]);

  const prompt = buildSmartActionSuggestionPrompt({
    application: app,
    stage: app.stage,
    appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
    interviews,
    reminders,
    existingDrafts: drafts,
    latestInterviewPrep: preps[0] ?? null,
  });

  let aiOutput: { suggestions: Array<{ suggestion_type: string; title: string; description: string; suggested_at: string; payload: Record<string, unknown> }> };

  try {
    const response = await openai.responses.create({
      model: AI_MODELS.FAST,
      instructions: prompt,
      input: [{ role: "user", content: "Generate smart action suggestions for this application now." }],
      text: { format: { type: "json_object" } },
      max_output_tokens: 1024,
    });
    aiOutput = JSON.parse(response.output_text ?? "{}");
    if (!Array.isArray(aiOutput?.suggestions)) aiOutput = { suggestions: [] };
  } catch (err) {
    logger.error({ err }, "Smart actions AI generation failed");
    res.status(502).json({ error: "AI generation failed. Try again." });
    return;
  }

  const inserted = [];
  for (const s of aiOutput.suggestions) {
    if (!SuggestionTypeEnum.safeParse(s.suggestion_type).success) continue;
    const [row] = await db
      .insert(smartActionSuggestionsTable)
      .values({
        userId,
        applicationId: body.applicationId,
        suggestionType: s.suggestion_type,
        title: s.title ?? "Smart suggestion",
        description: s.description ?? null,
        suggestedAt: new Date(s.suggested_at ?? Date.now()),
        status: "pending",
        payload: (s.payload ?? {}) as Record<string, unknown>,
      })
      .returning();
    if (row) inserted.push(row);
  }

  res.status(201).json({ suggestions: inserted });
});

// ─── GET /api/smart-actions ───────────────────────────────────────────────────

router.get("/smart-actions", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const applicationId = req.query.applicationId as string | undefined;
  const status = (req.query.status as string) ?? "pending";

  const conditions = [
    eq(smartActionSuggestionsTable.userId, userId),
    eq(smartActionSuggestionsTable.status, status),
  ];
  if (applicationId) {
    conditions.push(eq(smartActionSuggestionsTable.applicationId, applicationId));
  }

  const suggestions = await db
    .select()
    .from(smartActionSuggestionsTable)
    .where(and(...conditions))
    .orderBy(desc(smartActionSuggestionsTable.createdAt))
    .limit(20);

  res.json({ suggestions });
});

// ─── POST /api/smart-actions/accept ──────────────────────────────────────────

router.post("/smart-actions/accept", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(AcceptSmartActionBody, req.body, res);
  if (!body) return;

  const [suggestion] = await db
    .select()
    .from(smartActionSuggestionsTable)
    .where(and(eq(smartActionSuggestionsTable.id, body.suggestionId), eq(smartActionSuggestionsTable.userId, userId)))
    .limit(1);

  if (!suggestion) { res.status(404).json({ error: "Suggestion not found" }); return; }
  if (suggestion.status !== "pending") { res.status(400).json({ error: "Suggestion already processed" }); return; }

  const payload = (suggestion.payload ?? {}) as Record<string, unknown>;
  const reminderAt = suggestedAtFromPayload(payload);
  const reminderType = reminderTypeFromSuggestion(suggestion.suggestionType);

  let reminder = null;
  let notification = null;

  // For most types: create a reminder
  if (suggestion.suggestionType !== "asset_missing" && suggestion.applicationId) {
    [reminder] = await db
      .insert(applicationRemindersTable)
      .values({
        userId,
        applicationId: suggestion.applicationId,
        reminderType,
        reminderAt,
        reminderNote: suggestion.title,
        isCompleted: false,
      })
      .returning();

    // Also create a notification item
    [notification] = await db
      .insert(notificationItemsTable)
      .values({
        userId,
        applicationId: suggestion.applicationId,
        reminderId: reminder?.id ?? null,
        type: "reminder_due",
        title: suggestion.title,
        body: suggestion.description ?? null,
        actionLabel: "View application",
        actionUrl: `/tracker/${suggestion.applicationId}`,
        priority: "medium",
        dueAt: reminderAt,
      })
      .returning();
  } else if (suggestion.suggestionType === "asset_missing" && suggestion.applicationId) {
    // asset_missing: notification only
    [notification] = await db
      .insert(notificationItemsTable)
      .values({
        userId,
        applicationId: suggestion.applicationId,
        type: "draft_ready",
        title: suggestion.title,
        body: suggestion.description ?? null,
        actionLabel: "View application",
        actionUrl: `/tracker/${suggestion.applicationId}`,
        priority: "medium",
      })
      .returning();
  }

  // Mark suggestion as accepted
  const [updated] = await db
    .update(smartActionSuggestionsTable)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(smartActionSuggestionsTable.id, body.suggestionId))
    .returning();

  res.json({ suggestion: updated, reminder, notification });
});

// ─── POST /api/smart-actions/dismiss ─────────────────────────────────────────

router.post("/smart-actions/dismiss", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = fail(DismissSmartActionBody, req.body, res);
  if (!body) return;

  const [suggestion] = await db
    .select({ id: smartActionSuggestionsTable.id, userId: smartActionSuggestionsTable.userId })
    .from(smartActionSuggestionsTable)
    .where(and(eq(smartActionSuggestionsTable.id, body.suggestionId), eq(smartActionSuggestionsTable.userId, userId)))
    .limit(1);

  if (!suggestion) { res.status(404).json({ error: "Suggestion not found" }); return; }

  const [updated] = await db
    .update(smartActionSuggestionsTable)
    .set({ status: "dismissed", updatedAt: new Date() })
    .where(eq(smartActionSuggestionsTable.id, body.suggestionId))
    .returning();

  res.json({ suggestion: updated });
});

export default router;
