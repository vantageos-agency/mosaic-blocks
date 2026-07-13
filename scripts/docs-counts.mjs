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
 * Counting definition: reused verbatim from
 * `src/__tests__/readme-matches-exports.test.ts` (`extractRealExports`,
 * `extractRealTypeExports`). This file is intentionally NOT re-implementing
 * its own counting logic — a second, drifting definition of "count" would be
 * exactly the defect this script exists to close. If the test's extraction
 * logic ever changes, update BOTH functions there and the mirror in this
 * file in lockstep — the extraction result is exercised end-to-end by
 * `src/__tests__/docs-counts.test.ts` and `src/__tests__/readme-matches-exports.test.ts`
 * against the real `src/index.ts`, so a divergence between the two
 * definitions would surface as a numeric mismatch between the two test
 * files rather than a dedicated unit test.
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
 * Fail-closed by construction: every anchor this script writes through is
 * matched by an explicit regex; if an anchor is not found in a target file,
 * the script throws immediately, naming the file and the anchor it expected
 * — it never silently skips a file or reports "0 found, all good".
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INDEX_PATH = resolve(ROOT, "src", "index.ts");
const README_PATH = resolve(ROOT, "README.md");
const CATALOG_PATH = resolve(ROOT, "docs", "components-catalog.md");

const CHECK_MODE = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// 1. Derive the canonical counts from src/index.ts — mirrors
//    extractRealExports / extractRealTypeExports in
//    src/__tests__/readme-matches-exports.test.ts EXACTLY. Do not diverge.
// ---------------------------------------------------------------------------

/** @param {string} indexSource @returns {Set<string>} */
function extractRealExports(indexSource) {
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

function deriveCounts() {
  const indexSource = readFileSync(INDEX_PATH, "utf-8");
  const realExports = extractRealExports(indexSource);
  if (realExports.size === 0) {
    throw new Error(
      `docs-counts: extracted ZERO named exports from ${INDEX_PATH} — the extraction regex no longer matches src/index.ts's shape. Refusing to write a bogus '0' count. Fix the regex (kept in lockstep with src/__tests__/readme-matches-exports.test.ts) before rerunning.`,
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
// 2. Versioning-table Historical/Current classification — mirrors
//    extractVersionTableRowStatusByLine in the guard test EXACTLY.
// ---------------------------------------------------------------------------

/** @param {string} doc @returns {Map<number, "Current"|"Historical"|"unclassified">} */
function extractVersionTableRowStatusByLine(doc) {
  const statusByLine = new Map();
  const semverCell = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*([^|]*)\|/;
  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = rowRe.exec(lines[i]);
    if (!match) continue;
    const versionCell = match[1].trim();
    if (!semverCell.test(versionCell)) continue;
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

function lineNumberAt(doc, index) {
  return doc.slice(0, index).split("\n").length;
}

// ---------------------------------------------------------------------------
// 3. Anchor definitions — one entry per live count claim this script owns.
//    Each anchor:
//      - `re`: matches the claim, capturing the number in group 1 (the FIRST
//        captured group is always "the number to replace"). Anchors that
//        capture two numbers (mosaic + total) list a second `re2`-style pair
//        via `groups: ["mosaicCount", "totalExports"]`.
//      - `expected(counts)`: value(s) this anchor must hold.
//      - `historicalAware`: if true, any match landing on a README
//        Versioning-table line classified "Historical" is skipped (dated
//        fact) rather than rewritten/asserted.
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   file: "README" | "CATALOG";
 *   label: string;
 *   re: RegExp;
 *   groups: Array<"mosaicCount" | "totalExports">;
 *   historicalAware?: boolean;
 * }} AnchorDef
 */

/** @type {AnchorDef[]} */
const ANCHORS = [
  {
    file: "README",
    label: "hero line ('It provides N opinionated')",
    re: /It provides (\d+) opinionated/g,
    groups: ["mosaicCount"],
  },
  {
    file: "README",
    label: "Section 6 summary ('N exported `Mosaic*` components across M sections')",
    re: /(\d+)(?= exported `Mosaic\*` components across \d+ sections)/g,
    groups: ["mosaicCount"],
  },
  {
    file: "README",
    label: "Section 6 parenthetical ('(N total named exports')",
    re: /(?<=\()(\d+)(?= total named exports)/g,
    groups: ["totalExports"],
  },
  {
    file: "README",
    label: "Versioning table row ('N exported `Mosaic*` components')",
    re: /(?<=\| )(\d+)(?= exported `Mosaic\*` components)/g,
    groups: ["mosaicCount"],
    historicalAware: true,
  },
  {
    file: "CATALOG",
    label:
      "header prose ('src/index.ts exports **N** `Mosaic*` components and **M** total named exports')",
    // Handles the line-wrapped variant too: number/keyword may be split
    // across a markdown line wrap (`**133**\n\`Mosaic*\`\ncomponents`).
    re: /exports\s*\*\*(\d+)\*\*\s*`Mosaic\*`\s*components and\s*\*\*(\d+)\*\*\s*total named exports/gs,
    groups: ["mosaicCount", "totalExports"],
  },
  {
    file: "CATALOG",
    label:
      "'Documented / exported ratio' section ('out of the **N** `Mosaic*` components (**M** total named exports)')",
    re: /out of the \*\*(\d+)\*\*\s*`Mosaic\*`\s*components \(\*\*(\d+)\*\*\s*total named exports\)/gs,
    groups: ["mosaicCount", "totalExports"],
  },
];

/**
 * Single pass: walks every match of `anchor.re` in `doc`, records drift for
 * any captured group that differs from `expected`, and produces a rewritten
 * copy of `doc` with every captured group forced to the expected value
 * (Historical-classified README rows are left byte-for-byte untouched).
 *
 * @param {string} doc
 * @param {AnchorDef} anchor
 * @param {{mosaicCount:number, totalExports:number}} expected
 * @param {Map<number,string>} historicalStatusByLine
 * @returns {{ drift: Array<{line:number, found:string, expected:string, snippet:string}>, rewritten: string }}
 */
function scanAndRewrite(doc, anchor, expected, historicalStatusByLine) {
  const drift = [];
  anchor.re.lastIndex = 0;
  const rewritten = doc.replace(anchor.re, (full, ...rest) => {
    // String.prototype.replace callback shape: (match, p1, p2, ..., offset, string[, groups])
    const offset = rest[rest.length - (typeof rest[rest.length - 1] === "object" ? 3 : 2)];
    const captures = rest.slice(0, anchor.groups.length);
    const line = lineNumberAt(doc, offset);

    if (anchor.historicalAware && historicalStatusByLine.get(line) === "Historical") {
      return full; // dated fact — never rewritten, never asserted
    }

    let out = full;
    for (let g = 0; g < anchor.groups.length; g++) {
      const found = captures[g];
      const key = anchor.groups[g];
      const wanted = String(expected[key]);
      if (found !== wanted) {
        drift.push({
          line,
          found,
          expected: wanted,
          snippet: full.replace(/\s+/g, " ").trim().slice(0, 120),
        });
        out = out.replace(found, wanted);
      }
    }
    return out;
  });
  return { drift, rewritten };
}

function loadFile(anchor) {
  return anchor.file === "README" ? README_PATH : CATALOG_PATH;
}

function main() {
  const expected = deriveCounts();
  const readmeSrc = readFileSync(README_PATH, "utf-8");
  const catalogSrc = readFileSync(CATALOG_PATH, "utf-8");
  const historicalStatusByLine = extractVersionTableRowStatusByLine(readmeSrc);

  const docs = { README: readmeSrc, CATALOG: catalogSrc };
  const nextDocs = { README: readmeSrc, CATALOG: catalogSrc };
  const allDrift = [];
  const anchorsSeenPerFile = { README: 0, CATALOG: 0 };

  for (const anchor of ANCHORS) {
    const src = nextDocs[anchor.file];
    const before = anchorsSeenPerFile[anchor.file];
    const matchCount = (src.match(anchor.re) ?? []).length;
    anchor.re.lastIndex = 0;
    anchorsSeenPerFile[anchor.file] = before + matchCount;
    if (matchCount === 0) {
      throw new Error(
        `docs-counts: anchor "${anchor.label}" (${loadFile(anchor)}) matched ZERO times — the anchor's wording/shape no longer exists in the file. Refusing to silently skip it: update ANCHORS in scripts/docs-counts.mjs to match the new phrasing, or restore the expected wording in the doc.`,
      );
    }
    const { drift, rewritten } = scanAndRewrite(src, anchor, expected, historicalStatusByLine);
    for (const d of drift) {
      allDrift.push({ file: loadFile(anchor), label: anchor.label, ...d });
    }
    nextDocs[anchor.file] = rewritten;
  }

  if (anchorsSeenPerFile.README === 0 || anchorsSeenPerFile.CATALOG === 0) {
    throw new Error(
      "docs-counts: zero anchors matched in one of the target files — refusing to report success.",
    );
  }

  if (CHECK_MODE) {
    if (allDrift.length > 0) {
      const details = allDrift
        .map(
          (d) =>
            `  - ${d.file}:${d.line} [${d.label}] found ${d.found}, expected ${d.expected} — "${d.snippet}"`,
        )
        .join("\n");
      console.error(
        `docs-counts --check: ${allDrift.length} stale count claim(s) found (derived from src/index.ts: ${expected.mosaicCount} Mosaic* components, ${expected.totalExports} total named exports):\n${details}\n\nFix: run \`pnpm docs:counts\` to regenerate the derived counts.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `docs-counts --check: OK — all live count claims match src/index.ts (${expected.mosaicCount} Mosaic* components, ${expected.totalExports} total named exports).`,
    );
    return;
  }

  if (docs.README !== nextDocs.README) writeFileSync(README_PATH, nextDocs.README);
  if (docs.CATALOG !== nextDocs.CATALOG) writeFileSync(CATALOG_PATH, nextDocs.CATALOG);
  console.log(
    `docs-counts: derived ${expected.mosaicCount} Mosaic* components / ` +
      `${expected.totalExports} total named exports from src/index.ts and wrote them into ` +
      `README.md${docs.README !== nextDocs.README ? " (changed)" : " (already current)"} and ` +
      `docs/components-catalog.md${docs.CATALOG !== nextDocs.CATALOG ? " (changed)" : " (already current)"}.`,
  );
}

main();
