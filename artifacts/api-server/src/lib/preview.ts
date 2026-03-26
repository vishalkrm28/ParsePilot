/**
 * Server-side helpers for building free-tier preview content.
 *
 * Free users see a limited preview of their tailored CV — enough to
 * demonstrate value without exposing the full export-ready content.
 * The full tailored CV is ALWAYS stored in the DB (needed for Pro
 * features after upgrade) but stripped from API responses for free users.
 */

export interface CvFreePreview {
  /** First ~220 chars of the professional summary, truncated. */
  summaryPreview: string;
  /** The first real bullet point from the work experience section. */
  firstBullet: string;
  /** Number of additional locked sections (besides summary). */
  lockedSectionsCount: number;
}

const FREE_SUMMARY_CHARS = 220;

// Matches all-caps section headers (e.g. "WORK EXPERIENCE", "SKILLS")
const SECTION_HEADER_RE = /^[A-Z][A-Z\s&\/]{3,}$/;

// Matches bullet lines starting with common bullet characters
const BULLET_RE = /^[•\-\*–]\s+(.+)$/;

/**
 * Extracts a safe preview from a fully generated tailored CV.
 * Called server-side only — never on the client.
 */
export function buildCvPreview(tailoredCvText: string): CvFreePreview {
  const lines = tailoredCvText.split("\n");

  // ── Collect all section headers ─────────────────────────────────────────
  const sectionHeaders: string[] = [];
  const sectionIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.length >= 4 && SECTION_HEADER_RE.test(t)) {
      sectionHeaders.push(t);
      sectionIndices.push(i);
    }
  }

  // ── Extract professional summary ─────────────────────────────────────────
  let summaryText = "";
  const summaryIdx = sectionIndices.findIndex((_, i) =>
    /PROFESSIONAL SUMMARY/i.test(sectionHeaders[i]),
  );

  if (summaryIdx >= 0) {
    const contentStart = sectionIndices[summaryIdx] + 1;
    const contentEnd =
      summaryIdx + 1 < sectionIndices.length
        ? sectionIndices[summaryIdx + 1]
        : lines.length;

    const summaryLines: string[] = [];
    for (let i = contentStart; i < contentEnd; i++) {
      const t = lines[i].trim();
      if (t) summaryLines.push(t);
    }
    summaryText = summaryLines.join(" ");
  } else {
    // Fallback: first long paragraph
    const firstPara = lines.find((l) => l.trim().length > 60);
    summaryText = firstPara?.trim() ?? "";
  }

  const summaryPreview =
    summaryText.length > FREE_SUMMARY_CHARS
      ? summaryText.slice(0, FREE_SUMMARY_CHARS).trimEnd() + "…"
      : summaryText;

  // ── Extract first bullet ─────────────────────────────────────────────────
  let firstBullet = "";
  for (const line of lines) {
    const match = line.trim().match(BULLET_RE);
    if (match && match[1].length > 15) {
      firstBullet = match[1].trim();
      break;
    }
  }

  // ── Count locked sections ─────────────────────────────────────────────────
  // Everything after PROFESSIONAL SUMMARY is locked for free users.
  const lockedSectionsCount =
    summaryIdx >= 0
      ? sectionHeaders.length - summaryIdx - 1
      : Math.max(0, sectionHeaders.length - 1);

  return { summaryPreview, firstBullet, lockedSectionsCount };
}

/**
 * Applies the free-tier content filter to a full application DB row.
 * Strips premium fields and attaches a preview object.
 *
 * IMPORTANT: This is the single authoritative place where premium data
 * is withheld. Do not add secondary checks elsewhere — keep it here.
 */
export function applyFreeFilter<T extends {
  tailoredCvText?: string | null;
  coverLetterText?: string | null;
}>(
  row: T,
): T & { freePreview: CvFreePreview | null } {
  const preview =
    row.tailoredCvText ? buildCvPreview(row.tailoredCvText) : null;

  return {
    ...row,
    tailoredCvText: null,       // stripped — never send to free users
    coverLetterText: null,      // stripped — cover letter is Pro only anyway
    freePreview: preview,
  };
}

/**
 * Passes through a full row for Pro users with no filtering.
 * freePreview is explicitly null so the frontend can always check it.
 */
export function applyProPass<T extends object>(
  row: T,
): T & { freePreview: null; isUnlockedResult: false } {
  return { ...row, freePreview: null, isUnlockedResult: false as const };
}

/**
 * Passes through a full row for users who purchased a one-time unlock for
 * this specific result. Equivalent to Pro access for this single application.
 * Sets isUnlockedResult: true so the frontend can show unlock-specific UI.
 */
export function applyUnlockPass<T extends object>(
  row: T,
): T & { freePreview: null; isUnlockedResult: true } {
  return { ...row, freePreview: null, isUnlockedResult: true as const };
}
