/**
 * FORM 1 (Tailwind color utilities in string literals) and FORM 2
 * (`var(--color-<token>)` in string literals) of
 * scripts/theme-tokens-declared-guard.mjs — D1 of task
 * k17dchnw3f2fqgjeqw10mn9b9h8jvfcm.
 *
 * The class: the two scanners were hand-written quote scanners. FORM 1 paired
 * quote characters over the whole text, comments included; FORM 2 skipped
 * comments but did not parse regex literals. A quote in a comment or a regex
 * paired with the next quote below it and formed a fake string over real code,
 * so the real string after it was never read: an undeclared token slipped by.
 *
 * Each case puts one hiding form (apostrophe in `//`, in a block comment, in a
 * JSDoc block, a quote in a regex literal) BEFORE three real strings (an
 * undeclared utility, an undeclared `var(--color-…)`, an undeclared utility in
 * a template), runs the real guard, and asserts (1) all three are named, and
 * (2) the verdict is IDENTICAL to a control carrying the same lines with the
 * hiding quote removed. The guard is spawned on a fixture tree in a temp dir
 * (its own override variables), never on the working tree. Real-component
 * mutations live in scripts/tests/probe-theme-tokens-declared-guard.sh.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..", "..");
const GUARD = path.join(ROOT, "scripts", "theme-tokens-declared-guard.mjs");
const work = mkdtempSync(path.join(tmpdir(), "theme-forms-"));
afterAll(() => rmSync(work, { recursive: true, force: true }));

const STYLES = [
  "@theme inline {",
  "  --color-probe-brand: var(--probe-brand);",
  "}",
  ":root {",
  "  --probe-brand: oklch(0.5 0.1 250);",
  "}",
  "",
].join("\n");

let caseNo = 0;
function runGuard(component: string, fileName = "Probe.tsx") {
  caseNo += 1;
  const dir = path.join(work, `case-${caseNo}`);
  mkdirSync(path.join(dir, "src"), { recursive: true });
  const file = path.join(dir, "src", fileName);
  writeFileSync(file, component, "utf-8");
  writeFileSync(path.join(dir, "src", "styles.css"), STYLES, "utf-8");
  expect(readFileSync(file, "utf-8")).toBe(component); // the write landed
  const r = spawnSync("node", [GUARD], {
    cwd: ROOT,
    encoding: "utf-8",
    env: {
      ...process.env,
      THEME_TOKENS_SRC_DIR: path.join(dir, "src"),
      THEME_TOKENS_STYLES_PATH: path.join(dir, "src", "styles.css"),
    },
  });
  if (r.error) throw r.error;
  // The case directory differs between runs; the verdict must not.
  const out = `${r.stdout}${r.stderr}`.split(dir).join("<D>");
  return { code: r.status, out };
}

const TOKENS = ["zqprobe-f1", "zqprobe-f2", "zqprobe-tpl"];
const REAL = [
  "const __zqA = 'bg-zqprobe-f1'; const __zqB = 'var(--color-zqprobe-f2)';",
  "const __zqT = `text-zqprobe-tpl ${__zqA}`;",
  "void [__zqA, __zqB, __zqT];",
];
const USED = 'export const probeBrand = "bg-probe-brand";';

/** [label, hiding line(s) carrying a quote, the same lines with the quote removed] */
const FORMS: Array<[string, string[], string[]]> = [
  ["an apostrophe in a // comment", ["// zq: the column's width"], ["// zq: the column width"]],
  [
    "an apostrophe in a block comment",
    ["/* zq: the column's width */"],
    ["/* zq: the column width */"],
  ],
  [
    "an apostrophe in a JSDoc block",
    ["/** zq: the column's width */"],
    ["/** zq: the column width */"],
  ],
  // The regex form shares ONE line with the strings: an old scanner that
  // treated a quote with no closing quote on its line as stray was only
  // fooled when the closing quote was on the same line.
  [
    "a quote inside a regex literal",
    [`const __zqRe = /'/; void __zqRe; ${REAL[0]}`],
    [`const __zqRe = /x/; void __zqRe; ${REAL[0]}`],
  ],
];

function component(hider: string[], withRealLine0: boolean): string {
  const real = withRealLine0 ? REAL : REAL.slice(1);
  return [USED, ...hider, ...real, ""].join("\n");
}

describe("theme-tokens-declared-guard FORM 1 + FORM 2 read tokens, not quote pairs", () => {
  it("control: the three real strings are each named (positive pole, string + var() + template)", () => {
    const r = runGuard(component(["// zq: neutral"], true));
    expect(r.code).toBe(1);
    for (const t of TOKENS) expect(r.out).toContain(t);
  });

  it.each(FORMS)("verdict is unchanged by %s", (_label, hidden, neutral) => {
    const isRegex = hidden[0].startsWith("const __zqRe");
    const mutated = component(hidden, !isRegex);
    const control = component(neutral, !isRegex);
    expect(mutated).toContain(hidden[0]); // the hiding form landed
    expect(mutated).not.toBe(control);
    const a = runGuard(control);
    const b = runGuard(mutated);
    expect(a.code).toBe(1);
    for (const t of TOKENS) expect(b.out, `names ${t}`).toContain(t);
    expect(b.code).toBe(a.code);
    expect(b.out).toBe(a.out);
  });

  it("a clean file with every hiding form and only declared tokens exits 0", () => {
    const clean = [
      USED,
      "// zq: the column's width",
      "/* zq: the column's width */",
      "/** zq: the column's width */",
      "const __zqRe = /'/; const __zqOk = 'bg-probe-brand'; void [__zqRe, __zqOk];",
      "",
    ].join("\n");
    const r = runGuard(clean);
    expect(r.out).not.toContain("BLOCKED");
    expect(r.code).toBe(0);
  });

  it("JSX text is not a string: an apostrophe in it hides nothing and names nothing", () => {
    const jsx = [
      USED,
      "export const A = () => <p>it's 'bg-zqprobe-jsxtext'</p>;",
      "const __zqOk = 'bg-probe-brand'; void __zqOk;",
      "",
    ].join("\n");
    const r = runGuard(jsx);
    expect(r.out).not.toContain("zqprobe-jsxtext");
    expect(r.code).toBe(0);
  });

  it("REFUSES to judge (exit 2), naming the file, on a source file that does not parse", () => {
    const r = runGuard(`${USED}\nconst broken = 'unterminated;\n`, "Broken.tsx");
    expect(r.code).toBe(2);
    expect(r.out).toContain("REFUSES TO JUDGE");
    expect(r.out).toContain("Broken.tsx");
    expect(r.out).toContain("could not parse");
  });
});
