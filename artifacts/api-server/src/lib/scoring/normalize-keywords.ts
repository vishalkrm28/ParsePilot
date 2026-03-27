export function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/[^a-z0-9 +#./]/g, " ")
    // ── UK → US spelling normalization ──────────────────────────────────────
    // Applied AFTER character stripping so it operates on clean tokens only.
    // Both the JD text and CV text go through this function, so both sides
    // always converge to the same form — matching is never broken.
    .replace(/isations?\b/g,  "izations")   // organisations → organizations
    .replace(/isation\b/g,    "ization")     // organisation → organization
    .replace(/ising\b/g,      "izing")       // organising → organizing
    .replace(/ised\b/g,       "ized")        // organised → organized
    .replace(/ise\b/g,        "ize")         // organise → organize
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const kw of keywords) {
    const norm = normalizeKeyword(kw);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "must", "can",
  "that", "this", "these", "those", "i", "you", "he", "she", "it", "we",
  "they", "what", "which", "who", "how", "when", "where", "why",
  "not", "no", "nor", "so", "yet", "both", "either", "neither",
  "each", "every", "all", "any", "few", "more", "most", "other",
  "some", "such", "only", "own", "same", "than", "too", "very",
  "just", "as", "into", "through", "during", "before", "after",
  "above", "below", "between", "out", "off", "over", "under",
  "again", "further", "then", "once", "up", "down",
  "our", "their", "your", "its", "his", "her", "my",
  "work", "including", "related", "required", "ability", "strong",
  "excellent", "good", "great", "knowledge", "understanding",
  "preferred", "responsible", "responsibilities", "collaborate",
  "team", "teams", "member", "members", "using", "used", "use",
  "ensure", "ensuring", "provide", "providing", "support", "supporting",
  "across", "within", "role", "roles", "position", "company",
]);

export function extractKeywordsFromText(text: string, minLen = 3): string[] {
  const normalized = normalizeKeyword(text);
  const words = normalized.split(/\s+/).filter(
    w => w.length >= minLen && !STOP_WORDS.has(w)
  );
  return [...new Set(words)];
}

export function isTermInText(term: string, text: string): boolean {
  const normTerm = normalizeKeyword(term);
  const normText = normalizeKeyword(text);

  if (!normTerm || !normText) return false;

  const words = normTerm.split(" ");
  if (words.length === 1) {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(normTerm)}(?![a-z0-9])`, "i");
    return pattern.test(normText);
  }

  return normText.includes(normTerm);
}

function escapeRegex(s: string): string {
  return s.replace(/[+.#]/g, "\\$&");
}

// ── Significant-word extraction ────────────────────────────────────────────
// Words that carry no discriminating meaning when checking keyword presence.
const SIGNIFICANCE_STOP = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were",
  // Skill-qualifier words — carry no discriminating information
  "skill", "skills", "ability", "abilities", "knowledge", "experience",
  "proficiency", "expertise", "understanding", "competency", "competencies",
  "strong", "excellent", "good", "solid", "proven", "demonstrated",
  "including", "related", "based", "focused", "driven", "oriented",
  "using", "used", "use", "via",
  // General seniority / structural words
  "level", "levels",         // "board level", "entry level", "C-level"
  "track",                   // "track record"
  // Compound-word fragments — become noise after hyphen→space conversion
  "hands",                   // "hands-on"
  "depth",                   // "in-depth"
  // Broad domain words — too generic to be discriminating alone
  "design", "designs",       // "API design", "system design", "database design"
  "environment", "environments",  // "cloud environment", "production environment"
  "solution", "solutions",   // "enterprise solutions", "cloud solution"
  "approach", "approaches",  // "agile approach"
  "framework", "frameworks", // "strategic framework"
  "effective", "effectively",
  "extensive", "comprehensive", "exceptional",
]);

/**
 * Returns the meaningful constituent words from a (potentially multi-word)
 * term — used to check individual word presence when exact phrase matching
 * fails.  Words shorter than `minLen` or on the significance stop-list are
 * excluded.
 */
export function getSignificantWords(term: string, minLen = 4): string[] {
  return normalizeKeyword(term)
    .split(" ")
    .filter(w => w.length >= minLen && !SIGNIFICANCE_STOP.has(w));
}

// ── Root / stem extraction ─────────────────────────────────────────────────
// A lightweight suffix stripper — NOT a full NLP stemmer, but covers the
// most common English inflections found in CVs and job descriptions.

const SUFFIXES_ORDERED = [
  "ications", "ication",  // communication → commun, application → applic
  "ications", "ication",  // (plural covered above)
  "orations", "oration",  // collaboration → collab, exploration → explor
  "orates",   "orate",    // collaborate → collab
  "orating",  "orated",   // collaborating/collaborated → collab
  "orative",              // collaborative → collab
  "ations",   "ation",    // communication → communicat, creation → creat
  "ements",   "ement",    // management → manag, achievement → achiev (before "ment")
  "ments",    "ment",     // alignment → align, development → develop
  "nesses",   "ness",     // effectiveness → effectiv
  "ships",    "ship",     // leadership → leader
  "tions",    "tion",     // execution → execut
  "sions",    "sion",     // supervision → supervis
  "ities",    "ity",      // creativity → creativ
  "ives",     "ive",      // creative → creativ
  "ials",     "ial",      // managerial → manager
  "ings",     "ing",      // managing → manag
  "ates",     "ate",      // coordinate → coordinat, automate → automat
  "ers",      "er",       // developer → develop
  "eds",      "ed",       // managed → manag
  "lys",      "ly",       // efficiently → efficient
  "als",      "al",       // analytical → analytic
];

export function getWordRoot(word: string): string {
  if (word.length <= 3) return word; // too short to stem safely
  for (const suffix of SUFFIXES_ORDERED) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }
  // Trailing "s" for simple plurals (avoid stripping "ss" endings)
  // >= 5 so "teams" (5) → "team", "leads" (5) → "lead" etc. are handled
  if (word.endsWith("s") && !word.endsWith("ss") && word.length >= 5) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Returns true if a prefix of `wordRoot` (≥ minLen chars, and within 2 chars
 * of the full root length) is found in `cvRoots`.
 *
 * The "within-2" constraint prevents false positives from compound strings
 * where a short prefix coincidentally appears in an unrelated CV word:
 *   "containerorchestrat" (19) → min prefix = max(6, 17) = 17 → no match
 *   "demonstr"            (8)  → min prefix = max(6, 6)  = 6  → checks fine
 *   "coordin"             (7)  → min prefix = max(6, 5)  = 6  → checks fine
 */
export function prefixFoundInRoots(wordRoot: string, cvRoots: Set<string>, minLen = 6): boolean {
  if (wordRoot.length < minLen) return false;
  const effectiveMin = Math.max(minLen, wordRoot.length - 2);
  for (let len = wordRoot.length; len >= effectiveMin; len--) {
    if (cvRoots.has(wordRoot.slice(0, len))) return true;
  }
  return false;
}

/**
 * Builds a set containing every word, its root, AND 6-char+ prefixes of each
 * root.  The prefix entries enable prefix-based fuzzy stem matching: a CV
 * word "demonstrated" → root "demonstrat" adds "demonstr", "demonstra", etc.
 * so that the JD root "demonstr" (from "demonstration") finds a match.
 */
export function buildCvRootSet(cvFullText: string): Set<string> {
  const roots = new Set<string>();
  for (const word of normalizeKeyword(cvFullText).split(/\s+/)) {
    if (word.length < 3) continue;
    roots.add(word);
    const root = getWordRoot(word);
    if (root !== word) roots.add(root);
    // Add 6-char+ prefixes of the shorter of (word, root) to the set.
    // This ensures that a JD root which is a prefix of a CV root still
    // matches even when they differ by a few characters.
    const stem = root.length < word.length ? root : word;
    for (let len = 6; len < stem.length; len++) {
      roots.add(stem.slice(0, len));
    }
  }
  return roots;
}
