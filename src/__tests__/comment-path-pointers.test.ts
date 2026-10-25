/**
 * Guard: every repository-relative path a comment cites must exist.
 *
 * A comment that names a file ("the GUARD lives in <that test file>")
 * is a claim of coverage. When the file moves and the comment does not, the
 * next reader trusts a test that is not where the comment says, and nothing
 * ever goes red. This test makes the claim checkable.
 *
 * Domain of comment forms scanned (the comment syntaxes used by the files
 * walked: TypeScript/JavaScript, shell, YAML):
 *   - a line opening with `//`
 *   - a line opening with `/*` or `*` (block / JSDoc comment)
 *   - a line opening with `#` (shell, YAML)
 *   - a trailing ` // ` comment after code
 * Each form has its own MUST_BLOCK case below.
 *
 * Declared, not covered: a path that only appears inside a string literal is
 * data (test fixtures inject fake paths on purpose), never a pointer, and is
 * not scanned. A path containing a glob or placeholder (`*`, `<`, `[`) is a
 * pattern, not a pointer, and is not matched by PATH_RE.
 *
 * The real-tree scan is fail-closed: if it collects no citation at all, or
 * misses the citation this very file makes to `scripts/docs-counts-shared.mjs`
 * (read in the positive-control case), the scanner is blind and the test fails.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ROOTS = ["src", "scripts", ".github"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".next", "coverage"]);
const CODE_EXT = /\.(tsx|ts|mts|mjs|cjs|js|sh|ya?ml)$/;

const PATH_RE =
  /(?<![\w./@-])((?:src|scripts|docs|sandbox|stories|\.github)\/[\w./-]+?\.(?:tsx|ts|mts|mjs|cjs|json|js|md|sh|ya?ml))(?![\w*<[])/g;

interface Citation {
  file: string;
  line: number;
  cited: string;
}

function commentPart(line: string): string | null {
  const t = line.trimStart();
  if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("#")) {
    return t;
  }
  const trailing = line.indexOf(" // ");
  return trailing === -1 ? null : line.slice(trailing + 4);
}

function collectCitations(file: string, source: string): Citation[] {
  const out: Citation[] = [];
  source.split("\n").forEach((line, i) => {
    const comment = commentPart(line);
    if (comment === null) return;
    for (const m of comment.matchAll(PATH_RE)) {
      out.push({ file, line: i + 1, cited: m[1] });
    }
  });
  return out;
}

function walk(dir: string, acc: string[]): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (CODE_EXT.test(name)) acc.push(full);
  }
  return acc;
}

function deadCitations(citations: Citation[]): Citation[] {
  return citations.filter((c) => !existsSync(path.join(REPO_ROOT, c.cited)));
}

describe("comment path pointers", () => {
  it("every path cited in a comment of src/, scripts/ or .github/ exists", () => {
    const files = ROOTS.flatMap((r) => walk(path.join(REPO_ROOT, r), []));
    const citations = files.flatMap((f) =>
      collectCitations(path.relative(REPO_ROOT, f), readFileSync(f, "utf-8")),
    );

    // Positive control: the scanner reads, or the zero below proves nothing.
    expect(citations.length).toBeGreaterThan(0);
    expect(
      citations.some(
        (c) =>
          c.file === path.join("src", "__tests__", "comment-path-pointers.test.ts") &&
          c.cited === "scripts/docs-counts-shared.mjs",
      ),
    ).toBe(true);

    const dead = deadCitations(citations).map((c) => `${c.file}:${c.line} -> ${c.cited}`);
    expect(dead).toEqual([]);
  });

  describe("one MUST_BLOCK case per comment form", () => {
    const missing = "src/__tests__/no-such-file.test.ts";
    const cases: Array<[string, string]> = [
      ["line comment", `// see ${missing}`],
      ["block comment opener", `/* see ${missing} */`],
      ["JSDoc continuation", ` * see ${missing}`],
      ["hash comment", `# see ${missing}`],
      ["trailing comment", `const x = 1; // see ${missing}`],
    ];
    for (const [form, line] of cases) {
      it(`${form}: a dead path is reported`, () => {
        const found = collectCitations("probe.ts", line);
        expect(found.map((c) => c.cited)).toEqual([missing]);
        expect(deadCitations(found)).toHaveLength(1);
      });
    }
  });

  describe("MUST_PASS", () => {
    it("a live path in a comment is not reported", () => {
      const found = collectCitations("probe.ts", "// see scripts/docs-counts-shared.mjs");
      expect(found).toHaveLength(1);
      expect(deadCitations(found)).toEqual([]);
    });

    it("a path inside a string literal is data, not a pointer", () => {
      expect(collectCitations("probe.ts", 'const f = "src/a/A.ts";')).toEqual([]);
    });

    it("a glob or placeholder is a pattern, not a pointer", () => {
      expect(collectCitations("probe.ts", "// src/components/*.tsx")).toEqual([]);
      expect(collectCitations("probe.ts", "// src/components/<name>/X.tsx")).toEqual([]);
    });
  });
});
