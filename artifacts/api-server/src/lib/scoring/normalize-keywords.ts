export function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/[^a-z0-9 +#./]/g, " ")
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
  "skill", "skills", "ability", "abilities", "knowledge", "experience",
  "proficiency", "expertise", "understanding", "competency", "competencies",
  "strong", "excellent", "good", "solid", "proven", "demonstrated",
  "including", "related", "based", "focused", "driven", "oriented",
  "using", "used", "use", "via",
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
  "ations", "ation",   // communication → communicat
  "ements", "ement",   // management → manag, achievement → achiev  (must be before "ment")
  "ments",  "ment",    // alignment → align
  "nesses", "ness",    // effectiveness → effectiv
  "ships",  "ship",    // leadership → leader
  "tions",  "tion",    // execution → execut
  "sions",  "sion",    // supervision → supervis
  "ities",  "ity",     // creativity → creativ
  "ives",   "ive",     // creative → creativ
  "ials",   "ial",     // managerial → manager
  "ings",   "ing",     // managing → manag
  "ers",    "er",      // developer → develop
  "eds",    "ed",      // managed → manag
  "lys",    "ly",      // efficiently → efficient
  "als",    "al",      // analytical → analytic
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
 * Builds a set containing every word AND its root that appears in the CV
 * full text.  Used for stem-based matching without expensive regex scanning.
 */
export function buildCvRootSet(cvFullText: string): Set<string> {
  const roots = new Set<string>();
  for (const word of normalizeKeyword(cvFullText).split(/\s+/)) {
    if (word.length < 3) continue;
    roots.add(word);
    const root = getWordRoot(word);
    if (root !== word) roots.add(root);
  }
  return roots;
}
