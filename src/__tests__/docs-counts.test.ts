/**
 * Guard test for `scripts/docs-counts.mjs` — the PRODUCER that derives README.md
 * / docs/components-catalog.md count claims from `src/index.ts`, closing the
 * class of defect `readme-matches-exports.test.ts` could only VERIFY, never fix.
 *
 * Day 129 doctrine: "dériver, jamais taper". The concrete failure mode this
 * file proves closed is the one no per-branch CI run can ever see structurally:
 *
 *   Two PRs branch off the SAME main (say: 133 components). PR A adds one
 *   component and (correctly, from its own branch's point of view) bumps
 *   every count anchor to 134. PR A's CI is green — its own `src/index.ts`
 *   really does have 134 exports. PR B, branched at the same point, adds a
 *   DIFFERENT component and also bumps its anchors to 134. PR B's CI is also
 *   green, for the same honest reason. Neither branch can see the other.
 *
 *   PR A merges first: main is now truly at 134, and matches. PR B merges
 *   second: main's `src/index.ts` now has BOTH new exports (135 total), but
 *   PR B's markdown diff still asserts "134" — a number that was correct on
 *   PR B's own branch and is now stale on the composed main. No per-branch
 *   CI run could ever have caught this: the inconsistency exists only AFTER
 *   composition.
 *
 *   `pnpm docs:counts --check` run on the merged main is what closes this —
 *   it derives the count fresh from the actually-composed `src/index.ts`,
 *   at merge time, not at branch time.
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT_PATH = path.resolve(REPO_ROOT, "scripts", "docs-counts.mjs");
const SHARED_MODULE_PATH = path.resolve(REPO_ROOT, "scripts", "docs-counts-shared.mjs");

let workDir: string | undefined;

afterEach(() => {
  if (workDir) {
    rmSync(workDir, { recursive: true, force: true });
    workDir = undefined;
  }
});

/**
 * Builds a minimal, self-contained fixture repo (script + shared module +
 * src/index.ts + README.md + docs/components-catalog.md) at the exact
 * relative layout `docs-counts.mjs` expects (it resolves paths from its own
 * `import.meta.url`, not from `process.cwd()`, so the script — and the
 * shared module it imports — must live at `<fixture>/scripts/`).
 */
function makeFixture(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "docs-counts-fixture-"));
  mkdirSync(path.join(dir, "scripts"), { recursive: true });
  mkdirSync(path.join(dir, "src"), { recursive: true });
  mkdirSync(path.join(dir, "docs"), { recursive: true });
  cpSync(SCRIPT_PATH, path.join(dir, "scripts", "docs-counts.mjs"));
  cpSync(SHARED_MODULE_PATH, path.join(dir, "scripts", "docs-counts-shared.mjs"));
  return dir;
}

function writeIndex(dir: string, componentNames: string[]) {
  const exportLines = componentNames.map((n) => `export { ${n} } from "./components/${n}.js";`);
  writeFileSync(path.join(dir, "src", "index.ts"), `${exportLines.join("\n")}\n`);
}

function baseReadme(mosaicCount: number, totalExports: number): string {
  return [
    `It provides ${mosaicCount} opinionated, fully-typed UI components.`,
    "",
    `${mosaicCount} exported \`Mosaic*\` components across 1 sections (${totalExports} total named exports).`,
    "",
    "## 14. Versioning & Changelog",
    "",
    "| Version | Status | Notes |",
    "|---|---|---|",
    `| \`0.1.0\` | Current | ${mosaicCount} exported \`Mosaic*\` components |`,
    "",
  ].join("\n");
}

function baseCatalog(mosaicCount: number, totalExports: number): string {
  return [
    "# Components Catalog",
    "",
    "Documented: **1 Mosaic* components + 0 hooks** — a curated subset.",
    `\`src/index.ts\` exports **${mosaicCount}** \`Mosaic*\` components and **${totalExports}** total named exports.`,
    "",
    "## Documented / exported ratio",
    "",
    `It documents **1 \`Mosaic*\` components** and **0 hooks** out of the **${mosaicCount}** \`Mosaic*\``,
    `components (**${totalExports}** total named exports) that \`src/index.ts\` actually exports.`,
    "",
    "Total unique `Mosaic*` components documented in this catalog: **1**",
    "",
  ].join("\n");
}

function runCheck(dir: string): { status: number; output: string } {
  try {
    const output = execFileSync("node", ["scripts/docs-counts.mjs", "--check"], {
      cwd: dir,
      encoding: "utf-8",
    });
    return { status: 0, output };
  } catch (err) {
    const e = err as { status: number; stderr: string; stdout: string };
    return { status: e.status, output: `${e.stdout}${e.stderr}` };
  }
}

function runWrite(dir: string): { status: number; output: string } {
  try {
    const output = execFileSync("node", ["scripts/docs-counts.mjs"], {
      cwd: dir,
      encoding: "utf-8",
    });
    return { status: 0, output };
  } catch (err) {
    const e = err as { status: number; stderr: string; stdout: string };
    return { status: e.status, output: `${e.stdout}${e.stderr}` };
  }
}

describe("docs-counts.mjs — sanity on a minimal fixture", () => {
  it("--check is green when the fixture's counts already match src/index.ts", () => {
    workDir = makeFixture();
    writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]);
    writeFileSync(path.join(workDir, "README.md"), baseReadme(2, 2));
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), baseCatalog(2, 2));

    const result = runCheck(workDir);
    expect(result.status, result.output).toBe(0);
  });
});

describe("docs-counts.mjs — the post-composition blind spot (the test that must actually bite)", () => {
  it("PR A and PR B each honestly bump 133->134 on their own branch (both green in isolation); " +
    "once BOTH merge, src/index.ts truly has 135 but the composed README still says 134 — " +
    "--check must catch THIS, which no single branch's own CI run could ever have seen", () => {
    workDir = makeFixture();

    // Base main: 133 components (mirrors this repo's real starting point).
    const baseNames = Array.from({ length: 133 }, (_, i) => `MosaicBase${i}`);

    // --- Simulate PR A in isolation: adds ONE component, bumps to 134. ---
    const branchANames = [...baseNames, "MosaicFromBranchA"];
    writeIndex(workDir, branchANames);
    writeFileSync(path.join(workDir, "README.md"), baseReadme(134, 134));
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), baseCatalog(134, 134));
    const branchACheck = runCheck(workDir);
    expect(
      branchACheck.status,
      `PR A in isolation must be green (its own src/index.ts really has 134 exports): ${branchACheck.output}`,
    ).toBe(0);

    // --- Simulate PR B in isolation (branched from the SAME base, never
    // saw PR A): adds a DIFFERENT component, also honestly bumps to 134. ---
    const branchBNames = [...baseNames, "MosaicFromBranchB"];
    writeIndex(workDir, branchBNames);
    writeFileSync(path.join(workDir, "README.md"), baseReadme(134, 134));
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), baseCatalog(134, 134));
    const branchBCheck = runCheck(workDir);
    expect(
      branchBCheck.status,
      `PR B in isolation must be green (its own src/index.ts really has 134 exports): ${branchBCheck.output}`,
    ).toBe(0);

    // --- Compose: main now has BOTH new exports (135 real), but the
    // markdown merged in is PR B's (still says 134 — stale post-composition,
    // and structurally invisible to either branch's own CI run). ---
    const mergedNames = [...baseNames, "MosaicFromBranchA", "MosaicFromBranchB"];
    writeIndex(workDir, mergedNames); // 135 real
    // README/catalog left exactly as PR B wrote them (134) — this is the bug.
    const mergedCheckBeforeFix = runCheck(workDir);
    expect(
      mergedCheckBeforeFix.status,
      "post-composition drift MUST be red: src/index.ts has 135 exports but README/catalog still say 134",
    ).not.toBe(0);
    expect(mergedCheckBeforeFix.output).toContain("134");
    expect(mergedCheckBeforeFix.output).toContain("135");

    // --- The fix: regenerate from the composed source of truth. ---
    const writeResult = runWrite(workDir);
    expect(writeResult.status, writeResult.output).toBe(0);

    const mergedCheckAfterFix = runCheck(workDir);
    expect(
      mergedCheckAfterFix.status,
      `after \`pnpm docs:counts\`, --check must be green: ${mergedCheckAfterFix.output}`,
    ).toBe(0);

    const readmeAfter = readFileSync(path.join(workDir, "README.md"), "utf-8");
    expect(readmeAfter).toContain("135");
    expect(readmeAfter).not.toContain("It provides 134");
  });
});

describe("docs-counts.mjs — Historical rows are dated fact, never rewritten/asserted", () => {
  it("a Historical row's stale count is left untouched by both --check and the write mode", () => {
    workDir = makeFixture();
    writeIndex(workDir, ["MosaicAlpha", "MosaicBeta", "MosaicGamma"]);
    const readme = [
      "It provides 3 opinionated, fully-typed UI components.",
      "",
      "3 exported `Mosaic*` components across 1 sections (3 total named exports).",
      "",
      "## 14. Versioning & Changelog",
      "",
      "| Version | Status | Notes |",
      "|---|---|---|",
      "| `0.2.0` | Current | 3 exported `Mosaic*` components |",
      "| `0.1.0` | Historical | 2 exported `Mosaic*` components — dated fact, was true at release |",
      "",
    ].join("\n");
    writeFileSync(path.join(workDir, "README.md"), readme);
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), baseCatalog(3, 3));

    const check1 = runCheck(workDir);
    expect(check1.status, check1.output).toBe(0);

    runWrite(workDir);
    const after = readFileSync(path.join(workDir, "README.md"), "utf-8");
    expect(after).toContain("| `0.1.0` | Historical | 2 exported `Mosaic*` components");
  });
});

describe("docs-counts.mjs — per-anchor blind spot: losing ONE anchor out of ten must never be hidden by the other nine", () => {
  // Full-featured README / catalog fixtures that exercise EVERY dedicated
  // anchor the producer relies on (HERO_RE, SECTION6_SUMMARY_RE,
  // SECTION6_TOTAL_RE for README; CATALOG_HEADER_DOCUMENTED_RE,
  // CATALOG_LIVE_LIB_RE, CATALOG_FOOTER_RE for the catalog), plus enough
  // generic mosaicCountPatterns()/totalExportsPatterns() occurrences
  // (the Versioning-table row) that `matchCount` NEVER drops to zero when
  // exactly one dedicated anchor is reworded — this is what proves the
  // file-level `matchCount === 0` check alone cannot catch this class, only
  // the per-anchor check added by this fix can.
  function fullReadme(n: number): string {
    return [
      `It provides ${n} opinionated, fully-typed UI components.`,
      "",
      `${n} exported \`Mosaic*\` components across 1 sections (${n} total named exports).`,
      "",
      "## 14. Versioning & Changelog",
      "",
      "| Version | Status | Notes |",
      "|---|---|---|",
      `| \`0.1.0\` | Current | ${n} exported \`Mosaic*\` components |`,
      "",
    ].join("\n");
  }

  function fullCatalog(n: number): string {
    return [
      "# Components Catalog",
      "",
      "Documented: **1 Mosaic* components + 0 hooks** — a curated subset.",
      `\`src/index.ts\` exports **${n}** \`Mosaic*\` components and **${n}** total named exports.`,
      "",
      "## Documented / exported ratio",
      "",
      `It documents **1 \`Mosaic*\` components** and **0 hooks** out of the **${n}** \`Mosaic*\``,
      `components (**${n}** total named exports) that \`src/index.ts\` actually exports.`,
      "",
      "Total unique `Mosaic*` components documented in this catalog: **1**",
      "",
    ].join("\n");
  }

  const readmeAnchorMutations: Array<{ name: string; mutate: (src: string) => string }> = [
    {
      name: "HERO_RE",
      mutate: (src) => src.replace("It provides 2 opinionated", "It ships 2 curated"),
    },
    {
      name: "SECTION6_SUMMARY_RE",
      mutate: (src) =>
        src.replace(
          "2 exported `Mosaic*` components across 1 sections",
          "2 shipped `Mosaic*` items across 1 sections",
        ),
    },
    {
      name: "SECTION6_TOTAL_RE",
      mutate: (src) => src.replace("(2 total named exports)", "(2 total exported names)"),
    },
  ];

  const catalogAnchorMutations: Array<{ name: string; mutate: (src: string) => string }> = [
    {
      name: "CATALOG_HEADER_DOCUMENTED_RE",
      mutate: (src) =>
        src.replace(
          "Documented: **1 Mosaic* components + 0 hooks**",
          "Documented: 1 Mosaic components plus 0 hooks",
        ),
    },
    {
      name: "CATALOG_LIVE_LIB_RE",
      mutate: (src) =>
        src.replace(
          "`src/index.ts` exports **2** `Mosaic*` components and **2** total named exports.",
          "`src/index.ts` ships **2** `Mosaic*` components with **2** total named exports.",
        ),
    },
    {
      name: "CATALOG_FOOTER_RE",
      mutate: (src) =>
        src.replace(
          "Total unique `Mosaic*` components documented in this catalog: **1**",
          "Grand total of unique `Mosaic*` components documented here: **1**",
        ),
    },
  ];

  it("sanity: the full-featured fixture (all anchors intact) is green", () => {
    workDir = makeFixture();
    writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]);
    writeFileSync(path.join(workDir, "README.md"), fullReadme(2));
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), fullCatalog(2));
    const result = runCheck(workDir);
    expect(result.status, result.output).toBe(0);
  });

  for (const { name, mutate } of readmeAnchorMutations) {
    it(`README.md losing ONLY the ${name} anchor (all others intact) must make the PRODUCER go RED naming ${name} — not silently pass because the other anchors still match`, () => {
      workDir = makeFixture();
      writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]);
      const mutated = mutate(fullReadme(2));
      expect(mutated, `mutation for ${name} did not land — fixture text not found`).not.toBe(
        fullReadme(2),
      );
      writeFileSync(path.join(workDir, "README.md"), mutated);
      writeFileSync(path.join(workDir, "docs", "components-catalog.md"), fullCatalog(2));

      const result = runCheck(workDir);
      expect(
        result.status,
        `producer must go RED when ${name} is reworded away, even though other anchors ` +
          `still match (matchCount stays > 0): ${result.output}`,
      ).not.toBe(0);
      expect(result.output).toContain(name);
    });
  }

  for (const { name, mutate } of catalogAnchorMutations) {
    it(`docs/components-catalog.md losing ONLY the ${name} anchor (all others intact) must make the PRODUCER go RED naming ${name} — not silently pass because the other anchors still match`, () => {
      workDir = makeFixture();
      writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]);
      const mutated = mutate(fullCatalog(2));
      expect(mutated, `mutation for ${name} did not land — fixture text not found`).not.toBe(
        fullCatalog(2),
      );
      writeFileSync(path.join(workDir, "README.md"), fullReadme(2));
      writeFileSync(path.join(workDir, "docs", "components-catalog.md"), mutated);

      const result = runCheck(workDir);
      expect(
        result.status,
        `producer must go RED when ${name} is reworded away, even though other anchors ` +
          `still match (matchCount stays > 0): ${result.output}`,
      ).not.toBe(0);
      expect(result.output).toContain(name);
    });
  }

  it("the exact reviewer-cited mutation (README hero 'It provides N opinionated' -> 'It ships N curated') is caught by the producer, naming HERO_RE", () => {
    workDir = makeFixture();
    writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]);
    writeFileSync(
      path.join(workDir, "README.md"),
      fullReadme(2).replace("It provides 2 opinionated", "It ships 2 curated"),
    );
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), fullCatalog(2));

    const result = runCheck(workDir);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("HERO_RE");
  });
});

describe("docs-counts-shared.mjs — sharing is PROVEN, not just claimed by comment", () => {
  it("a brand-new count wording added ONCE to the shared module is detected by BOTH the " +
    "producer script (docs-counts.mjs) and a guard-style generic scan built from the same " +
    "exported patterns — if either one used its own private copy of the patterns instead of " +
    "importing this module, one of the two assertions below would go blind and fail", () => {
    workDir = makeFixture();

    // Patch the FIXTURE's copy of the shared module (not the real repo's) to
    // add exactly one brand-new count-claim wording no other test has ever
    // used: "N brand-new-wording `Mosaic*` units". Both the sanity-check
    // guard-style scan below AND the producer script import THIS SAME
    // patched file — there is no way to fake this by hand-adding a regex to
    // only one of the two consumers.
    const sharedModulePath = path.join(workDir, "scripts", "docs-counts-shared.mjs");
    const originalShared = readFileSync(sharedModulePath, "utf-8");
    const patchedShared = originalShared.replace(
      "export function mosaicCountPatterns() {\n  return [",
      "export function mosaicCountPatterns() {\n  return [\n    /(\\d+)\\s*brand-new-wording\\s*`Mosaic\\*`\\s*units/gs,",
    );
    expect(
      patchedShared,
      "patch anchor not found — mosaicCountPatterns() shape changed in docs-counts-shared.mjs",
    ).not.toBe(originalShared);
    writeFileSync(sharedModulePath, patchedShared);

    // Grep-assert the mutation actually landed on disk before trusting any
    // verdict that follows (Day 129 doctrine: never read a "green" that
    // never received the mutation it claims to prove).
    const landedCheck = readFileSync(sharedModulePath, "utf-8");
    expect(landedCheck).toContain("brand-new-wording");

    writeIndex(workDir, ["MosaicAlpha", "MosaicBeta"]); // 2 real components
    // The novel wording claims 999 — deliberately wrong, using ONLY the
    // brand-new phrasing (no other anchor is touched), so a pass here can
    // ONLY be explained by the new pattern being live.
    writeFileSync(
      path.join(workDir, "README.md"),
      [
        "It provides 2 opinionated, fully-typed UI components.",
        "",
        "2 exported `Mosaic*` components across 1 sections (2 total named exports).",
        "",
        "999 brand-new-wording `Mosaic*` units shipped in this release.",
        "",
      ].join("\n"),
    );
    writeFileSync(path.join(workDir, "docs", "components-catalog.md"), baseCatalog(2, 2));

    // --- Assertion 1: the PRODUCER (docs-counts.mjs --check) sees it. ---
    const producerResult = runCheck(workDir);
    expect(
      producerResult.status,
      `producer must go RED on the brand-new wording's stale 999: ${producerResult.output}`,
    ).not.toBe(0);
    expect(producerResult.output).toContain("999");
    expect(producerResult.output).toContain("brand-new-wording");

    // --- Assertion 2: a GUARD-STYLE generic scan, built from the exact
    // same `mosaicCountPatterns()` export of the SAME patched module (not
    // a re-implementation), also sees it. This mirrors exactly what
    // src/__tests__/readme-matches-exports.test.ts's extractGenericCountClaims
    // does with the real module — run out-of-process (plain `node`, no
    // bundler module graph involved) so this is a genuine re-import of the
    // patched file from disk, not vitest's cached module of the pristine one.
    const guardStyleScannerScript = [
      "import { readFileSync } from 'node:fs';",
      `import { mosaicCountPatterns } from ${JSON.stringify(sharedModulePath)};`,
      `const doc = readFileSync(${JSON.stringify(path.join(workDir, "README.md"))}, 'utf-8');`,
      "const claims = [];",
      "for (const pattern of mosaicCountPatterns()) {",
      "  let match;",
      "  while ((match = pattern.exec(doc))) claims.push({ claimed: Number(match[1]), snippet: match[0] });",
      "}",
      "console.log(JSON.stringify(claims));",
    ].join("\n");
    const scannerScriptPath = path.join(workDir, "guard-style-scan.mjs");
    writeFileSync(scannerScriptPath, guardStyleScannerScript);
    const guardStyleClaims = JSON.parse(
      execFileSync("node", [scannerScriptPath], { encoding: "utf-8" }),
    ) as Array<{ claimed: number; snippet: string }>;
    const novelClaim = guardStyleClaims.find((c) => c.snippet.includes("brand-new-wording"));
    expect(
      novelClaim,
      "guard-style generic scan (built from the SAME shared module) never saw the brand-new " +
        "wording at all — sharing is broken",
    ).toBeDefined();
    expect(novelClaim?.claimed).toBe(999);
  });
});
