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
 * Extract every named VALUE export from src/index.ts (ignores `export type`
 * re-exports — types are not "components").
 * @param {string} indexSource
 * @returns {Set<string>}
 */
export function extractRealExports(indexSource) {
  const names = new Set();
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
