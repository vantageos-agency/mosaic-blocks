/**
 * docs-counts-shared.mjs — SINGLE SOURCE for both the counting definition
 * AND every count-claim anchor regex used to detect a "Mosaic* component
 * count" / "total named exports count" claim in README.md /
 * docs/components-catalog.md.
 *
 * Imported by BOTH:
 *   - scripts/docs-counts.mjs               (the PRODUCER — derives + rewrites)
 *   - src/__tests__/readme-matches-exports.test.ts  (the GUARD — verifies)
 *
 * Why this file exists (Day 129 follow-up, coordinator review): a prior
 * version of scripts/docs-counts.mjs re-implemented its own copy of the
 * counting logic AND its own separate set of anchor regexes, with only a
 * code comment ("keep in lockstep") asking a future editor to remember to
 * update both places. A comment is a wish, not a mechanism — the day someone
 * adds a new count-wording to one file and not the other, the producer and
 * the guard silently diverge: the producer could "fix" a count the guard
 * never learns to check, or the guard could flag a drift the producer has no
 * regex to repair. That would transplant into the remedy exactly the disease
 * it exists to close: two sources of truth for the same value.
 *
 * There is now exactly ONE regex per count-claim wording, defined here, and
 * neither consumer is allowed to redefine it locally.
 */

// ---------------------------------------------------------------------------
// Counting definition — extracted from src/index.ts.
// ---------------------------------------------------------------------------

/**
 * Extract every named VALUE export from src/index.ts.
 *
 * Covers the FULL ES module named-value-export grammar, not just the barrel
 * `export { … } from "…";` form (guard-formulation-census: a domain-counter
 * that only knows one syntactic shape of "export" fails OPEN, silently, on
 * every other shape — proven hole: `export const MosaicProbeZZ = 1;` left the
 * count unchanged). Forms recognised:
 *
 *   - `export { A, B as C } from "…";`        (barrel re-export, value)
 *   - `export const/let/var NAME = …;`        (local named value export)
 *   - `export function NAME(...) {…}`         (incl. `async function`)
 *   - `export class NAME {…}`
 *   - `export * as NS from "…";`              (namespace re-export — the
 *                                               binding IS enumerable: `NS`)
 *
 * `export type {...}` blocks are excluded (types are not "components").
 * `export default ...` is excluded (unnamed — not a "named export").
 *
 * A BARE `export * from "…";` (no `as NS`) is structurally NOT enumerable
 * from this file alone — the names it re-exports live in the target module,
 * which this function does not resolve/parse. Per derive-never-type +
 * measurement-integrity ("non-red-is-not-green"), silently skipping it would
 * recreate the exact hole this function was extended to close. It FAILS LOUD
 * instead, naming the exact source line, so a human resolves the target
 * module rather than the count silently under-reporting.
 *
 * @param {string} indexSource
 * @returns {Set<string>}
 */
export function extractRealExports(indexSource) {
  const names = new Set();

  // Bare `export * from "…";` — reject BEFORE consuming `export * as NS`
  // below (that form is legitimate and handled separately). A negative
  // lookahead excludes `as` so this only fires on the truly-unenumerable
  // bare wildcard form.
  const bareStarRe = /^[ \t]*export\s*\*\s*(?!as\b)from\s*"[^"]+";?[ \t]*$/gm;
  const bareStarMatch = bareStarRe.exec(indexSource);
  if (bareStarMatch) {
    const line = lineNumberAt(indexSource, bareStarMatch.index);
    throw new Error(
      `extractRealExports: bare "export * from ...;" at src/index.ts:${line} (${bareStarMatch[0].trim()}) re-exports an unknown set of names — this function cannot enumerate them without resolving the target module, and silently skipping it would under-count. Use a named barrel \`export { A, B } from "...";\` or a namespaced \`export * as NS from "...";\` instead, or extend extractRealExports to resolve the target.`,
    );
  }

  // Barrel form: `export { … } from "…";` (value or type).
  const exportBlockRe = /export(?:\s+type)?\s*\{([^}]*)\}\s*from\s*"[^"]+";/gs;
  let match;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = exportBlockRe.exec(indexSource))) {
    const isTypeExport = match[0].trimStart().startsWith("export type");
    if (isTypeExport) continue;
    for (const rawName of match[1].split(",")) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;
      const asParts = trimmed.split(/\s+as\s+/);
      names.add(asParts[asParts.length - 1].trim());
    }
  }

  // Local declaration form: `export const/let/var/function/class NAME`.
  const declarationRe =
    /export\s+(?:const|let|var)\s+(\w+)|export\s+(?:async\s+)?function\s*\*?\s+(\w+)|export\s+class\s+(\w+)/g;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = declarationRe.exec(indexSource))) {
    const name = match[1] ?? match[2] ?? match[3];
    if (name) names.add(name);
  }

  // Namespaced re-export: `export * as NS from "…";` — NS is enumerable.
  const namespaceStarRe = /export\s*\*\s*as\s+(\w+)\s*from\s*"[^"]+";/g;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = namespaceStarRe.exec(indexSource))) {
    names.add(match[1]);
  }

  return names;
}

/**
 * Extract every named TYPE-ONLY export from src/index.ts (`export type {...}`
 * blocks) — legitimate real API surface, just not a component/value.
 * @param {string} indexSource
 * @returns {Set<string>}
 */
export function extractRealTypeExports(indexSource) {
  const names = new Set();
  const exportBlockRe = /export\s+type\s*\{([^}]*)\}\s*from\s*"[^"]+";/gs;
  let match;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = exportBlockRe.exec(indexSource))) {
    for (const rawName of match[1].split(",")) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;
      const asParts = trimmed.split(/\s+as\s+/);
      names.add(asParts[asParts.length - 1].trim());
    }
  }
  return names;
}

/**
 * Every `Mosaic*` identifier-shaped token cited anywhere in a doc source.
 * @param {string} doc
 * @returns {string[]}
 */
export function extractCitedMosaicTokens(doc) {
  const matches = doc.match(/\bMosaic[A-Za-z0-9]+\b/g) ?? [];
  return [...new Set(matches)];
}

/**
 * Distinct `Mosaic*` names documented as first-column entries in
 * docs/components-catalog.md's markdown tables.
 * @param {string} catalog
 * @returns {Set<string>}
 */
export function extractCatalogDocumentedMosaicNames(catalog) {
  const names = new Set();
  const rowRe = /^\| `(Mosaic[A-Za-z0-9]+)`/gm;
  let match;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = rowRe.exec(catalog))) {
    names.add(match[1]);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Versioning-table Historical/Current classification — read from the row's
// Status column, never from sentence wording.
// ---------------------------------------------------------------------------

/**
 * @typedef {"Current"|"Historical"|"unclassified"} VersionTableRowStatus
 */

/**
 * @param {string} doc
 * @returns {Map<number, VersionTableRowStatus>}
 */
export function extractVersionTableRowStatusByLine(doc) {
  const statusByLine = new Map();
  const semverCell = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*([^|]*)\|/;
  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = rowRe.exec(lines[i]);
    if (!match) continue;
    const versionCell = match[1].trim();
    if (!semverCell.test(versionCell)) continue; // not a versioning-table row
    const statusCell = match[2].trim();
    const status =
      statusCell === "Current"
        ? "Current"
        : statusCell === "Historical"
          ? "Historical"
          : "unclassified";
    statusByLine.set(i + 1, status);
  }
  return statusByLine;
}

/**
 * @param {string} doc
 * @param {number} index
 * @returns {number}
 */
export function lineNumberAt(doc, index) {
  return doc.slice(0, index).split("\n").length;
}

// ---------------------------------------------------------------------------
// Generic, whole-document count-claim patterns — the single definition of
// "what counts as a Mosaic*-count / total-exports-count claim anywhere in a
// doc". Exposed as FACTORY FUNCTIONS (not precompiled RegExp constants):
// each call returns brand-new RegExp instances, so two independent callers
// (the guard scanning README.md, the producer scanning both files, each
// possibly more than once) never share mutable `lastIndex` state on a
// stateful global-flag RegExp — a classic footgun this module closes by
// construction rather than by convention.
// ---------------------------------------------------------------------------

/** @returns {RegExp[]} */
export function mosaicCountPatterns() {
  return [
    // "**123** `Mosaic*` components" (bold number, backtick keyword). `\s*`
    // (with the `s` flag) tolerates the number/keyword being split across a
    // markdown line wrap, e.g. docs/components-catalog.md's
    // "**133** `Mosaic*`\ncomponents (**156** total named exports)".
    /\*\*(\d+)\*\*\s*`Mosaic\*`\s*components/gs,
    // "123 exported `Mosaic*` components" / "123 shipped `Mosaic*` components"
    // — verb-AGNOSTIC by design (any single word between the number and the
    // backtick-wrapped `Mosaic*`). Catches README's Section 6 summary line
    // AND every Versioning-table row in one shared pattern.
    /(\d+)\s+\S+\s*`Mosaic\*`\s*components/gs,
    // "It provides 123 opinionated" (README hero line).
    /(\d+)\s*opinionated/gs,
  ];
}

/** @returns {RegExp[]} */
export function totalExportsPatterns() {
  return [
    // "(**140** total named exports)" — bold.
    /\*\*(\d+)\*\*\s*total named exports/gs,
    // "140 total named exports" — bare.
    /(\d+)\s*total named exports/gs,
  ];
}

// ---------------------------------------------------------------------------
// Dedicated, single-sentence anchors — used by the guard's named,
// sentence-specific assertions (one test per known sentence, with a
// wording-changed failure message pointing at exactly that sentence). These
// are NOT `g`-flagged (single match via `.match()`), so they carry no
// mutable state and are safe to export as plain constants.
// ---------------------------------------------------------------------------

export const HERO_RE = /It provides (\d+) opinionated/;
export const SECTION6_SUMMARY_RE = /(\d+) exported `Mosaic\*` components across (\d+) sections/;
export const SECTION6_TOTAL_RE = /\((\d+) total named exports/;
export const CATALOG_HEADER_DOCUMENTED_RE =
  /Documented:\s*\*\*(\d+) Mosaic\* components \+ (\d+) hooks\*\*/;
export const CATALOG_LIVE_LIB_RE =
  /exports\s*\*\*(\d+)\*\*\s*`Mosaic\*`\s*components and\s*\*\*(\d+)\*\*\s*total named exports/s;
export const CATALOG_FOOTER_RE =
  /Total unique `Mosaic\*` components documented in this catalog:\s*\*\*(\d+)\*\*/;

// ---------------------------------------------------------------------------
// FAIL-CLOSED count-shaped-claim detection (derive-never-type +
// guard-formulation-census).
//
// The anchor regexes above only recognise the count FORMS the authors have met
// so far (backtick-wrapped `Mosaic*`, bold numbers, the "opinionated" hero
// wording, "total named exports"). Any OTHER phrasing of a library-wide count —
// most simply an unbacktick'd prose sentence like "The library exports 999
// Mosaic components in total." — is structurally invisible to every anchor, so
// a hand-typed FALSE number in that shape passes GREEN through both consumers.
// That is the mono-formulation disease: a guard that only knows the forms its
// author happened to enumerate, failing OPEN on every other member of the same
// domain.
//
// The remedy is NOT one more anchor regex (that repeats the disease). It is a
// SEPARATE, deliberately BROADER detector for the SHAPE of a count claim — a
// standalone integer adjacent to a plural domain noun (components / exports /
// hooks) — that is intentionally a superset of the recognised anchors. A claim
// this detector sees is then classified:
//   - it overlaps a KNOWN anchor            -> verified elsewhere (keep as-is)
//   - it sits on a Historical versioning row -> a dated fact, declared by its
//                                               Status column (see the classifier)
//   - its line carries a <!-- count-exempt: <reason> --> marker
//                                            -> a deliberately-non-derived figure,
//                                               declared IN THE DOC where the reader sees it
//   - none of the above                      -> FAIL LOUD, naming file + line + text.
//
// Bounded on purpose: it matches ONLY a number adjacent to a domain noun, never
// arbitrary prose — a prose scanner is either too lax or too zealous and gets
// torn out (see release-artifacts-guard.mjs's MARKER_RE history for the same
// lesson). It VERIFIES structured anchors and FAILS CLOSED on a count-shaped
// claim it cannot attach; it never mines free prose for TRUTH.
// ---------------------------------------------------------------------------

// Plural domain nouns whose adjacency to a standalone integer makes a claim
// "count-shaped". Plural only, so a dependency-version cell like
// "`^7` | Using any auth component" (singular, and not even adjacent) never trips it.
const COUNT_DOMAIN_NOUN = "(?:components|exports|hooks)";
// Markdown / keyword tokens allowed to sit BETWEEN the number and the domain
// noun without breaking a count claim. Anything NOT in this set (a comma, a
// pipe, an unrelated word such as "sizes" or "variants") ends the run, so
// "4 sizes; also exports `buttonVariants`" is NOT a count claim.
const COUNT_QUALIFIER =
  "(?:`?Mosaic\\*?`?|total|named|exported|shipped|documented|unique|opinionated|distinct|UI|fully-typed)";

/**
 * Factory (fresh RegExp per call — no shared mutable lastIndex). Matches a
 * count-SHAPED claim: a standalone integer (never mid-token, so "wave-2
 * components" and "^1.0.0" are excluded) followed, through zero or more allowed
 * qualifier words, by a plural domain noun; plus the bare "N opinionated" hero
 * shape where the noun is elided.
 * @returns {RegExp[]}
 */
export function countShapedClaimPatterns() {
  return [
    new RegExp(
      `(?<![-\\w.*])\\*{0,2}(\\d+)\\*{0,2}(?:\\s+${COUNT_QUALIFIER})*\\s+${COUNT_DOMAIN_NOUN}\\b`,
      "gis",
    ),
    /(?<![-\w.*])(\d+)\s+opinionated\b/gis,
  ];
}

/**
 * @param {string} text a single line (or arbitrary text) to test.
 * @returns {boolean} true if the text carries at least one count-shaped claim.
 */
export function isCountShaped(text) {
  for (const re of countShapedClaimPatterns()) {
    re.lastIndex = 0;
    if (re.test(text)) return true;
  }
  return false;
}

/**
 * Every count-shaped claim in a doc, with its char offset and 1-based line.
 * @param {string} doc
 * @returns {Array<{ number: string, index: number, matchText: string, line: number }>}
 */
export function extractCountShapedClaims(doc) {
  const claims = [];
  for (const re of countShapedClaimPatterns()) {
    re.lastIndex = 0;
    let match;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
    while ((match = re.exec(doc))) {
      claims.push({
        number: match[1],
        index: match.index,
        matchText: match[0],
        line: lineNumberAt(doc, match.index),
      });
      if (match.index === re.lastIndex) re.lastIndex++; // guard against zero-length matches
    }
  }
  return claims;
}

// Inline, reader-visible declaration for a count-shaped figure that is
// deliberately NOT derived from src/index.ts (a curated subset, an illustrative
// example, etc.). It lives on the SAME line as the number — never in a hidden
// exclusion list at the bottom of a guard. A declared divergence is a decision;
// a silent one is a hole.
export const COUNT_EXEMPT_MARKER_RE = /<!--\s*count-exempt:\s*(\S.*?)\s*-->/;

/**
 * Char ranges of every KNOWN, recognised count anchor in a doc — the union of
 * the generic scanners and the dedicated single-sentence anchors. A
 * count-shaped claim overlapping one of these ranges is already verified by the
 * existing machinery and is not a fail-closed candidate.
 * @param {string} doc
 * @returns {Array<[number, number]>}
 */
export function recognizedCountAnchorRanges(doc) {
  const ranges = [];
  const globalAnchors = [...mosaicCountPatterns(), ...totalExportsPatterns()];
  for (const re of globalAnchors) {
    re.lastIndex = 0;
    let match;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
    while ((match = re.exec(doc))) {
      ranges.push([match.index, match.index + match[0].length]);
      if (match.index === re.lastIndex) re.lastIndex++;
    }
  }
  const singleAnchors = [
    HERO_RE,
    SECTION6_SUMMARY_RE,
    SECTION6_TOTAL_RE,
    CATALOG_HEADER_DOCUMENTED_RE,
    CATALOG_LIVE_LIB_RE,
    CATALOG_FOOTER_RE,
  ];
  for (const re of singleAnchors) {
    const match = re.exec(doc);
    if (match) ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/**
 * The fail-closed set: count-shaped claims that attach to NO known anchor, are
 * NOT on a Historical versioning row, and carry NO inline count-exempt marker.
 * Each is a number the guard cannot verify against src/index.ts and that no one
 * declared as deliberately non-derived — exactly the class that used to pass
 * GREEN.
 * @param {string} doc
 * @param {Map<number, VersionTableRowStatus>} [historicalStatusByLine]
 * @returns {Array<{ line: number, number: string, text: string, lineText: string }>}
 */
export function findUnrecognizedCountClaims(doc, historicalStatusByLine = new Map()) {
  const ranges = recognizedCountAnchorRanges(doc);
  const lines = doc.split("\n");
  const unrecognized = [];
  for (const claim of extractCountShapedClaims(doc)) {
    const start = claim.index;
    const end = claim.index + claim.matchText.length;
    const covered = ranges.some(([s, e]) => start < e && end > s);
    if (covered) continue;
    if (historicalStatusByLine.get(claim.line) === "Historical") continue;
    const lineText = lines[claim.line - 1] ?? "";
    if (COUNT_EXEMPT_MARKER_RE.test(lineText)) continue;
    unrecognized.push({
      line: claim.line,
      number: claim.number,
      text: claim.matchText.replace(/\s+/g, " ").trim(),
      lineText: lineText.trim().slice(0, 160),
    });
  }
  return unrecognized;
}
