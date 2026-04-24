import { type LanguageKeywordResult, type LanguageSignal } from "./language-keyword-detector.js";
import { type CountryLanguageResult } from "./language-country-rules.js";

export interface LanguageScoringInput {
  keywords: LanguageKeywordResult;
  countryRules: CountryLanguageResult;
  recruiterDeclared?: {
    requiredLanguages?: string[] | null;
    preferredLanguages?: string[] | null;
    workingLanguage?: string | null;
    languageNotes?: string | null;
  };
}

export interface LanguageScoringResult {
  signal: LanguageSignal;
  requiredLanguages: string[];
  preferredLanguages: string[];
  confidence: number;
  evidenceSummary: string;
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

export function computeLanguageScore(input: LanguageScoringInput): LanguageScoringResult {
  const { keywords, countryRules, recruiterDeclared } = input;

  // Merge recruiter-declared with keyword-detected (recruiter takes precedence)
  let requiredLanguages = unique([
    ...(recruiterDeclared?.requiredLanguages ?? []),
    ...keywords.requiredLanguages,
  ]);
  let preferredLanguages = unique([
    ...(recruiterDeclared?.preferredLanguages ?? []),
    ...keywords.preferredLanguages,
  ]);

  // Working language declared by recruiter as English → english_friendly signal
  const workingLangIsEnglish =
    recruiterDeclared?.workingLanguage?.toLowerCase().includes("english") ?? false;

  const evidenceParts: string[] = [];
  let signal: LanguageSignal = keywords.languageSignal;
  let confidence = 0;
  let sources = 0;

  // ─── 1. Recruiter-declared fields are the strongest signal ────────────────

  if (recruiterDeclared?.requiredLanguages?.length) {
    const nonEnglish = recruiterDeclared.requiredLanguages.filter(
      (l) => l.toLowerCase() !== "english",
    );
    const hasEnglish = recruiterDeclared.requiredLanguages.some(
      (l) => l.toLowerCase() === "english",
    );
    if (nonEnglish.length > 0 && hasEnglish) {
      signal = "multilingual";
      confidence = Math.max(confidence, 90);
    } else if (nonEnglish.length >= 2) {
      signal = "multilingual";
      confidence = Math.max(confidence, 90);
    } else if (nonEnglish.length === 1) {
      signal = "local_required";
      confidence = Math.max(confidence, 90);
    } else {
      // Only English required
      signal = "english_friendly";
      confidence = Math.max(confidence, 90);
    }
    evidenceParts.push(`Recruiter declared required: ${recruiterDeclared.requiredLanguages.join(", ")}`);
    sources++;
  }

  if (workingLangIsEnglish && signal === "unknown") {
    signal = "english_friendly";
    confidence = Math.max(confidence, 88);
    evidenceParts.push(`Working language: ${recruiterDeclared!.workingLanguage}`);
    sources++;
  }

  if (recruiterDeclared?.preferredLanguages?.length && signal === "unknown") {
    signal = "local_preferred";
    confidence = Math.max(confidence, 75);
    evidenceParts.push(`Recruiter declared preferred: ${recruiterDeclared.preferredLanguages.join(", ")}`);
    sources++;
  }

  // ─── 2. Keyword detection signals (if recruiter didn't fully determine it) ──

  if (signal === "unknown" || sources === 0) {
    signal = keywords.languageSignal;
    confidence = confidenceForKeywordSignal(keywords);
    if (keywords.positiveSignals.length > 0) {
      evidenceParts.push(`Text signals: ${keywords.positiveSignals.slice(0, 3).join("; ")}`);
      sources++;
    }
  } else if (keywords.languageSignal !== "unknown" && keywords.languageSignal !== signal) {
    // Keyword detection found something different from recruiter — note conflict but trust recruiter
    evidenceParts.push(`Job text suggests: ${keywords.languageSignal}`);
  }

  // ─── 3. Country rules — mild adjustment only if signal is still unknown ───

  if (signal === "unknown" && countryRules.defaultSignal === "english_friendly") {
    signal = "english_friendly";
    confidence = Math.max(confidence, 40); // Low confidence — country-only inference
    evidenceParts.push(countryRules.notes);
  }

  // Final confidence floor
  if (signal === "unknown") confidence = 0;
  else if (confidence === 0) confidence = 50;

  return {
    signal,
    requiredLanguages,
    preferredLanguages,
    confidence,
    evidenceSummary: evidenceParts.join(" | ") || "No language signals detected",
  };
}

function confidenceForKeywordSignal(keywords: LanguageKeywordResult): number {
  const count = keywords.positiveSignals.length;
  switch (keywords.languageSignal) {
    case "local_required": return Math.min(90, 75 + count * 4);
    case "multilingual": return Math.min(88, 70 + count * 5);
    case "english_friendly": return Math.min(85, 65 + count * 4);
    case "local_preferred": return Math.min(75, 55 + count * 5);
    default: return 0;
  }
}
