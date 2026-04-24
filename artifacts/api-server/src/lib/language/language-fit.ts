import { type LanguageSignal } from "./language-keyword-detector.js";

export type LanguageFit = "good" | "risky" | "poor" | "unknown";

export interface LanguageFitResult {
  languageFit: LanguageFit;
  reasoning: string;
}

export interface LanguageFitInput {
  candidateKnownLanguages: string[];
  candidatePreferredWorkingLanguages: string[];
  requiredLanguages: string[];
  preferredLanguages: string[];
  languageRequirementSignal: LanguageSignal;
}

function normalise(lang: string): string {
  return lang.trim().toLowerCase();
}

function hasLanguage(candidateLangs: string[], target: string): boolean {
  const t = normalise(target);
  return candidateLangs.some((l) => normalise(l) === t || normalise(l).startsWith(t) || t.startsWith(normalise(l)));
}

function hasAny(candidateLangs: string[], targets: string[]): boolean {
  return targets.some((t) => hasLanguage(candidateLangs, t));
}

function hasAll(candidateLangs: string[], targets: string[]): boolean {
  return targets.every((t) => hasLanguage(candidateLangs, t));
}

export function calculateLanguageFit(input: LanguageFitInput): LanguageFitResult {
  const { candidateKnownLanguages, candidatePreferredWorkingLanguages, requiredLanguages, preferredLanguages, languageRequirementSignal } = input;

  // If candidate hasn't set their languages, we don't know — never penalise an empty profile
  if (candidateKnownLanguages.length === 0 && candidatePreferredWorkingLanguages.length === 0) {
    return { languageFit: "unknown", reasoning: "Set your known languages in profile to see language fit" };
  }

  const allCandidateLangs = [...candidateKnownLanguages, ...candidatePreferredWorkingLanguages];

  switch (languageRequirementSignal) {
    case "english_friendly": {
      const hasEnglish = hasLanguage(allCandidateLangs, "English");
      if (hasEnglish) return { languageFit: "good", reasoning: "You know English — this English-friendly role is a language match" };
      return { languageFit: "risky", reasoning: "This role is English-friendly but English is not listed in your known languages" };
    }

    case "local_required": {
      const nonGeneric = requiredLanguages.filter((l) => l !== "Local language" && l !== "English");
      if (nonGeneric.length === 0) {
        // Generic "local language required" — we don't know which
        return { languageFit: "unknown", reasoning: "Local language required but specific language is unclear" };
      }
      if (hasAll(allCandidateLangs, nonGeneric)) {
        return { languageFit: "good", reasoning: `You know the required language(s): ${nonGeneric.join(", ")}` };
      }
      const missing = nonGeneric.filter((l) => !hasLanguage(allCandidateLangs, l));
      return { languageFit: "poor", reasoning: `Required language(s) missing from your profile: ${missing.join(", ")}` };
    }

    case "local_preferred": {
      const nonGeneric = preferredLanguages.filter((l) => l !== "Local language");
      if (nonGeneric.length === 0) return { languageFit: "unknown", reasoning: "Preferred language unclear" };
      if (hasAny(allCandidateLangs, nonGeneric)) {
        return { languageFit: "good", reasoning: `You know a preferred language: ${nonGeneric.find((l) => hasLanguage(allCandidateLangs, l))}` };
      }
      return { languageFit: "risky", reasoning: `Preferred language(s) not in your profile: ${nonGeneric.join(", ")} — application still possible` };
    }

    case "multilingual": {
      const required = requiredLanguages.filter((l) => l !== "Local language");
      if (required.length === 0) return { languageFit: "unknown", reasoning: "Multilingual role but required languages unclear" };
      if (hasAll(allCandidateLangs, required)) {
        return { languageFit: "good", reasoning: `You have all required languages: ${required.join(", ")}` };
      }
      const missing = required.filter((l) => !hasLanguage(allCandidateLangs, l));
      if (missing.length < required.length) {
        return { languageFit: "risky", reasoning: `You have some required languages but are missing: ${missing.join(", ")}` };
      }
      return { languageFit: "poor", reasoning: `Missing all required languages for this multilingual role: ${required.join(", ")}` };
    }

    case "unknown":
    default:
      return { languageFit: "unknown", reasoning: "Language requirements not determined — review job description for details" };
  }
}
