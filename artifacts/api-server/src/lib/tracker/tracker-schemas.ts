import { z } from "zod";

// ─── Stage + Status Enums ─────────────────────────────────────────────────────

export const ApplicationStageEnum = z.enum([
  "saved",
  "preparing",
  "applied",
  "screening",
  "interview",
  "final_round",
  "offer",
  "rejected",
  "withdrawn",
]);
export type ApplicationStage = z.infer<typeof ApplicationStageEnum>;

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  final_round: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const ApplicationStatusEnum = z.enum(["active", "archived", "closed"]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>;

export const ReminderTypeEnum = z.enum([
  "follow_up",
  "interview",
  "deadline",
  "personal_note",
]);
export type ReminderType = z.infer<typeof ReminderTypeEnum>;

export const AnswerTypeEnum = z.enum([
  "behavioral",
  "technical",
  "role_fit",
  "motivation",
  "culture",
  "leadership",
  "experience",
  "general",
]);
export type AnswerType = z.infer<typeof AnswerTypeEnum>;

// ─── Request Body Schemas ─────────────────────────────────────────────────────

export const SaveJobBody = z.object({
  externalJobCacheId: z.string().optional().nullable(),
  discoveredJobId: z.string().optional().nullable(),
  sourceApplicationId: z.string().optional().nullable(),
  jobTitle: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  remoteType: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  applyUrl: z.string().optional().nullable(),
  jobSnapshot: z.record(z.unknown()).optional().default({}),
});

export const CreateTrackedAppBody = z.object({
  savedJobId: z.string().optional().nullable(),
  externalJobCacheId: z.string().optional().nullable(),
  sourceApplicationId: z.string().optional().nullable(),
  applicationTitle: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  applyUrl: z.string().optional().nullable(),
  tailoredCvId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  jobSnapshot: z.record(z.unknown()).optional().default({}),
});

export const UpdateStageBody = z.object({
  stage: ApplicationStageEnum,
});

export const UpdateNotesBody = z.object({
  notes: z.string(),
});

export const LinkAssetsBody = z.object({
  tailoredCvId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),
});

export const AddTimelineEventBody = z.object({
  eventType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  eventAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const CreateReminderBody = z.object({
  reminderType: ReminderTypeEnum,
  reminderAt: z.string().datetime(),
  reminderNote: z.string().optional().nullable(),
});

export const SaveAnswerBody = z.object({
  answerDraft: z.string(),
});

export const GenerateInterviewPrepBody = z.object({
  applicationId: z.string().min(1),
  tailoredCvId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),
  jobText: z.string().optional().nullable(),
});

// ─── Interview Prep JSON Schema ───────────────────────────────────────────────

export const LikelyQuestionSchema = z.object({
  question: z.string(),
  why_it_matters: z.string(),
  answer_strategy: z.string(),
  answer_type: AnswerTypeEnum,
});

export const InterviewPrepJsonSchema = z.object({
  prep_summary: z.string(),
  likely_questions: z.array(LikelyQuestionSchema),
  company_focus_areas: z.array(z.string()),
  role_focus_areas: z.array(z.string()),
  strengths_to_emphasize: z.array(z.string()),
  risks_to_address: z.array(z.string()),
  questions_to_ask_them: z.array(z.string()),
  "30_second_pitch": z.string(),
  "90_second_pitch": z.string(),
});

export type InterviewPrepJson = z.infer<typeof InterviewPrepJsonSchema>;
export type LikelyQuestion = z.infer<typeof LikelyQuestionSchema>;
