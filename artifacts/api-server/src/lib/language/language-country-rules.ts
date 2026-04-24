export interface CountryLanguageResult {
  defaultSignal: "english_friendly" | "local_likely" | "neutral";
  countryLanguage: string | null;
  signals: string[];
  notes: string;
}

// Conservative country rules — we never assume local language without text evidence.
// These only inform the scoring engine as a mild adjustment, never override keyword detection.
const COUNTRY_LANGUAGE_MAP: Record<string, CountryLanguageResult> = {
  // English-native: "English required" is the norm, no adjustment needed
  US: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  GB: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  UK: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  AU: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  NZ: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  CA: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  IE: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — English requirements are standard" },
  SG: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English-speaking country — strong international English environment" },
  // Nordic: tech sector commonly English-friendly, but do not assume without evidence
  SE: { defaultSignal: "neutral", countryLanguage: "Swedish", signals: ["Swedish is the local language; many tech roles are English-friendly"], notes: "Tech roles often English-friendly, but Swedish may be required — text evidence needed" },
  NO: { defaultSignal: "neutral", countryLanguage: "Norwegian", signals: [], notes: "Norwegian may be required — look for explicit signals" },
  DK: { defaultSignal: "neutral", countryLanguage: "Danish", signals: [], notes: "Danish may be required — look for explicit signals" },
  FI: { defaultSignal: "neutral", countryLanguage: "Finnish", signals: [], notes: "Finnish or English may be required — look for explicit signals" },
  // DACH: local language common, but English-only tech roles exist
  DE: { defaultSignal: "neutral", countryLanguage: "German", signals: [], notes: "German is often required but English-only tech roles exist — text evidence needed" },
  AT: { defaultSignal: "neutral", countryLanguage: "German", signals: [], notes: "German commonly required — look for explicit signals" },
  CH: { defaultSignal: "neutral", countryLanguage: "German", signals: [], notes: "German/French common; some roles English-only — text evidence needed" },
  // Benelux
  NL: { defaultSignal: "neutral", countryLanguage: "Dutch", signals: ["Netherlands has many English-friendly international companies"], notes: "Tech/international roles often English-friendly, but Dutch may be required" },
  BE: { defaultSignal: "neutral", countryLanguage: "French", signals: [], notes: "French or Dutch commonly required — text evidence needed" },
  // Southern Europe: local language more common but not guaranteed
  FR: { defaultSignal: "neutral", countryLanguage: "French", signals: [], notes: "French commonly required — look for explicit English-friendly signals" },
  ES: { defaultSignal: "neutral", countryLanguage: "Spanish", signals: [], notes: "Spanish commonly required — look for explicit English-friendly signals" },
  IT: { defaultSignal: "neutral", countryLanguage: "Italian", signals: [], notes: "Italian commonly required — look for explicit English-friendly signals" },
  PT: { defaultSignal: "neutral", countryLanguage: "Portuguese", signals: [], notes: "Portuguese commonly required — look for explicit signals" },
  PL: { defaultSignal: "neutral", countryLanguage: "Polish", signals: [], notes: "Polish commonly required — look for explicit English-friendly signals" },
  // Global hubs
  AE: { defaultSignal: "english_friendly", countryLanguage: "Arabic", signals: ["UAE international business environment often English-first"], notes: "Many multinational roles in UAE are English-friendly" },
  IN: { defaultSignal: "english_friendly", countryLanguage: "English", signals: [], notes: "English is the primary business language in Indian tech sector" },
};

export function getCountryLanguageRules(country?: string | null): CountryLanguageResult {
  if (!country) {
    return { defaultSignal: "neutral", countryLanguage: null, signals: [], notes: "Country unknown — no country-level adjustment applied" };
  }
  const code = country.trim().toUpperCase();
  return (
    COUNTRY_LANGUAGE_MAP[code] ?? {
      defaultSignal: "neutral",
      countryLanguage: null,
      signals: [],
      notes: `Country "${country}" — no specific language rule, neutral`,
    }
  );
}
