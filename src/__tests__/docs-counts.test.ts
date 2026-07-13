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

let workDir: string | undefined;

afterEach(() => {
  if (workDir) {
    rmSync(workDir, { recursive: true, force: true });
    workDir = undefined;
  }
});

/**
 * Builds a minimal, self-contained fixture repo (script + src/index.ts +
 * README.md + docs/components-catalog.md) at the exact relative layout
 * `docs-counts.mjs` expects (it resolves paths from its own `import.meta.url`,
 * not from `process.cwd()`, so the script must live at `<fixture>/scripts/`).
 */
function makeFixture(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "docs-counts-fixture-"));
  mkdirSync(path.join(dir, "scripts"), { recursive: true });
  mkdirSync(path.join(dir, "src"), { recursive: true });
  mkdirSync(path.join(dir, "docs"), { recursive: true });
  cpSync(SCRIPT_PATH, path.join(dir, "scripts", "docs-counts.mjs"));
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
