import { openai } from "@workspace/integrations-openai-ai-server";
import { AI_MODELS } from "./ai.js";
import {
  buildTailorCvSystemPrompt,
  buildTailorCvUserPrompt,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  buildAtsImprovementPrompt,
} from "../lib/ai/tailoring-prompts.js";
import {
  TailoredCvJsonSchema,
  AtsImprovementsSchema,
  type TailoredCvJson,
  type AtsImprovements,
} from "../lib/ai/tailoring-schemas.js";
import { logger } from "../lib/logger.js";

function parseJsonResponse(content: string | null | undefined, label: string): unknown {
  if (!content) throw new Error(`AI returned empty response for ${label}`);
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`AI returned invalid JSON for ${label}`);
  }
}

// ─── tailorCv ─────────────────────────────────────────────────────────────────
// Generates a tailored CV JSON from the original parsed CV and job info.
// Uses MAIN model — this is a complex, high-quality operation.

export async function tailorCv(
  parsedCvJson: string,
  jobInfo: string,
): Promise<TailoredCvJson> {
  logger.info({ jobInfoLength: jobInfo.length }, "Starting CV tailoring");

  const response = await openai.responses.create({
    model: AI_MODELS.MAIN,
    instructions: buildTailorCvSystemPrompt(),
    input: [
      {
        role: "user",
        content: buildTailorCvUserPrompt(parsedCvJson, jobInfo),
      },
    ],
    text: { format: { type: "json_object" } },
    max_output_tokens: 4096,
  });

  const raw = parseJsonResponse(response.output_text, "tailored CV");
  const validated = TailoredCvJsonSchema.parse(raw);

  logger.info(
    { atsKeywords: validated.ats_keywords_added.length },
    "CV tailoring complete",
  );

  return validated;
}

// ─── generateCoverLetter ──────────────────────────────────────────────────────
// Generates a cover letter from a parsed CV (and optionally a tailored CV) + job.
// Uses MAIN model — quality matters here.

export async function generateCoverLetter(opts: {
  parsedCvJson: string;
  tailoredCvJson: string | null;
  jobInfo: string;
  tone: string;
}): Promise<string> {
  const { parsedCvJson, tailoredCvJson, jobInfo, tone } = opts;

  logger.info({ tone }, "Starting cover letter generation");

  const response = await openai.responses.create({
    model: AI_MODELS.MAIN,
    instructions: buildCoverLetterSystemPrompt(tone),
    input: [
      {
        role: "user",
        content: buildCoverLetterUserPrompt(parsedCvJson, tailoredCvJson, jobInfo),
      },
    ],
    max_output_tokens: 1024,
  });

  const text = response.output_text?.trim() ?? "";
  if (!text) throw new Error("AI returned empty cover letter");

  logger.info({ length: text.length }, "Cover letter generation complete");
  return text;
}

// ─── generateAtsImprovements ──────────────────────────────────────────────────
// Generates ATS improvement suggestions (lightweight — uses FAST model).

export async function generateAtsImprovements(
  parsedCvJson: string,
  jobInfo: string,
): Promise<AtsImprovements> {
  logger.info("Starting ATS improvement analysis");

  const response = await openai.responses.create({
    model: AI_MODELS.FAST,
    instructions: "You are an ATS optimisation expert. Return only valid JSON.",
    input: [
      {
        role: "user",
        content: buildAtsImprovementPrompt(parsedCvJson, jobInfo),
      },
    ],
    text: { format: { type: "json_object" } },
    max_output_tokens: 1024,
  });

  const raw = parseJsonResponse(response.output_text, "ATS improvements");
  return AtsImprovementsSchema.parse(raw);
}
