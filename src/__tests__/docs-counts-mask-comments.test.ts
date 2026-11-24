/**
 * `maskCommentsAndStrings` (scripts/docs-counts-shared.mjs) and the statement
 * scan built on it — D2 of task k17dchnw3f2fqgjeqw10mn9b9h8jvfcm.
 *
 * The class: this function used to skip comments but not regex literals, and
 * paired quote characters. A `'` inside a regex literal (`/'/`) opened a fake
 * string that swallowed the real code below it, so an `import` or `export`
 * line after it vanished from the masked text and its statement was never
 * seen. Every case puts such a quote BEFORE a real statement and asserts the
 * statement is still visible. This file imports only docs-counts-shared.mjs,
 * so it runs unchanged against the previous implementation (the RED proof).
 */

import { describe, expect, it } from "vitest";
import {
  maskCommentsAndStrings,
  scanExportStatements,
} from "../../scripts/docs-counts-shared.mjs";

const lineBreaks = (s: string) => [...s].flatMap((c, i) => (c === "\n" ? [i] : []));

describe("maskCommentsAndStrings — a quote hidden in a non-string token never swallows code", () => {
  const SRC = [
    "const re = /'/;",
    'import { Button } from "@heroui/react";',
    "const s = 'it';",
    'export { Y } from "./Y.js";',
    "",
  ].join("\n");

  it("keeps the import and export lines below a regex literal holding a quote", () => {
    expect(SRC).toContain("/'/"); // the form landed
    const blanked = maskCommentsAndStrings(SRC, false);
    const kept = maskCommentsAndStrings(SRC, true);
    expect(blanked).toMatch(/import \{ Button \} from "\s+";/);
    expect(blanked).toMatch(/export \{ Y \} from "\s+";/);
    expect(kept).toContain('import { Button } from "@heroui/react";');
    expect(kept).toContain('export { Y } from "./Y.js";');
  });

  it("blanks the regex literal itself (neither code nor a string)", () => {
    const blanked = maskCommentsAndStrings("const r = /import \"x\"/;\n", false);
    expect(blanked).not.toContain("import");
    expect(blanked).not.toContain("/");
  });

  it("is the same length with the same line breaks, in both modes", () => {
    for (const keep of [false, true]) {
      const out = maskCommentsAndStrings(SRC, keep);
      expect(out).toHaveLength(SRC.length);
      expect(lineBreaks(out)).toEqual(lineBreaks(SRC));
    }
  });

  it.each([
    ["a // comment apostrophe", "// the column's width\nimport a from 'a-pkg';\n"],
    ["a block comment apostrophe", "/* the column's width */\nimport a from 'a-pkg';\n"],
    ["a JSDoc apostrophe", "/** the column's width */\nimport a from 'a-pkg';\n"],
  ])("keeps the import below %s", (_label, src) => {
    expect(maskCommentsAndStrings(src, true)).toContain("import a from 'a-pkg';");
    expect(maskCommentsAndStrings(src, false)).not.toContain("width");
  });

  it("masks string content but keeps the delimiters, escapes included", () => {
    const out = maskCommentsAndStrings("const a = 'it\\'s'; const b = \"x\";", false);
    expect(out).toBe("const a = '     '; const b = \" \";");
  });

  it("masks a template's static text, keeps its substitution code visible", () => {
    const out = maskCommentsAndStrings("const t = `ab${f(\"cd\")}ef`;", false);
    expect(out).toBe("const t = `  ${f(\"  \")}  `;");
  });

  it("blanks JSX text in a .tsx file, in both modes (not code, not a string)", () => {
    const src = "export const A = () => <p>it's import \"x\"</p>;\nimport b from 'b-pkg';\n";
    for (const keep of [false, true]) {
      const out = maskCommentsAndStrings(src, keep, "A.tsx");
      expect(out).not.toContain("it's");
      expect(out).toContain("import b from");
    }
  });
});

describe("maskCommentsAndStrings — refuses what it cannot read, never a half-masked copy", () => {
  it("throws, naming the file, on text that does not parse", () => {
    expect(() => maskCommentsAndStrings("import { from ;\n", false, "Broken.ts")).toThrow(
      /could not parse Broken\.ts/,
    );
  });

  it("throws on an extension it has no grammar for", () => {
    expect(() => maskCommentsAndStrings("a", false, "styles.css")).toThrow(/no script kind/);
  });
});

describe("scanExportStatements — an export line below a regex-literal quote is still a statement", () => {
  it("reads the named re-export after `const re = /'/;`", () => {
    const stmts = scanExportStatements("const re = /'/;\nexport { A } from \"./A.js\";\n");
    expect(stmts.map((s) => [s.kind, s.source])).toEqual([["named-reexport", "./A.js"]]);
  });
});
