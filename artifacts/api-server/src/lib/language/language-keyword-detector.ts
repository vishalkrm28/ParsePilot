export type LanguageSignal = "english_friendly" | "local_required" | "local_preferred" | "multilingual" | "unknown";

export interface LanguageKeywordResult {
  requiredLanguages: string[];
  preferredLanguages: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  languageSignal: LanguageSignal;
}

// ─── English-friendly signals ─────────────────────────────────────────────────
const ENGLISH_FRIENDLY_PHRASES = [
  "english is our working language",
  "english-speaking environment",
  "english only",
  "all meetings in english",
  "international team",
  "global team",
  "english-language environment",
  "no swedish required",
  "no german required",
  "no dutch required",
  "no french required",
  "no local language required",
  "english fluency required",
  "business english",
  "proficient in english",
  "strong english",
  "fluent english",
  "english is the company language",
  "working language is english",
  "our language is english",
];

// ─── Local language REQUIRED signals ─────────────────────────────────────────
// Format: [phrase, language] — language extracted to requiredLanguages array
const LOCAL_REQUIRED_PATTERNS: [string, string][] = [
  ["swedish required", "Swedish"],
  ["fluent in swedish", "Swedish"],
  ["fluent swedish", "Swedish"],
  ["native swedish", "Swedish"],
  ["native-level swedish", "Swedish"],
  ["must speak swedish", "Swedish"],
  ["german required", "German"],
  ["fluent in german", "German"],
  ["fluent german", "German"],
  ["native german", "German"],
  ["native-level german", "German"],
  ["must speak german", "German"],
  ["dutch required", "Dutch"],
  ["fluent in dutch", "Dutch"],
  ["fluent dutch", "Dutch"],
  ["native dutch", "Dutch"],
  ["must speak dutch", "Dutch"],
  ["french required", "French"],
  ["fluent in french", "French"],
  ["fluent french", "French"],
  ["native french", "French"],
  ["must speak french", "French"],
  ["spanish required", "Spanish"],
  ["fluent in spanish", "Spanish"],
  ["fluent spanish", "Spanish"],
  ["native spanish", "Spanish"],
  ["must speak spanish", "Spanish"],
  ["portuguese required", "Portuguese"],
  ["fluent portuguese", "Portuguese"],
  ["italian required", "Italian"],
  ["fluent italian", "Italian"],
  ["polish required", "Polish"],
  ["fluent polish", "Polish"],
  ["norwegian required", "Norwegian"],
  ["fluent norwegian", "Norwegian"],
  ["danish required", "Danish"],
  ["fluent danish", "Danish"],
  ["finnish required", "Finnish"],
  ["local language required", "Local language"],
  ["local language is required", "Local language"],
  ["must speak the local language", "Local language"],
];

// ─── Local language PREFERRED signals ────────────────────────────────────────
const LOCAL_PREFERRED_PATTERNS: [string, string][] = [
  ["swedish preferred", "Swedish"],
  ["swedish is a plus", "Swedish"],
  ["swedish is an advantage", "Swedish"],
  ["nice to have swedish", "Swedish"],
  ["beneficial if you speak swedish", "Swedish"],
  ["swedish is beneficial", "Swedish"],
  ["german preferred", "German"],
  ["german is a plus", "German"],
  ["german is an advantage", "German"],
  ["nice to have german", "German"],
  ["dutch preferred", "Dutch"],
  ["dutch is a plus", "Dutch"],
  ["french preferred", "French"],
  ["french is a plus", "French"],
  ["spanish preferred", "Spanish"],
  ["spanish is a plus", "Spanish"],
  ["portuguese preferred", "Portuguese"],
  ["italian preferred", "Italian"],
  ["norwegian preferred", "Norwegian"],
  ["danish preferred", "Danish"],
  ["finnish preferred", "Finnish"],
  ["local language preferred", "Local language"],
  ["local language is a plus", "Local language"],
  ["local language is an advantage", "Local language"],
];

// ─── Multilingual signals ─────────────────────────────────────────────────────
const MULTILINGUAL_PHRASES = [
  "multilingual",
  "bilingual",
  "trilingual",
  "multiple languages",
  "several languages",
  "english and swedish",
  "english and german",
  "english and dutch",
  "english and french",
  "english plus swedish",
  "english plus german",
  "english plus dutch",
  "english plus french",
  "english and another language",
  "two or more languages",
];

function findPhrases(lower: string, phrases: string[]): string[] {
  return phrases.filter((p) => lower.includes(p));
}

function findPatterns(lower: string, patterns: [string, string][]): [string, string][] {
  return patterns.filter(([phrase]) => lower.includes(phrase));
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

// English-speaking countries — "English required" here is the norm, not a local-language signal
const ENGLISH_NATIVE_COUNTRIES = new Set(["US", "UK", "GB", "AU", "NZ", "CA", "IE", "SG"]);

export function detectLanguageKeywords(
  jobDescription: string,
  country?: string | null,
): LanguageKeywordResult {
  const lower = jobDescription.toLowerCase();

  const englishFriendlyMatches = findPhrases(lower, ENGLISH_FRIENDLY_PHRASES);
  const multilingualMatches = findPhrases(lower, MULTILINGUAL_PHRASES);
  const requiredMatches = findPatterns(lower, LOCAL_REQUIRED_PATTERNS);
  const preferredMatches = findPatterns(lower, LOCAL_PREFERRED_PATTERNS);

  const requiredLanguages = unique(requiredMatches.map(([, lang]) => lang));
  const preferredLanguages = unique(preferredMatches.map(([, lang]) => lang));

  // Add English to requiredLanguages if explicit english_friendly signals mention it
  const hasExplicitEnglishRequired =
    lower.includes("english fluency required") ||
    lower.includes("fluent english required") ||
    lower.includes("strong english required") ||
    lower.includes("must be fluent in english");

  if (hasExplicitEnglishRequired && !requiredLanguages.includes("English")) {
    requiredLanguages.unshift("English");
  }

  const positiveSignals: string[] = [
    ...englishFriendlyMatches,
    ...multilingualMatches,
    ...requiredMatches.map(([phrase]) => phrase),
    ...preferredMatches.map(([phrase]) => phrase),
  ];

  // ─── Signal hierarchy: multilingual > local_required > local_preferred > english_friendly > unknown

  let languageSignal: LanguageSignal = "unknown";

  // Multilingual: explicit multilingual phrases OR 2+ required languages (including English)
  const nonEnglishRequired = requiredLanguages.filter((l) => l !== "English" && l !== "Local language");
  const hasEnglishRequired = requiredLanguages.includes("English");
  if (multilingualMatches.length > 0 || (hasEnglishRequired && nonEnglishRequired.length > 0) || nonEnglishRequired.length >= 2) {
    languageSignal = "multilingual";
  } else if (requiredLanguages.length > 0) {
    // Single non-English local language required
    // For English-native countries, "English required" is just normal — treat as english_friendly
    const countryCode = country?.trim().toUpperCase() ?? "";
    const onlyEnglishRequired = requiredLanguages.every((l) => l === "English");
    if (onlyEnglishRequired && ENGLISH_NATIVE_COUNTRIES.has(countryCode)) {
      languageSignal = "english_friendly";
    } else if (onlyEnglishRequired) {
      languageSignal = "english_friendly";
    } else {
      languageSignal = "local_required";
    }
  } else if (englishFriendlyMatches.length > 0) {
    languageSignal = "english_friendly";
  } else if (preferredLanguages.length > 0) {
    languageSignal = "local_preferred";
  }

  return {
    requiredLanguages,
    preferredLanguages,
    positiveSignals: unique(positiveSignals),
    negativeSignals: [], // Language signals are additive — no "hard no" equivalent
    languageSignal,
  };
}
