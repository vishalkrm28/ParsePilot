import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let _stripe: Stripe | null = null;

/**
 * Returns the Stripe client, initialised lazily so the server can boot
 * without STRIPE_SECRET_KEY set (e.g. when billing routes are not enabled).
 * Throws only at the point where a billing operation is actually attempted.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
        "Add it to your environment secrets before using billing features.",
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: "2025-03-31.basil",
    typescript: true,
  });

  return _stripe;
}

/**
 * Returns a valid Stripe customer ID for the user.
 * - If no customer ID is stored, creates one and persists it.
 * - If the stored ID no longer exists in Stripe (e.g. after switching Stripe
 *   accounts), clears the stale ID, creates a fresh customer, and persists it.
 */
export async function ensureStripeCustomer(
  userId: string,
  email: string | null,
): Promise<string> {
  const stripe = getStripe();

  const [dbUser] = await db
    .select({ stripeCustomerId: usersTable.stripeCustomerId })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  let customerId = dbUser?.stripeCustomerId ?? null;

  if (customerId) {
    try {
      const existing = await stripe.customers.retrieve(customerId);
      if ((existing as Stripe.DeletedCustomer).deleted) {
        customerId = null;
      }
    } catch (err) {
      const stripeErr = err as Stripe.StripeRawError;
      if (stripeErr.code === "resource_missing") {
        customerId = null;
      } else {
        throw err;
      }
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db
      .update(usersTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(usersTable.id, userId));
  }

  return customerId;
}
