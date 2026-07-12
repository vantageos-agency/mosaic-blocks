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
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const README_PATH = path.resolve(REPO_ROOT, "README.md");
const INDEX_PATH = path.resolve(REPO_ROOT, "src", "index.ts");

function readFile(p: string): string {
  return fs.readFileSync(p, "utf-8");
}

/**
 * Extract every named VALUE export from src/index.ts (ignores `export type`
 * re-exports — types are not "components" and are not what README.md's
 * catalogue claims describe).
 */
function extractRealExports(indexSource: string): Set<string> {
  const names = new Set<string>();
  const exportBlockRe = /export(?:\s+type)?\s*\{([^}]*)\}\s*from\s*"[^"]+";/gs;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = exportBlockRe.exec(indexSource))) {
    const isTypeExport = match[0].trimStart().startsWith("export type");
    if (isTypeExport) continue;
    for (const rawName of match[1].split(",")) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;
      const asParts = trimmed.split(/\s+as\s+/);
      const exportedName = asParts[asParts.length - 1].trim();
      names.add(exportedName);
    }
  }
  return names;
}

/**
 * Extract every `Mosaic*` identifier-shaped token that appears anywhere in
 * README.md (prose, tables, code fences, imports, JSX).
 */
function extractCitedMosaicTokens(readme: string): string[] {
  const matches = readme.match(/\bMosaic[A-Za-z0-9]+\b/g) ?? [];
  return [...new Set(matches)];
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
    const heroMatch = readme.match(/It provides (\d+) opinionated/);
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
    const catalogueMatch = readme.match(
      /(\d+) exported `Mosaic\*` components across (\d+) sections/,
    );
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
    const totalMatch = readme.match(/\((\d+) total named exports/);
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
