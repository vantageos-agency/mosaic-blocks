#!/usr/bin/env node
/**
 * docs-counts.mjs — derives the canonical Mosaic* component / total-export
 * counts from `src/index.ts` and writes them into the live (non-Historical)
 * count claims of `README.md` and `docs/components-catalog.md`.
 *
 * Why this exists (Day 129 doctrine — "dériver, jamais taper"):
 *   `src/__tests__/readme-matches-exports.test.ts` already VERIFIES these
 *   counts against src/index.ts, but nothing PRODUCED them — a human typed
 *   the number, and a CI guard scoped to a single branch cannot see an
 *   inconsistency that only exists after two branches are composed (two PRs
 *   each add one component, each says "134" in isolation, both green; after
 *   merge the real number is 135 and the second-merged PR's text is stale on
 *   main). This script is the missing PRODUCER: run it, and the count is
 *   always exactly what `src/index.ts` says, never what a human remembered.
 *
 * Counting definition AND every count-claim anchor regex: imported from
 * `scripts/docs-counts-shared.mjs`, the SINGLE shared module also imported
 * by `src/__tests__/readme-matches-exports.test.ts`. This file defines and
 * maintains NO regex of its own for detecting a count claim — a second,
 * drifting definition of "what counts as a count claim" is exactly the
 * defect this script exists to close (see docs-counts-shared.mjs's header
 * comment for the full history).
 *
 * Modes:
 *   pnpm docs:counts          -> rewrites the live count claims in place
 *   pnpm docs:counts --check  -> writes nothing; exits non-zero (naming
 *                                 file + line + found + expected) if any
 *                                 live claim has drifted from the derived
 *                                 count
 *
 * Deliberately NEVER touched (dated fact, not live state):
 *   - Any row of README.md's "## 14. Versioning & Changelog" table whose
 *     Status column reads "Historical". Its count was true the day it was
 *     written; rewriting it would falsify history. Classification is read
 *     from the Status column, exactly like the guard test — never from
 *     sentence wording.
 *   - docs/components-catalog.md's curated-subset counts ("82 Mosaic*
 *     components + 10 hooks", "Total unique ... documented: **82**") — those
 *     are a human-curated subset, not a src/index.ts mirror, and are already
 *     out of scope for the drift guard by design.
 *
 * Fail-closed by construction, at TWO independent levels:
 *   1. Per-anchor: every dedicated single-sentence anchor this script relies
 *      on (HERO_RE, SECTION6_SUMMARY_RE, SECTION6_TOTAL_RE for README.md;
 *      CATALOG_HEADER_DOCUMENTED_RE, CATALOG_LIVE_LIB_RE, CATALOG_FOOTER_RE
 *      for docs/components-catalog.md) is asserted PRESENT in its file
 *      before any scan runs. If even ONE of these anchors is missing (a
 *      single sentence reworded), the script throws immediately, naming
 *      that anchor's export and the file — it does NOT silently fall
 *      through to the file-level check below, where nine other still-intact
 *      anchors would keep `matchCount > 0` and hide the loss.
 *   2. Per-file (belt): the generic `matchCount === 0` check still guards
 *      the degenerate case where EVERY count-wording in a file changes at
 *      once, so the generic scanner (mosaicCountPatterns/totalExportsPatterns)
 *      never silently reports "0 found, all good" either.
 * Together, per-anchor and per-file close two different blind spots; neither
 * replaces the other.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATALOG_FOOTER_RE,
  CATALOG_HEADER_DOCUMENTED_RE,
  CATALOG_LIVE_LIB_RE,
  HERO_RE,
  SECTION6_SUMMARY_RE,
  SECTION6_TOTAL_RE,
  extractRealExports,
  extractVersionTableRowStatusByLine,
  lineNumberAt,
  mosaicCountPatterns,
  totalExportsPatterns,
} from "./docs-counts-shared.mjs";

// ---------------------------------------------------------------------------
// Per-anchor presence assertions — one dedicated regex per required sentence,
// checked BEFORE any generic scan runs. A single missing anchor throws by
// name; it can never be masked by other anchors in the same file still
// matching (the exact blind spot the file-level `matchCount === 0` check
// cannot see, since it only sums occurrences across ALL anchors in a file).
// ---------------------------------------------------------------------------

/** @typedef {{ name: string, regex: RegExp }} RequiredAnchor */

/** @type {RequiredAnchor[]} */
const README_REQUIRED_ANCHORS = [
  { name: "HERO_RE", regex: HERO_RE },
  { name: "SECTION6_SUMMARY_RE", regex: SECTION6_SUMMARY_RE },
  { name: "SECTION6_TOTAL_RE", regex: SECTION6_TOTAL_RE },
];

/** @type {RequiredAnchor[]} */
const CATALOG_REQUIRED_ANCHORS = [
  { name: "CATALOG_HEADER_DOCUMENTED_RE", regex: CATALOG_HEADER_DOCUMENTED_RE },
  { name: "CATALOG_LIVE_LIB_RE", regex: CATALOG_LIVE_LIB_RE },
  { name: "CATALOG_FOOTER_RE", regex: CATALOG_FOOTER_RE },
];

/**
 * @param {string} label human-readable file label for the error message
 * @param {string} src the doc source to check
 * @param {RequiredAnchor[]} anchors
 */
function assertRequiredAnchorsPresent(label, src, anchors) {
  const missing = anchors.filter(({ regex }) => !regex.test(src));
  if (missing.length > 0) {
    const details = missing
      .map(({ name }) => `  - ${name} (scripts/docs-counts-shared.mjs)`)
      .join("\n");
    throw new Error(
      `docs-counts: ${missing.length} required anchor(s) not found in ${label} — a sentence this script depends on to keep the count derived was reworded (or removed) without updating the matching regex:\n${details}\n\nFix: either restore the sentence's wording, or update the named anchor(s) in scripts/docs-counts-shared.mjs to match the new phrasing.`,
    );
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INDEX_PATH = resolve(ROOT, "src", "index.ts");
const README_PATH = resolve(ROOT, "README.md");
const CATALOG_PATH = resolve(ROOT, "docs", "components-catalog.md");

const CHECK_MODE = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// 1. Derive the canonical counts from src/index.ts.
// ---------------------------------------------------------------------------

function deriveCounts() {
  const indexSource = readFileSync(INDEX_PATH, "utf-8");
  const realExports = extractRealExports(indexSource);
  if (realExports.size === 0) {
    throw new Error(
      `docs-counts: extracted ZERO named exports from ${INDEX_PATH} — the extraction regex no longer matches src/index.ts's shape. Refusing to write a bogus '0' count. Fix extractRealExports in scripts/docs-counts-shared.mjs before rerunning.`,
    );
  }
  const mosaicCount = [...realExports].filter((name) => name.startsWith("Mosaic")).length;
  if (mosaicCount === 0) {
    throw new Error(
      "docs-counts: extracted exports from src/index.ts but NONE start with 'Mosaic' — " +
        "refusing to write a bogus '0 Mosaic* components' count. Something upstream broke.",
    );
  }
  return { mosaicCount, totalExports: realExports.size };
}

// ---------------------------------------------------------------------------
// 2. Generic scan + rewrite — walks EVERY occurrence of the shared
//    mosaic-count / total-exports patterns in a doc, records drift, and
//    (in write mode) forces every live occurrence to the expected value.
//    README's Versioning-table Historical rows are read via the shared
//    classifier and left byte-for-byte untouched, exactly like the guard.
// ---------------------------------------------------------------------------

/**
 * @param {string} doc
 * @param {RegExp} pattern a FRESH RegExp from mosaicCountPatterns()/totalExportsPatterns()
 * @param {number} expectedValue
 * @param {Map<number,string>} historicalStatusByLine only non-empty for README
 * @returns {{ drift: Array<{line:number, found:string, expected:string, snippet:string}>, rewritten: string }}
 */
function scanAndRewrite(doc, pattern, expectedValue, historicalStatusByLine) {
  const drift = [];
  const rewritten = doc.replace(pattern, (full, captured, offset) => {
    const line = lineNumberAt(doc, offset);
    if (historicalStatusByLine.get(line) === "Historical") {
      return full; // dated fact — never rewritten, never asserted
    }
    const wanted = String(expectedValue);
    if (captured !== wanted) {
      drift.push({
        line,
        found: captured,
        expected: wanted,
        snippet: full.replace(/\s+/g, " ").trim().slice(0, 120),
      });
      return full.replace(captured, wanted);
    }
    return full;
  });
  return { drift, rewritten };
}

/**
 * @param {string} label human-readable file label for error/drift messages
 * @param {string} src the doc source to scan
 * @param {{mosaicCount:number, totalExports:number}} expected
 * @param {Map<number,string>} historicalStatusByLine
 * @returns {{ rewritten: string, drift: Array<{file:string, line:number, found:string, expected:string, snippet:string}>, matchCount: number }}
 */
function processDoc(label, src, expected, historicalStatusByLine) {
  let rewritten = src;
  const allDrift = [];
  let matchCount = 0;

  for (const pattern of mosaicCountPatterns()) {
    const before = (rewritten.match(pattern) ?? []).length;
    matchCount += before;
    const result = scanAndRewrite(rewritten, pattern, expected.mosaicCount, historicalStatusByLine);
    rewritten = result.rewritten;
    for (const d of result.drift) allDrift.push({ file: label, ...d });
  }
  for (const pattern of totalExportsPatterns()) {
    const before = (rewritten.match(pattern) ?? []).length;
    matchCount += before;
    const result = scanAndRewrite(
      rewritten,
      pattern,
      expected.totalExports,
      historicalStatusByLine,
    );
    rewritten = result.rewritten;
    for (const d of result.drift) allDrift.push({ file: label, ...d });
  }

  if (matchCount === 0) {
    throw new Error(
      `docs-counts: extracted ZERO count-claim occurrences from ${label} — did all count wording change? Update mosaicCountPatterns()/totalExportsPatterns() in scripts/docs-counts-shared.mjs to match the new phrasing (this sanity check exists so the scanner never silently stops checking anything).`,
    );
  }

  return { rewritten, drift: allDrift, matchCount };
}

function main() {
  const expected = deriveCounts();
  const readmeSrc = readFileSync(README_PATH, "utf-8");
  const catalogSrc = readFileSync(CATALOG_PATH, "utf-8");

  assertRequiredAnchorsPresent(README_PATH, readmeSrc, README_REQUIRED_ANCHORS);
  assertRequiredAnchorsPresent(CATALOG_PATH, catalogSrc, CATALOG_REQUIRED_ANCHORS);

  const historicalStatusByLine = extractVersionTableRowStatusByLine(readmeSrc);

  const readmeResult = processDoc(README_PATH, readmeSrc, expected, historicalStatusByLine);
  const catalogResult = processDoc(CATALOG_PATH, catalogSrc, expected, new Map());

  const allDrift = [...readmeResult.drift, ...catalogResult.drift];

  if (CHECK_MODE) {
    if (allDrift.length > 0) {
      const details = allDrift
        .map(
          (d) =>
            `  - ${d.file}:${d.line} found ${d.found}, expected ${d.expected} — "${d.snippet}"`,
        )
        .join("\n");
      console.error(
        `docs-counts --check: ${allDrift.length} stale count claim(s) found (derived from ` +
          `src/index.ts: ${expected.mosaicCount} Mosaic* components, ${expected.totalExports} total ` +
          `named exports):\n${details}\n\nFix: run \`pnpm docs:counts\` to regenerate the derived counts.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `docs-counts --check: OK — all live count claims match src/index.ts (${expected.mosaicCount} Mosaic* components, ${expected.totalExports} total named exports).`,
    );
    return;
  }

  if (readmeSrc !== readmeResult.rewritten) writeFileSync(README_PATH, readmeResult.rewritten);
  if (catalogSrc !== catalogResult.rewritten) writeFileSync(CATALOG_PATH, catalogResult.rewritten);
  console.log(
    `docs-counts: derived ${expected.mosaicCount} Mosaic* components / ${expected.totalExports} total named exports from src/index.ts and wrote them into README.md${readmeSrc !== readmeResult.rewritten ? " (changed)" : " (already current)"} and docs/components-catalog.md${catalogSrc !== catalogResult.rewritten ? " (changed)" : " (already current)"}.`,
  );
}

main();
