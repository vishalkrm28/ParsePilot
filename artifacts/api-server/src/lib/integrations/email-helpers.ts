// ─── Email Integration Helpers (sync-ready abstraction layer) ─────────────────
// Full OAuth/Gmail API not implemented in M37 — architecture is provider-ready.

export type EmailProvider = "gmail" | "outlook" | "internal";

export type OutboundEmailPayload = {
  recipientEmail?: string | null;
  subject: string;
  bodyText: string;
  applicationId?: string | null;
  emailDraftId?: string | null;
};

// ─── buildOutboundEmailPayload ────────────────────────────────────────────────

export function buildOutboundEmailPayload(
  input: OutboundEmailPayload,
): Record<string, unknown> {
  return {
    to: input.recipientEmail ?? null,
    subject: input.subject,
    body: input.bodyText,
    resuoneApplicationId: input.applicationId ?? null,
    resuoneEmailDraftId: input.emailDraftId ?? null,
    createdAt: new Date().toISOString(),
  };
}

// ─── normalizeEmailSyncStatus ─────────────────────────────────────────────────

export function normalizeEmailSyncStatus(
  status: string | null | undefined,
): "draft_only" | "synced" | "failed" {
  if (!status) return "draft_only";
  if (status === "draft" || status === "draft_only") return "draft_only";
  if (status === "sent" || status === "synced") return "synced";
  return "failed";
}

// ─── providerSupportsDraftSync ────────────────────────────────────────────────

export function providerSupportsDraftSync(provider: string): boolean {
  return provider === "gmail" || provider === "outlook";
}

// ─── getEmailConnectionStatus (stub — no real OAuth in M37) ──────────────────

export async function getEmailConnectionStatus(
  _userId: string,
  _provider: EmailProvider,
): Promise<{ connected: boolean; providerEmail: string | null }> {
  return { connected: false, providerEmail: null };
}

// ─── createProviderDraft (stub) ────────────────────────────────────────────────

export async function createProviderDraft(
  _provider: EmailProvider,
  _payload: OutboundEmailPayload,
): Promise<{ externalDraftId: string | null; synced: boolean }> {
  return { externalDraftId: null, synced: false };
}
