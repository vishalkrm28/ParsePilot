export interface CountryRuleResult {
  countryBoost: number;
  signals: string[];
  notes: string;
}

// Countries sorted by typical visa sponsorship friendliness
// These are heuristics — real determination requires job content analysis
const SPONSORSHIP_FRIENDLY: Record<string, CountryRuleResult> = {
  // Tier 1: Active sponsorship ecosystems, well-known routes
  CA: { countryBoost: 12, signals: ["Canada has accessible work permit pathways"], notes: "Express Entry / LMIA programs active" },
  AU: { countryBoost: 12, signals: ["Australia has structured skilled migration"], notes: "Employer-sponsored visa routes active" },
  NZ: { countryBoost: 10, signals: ["New Zealand employer-sponsored visas available"], notes: "Accredited employer work visa scheme" },
  DE: { countryBoost: 14, signals: ["Germany EU Blue Card program active"], notes: "Strong blue card / skilled migration route" },
  NL: { countryBoost: 12, signals: ["Netherlands Highly Skilled Migrant visa route"], notes: "Knowledge worker permit widely used" },
  SE: { countryBoost: 12, signals: ["Sweden employer-sponsored work permits"], notes: "Tech sector frequently sponsors" },
  DK: { countryBoost: 10, signals: ["Denmark green card / positive list occupations"], notes: "STEM roles frequently sponsored" },
  FI: { countryBoost: 8, signals: ["Finland Specialist permit route"], notes: "Growing tech sponsorship ecosystem" },
  NO: { countryBoost: 8, signals: ["Norway skilled worker permit route"], notes: "Oil & tech sector sponsors regularly" },
  CH: { countryBoost: 8, signals: ["Switzerland cantonal work permits for non-EU"], notes: "Quota-limited but common in tech/finance" },
  SG: { countryBoost: 14, signals: ["Singapore Employment Pass widely used"], notes: "Active EP / S-Pass sponsorship market" },
  AE: { countryBoost: 12, signals: ["UAE employer visa sponsorship standard"], notes: "Employment visa typically employer-arranged" },
  // Tier 2: Common but more restricted
  GB: { countryBoost: 6, signals: ["UK Skilled Worker visa route exists"], notes: "Post-Brexit sponsorship requires licensed sponsor status" },
  UK: { countryBoost: 6, signals: ["UK Skilled Worker visa route exists"], notes: "Post-Brexit sponsorship requires licensed sponsor status" },
  IE: { countryBoost: 6, signals: ["Ireland Critical Skills Employment Permit"], notes: "Common in tech/pharma but selective" },
  FR: { countryBoost: 6, signals: ["France Talent Passport / work permit"], notes: "Available but more bureaucratic process" },
  ES: { countryBoost: 4, signals: ["Spain Startup Act / work permit"], notes: "Growing but less common than N. Europe" },
  PT: { countryBoost: 4, signals: ["Portugal D2 visa / tech visa"], notes: "Growing tech scene, some sponsorship" },
  // Tier 3: Restrictive / less common
  US: { countryBoost: 2, signals: ["US H-1B visa route exists but highly competitive"], notes: "H-1B lottery makes sponsorship uncertain; L-1/O-1 also possible" },
  JP: { countryBoost: 4, signals: ["Japan Highly Skilled Professional visa"], notes: "Points-based system; English-language roles limited" },
  IN: { countryBoost: -4, signals: ["India large local talent pool; sponsorship rare"], notes: "Most roles filled locally" },
};

const SPONSORSHIP_UNFRIENDLY = new Set(["CN", "RU", "KR"]);

export function getCountryRules(country?: string | null): CountryRuleResult {
  if (!country) return { countryBoost: 0, signals: [], notes: "Country unknown — no adjustment applied" };

  const code = country.trim().toUpperCase();

  if (SPONSORSHIP_UNFRIENDLY.has(code)) {
    return { countryBoost: -10, signals: ["Country rarely sponsors international candidates"], notes: "Large domestic talent pools; sponsorship uncommon" };
  }

  return (
    SPONSORSHIP_FRIENDLY[code] ?? {
      countryBoost: 0,
      signals: [],
      notes: `Country "${country}" — no specific rule, neutral adjustment`,
    }
  );
}
