/**
 * Marketing routes — lead capture, waitlist, funnel tracking, SEO pages.
 * All public (no auth required) except the admin endpoint.
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, eq, count, sql } from "drizzle-orm";
import {
  db,
  marketingLeadsTable,
  waitlistSignupsTable,
  funnelEventsTable,
  seoPagesTable,
} from "@workspace/db";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const LeadType = z.enum(["candidate", "recruiter", "institution", "partner", "general"]);
const UserType = z.enum(["candidate", "recruiter", "institution"]);
const InquiryType = z.enum(["demo", "sales", "support", "partnership", "general"]);

const LeadCaptureBody = z.object({
  email: z.string().email(),
  fullName: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  leadType: LeadType.default("general"),
  source: z.string().max(100).optional(),
  pagePath: z.string().max(300).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const WaitlistBody = z.object({
  email: z.string().email(),
  fullName: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  userType: UserType.default("candidate"),
  interestArea: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  pagePath: z.string().max(300).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

const FunnelEventBody = z.object({
  anonymousId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  eventName: z.string().max(100),
  pagePath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── POST /marketing/lead-capture ─────────────────────────────────────────────

router.post("/marketing/lead-capture", async (req, res) => {
  const parsed = LeadCaptureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }

  try {
    const [lead] = await db.insert(marketingLeadsTable).values({
      email: parsed.data.email,
      fullName: parsed.data.fullName ?? null,
      company: parsed.data.company ?? null,
      role: parsed.data.role ?? null,
      leadType: parsed.data.leadType,
      source: parsed.data.source ?? null,
      pagePath: parsed.data.pagePath ?? null,
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null,
      notes: parsed.data.notes ?? null,
    }).returning({ id: marketingLeadsTable.id });

    logger.info({ email: parsed.data.email, leadType: parsed.data.leadType }, "Marketing lead captured");
    res.status(201).json({ success: true, id: lead.id });
  } catch (err) {
    logger.error({ err }, "Failed to capture marketing lead");
    res.status(500).json({ error: "Could not save lead" });
  }
});

// ─── POST /marketing/waitlist ──────────────────────────────────────────────────

router.post("/marketing/waitlist", async (req, res) => {
  const parsed = WaitlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }

  try {
    await db.insert(waitlistSignupsTable).values({
      email: parsed.data.email,
      fullName: parsed.data.fullName ?? null,
      company: parsed.data.company ?? null,
      userType: parsed.data.userType,
      interestArea: parsed.data.interestArea ?? null,
      source: parsed.data.source ?? null,
      pagePath: parsed.data.pagePath ?? null,
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null,
    });

    logger.info({ email: parsed.data.email, userType: parsed.data.userType }, "Waitlist signup recorded");
    res.status(201).json({ success: true });
  } catch (err: any) {
    // Unique constraint on email — not an error for the user
    if (err?.code === "23505") {
      res.status(200).json({ success: true, alreadyJoined: true });
      return;
    }
    logger.error({ err }, "Failed to record waitlist signup");
    res.status(500).json({ error: "Could not save signup" });
  }
});

// ─── POST /marketing/funnel-event ─────────────────────────────────────────────

router.post("/marketing/funnel-event", async (req, res) => {
  const parsed = FunnelEventBody.safeParse(req.body);
  if (!parsed.success) {
    // Silently drop malformed funnel events — never fail the client
    res.status(204).send();
    return;
  }

  try {
    await db.insert(funnelEventsTable).values({
      anonymousId: parsed.data.anonymousId ?? null,
      userId: parsed.data.userId ?? null,
      eventName: parsed.data.eventName,
      pagePath: parsed.data.pagePath ?? null,
      referrer: parsed.data.referrer ?? null,
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null,
      metadata: (parsed.data.metadata as Record<string, unknown>) ?? {},
    });
  } catch (err) {
    logger.warn({ err }, "Failed to record funnel event (non-fatal)");
  }

  res.status(204).send();
});

// ─── GET /marketing/seo-pages ─────────────────────────────────────────────────

router.get("/marketing/seo-pages", async (_req, res) => {
  try {
    const pages = await db
      .select({
        id: seoPagesTable.id,
        slug: seoPagesTable.slug,
        title: seoPagesTable.title,
        description: seoPagesTable.description,
        pageType: seoPagesTable.pageType,
        isPublished: seoPagesTable.isPublished,
      })
      .from(seoPagesTable)
      .where(eq(seoPagesTable.isPublished, true))
      .orderBy(desc(seoPagesTable.updatedAt));

    res.json({ pages });
  } catch (err) {
    logger.error({ err }, "Failed to list SEO pages");
    res.status(500).json({ error: "Could not list pages" });
  }
});

// ─── GET /marketing/seo-pages/:slug ───────────────────────────────────────────

router.get("/marketing/seo-pages/:slug", async (req, res) => {
  try {
    const [page] = await db
      .select()
      .from(seoPagesTable)
      .where(eq(seoPagesTable.slug, req.params.slug))
      .limit(1);

    if (!page || !page.isPublished) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    res.json({ page });
  } catch (err) {
    logger.error({ err }, "Failed to fetch SEO page");
    res.status(500).json({ error: "Could not fetch page" });
  }
});

// ─── GET /_admin/marketing-stats ──────────────────────────────────────────────

router.get("/_admin/marketing-stats", async (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!token || token !== process.env["ADMIN_SEED_TOKEN"]) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [leadsTotal] = await db.select({ c: count() }).from(marketingLeadsTable);
    const [waitlistTotal] = await db.select({ c: count() }).from(waitlistSignupsTable);
    const [funnelTotal] = await db.select({ c: count() }).from(funnelEventsTable);

    const leadsByType = await db
      .select({ leadType: marketingLeadsTable.leadType, c: count() })
      .from(marketingLeadsTable)
      .groupBy(marketingLeadsTable.leadType)
      .orderBy(desc(count()));

    const waitlistByType = await db
      .select({ userType: waitlistSignupsTable.userType, c: count() })
      .from(waitlistSignupsTable)
      .groupBy(waitlistSignupsTable.userType)
      .orderBy(desc(count()));

    const topEvents = await db
      .select({ eventName: funnelEventsTable.eventName, c: count() })
      .from(funnelEventsTable)
      .groupBy(funnelEventsTable.eventName)
      .orderBy(desc(count()))
      .limit(10);

    const topUtmCampaigns = await db
      .select({ utm: funnelEventsTable.utmCampaign, c: count() })
      .from(funnelEventsTable)
      .where(sql`${funnelEventsTable.utmCampaign} is not null`)
      .groupBy(funnelEventsTable.utmCampaign)
      .orderBy(desc(count()))
      .limit(10);

    const topLeadSources = await db
      .select({ source: marketingLeadsTable.source, c: count() })
      .from(marketingLeadsTable)
      .where(sql`${marketingLeadsTable.source} is not null`)
      .groupBy(marketingLeadsTable.source)
      .orderBy(desc(count()))
      .limit(10);

    const recentLeads = await db
      .select()
      .from(marketingLeadsTable)
      .orderBy(desc(marketingLeadsTable.createdAt))
      .limit(20);

    const recentWaitlist = await db
      .select()
      .from(waitlistSignupsTable)
      .orderBy(desc(waitlistSignupsTable.createdAt))
      .limit(20);

    res.json({
      totals: {
        leads: Number(leadsTotal.c),
        waitlist: Number(waitlistTotal.c),
        funnelEvents: Number(funnelTotal.c),
      },
      leadsByType,
      waitlistByType,
      topEvents,
      topUtmCampaigns,
      topLeadSources,
      recentLeads,
      recentWaitlist,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch marketing stats");
    res.status(500).json({ error: "Could not fetch stats" });
  }
});

export default router;
