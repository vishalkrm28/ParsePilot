import { type KeywordDetectionResult } from "./keyword-detector.js";
import { type CountryRuleResult } from "./country-rules.js";

export type SponsorshipSignal = "high" | "medium" | "low" | "no" | "unknown";

export interface ScoringInput {
  keywords: KeywordDetectionResult;
  countryRules: CountryRuleResult;
  recruiterDeclared?: {
    visaSponsorshipAvailable?: boolean | null;
    relocationSupport?: boolean | null;
    workAuthorizationRequirement?: string | null;
  };
}

export interface ScoringResult {
  signal: SponsorshipSignal;
  confidence: number;
  positiveSignals: string[];
  negativeSignals: string[];
  isAmbiguous: boolean;
  evidenceSummary: string;
}

// Scores below this trigger "no" signal
const STRONG_NEGATIVE_THRESHOLD = -20;

function mapScoreToSignal(score: number, hasHardNegative: boolean): SponsorshipSignal {
  if (hasHardNegative) return "no";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  if (score >= 20) return "low";
  if (score >= 0) return "unknown";
  return "no";
}

export function computeScore(input: ScoringInput): ScoringResult {
  const { keywords, countryRules, recruiterDeclared } = input;
  let score = 0;
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  let hasHardNegative = false;

  // 1. Recruiter-declared visa availability (strongest signal, +35)
  if (recruiterDeclared?.visaSponsorshipAvailable === true) {
    score += 35;
    positiveSignals.push("Recruiter confirmed visa sponsorship available");
  } else if (recruiterDeclared?.visaSponsorshipAvailable === false) {
    // Explicit "no" from recruiter — decisive
    hasHardNegative = true;
    negativeSignals.push("Recruiter confirmed no visa sponsorship");
  }

  // 2. Work authorization requirement field — check for negatives
  const warText = recruiterDeclared?.workAuthorizationRequirement ?? "";
  if (warText) {
    const lower = warText.toLowerCase();
    const hardNegPhrases = ["must have right to work", "no sponsorship", "cannot sponsor", "not offering sponsorship", "local candidates"];
    for (const phrase of hardNegPhrases) {
      if (lower.includes(phrase)) {
        hasHardNegative = true;
        negativeSignals.push(`Requirement states: "${recruiterDeclared?.workAuthorizationRequirement}"`);
        break;
      }
    }
  }

  // Early exit if recruiter confirmed "no"
  if (hasHardNegative) {
    return {
      signal: "no",
      confidence: 92,
      positiveSignals,
      negativeSignals,
      isAmbiguous: false,
      evidenceSummary: negativeSignals.join("; "),
    };
  }

  // 3. Keyword positive signals (+8 each, cap at +40)
  const keywordPositiveScore = Math.min(keywords.positiveSignals.length * 8, 40);
  score += keywordPositiveScore;
  positiveSignals.push(...keywords.positiveSignals);

  // 4. Keyword strong negative — decisive
  if (keywords.hasStrongNegative) {
    hasHardNegative = true;
    negativeSignals.push(...keywords.negativeSignals);
  } else {
    // Soft negative keywords — partial penalty
    const softNegScore = Math.min(keywords.negativeSignals.length * 6, 24);
    score -= softNegScore;
    if (keywords.negativeSignals.length > 0) {
      negativeSignals.push(...keywords.negativeSignals);
    }
  }

  if (hasHardNegative) {
    return {
      signal: "no",
      confidence: 88,
      positiveSignals,
      negativeSignals,
      isAmbiguous: false,
      evidenceSummary: negativeSignals.join("; "),
    };
  }

  // 5. Relocation support signals (+6 each, cap at +18)
  const relocationScore = Math.min(keywords.relocationSignals.length * 6, 18);
  score += relocationScore;
  if (keywords.relocationSignals.length > 0) {
    positiveSignals.push(...keywords.relocationSignals);
    if (recruiterDeclared?.relocationSupport) {
      score += 8;
      positiveSignals.push("Recruiter confirmed relocation support");
    }
  }

  // 6. Country rules
  score += countryRules.countryBoost;
  if (countryRules.signals.length > 0) {
    positiveSignals.push(...countryRules.signals);
  }

  // 7. Determine signal
  const signal = mapScoreToSignal(score, hasHardNegative);

  // 8. Confidence — higher when more signals (cap at 90, floor at 20)
  const totalSignals = positiveSignals.length + negativeSignals.length;
  const confidence = Math.min(90, Math.max(20, 30 + totalSignals * 8));

  // 9. Ambiguous: medium signal + conflicting evidence + mid-confidence range
  const isAmbiguous =
    (signal === "medium" || signal === "low") &&
    positiveSignals.length > 0 &&
    negativeSignals.length > 0 &&
    confidence < 70;

  // 10. Summary
  const parts: string[] = [];
  if (positiveSignals.length > 0) parts.push(`Positive: ${positiveSignals.slice(0, 3).join("; ")}`);
  if (negativeSignals.length > 0) parts.push(`Concerns: ${negativeSignals.slice(0, 2).join("; ")}`);
  if (countryRules.notes) parts.push(countryRules.notes);
  const evidenceSummary = parts.join(" | ") || "No strong signals detected";

  return { signal, confidence, positiveSignals, negativeSignals, isAmbiguous, evidenceSummary };
}
