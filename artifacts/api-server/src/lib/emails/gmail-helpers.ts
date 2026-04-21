// ─── Gmail Draft Helper ───────────────────────────────────────────────────────
// Uses @replit/connectors-sdk to push drafts to Gmail via the proxy pattern.
// OAuth tokens are managed automatically by the SDK.

import { ReplitConnectors } from "@replit/connectors-sdk";

function buildRfc2822(subject: string, body: string): string {
  const lines = [
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Subject: ${subject}`,
    ``,
    body,
  ];
  return lines.join("\r\n");
}

function toBase64Url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function pushDraftToGmail(
  subject: string,
  bodyText: string,
): Promise<{ gmailDraftId: string | null; success: boolean; error?: string }> {
  try {
    const connectors = new ReplitConnectors();
    const raw = toBase64Url(buildRfc2822(subject, bodyText));

    const response = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { raw } }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return { gmailDraftId: null, success: false, error: text };
    }

    const data = await response.json() as { id?: string };
    return { gmailDraftId: data.id ?? null, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { gmailDraftId: null, success: false, error: message };
  }
}
