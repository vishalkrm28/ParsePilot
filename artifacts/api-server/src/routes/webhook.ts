import { Router, type IRouter } from "express";
import express from "express";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getStripe } from "../lib/stripe.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
// Stripe requires the exact raw bytes of the request body to verify the
// HMAC-SHA256 signature. This route uses express.raw() instead of express.json(),
// and MUST be mounted in app.ts BEFORE the global express.json() middleware.

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body as Buffer, sig, secret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ msg }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: `Webhook signature invalid: ${msg}` });
      return;
    }

    logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

    try {
      await handleEvent(event);
    } catch (err) {
      // Return 500 so Stripe retries the delivery
      logger.error({ err, type: event.type }, "Webhook handler threw an error");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }

    // Always acknowledge to Stripe before responding
    res.json({ received: true });
  },
);

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    default:
      // Unhandled event types — ignore but log at debug level
      logger.debug({ type: event.type }, "Unhandled Stripe event type");
  }
}

// ─── checkout.session.completed ───────────────────────────────────────────────
// Fired when the user completes the Stripe Checkout form and payment is confirmed.
// We retrieve the full Subscription object from Stripe so we have accurate
// status, period end, and price info before writing to the DB.

async function onCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription") {
    logger.debug({ session_id: session.id }, "Ignoring non-subscription checkout session");
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    logger.error({ session_id: session.id }, "checkout.session.completed missing subscription ID");
    return;
  }

  // Retrieve the full subscription to get status, period, and price details
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  // Resolve the user — prefer metadata.userId set during checkout creation
  const userId =
    session.metadata?.userId ??
    subscription.metadata?.userId ??
    null;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  const user = await resolveUser({ userId, customerId });
  if (!user) {
    logger.error({ userId, customerId }, "checkout.session.completed: user not found");
    return;
  }

  await applySubscription(user.id, subscription);
  logger.info({ userId: user.id, subscriptionId }, "Pro subscription activated via checkout");
}

// ─── customer.subscription.updated ────────────────────────────────────────────
// Fired on any subscription change: plan switch, renewal, trial end, pause, etc.
// Always overwrite all fields — Stripe is the source of truth.

async function onSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId ?? null;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const user = await resolveUser({ userId, customerId });
  if (!user) {
    logger.error({ userId, customerId }, "customer.subscription.updated: user not found");
    return;
  }

  await applySubscription(user.id, subscription);
  logger.info(
    { userId: user.id, subscriptionId: subscription.id, status: subscription.status },
    "Subscription updated",
  );
}

// ─── customer.subscription.deleted ────────────────────────────────────────────
// Fired when a subscription is fully cancelled (not just paused).
// We keep the IDs in the DB for audit purposes but clear the active status.

async function onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId ?? null;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const user = await resolveUser({ userId, customerId });
  if (!user) {
    logger.error({ userId, customerId }, "customer.subscription.deleted: user not found");
    return;
  }

  await db
    .update(usersTable)
    .set({
      subscriptionStatus: "canceled",
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
    })
    .where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id, subscriptionId: subscription.id }, "Subscription cancelled");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface UserResolutionParams {
  userId: string | null;
  customerId: string | null;
}

/** Find the DB user by userId metadata first, then fall back to stripeCustomerId. */
async function resolveUser(
  params: UserResolutionParams,
): Promise<{ id: string } | null> {
  // Primary: metadata contains the internal userId
  if (params.userId) {
    const [row] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, params.userId))
      .limit(1);
    if (row) return row;
  }

  // Fallback: look up by Stripe customer ID
  if (params.customerId) {
    const [row] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.stripeCustomerId, params.customerId))
      .limit(1);
    if (row) return row;
  }

  return null;
}

/** Write all subscription fields to the DB from a Stripe Subscription object. */
async function applySubscription(
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  // First price item is the plan price
  const priceId = subscription.items.data[0]?.price?.id ?? null;

  await db
    .update(usersTable)
    .set({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPriceId: priceId,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
    })
    .where(eq(usersTable.id, userId));
}

export default router;
