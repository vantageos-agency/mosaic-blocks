/**
 * Guard test — README.md must never cite a component that is not actually
 * exported, and never advertise a component/export count that drifts from
 * the real `src/index.ts` surface.
 *
 * Trigger: README.md shipped to npm (via `package.json` `files: ["README.md"]`)
 * advertised a full "Debate" section (`MosaicDebateRoom`, `MosaicDebateTimer`,
 * `MosaicDebateParticipant` — 11 components) and an "85 components" changelog
 * entry, while `src/index.ts` exported ZERO debate components and the real
 * count was already different. The lie shipped straight to every consumer.
 *
 * This test is the structural guard against relapse:
 *   1. Every `Mosaic*` token that appears in README.md as a cited export
 *      (table cell, prose, import statement, JSX usage) MUST be a real
 *      named export of `src/index.ts`. Any `Mosaic*` token in README.md that
 *      is NOT exported is a "phantom component" — fails RED with its name.
 *   2. Every bare integer that README.md claims as a component/export count
 *      (patterns like "N exported", "N components", "N Mosaic*") MUST match
 *      the real count computed from `src/index.ts`. A stale number fails RED
 *      citing both numbers.
 *
 * Deliberately NOT enforced (documented, not silent):
 *   - Per-category counts inside the "Component Catalogue Summary" table
 *     (Section 6) are informative groupings, not machine-derived — the
 *     total row IS enforced (see above), the per-row split is a human
 *     curation the phantom-name check already keeps honest (every name
 *     cited in that table must be real).
 *   - Prose mentions of unrelated numbers (browser versions, peer dep
 *     semver ranges, port numbers) are not "component counts" and are out
 *     of this guard's scope by design — this guard targets the specific
 *     "phantom component" and "stale count" failure modes only.
 *
 * Structural exemption for the "## 14. Versioning & Changelog" table
 * (README.md): a row's Mosaic* count is a DATED FACT, not a live claim,
 * when that row's **Status** column reads "Historical" — it says what was
 * true at that release, and must NOT be forced to match today's count.
 * Only rows whose Status column reads "Current" assert against the live
 * `src/index.ts` count.
 *
 * This exemption is READ FROM THE TABLE STRUCTURE (the Status column of
 * each row), never from the wording of the sentence. There is no verb
 * keyword-list ("shipped" vs "exported" vs anything else) anywhere in this
 * guard — a keyword list is just an enumeration that a future rewrite
 * evades with the next synonym. If a row in this table carries a Mosaic*
 * count and the guard cannot read its Status column (missing, or not one
 * of "Current"/"Historical"), the guard FAILS LOUDLY naming the file and
 * line — it never silently drops the row from enforcement.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOG_FOOTER_RE,
  CATALOG_HEADER_DOCUMENTED_RE,
  CATALOG_LIVE_LIB_RE,
  HERO_RE,
  SECTION6_SUMMARY_RE,
  SECTION6_TOTAL_RE,
  extractCatalogDocumentedMosaicNames,
  extractCitedMosaicTokens,
  extractRealExports,
  extractRealTypeExports,
  extractVersionTableRowStatusByLine,
  lineNumberAt,
  mosaicCountPatterns,
  totalExportsPatterns,
} from "../../../scripts/docs-counts-shared.mjs";

// Three levels up: this file lives in src/__tests__/derived/. It moved one level
// deeper when it was excluded from the PR run, and the hop silently pointed
// REPO_ROOT at src/ — the suite then failed to even LOAD, and vitest reported
// "no tests" rather than a failure anyone would read as one. Hence the count
// assertion in CI: a suite that collects zero tests is not a suite that found
// nothing wrong.
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const README_PATH = path.resolve(REPO_ROOT, "README.md");
const INDEX_PATH = path.resolve(REPO_ROOT, "src", "index.ts");
const CATALOG_PATH = path.resolve(REPO_ROOT, "docs", "components-catalog.md");

function readFile(p: string): string {
  return fs.readFileSync(p, "utf-8");
}

/**
 * Counting definition, every dedicated single-sentence anchor regex, and the
 * two generic whole-document count-claim pattern sets are ALL imported from
 * `scripts/docs-counts-shared.mjs` — the SAME module `scripts/docs-counts.mjs`
 * (the producer) imports. This guard defines no count-claim regex of its
 * own: a regex duplicated here and there would be two sources of truth for
 * "what counts as a stale count", which is exactly the defect this whole
 * pairing exists to close (see docs-counts-shared.mjs's header comment).
 */
type VersionTableRowStatus = "Current" | "Historical" | "unclassified";

type GenericCountClaim = {
  line: number;
  snippet: string;
  claimed: number;
  kind: "mosaic-count" | "total-exports-count";
  /**
   * Only populated for `kind === "mosaic-count"` claims that land on a line
   * belonging to the "## 14. Versioning & Changelog" table. `undefined`
   * means the claim is outside that table (e.g. the Section 1 hero line,
   * the Section 6 summary, or docs/components-catalog.md prose) and is
   * always asserted against the live count, exactly as before.
   */
  rowStatus?: VersionTableRowStatus;
};

function extractGenericCountClaims(doc: string): GenericCountClaim[] {
  const claims: GenericCountClaim[] = [];
  const seenAt = new Set<string>(); // dedupe: bold pattern + bare pattern can both stage-match the same span start
  const versionTableRowStatusByLine = extractVersionTableRowStatusByLine(doc);
  const scan = (patterns: RegExp[], kind: GenericCountClaim["kind"]) => {
    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
      while ((match = pattern.exec(doc))) {
        const key = `${kind}:${match.index}`;
        if (seenAt.has(key)) continue;
        seenAt.add(key);
        const line = lineNumberAt(doc, match.index);
        claims.push({
          line,
          snippet: match[0].replace(/\s+/g, " ").trim(),
          claimed: Number(match[1]),
          kind,
          rowStatus: kind === "mosaic-count" ? versionTableRowStatusByLine.get(line) : undefined,
        });
      }
    }
  };
  scan(mosaicCountPatterns(), "mosaic-count");
  scan(totalExportsPatterns(), "total-exports-count");
  return claims;
}

/**
 * Deliberately NOT covered by extractGenericCountClaims (documented, not
 * silent — a guard that ignores silently is a guard with a hole):
 *
 *   - "82 `Mosaic*` components" / "**82 `Mosaic*` components**" — the
 *     curated-SUBSET count of docs/components-catalog.md ("Documented: N
 *     Mosaic* components + M hooks"), not the full src/index.ts export count.
 *     This number is legitimately != 123. It IS still enforced, by the
 *     dedicated "documented-count claims match" test below (headerMatch /
 *     footerMatch against `actuallyDocumented`), just not by this generic
 *     scanner (which only knows the two FULL-surface invariants: 123 and 140).
 *   - "10 hooks" — same curated-subset reasoning as above.
 *   - "9 sections" in "123 exported `Mosaic*` components across 9 sections"
 *     — a section count, not a component/export count.
 *   - Semver strings ("0.4.6-alpha", "0.2.0-alpha") and Storybook/story
 *     counts ("Storybook 10, 30 stories") — unrelated numbers, out of this
 *     guard's scope by design (see the file-header doc comment above).
 */
function assertGenericCountClaimsAreCurrent(
  doc: string,
  docLabel: string,
  expected: { mosaicCount: number; totalExports: number },
): { total: number; asserted: number; exemptedHistorical: number; unclassified: number } {
  const claims = extractGenericCountClaims(doc);
  expect(
    claims.length,
    `${docLabel}: extracted zero generic count claims — did all count wording change? Update MOSAIC_COUNT_PATTERNS / TOTAL_EXPORTS_PATTERNS to match the new phrasing (this sanity check exists so the scanner never silently stops checking).`,
  ).toBeGreaterThan(0);

  // Step 1 — loud, named failure for any versioning-table row this guard
  // cannot classify. A row that carries a Mosaic* count but has no
  // recognizable Status column is NEVER silently skipped and NEVER
  // silently enforced against the live count — it fails CI by name.
  const unclassified = claims.filter(
    (claim) => claim.kind === "mosaic-count" && claim.rowStatus === "unclassified",
  );
  if (unclassified.length > 0) {
    const details = unclassified
      .map(
        (claim) =>
          `  - ${docLabel}:${claim.line} carries a Mosaic* count but the guard cannot classify it (no Status column) in "${claim.snippet}" — classify it (Status = "Current" or "Historical") or add a written exemption`,
      )
      .join("\n");
    throw new Error(
      `${docLabel} has ${unclassified.length} unclassifiable versioning-table row(s):\n${details}`,
    );
  }

  // Step 2 — structural exemption: a row whose Status column reads
  // "Historical" is a dated fact, exempted from the live-count assertion
  // regardless of the verb its sentence uses. Every other claim (Current
  // rows, and everything outside the versioning table entirely) IS
  // asserted, exactly as before.
  const exemptedHistorical = claims.filter(
    (claim) => claim.kind === "mosaic-count" && claim.rowStatus === "Historical",
  );
  const asserted = claims.filter(
    (claim) => !(claim.kind === "mosaic-count" && claim.rowStatus === "Historical"),
  );

  const stale = asserted.filter((claim) =>
    claim.kind === "mosaic-count"
      ? claim.claimed !== expected.mosaicCount
      : claim.claimed !== expected.totalExports,
  );

  if (stale.length > 0) {
    const details = stale
      .map(
        (claim) =>
          `  - ${docLabel}:${claim.line} claims ${claim.claimed} (expected ` +
          `${claim.kind === "mosaic-count" ? expected.mosaicCount : expected.totalExports}) ` +
          `in "${claim.snippet}"`,
      )
      .join("\n");
    throw new Error(
      `${docLabel} has ${stale.length} stale count claim(s) not caught by the ` +
        `wording-specific regexes above:\n${details}`,
    );
  }

  expect(stale).toEqual([]);

  // Step 3 — coverage inventory, asserted, never silent: every occurrence
  // this scanner found is either asserted, exempted-by-structure, or
  // unclassified (which would already have thrown above). If the
  // partition doesn't sum to the total, the classification logic itself
  // is broken — fail loudly rather than under-report coverage.
  const coverage = {
    total: claims.length,
    asserted: asserted.length,
    exemptedHistorical: exemptedHistorical.length,
    unclassified: unclassified.length,
  };
  expect(
    coverage.asserted + coverage.exemptedHistorical + coverage.unclassified,
    `${docLabel} coverage inventory does not partition cleanly: asserted(${coverage.asserted}) + ` +
      `exemptedHistorical(${coverage.exemptedHistorical}) + unclassified(${coverage.unclassified}) ` +
      `!== total(${coverage.total})`,
  ).toBe(coverage.total);

  return coverage;
}

describe("README ↔ exports guard — no phantom components, no stale counts", () => {
  const readme = readFile(README_PATH);
  const indexSource = readFile(INDEX_PATH);
  const realExports = extractRealExports(indexSource);

  it("sanity: extracted a plausible number of real exports from src/index.ts", () => {
    // Guards the guard: if this regex ever breaks (e.g. index.ts restructured),
    // fail loudly instead of silently reporting zero phantoms.
    expect(realExports.size).toBeGreaterThan(50);
  });

  it("sanity: the versioning table's header still declares a Status column, and at least one row of each Status classifies", () => {
    // Guards the guard: the Historical-row exemption above is keyed on the
    // per-row Status column value, never on the header text — so a header
    // rename alone cannot silently defeat the classifier (verified: renaming
    // "Status" to "State" leaves per-row classification untouched, since
    // rows still say "Current"/"Historical" verbatim). What WOULD defeat the
    // classifier is the table's column ORDER changing (e.g. Status moved to
    // a different cell) — this sanity check fails loudly if that happens,
    // by requiring the header to still read "| Version | Status | Notes |"
    // AND requiring at least one row to classify as "Current" and one as
    // "Historical" (if the columns shifted, rows would classify as
    // "unclassified" instead, and this assertion would go to 0/0).
    expect(
      /\|\s*Version\s*\|\s*Status\s*\|\s*Notes\s*\|/.test(readme),
      'README.md "## 14. Versioning & Changelog" table header no longer reads ' +
        '"| Version | Status | Notes |" — did the table shape change? The Historical-row ' +
        "exemption reads the Status column by position; update extractVersionTableRowStatusByLine " +
        "if the column order changed.",
    ).toBe(true);
    const rowStatuses = [...extractVersionTableRowStatusByLine(readme).values()];
    expect(
      rowStatuses.filter((s) => s === "Current").length,
      "README.md versioning table has zero rows classified as Current — the per-row parser is broken.",
    ).toBeGreaterThan(0);
    expect(
      rowStatuses.filter((s) => s === "Historical").length,
      "README.md versioning table has zero rows classified as Historical — the per-row parser is broken.",
    ).toBeGreaterThan(0);
  });

  it("every Mosaic* component cited in README.md is a real export of src/index.ts", () => {
    const cited = extractCitedMosaicTokens(readme);
    const phantoms = cited.filter((name) => !realExports.has(name));

    if (phantoms.length > 0) {
      const details = phantoms
        .map((name) => `  - "${name}" is cited in README.md but NOT exported by src/index.ts`)
        .join("\n");
      throw new Error(
        `README.md cites ${phantoms.length} phantom component(s) that do not exist in the package's public API:\n${details}\n\nFix: either remove the phantom name from README.md, or export it for real from src/index.ts if it was supposed to exist.`,
      );
    }

    expect(phantoms).toEqual([]);
  });

  it("the real Mosaic* export count matches what README.md advertises", () => {
    const realMosaicComponentCount = [...realExports].filter((name) =>
      name.startsWith("Mosaic"),
    ).length;
    const realTotalExportCount = realExports.size;

    // README.md's Section 1 hero line: "It provides N opinionated ... components"
    const heroMatch = readme.match(HERO_RE);
    expect(
      heroMatch,
      "README.md hero line 'It provides N opinionated, fully-typed UI components' not found " +
        "— did the wording change? Update this guard's regex to match the new phrasing.",
    ).not.toBeNull();
    if (heroMatch) {
      const claimed = Number(heroMatch[1]);
      expect(
        claimed,
        `README.md hero claims ${claimed} components, but src/index.ts actually exports ` +
          `${realMosaicComponentCount} Mosaic* components. Update the README.md hero line.`,
      ).toBe(realMosaicComponentCount);
    }

    // Section 6 catalogue summary: "122 exported `Mosaic*` components across 9 sections"
    const catalogueMatch = readme.match(SECTION6_SUMMARY_RE);
    expect(
      catalogueMatch,
      "README.md Section 6 catalogue summary line not found — did the wording change? " +
        "Update this guard's regex to match the new phrasing.",
    ).not.toBeNull();
    if (catalogueMatch) {
      const claimedComponents = Number(catalogueMatch[1]);
      expect(
        claimedComponents,
        `README.md Section 6 claims ${claimedComponents} Mosaic* components, but ` +
          `src/index.ts actually exports ${realMosaicComponentCount}. Update Section 6.`,
      ).toBe(realMosaicComponentCount);
    }

    // Section 6 parenthetical total: "(139 total named exports including hooks, ...)"
    const totalMatch = readme.match(SECTION6_TOTAL_RE);
    expect(
      totalMatch,
      "README.md Section 6 '(N total named exports ...)' parenthetical not found — did the " +
        "wording change? Update this guard's regex to match the new phrasing.",
    ).not.toBeNull();
    if (totalMatch) {
      const claimedTotal = Number(totalMatch[1]);
      expect(
        claimedTotal,
        `README.md Section 6 claims ${claimedTotal} total named exports, but src/index.ts ` +
          `actually exports ${realTotalExportCount}. Update Section 6.`,
      ).toBe(realTotalExportCount);
    }
  });

  it("EVERY Mosaic*/total-exports count restated anywhere in README.md matches src/index.ts (not just the Section 1/6 lines above)", () => {
    const realMosaicComponentCount = [...realExports].filter((name) =>
      name.startsWith("Mosaic"),
    ).length;
    const coverage = assertGenericCountClaimsAreCurrent(readme, "README.md", {
      mosaicCount: realMosaicComponentCount,
      totalExports: realExports.size,
    });
    // Coverage inventory asserted, not silent: every occurrence found is
    // accounted for as asserted (live), exempted-by-structure (Historical
    // row), or unclassified (would already have thrown above).
    expect(coverage.unclassified).toBe(0);
    expect(coverage.asserted + coverage.exemptedHistorical).toBe(coverage.total);
  });

  it("package.json version and src/version.ts stay in lockstep", () => {
    const pkg = JSON.parse(readFile(path.resolve(REPO_ROOT, "package.json"))) as {
      version: string;
    };
    const versionTsSource = readFile(path.resolve(REPO_ROOT, "src", "version.ts"));
    const versionTsMatch = versionTsSource.match(/export const version = "([^"]+)";/);

    expect(
      versionTsMatch,
      'src/version.ts export const version = "..."; pattern not found — did the file change shape?',
    ).not.toBeNull();

    if (versionTsMatch) {
      expect(
        pkg.version,
        `package.json version "${pkg.version}" does not match src/version.ts version ` +
          `"${versionTsMatch[1]}". Bump both together.`,
      ).toBe(versionTsMatch[1]);
    }
  });
});

describe("components-catalog.md ↔ exports guard — no phantom components, no stale counts", () => {
  const catalog = readFile(CATALOG_PATH);
  const indexSource = readFile(INDEX_PATH);
  const realExports = extractRealExports(indexSource);
  const realTypeExports = extractRealTypeExports(indexSource);
  const realExportsAndTypes = new Set([...realExports, ...realTypeExports]);

  it("every Mosaic* component cited in docs/components-catalog.md is a real export of src/index.ts", () => {
    const cited = extractCitedMosaicTokens(catalog);
    // Type-only exports (e.g. `type MosaicQuickAction`) are legitimate real API
    // surface that code snippets may cite alongside the component they type —
    // only flag names that are neither a value export nor a type export.
    const phantoms = cited.filter((name) => !realExportsAndTypes.has(name));

    if (phantoms.length > 0) {
      const details = phantoms
        .map(
          (name) =>
            `  - "${name}" is cited in docs/components-catalog.md but NOT exported by src/index.ts`,
        )
        .join("\n");
      throw new Error(
        `docs/components-catalog.md cites ${phantoms.length} phantom component(s) that do not exist in the package's public API:\n${details}\n\nFix: either remove the phantom name from docs/components-catalog.md, or export it for real from src/index.ts if it was supposed to exist.`,
      );
    }

    expect(phantoms).toEqual([]);
  });

  it("docs/components-catalog.md's own documented-count claims match what it actually documents", () => {
    const realMosaicComponentCount = [...realExports].filter((name) =>
      name.startsWith("Mosaic"),
    ).length;
    const realTotalExportCount = realExports.size;
    const actuallyDocumented = extractCatalogDocumentedMosaicNames(catalog).size;

    // Header line: "Documented: **N Mosaic* components + M hooks** ..."
    const headerMatch = catalog.match(CATALOG_HEADER_DOCUMENTED_RE);
    expect(
      headerMatch,
      "docs/components-catalog.md header 'Documented: **N Mosaic* components + M hooks**' " +
        "line not found — did the wording change? Update this guard's regex to match the new phrasing.",
    ).not.toBeNull();
    if (headerMatch) {
      const claimedDocumented = Number(headerMatch[1]);
      expect(
        claimedDocumented,
        `docs/components-catalog.md header claims ${claimedDocumented} documented Mosaic* components, but the catalog's tables actually list ${actuallyDocumented}. Fix the header line or the tables.`,
      ).toBe(actuallyDocumented);
    }

    // Header line's live-library reference: "src/index.ts exports **122** `Mosaic*`
    // components and **139** total named exports"
    const liveLibMatch = catalog.match(CATALOG_LIVE_LIB_RE);
    expect(
      liveLibMatch,
      "docs/components-catalog.md 'src/index.ts exports **N** `Mosaic*` components and **M** " +
        "total named exports' line not found — did the wording change? Update this guard's " +
        "regex to match the new phrasing.",
    ).not.toBeNull();
    if (liveLibMatch) {
      const claimedRealMosaic = Number(liveLibMatch[1]);
      const claimedRealTotal = Number(liveLibMatch[2]);
      expect(
        claimedRealMosaic,
        `docs/components-catalog.md claims src/index.ts exports ${claimedRealMosaic} Mosaic* ` +
          `components, but it actually exports ${realMosaicComponentCount}. Update the line.`,
      ).toBe(realMosaicComponentCount);
      expect(
        claimedRealTotal,
        `docs/components-catalog.md claims src/index.ts exports ${claimedRealTotal} total named ` +
          `exports, but it actually exports ${realTotalExportCount}. Update the line.`,
      ).toBe(realTotalExportCount);
    }

    // Footer line: "Total unique `Mosaic*` components documented in this catalog: **N**"
    const footerMatch = catalog.match(CATALOG_FOOTER_RE);
    expect(
      footerMatch,
      "docs/components-catalog.md footer 'Total unique `Mosaic*` components documented in " +
        "this catalog: **N**' line not found — did the wording change? Update this guard's " +
        "regex to match the new phrasing.",
    ).not.toBeNull();
    if (footerMatch) {
      const claimedFooterTotal = Number(footerMatch[1]);
      expect(
        claimedFooterTotal,
        `docs/components-catalog.md footer claims ${claimedFooterTotal} documented Mosaic* components, but the catalog's tables actually list ${actuallyDocumented}. Fix the footer line or the tables.`,
      ).toBe(actuallyDocumented);
    }
  });

  it("EVERY Mosaic*/total-exports count restated anywhere in docs/components-catalog.md matches src/index.ts (not just the header line above) — closes the Eta-found blind spot", () => {
    const realMosaicComponentCount = [...realExports].filter((name) =>
      name.startsWith("Mosaic"),
    ).length;
    const coverage = assertGenericCountClaimsAreCurrent(catalog, "docs/components-catalog.md", {
      mosaicCount: realMosaicComponentCount,
      totalExports: realExports.size,
    });
    expect(coverage.unclassified).toBe(0);
    expect(coverage.asserted + coverage.exemptedHistorical).toBe(coverage.total);
  });

  it("docs/components-catalog.md never asserts a false '1:1 with src/index.ts' invariant", () => {
    // The catalog is a curated subset by design (see the two tests above). If it
    // ever re-claims full parity with src/index.ts, that claim must be true and
    // provable — which the tests above do not currently assert. Fail loudly
    // instead of silently shipping a false invariant again.
    const claims1to1 = /\(1:1 with `src\/index\.ts`\)/.test(catalog);
    expect(
      claims1to1,
      "docs/components-catalog.md claims '(1:1 with `src/index.ts`)' but this catalog is a " +
        "curated subset (see the header and footer). Either make the catalog truly 1:1 and add " +
        "a test proving it, or remove the false invariant claim.",
    ).toBe(false);
  });
});
