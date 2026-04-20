import type { TailoredCvJson } from "../ai/tailoring-schemas.js";

// ─── Export Helpers ───────────────────────────────────────────────────────────
// Converts structured tailored CV and cover letter data into portable formats.
// Architecture deliberately keeps PDF/DOCX generation out of scope for now —
// the helpers below return plain text + JSON, which is sufficient for copy/export.
// DOCX/PDF can be layered on later by calling tailoredCvJsonToText() and piping
// into a docx or puppeteer/playwright renderer.

/** Convert a TailoredCvJson object to a clean plain-text string. */
export function tailoredCvJsonToText(cv: TailoredCvJson): string {
  const lines: string[] = [];

  // Header
  if (cv.full_name) lines.push(cv.full_name.toUpperCase());
  if (cv.headline) lines.push(cv.headline);

  const contact = [cv.email, cv.phone, cv.location, cv.linkedin, cv.portfolio]
    .filter(Boolean)
    .join("  |  ");
  if (contact) lines.push(contact);
  lines.push("");

  // Professional Summary
  if (cv.professional_summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("─".repeat(40));
    lines.push(cv.professional_summary);
    lines.push("");
  }

  // Core Skills
  if (cv.core_skills.length > 0) {
    lines.push("CORE SKILLS");
    lines.push("─".repeat(40));
    lines.push(cv.core_skills.join("  ·  "));
    lines.push("");
  }

  // Experience
  if (cv.tailored_experience.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    lines.push("─".repeat(40));
    for (const role of cv.tailored_experience) {
      const dateRange = [role.start_date, role.end_date ?? "Present"]
        .filter(Boolean)
        .join(" – ");
      lines.push(`${role.title}  |  ${role.company}  |  ${dateRange}`);
      for (const bullet of role.bullets) {
        lines.push(`  • ${bullet}`);
      }
      lines.push("");
    }
  }

  // Education
  if (cv.education.length > 0) {
    lines.push("EDUCATION");
    lines.push("─".repeat(40));
    for (const edu of cv.education) {
      lines.push(`${edu.degree}  |  ${edu.institution}  |  ${edu.year}`);
    }
    lines.push("");
  }

  // Certifications
  if (cv.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("─".repeat(40));
    for (const cert of cv.certifications) {
      lines.push(`  • ${cert}`);
    }
    lines.push("");
  }

  // Projects
  if (cv.projects.length > 0) {
    lines.push("PROJECTS");
    lines.push("─".repeat(40));
    for (const project of cv.projects) {
      lines.push(`  • ${project}`);
    }
    lines.push("");
  }

  // ATS Keywords
  if (cv.ats_keywords_added.length > 0) {
    lines.push("ATS KEYWORDS EMPHASISED");
    lines.push("─".repeat(40));
    lines.push(cv.ats_keywords_added.join(", "));
    lines.push("");
  }

  return lines.join("\n").trim();
}

/** Return cover letter text as-is (already plain text). */
export function coverLetterToText(coverLetterText: string): string {
  return coverLetterText.trim();
}

/** Build a combined export payload for a tailored CV + cover letter pair. */
export function buildCombinedExportPayload(opts: {
  tailoredCvJson: TailoredCvJson | null;
  coverLetterText: string | null;
}): {
  tailored_cv_text: string | null;
  cover_letter_text: string | null;
  tailored_cv_json: TailoredCvJson | null;
} {
  return {
    tailored_cv_text: opts.tailoredCvJson ? tailoredCvJsonToText(opts.tailoredCvJson) : null,
    cover_letter_text: opts.coverLetterText ? coverLetterToText(opts.coverLetterText) : null,
    tailored_cv_json: opts.tailoredCvJson,
  };
}
