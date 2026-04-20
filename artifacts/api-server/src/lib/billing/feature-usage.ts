/**
 * logFeatureUsage — write a feature_usage_events row for any significant product action.
 * Call this from any route after successfully completing the action.
 */

import { db, featureUsageEventsTable } from "@workspace/db";
import { logger } from "../logger.js";

export interface FeatureUsageInput {
  userId: string | null;
  workspaceId?: string | null;
  featureKey: string;
  referenceType?: string;
  referenceId?: string;
  creditsUsed?: number;
  estimatedAiCost?: number;
  metadata?: Record<string, unknown>;
}

// Estimated cost per 1k tokens in USD (rough Claude Haiku baseline)
const COST_PER_1K_TOKENS_USD = 0.00025;

export function estimateAiCostUsd(inputTokens: number, outputTokens: number): number {
  return parseFloat((((inputTokens + outputTokens) / 1000) * COST_PER_1K_TOKENS_USD).toFixed(6));
}

export async function logFeatureUsage(input: FeatureUsageInput): Promise<void> {
  try {
    await db.insert(featureUsageEventsTable).values({
      userId: input.userId ?? null,
      workspaceId: input.workspaceId ?? null,
      featureKey: input.featureKey,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      creditsUsed: input.creditsUsed ?? 0,
      estimatedAiCost: String(input.estimatedAiCost ?? 0),
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    // Non-fatal — never block the main flow for a logging failure
    logger.warn({ err, featureKey: input.featureKey }, "Failed to write feature_usage_event");
  }
}
