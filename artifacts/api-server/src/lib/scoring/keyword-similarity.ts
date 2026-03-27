import {
  normalizeKeyword,
  isTermInText,
  getSignificantWords,
  getWordRoot,
  buildCvRootSet,
} from "./normalize-keywords.js";
import { resolveToCanonical, getAllAliases } from "./keyword-synonyms.js";

export interface MatchResult {
  matched: string[];
  missing: string[];
}

function buildCvCorpus(cvKeywords: string[]): Set<string> {
  const corpus = new Set<string>();
  for (const kw of cvKeywords) {
    const norm = normalizeKeyword(kw);
    if (!norm) continue;
    corpus.add(norm);
    // Canonical form
    const canonical = resolveToCanonical(norm);
    corpus.add(canonical);
    // Root of canonical (handles "leadership" → "leader" etc.)
    corpus.add(getWordRoot(canonical));
    // All aliases + their roots
    for (const alias of getAllAliases(norm)) {
      corpus.add(alias);
      corpus.add(getWordRoot(alias));
    }
    // Root of the raw keyword itself
    corpus.add(getWordRoot(norm));
    // For each word in a multi-word keyword, add its root too
    for (const word of norm.split(" ")) {
      if (word.length >= 4) corpus.add(getWordRoot(word));
    }
  }
  return corpus;
}

/**
 * Returns true if enough significant constituent words of `term` are present
 * in the CV text or CV root set.  Used as a fallback when exact phrase
 * matching fails — catches word-order variations, verbal/nominal form
 * switches, and partial phrase presence.
 *
 * Threshold: 2-word phrases require both; 3+ phrases require ≥ ⌈75%⌉.
 */
function significantWordsPresent(
  term: string,
  cvFullText: string,
  cvRoots: Set<string>,
): boolean {
  const sigWords = getSignificantWords(term, 4);
  if (sigWords.length < 2) return false; // single-significant-word terms use stem check instead

  const required = sigWords.length === 2 ? 2 : Math.ceil(sigWords.length * 0.75);

  let found = 0;
  for (const w of sigWords) {
    const root = getWordRoot(w);
    if (
      isTermInText(w, cvFullText) ||
      cvRoots.has(w) ||
      cvRoots.has(root)
    ) {
      found++;
      if (found >= required) return true;
    }
  }
  return false;
}

/**
 * Returns true if the root/stem of a single-word JD term matches any word
 * (or word root) found in the CV.  Handles inflection variants:
 *   "leadership" → root "leader" → matches "leader", "leading", "led"
 *   "management" → root "manag" → matches "managing", "managed", "manages"
 */
function stemMatchFound(
  norm: string,
  aliases: string[],
  cvRoots: Set<string>,
): boolean {
  if (norm.split(" ").length !== 1 || norm.length < 5) return false;

  const root = getWordRoot(norm);
  if (cvRoots.has(norm) || (root !== norm && cvRoots.has(root))) return true;

  for (const alias of aliases) {
    if (alias.split(" ").length !== 1) continue;
    const aliasRoot = getWordRoot(alias);
    if (cvRoots.has(alias) || (aliasRoot !== alias && cvRoots.has(aliasRoot))) {
      return true;
    }
  }
  return false;
}

export function matchKeywords(
  jdKeywords: string[],
  cvKeywords: string[],
  cvFullText: string,
): MatchResult {
  const cvCorpus = buildCvCorpus(cvKeywords);
  const cvRoots = buildCvRootSet(cvFullText);
  const matched: string[] = [];
  const missing: string[] = [];
  const seenNorm = new Set<string>();

  for (const rawJdKw of jdKeywords) {
    const norm = normalizeKeyword(rawJdKw);
    if (!norm || seenNorm.has(norm)) continue;
    seenNorm.add(norm);

    const canonical = resolveToCanonical(norm);
    const aliases = getAllAliases(norm);

    let found = false;

    // ── Pass 1: corpus lookup (extracted skills/bullets/titles) ─────────────
    if (cvCorpus.has(norm) || cvCorpus.has(canonical)) found = true;

    // ── Pass 2: alias corpus lookup ─────────────────────────────────────────
    if (!found) {
      for (const alias of aliases) {
        if (cvCorpus.has(alias)) { found = true; break; }
      }
    }

    // ── Pass 3: exact text search — term and canonical ───────────────────
    if (!found && isTermInText(norm, cvFullText)) found = true;
    if (!found && canonical !== norm && isTermInText(canonical, cvFullText)) found = true;

    // ── Pass 4: text search across all aliases ────────────────────────────
    if (!found) {
      for (const alias of aliases) {
        if (alias !== norm && isTermInText(alias, cvFullText)) { found = true; break; }
      }
    }

    // ── Pass 5: significant-word presence check ───────────────────────────
    // Catches word-order variation, nominal/verbal form switch, partial
    // phrase match.  E.g. "stakeholder communication" → looks for "stakeholder"
    // AND "communication" independently in the CV.
    if (!found && significantWordsPresent(norm, cvFullText, cvRoots)) found = true;

    // ── Pass 6: significant-word check across canonical & aliases ─────────
    if (!found) {
      const formsToCheck = [canonical, ...aliases].filter(f => f !== norm);
      for (const form of formsToCheck) {
        if (significantWordsPresent(form, cvFullText, cvRoots)) { found = true; break; }
      }
    }

    // ── Pass 7: root/stem matching for single-word terms ─────────────────
    // Catches inflection variants: "leadership" matches "leader",
    // "analysis" matches "analyzing", "management" matches "managed".
    if (!found && stemMatchFound(norm, aliases, cvRoots)) found = true;

    // ── Pass 8: single-significant-word terms ─────────────────────────────
    // Handles phrases like "leadership skills" where the stop-word filter
    // leaves only one meaningful word ("leadership"). Check that word's
    // stem against the CV — same logic as stem matching but applied after
    // extracting the significant token from a multi-word phrase.
    if (!found && norm.split(" ").length > 1) {
      const sigWords = getSignificantWords(norm, 4);
      if (sigWords.length === 1) {
        const w = sigWords[0];
        const root = getWordRoot(w);
        if (isTermInText(w, cvFullText) || cvRoots.has(w) || cvRoots.has(root)) {
          found = true;
        }
      }
      // Also try the significant word of each alias
      if (!found) {
        for (const alias of aliases) {
          if (alias === norm) continue;
          const aliasSig = getSignificantWords(alias, 4);
          if (aliasSig.length === 1) {
            const w = aliasSig[0];
            const root = getWordRoot(w);
            if (isTermInText(w, cvFullText) || cvRoots.has(w) || cvRoots.has(root)) {
              found = true;
              break;
            }
          }
        }
      }
    }

    if (found) {
      matched.push(rawJdKw);
    } else {
      missing.push(rawJdKw);
    }
  }

  return { matched, missing };
}
