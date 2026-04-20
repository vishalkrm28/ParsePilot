import { z } from "zod";

// ─── Tailored CV JSON Schema ──────────────────────────────────────────────────
// Validated output shape for AI-tailored CV generation.
// Mirrors the ParsedCv shape but with tailoring-specific additions.

export const TailoredExperienceSchema = z.object({
  title: z.string().catch(""),
  company: z.string().catch(""),
  start_date: z.string().catch(""),
  end_date: z.string().nullable().catch(null),
  bullets: z.array(z.string()).catch([]),
});

export const TailoredEducationSchema = z.object({
  degree: z.string().catch(""),
  institution: z.string().catch(""),
  year: z.string().catch(""),
});

export const TailoredCvNotesSchema = z.object({
  tailoring_strategy: z.string().catch(""),
  risk_flags: z.array(z.string()).catch([]),
});

export const TailoredCvJsonSchema = z.object({
  full_name: z.string().catch(""),
  headline: z.string().catch(""),
  location: z.string().catch(""),
  email: z.string().catch(""),
  phone: z.string().catch(""),
  linkedin: z.string().catch(""),
  portfolio: z.string().catch(""),
  professional_summary: z.string().catch(""),
  core_skills: z.array(z.string()).catch([]),
  ats_keywords_added: z.array(z.string()).catch([]),
  tailored_experience: z.array(TailoredExperienceSchema).catch([]),
  education: z.array(TailoredEducationSchema).catch([]),
  certifications: z.array(z.string()).catch([]),
  projects: z.array(z.string()).catch([]),
  tailoring_summary: z.string().catch(""),
  notes: TailoredCvNotesSchema.catch({ tailoring_strategy: "", risk_flags: [] }),
});

export type TailoredCvJson = z.infer<typeof TailoredCvJsonSchema>;

// ─── ATS Improvements Schema ──────────────────────────────────────────────────

export const AtsImprovementsSchema = z.object({
  missing_keywords: z.array(z.string()).catch([]),
  summary_suggestions: z.array(z.string()).catch([]),
  bullet_improvements: z.array(
    z.object({
      original: z.string().catch(""),
      improved: z.string().catch(""),
    }),
  ).catch([]),
  format_notes: z.array(z.string()).catch([]),
});

export type AtsImprovements = z.infer<typeof AtsImprovementsSchema>;
