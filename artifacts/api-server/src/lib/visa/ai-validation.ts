import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../logger.js";
import { type SponsorshipSignal } from "./scoring.js";

export interface AiValidationResult {
  signal: SponsorshipSignal;
  confidence: number;
  positiveSignals: string[];
  negativeSignals: string[];
  evidenceSummary: string;
  usedAi: true;
}

const SYSTEM_PROMPT = `You are a visa sponsorship intelligence analyst for a job marketplace.
Your task: analyse the provided job description and return a structured JSON assessment of whether this employer is likely to offer visa/work permit sponsorship.

IMPORTANT RULES:
- Never guarantee sponsorship — use signal/likelihood language only
- Base your assessment on textual evidence in the job description
- If no clear signals exist, return "unknown"
- Return ONLY valid JSON, no markdown, no explanations outside the JSON

Signal levels:
- "high"    = strong positive evidence (explicit sponsorship offer, relocation package, international hiring)
- "medium"  = moderate positive signals with some uncertainty
- "low"     = weak/indirect signals or mixed evidence
- "no"      = explicit refusal or hard right-to-work requirements
- "unknown" = insufficient evidence either way`;

const USER_PROMPT = (
  description: string,
  context: { country?: string; company?: string; existingPositive: string[]; existingNegative: string[] },
) => `Analyse this job posting for visa sponsorship likelihood.

${context.country ? `Job country: ${context.country}` : ""}
${context.company ? `Company: ${context.company}` : ""}
${context.existingPositive.length > 0 ? `Keyword detector found positive signals: ${context.existingPositive.join(", ")}` : ""}
${context.existingNegative.length > 0 ? `Keyword detector found potential negatives: ${context.existingNegative.join(", ")}` : ""}

JOB DESCRIPTION:
${description.slice(0, 4000)}

Return ONLY this JSON (no markdown):
{
  "signal": "high" | "medium" | "low" | "no" | "unknown",
  "confidence": <integer 0-100>,
  "positiveSignals": ["<specific phrase or indicator from the text>"],
  "negativeSignals": ["<specific phrase or concern from the text>"],
  "evidenceSummary": "<1-2 sentence plain-English summary of the evidence>"
}`;

export async function validateWithClaude(
  jobDescription: string,
  context: {
    country?: string | null;
    company?: string | null;
    existingPositive: string[];
    existingNegative: string[];
  },
): Promise<AiValidationResult | null> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: USER_PROMPT(jobDescription, {
            country: context.country ?? undefined,
            company: context.company ?? undefined,
            existingPositive: context.existingPositive,
            existingNegative: context.existingNegative,
          }),
        },
      ],
    });

    const rawText = message.content[0]?.type === "text" ? message.content[0].text : "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      signal: SponsorshipSignal;
      confidence: number;
      positiveSignals: string[];
      negativeSignals: string[];
      evidenceSummary: string;
    };

    const validSignals: SponsorshipSignal[] = ["high", "medium", "low", "no", "unknown"];
    if (!validSignals.includes(parsed.signal)) {
      logger.warn({ parsed }, "Claude returned invalid signal value, defaulting to unknown");
      parsed.signal = "unknown";
    }

    return {
      signal: parsed.signal,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 50)),
      positiveSignals: Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals : [],
      negativeSignals: Array.isArray(parsed.negativeSignals) ? parsed.negativeSignals : [],
      evidenceSummary: parsed.evidenceSummary ?? "No summary provided",
      usedAi: true,
    };
  } catch (err) {
    logger.error({ err }, "Claude visa validation failed");
    return null;
  }
}
