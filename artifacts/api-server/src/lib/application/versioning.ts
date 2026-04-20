// ─── Versioning Helpers ───────────────────────────────────────────────────────
// Utilities for naming and duplicating tailored CV / cover letter versions.

/** Generate a default version name for a tailored CV. */
export function buildDefaultTailoredCvVersionName(opts: {
  versionNumber: number;
  jobTitle?: string | null;
  company?: string | null;
}): string {
  const { versionNumber, jobTitle, company } = opts;

  if (jobTitle && company) {
    return `Tailored for ${jobTitle} @ ${company}`;
  }
  if (jobTitle) {
    return `Tailored for ${jobTitle}`;
  }
  return `Tailored CV v${versionNumber}`;
}

/** Generate a default version name for a cover letter. */
export function buildDefaultCoverLetterVersionName(opts: {
  versionNumber: number;
  jobTitle?: string | null;
  company?: string | null;
}): string {
  const { versionNumber, jobTitle, company } = opts;

  if (company) {
    return `Cover Letter for ${company}`;
  }
  if (jobTitle) {
    return `Cover Letter for ${jobTitle}`;
  }
  return `Cover Letter v${versionNumber}`;
}

/** Sort an array of versioned items newest-first by createdAt. */
export function sortNewestFirst<T extends { createdAt: Date | string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
