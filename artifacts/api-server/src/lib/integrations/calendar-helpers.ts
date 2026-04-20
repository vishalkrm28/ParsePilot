// ─── Calendar Integration Helpers (sync-ready abstraction layer) ──────────────
// Full OAuth not implemented in M37 — architecture is provider-ready.

export type CalendarProvider = "google" | "outlook" | "internal";

export type CalendarEventPayload = {
  title: string;
  scheduledAt: string;
  timezone: string;
  location?: string | null;
  meetingUrl?: string | null;
  notes?: string | null;
  interviewId: string;
  applicationId?: string | null;
};

// ─── buildCalendarEventPayload ────────────────────────────────────────────────

export function buildCalendarEventPayload(input: CalendarEventPayload): Record<string, unknown> {
  return {
    summary: input.title,
    start: { dateTime: input.scheduledAt, timeZone: input.timezone },
    end: {
      dateTime: new Date(new Date(input.scheduledAt).getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: input.timezone,
    },
    location: input.location ?? undefined,
    description: [
      input.notes ?? "",
      input.meetingUrl ? `Meeting link: ${input.meetingUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    extendedProperties: {
      private: {
        resuoneInterviewId: input.interviewId,
        resuoneApplicationId: input.applicationId ?? "",
      },
    },
  };
}

// ─── normalizeCalendarStatus ──────────────────────────────────────────────────

export function normalizeCalendarStatus(
  providerStatus: string | null | undefined,
): "pending" | "synced" | "failed" {
  if (!providerStatus) return "pending";
  if (providerStatus === "confirmed" || providerStatus === "accepted") return "synced";
  if (providerStatus === "cancelled" || providerStatus === "error") return "failed";
  return "pending";
}

// ─── providerSupportsCalendarSync ─────────────────────────────────────────────

export function providerSupportsCalendarSync(provider: string): boolean {
  return provider === "google" || provider === "outlook";
}

// ─── getCalendarConnectionStatus (stub — no real OAuth in M37) ───────────────

export async function getCalendarConnectionStatus(
  _userId: string,
  _provider: CalendarProvider,
): Promise<{ connected: boolean; providerEmail: string | null }> {
  return { connected: false, providerEmail: null };
}

// ─── createCalendarEvent (stub — returns sync-ready response) ─────────────────

export async function createCalendarEvent(
  _provider: CalendarProvider,
  _payload: CalendarEventPayload,
): Promise<{ externalEventId: string | null; synced: boolean }> {
  return { externalEventId: null, synced: false };
}
