export interface KeywordDetectionResult {
  positiveSignals: string[];
  negativeSignals: string[];
  relocationSignals: string[];
  workAuthorizationSignals: string[];
  hasStrongNegative: boolean;
}

const POSITIVE_PHRASES = [
  "visa sponsorship available",
  "sponsorship available",
  "sponsorship provided",
  "work permit support",
  "work permit provided",
  "visa support",
  "immigration support",
  "we sponsor visas",
  "we will sponsor",
  "happy to sponsor",
  "open to sponsoring",
  "open to visa",
  "skilled worker visa",
  "eu blue card",
  "blue card support",
  "permit assistance",
  "visa assistance",
  "work authorization provided",
  "international candidates welcome",
  "global candidates welcome",
  "candidates from abroad welcome",
  "willing to sponsor",
  "able to sponsor",
  "can sponsor",
  "sponsor work authorization",
];

const STRONG_NEGATIVE_PHRASES = [
  "no visa sponsorship",
  "visa sponsorship is not available",
  "sponsorship not available",
  "cannot sponsor",
  "we do not sponsor",
  "we don't sponsor",
  "does not offer sponsorship",
  "unable to sponsor",
  "not able to sponsor",
  "do not offer visa",
];

const NEGATIVE_PHRASES = [
  "must have right to work",
  "must already have work authorization",
  "must be authorized to work",
  "must be eligible to work",
  "must have existing right to work",
  "eu citizens only",
  "uk passport holders only",
  "us citizens only",
  "local candidates only",
  "local applicants only",
  "valid work permit required",
  "right to work in the uk required",
  "right to work in the us required",
  "no relocation assistance",
  "no sponsorship of any kind",
];

const RELOCATION_PHRASES = [
  "relocation support",
  "relocation package",
  "relocation assistance",
  "help with relocation",
  "moving costs covered",
  "relocation allowance",
  "moving allowance",
  "relocation budget",
  "we help with relocation",
];

const WORK_AUTH_PHRASES = [
  "right to work",
  "work authorization",
  "work permit",
  "valid visa",
  "eligible to work",
  "authorized to work",
  "employment authorization",
];

function findPhrases(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const phrase of phrases) {
    if (lower.includes(phrase.toLowerCase()) && !found.includes(phrase)) {
      found.push(phrase);
    }
  }
  return found;
}

export function detectKeywords(jobDescription: string): KeywordDetectionResult {
  const positive = findPhrases(jobDescription, POSITIVE_PHRASES);
  const strongNegative = findPhrases(jobDescription, STRONG_NEGATIVE_PHRASES);
  const negative = findPhrases(jobDescription, NEGATIVE_PHRASES);
  const relocation = findPhrases(jobDescription, RELOCATION_PHRASES);
  const workAuth = findPhrases(jobDescription, WORK_AUTH_PHRASES);

  return {
    positiveSignals: positive,
    negativeSignals: [...strongNegative, ...negative],
    relocationSignals: relocation,
    workAuthorizationSignals: workAuth,
    hasStrongNegative: strongNegative.length > 0,
  };
}
