/**
 * Guard test — mosaic-blocks carries ZERO user-facing strings.
 *
 * Doctrine (see gamma/i18n-required-props PR): every user-facing string
 * (JSX text node, aria-label, title, placeholder, alt, label attribute
 * value) MUST come from a caller-supplied prop. No English default, no
 * fallback, no i18n engine bundled in the library — the host owns the
 * language via required props (e.g. `navAriaLabel: string`, `countLabel:
 * (n: number) => string`).
 *
 * This test statically scans every non-test .tsx file under
 * src/components/** for a hardcoded literal in JSX text position or in
 * one of the user-facing attributes above, and fails the suite if any
 * violation is found.
 *
 * Exclusions (documented, not silent):
 *   - *.test.tsx, *.stories.tsx, *.spec.tsx files
 *   - Comment regions (// line comments and block comments, including
 *     JSDoc @example blocks) — quote-aware stripping so a "//" inside a
 *     string literal (e.g. "https://x") is NOT mistaken for a comment
 *     start.
 *   - Structural/DOM/CSS attribute VALUES that are not user-facing text:
 *     className, style, data-*, id, key, type, href, aria-hidden,
 *     aria-controls, aria-selected, aria-expanded, aria-labelledby,
 *     htmlFor, xmlns, viewBox, fill, stroke, strokeWidth, strokeLinecap,
 *     strokeLinejoin, width, height, x1/y1/x2/y2 (SVG geometry).
 *   - TypeScript type-position text (e.g. arrow-function return type
 *     `=> Promise<string | null>`) — the JSX-text regex explicitly
 *     excludes a `>` that is itself the second character of an arrow
 *     `=>`, so `Promise` in `=> Promise<...>` is never mistaken for a
 *     JSX text node (known false positive, documented, not "fixed" by
 *     touching the type).
 *
 * RED baseline: run `pnpm vitest run src/__tests__/i18n-no-hardcoded-literals.test.ts`
 * before the props migration — see PR body for the exact captured count.
 * GREEN: 0 violations once every component consumes required i18n props.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(__dirname, "..", "components");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (
      entry.name.endsWith(".tsx") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".stories.tsx") &&
      !entry.name.endsWith(".spec.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Quote-aware comment stripper. Replaces every character inside a line
 * comment or block comment with a space (preserving line numbers/offsets),
 * while never treating `//` or `/*` inside a string/template literal as a
 * comment start.
 */
function stripComments(source: string): string {
  const out: string[] = new Array(source.length);
  type State = "normal" | "single" | "double" | "template" | "line-comment" | "block-comment";
  let state: State = "normal";

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (state === "line-comment") {
      if (c === "\n") {
        state = "normal";
        out[i] = c;
      } else {
        out[i] = " ";
      }
      continue;
    }

    if (state === "block-comment") {
      if (c === "*" && next === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        i++;
        state = "normal";
      } else {
        out[i] = c === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (state === "single") {
      out[i] = c;
      if (c === "'" && prev !== "\\") state = "normal";
      continue;
    }

    if (state === "double") {
      out[i] = c;
      if (c === '"' && prev !== "\\") state = "normal";
      continue;
    }

    if (state === "template") {
      out[i] = c;
      if (c === "`" && prev !== "\\") state = "normal";
      continue;
    }

    // state === "normal"
    if (c === "/" && next === "/") {
      state = "line-comment";
      out[i] = " ";
      continue;
    }
    if (c === "/" && next === "*") {
      state = "block-comment";
      out[i] = " ";
      continue;
    }
    if (c === "'") {
      state = "single";
      out[i] = c;
      continue;
    }
    if (c === '"') {
      state = "double";
      out[i] = c;
      continue;
    }
    if (c === "`") {
      state = "template";
      out[i] = c;
      continue;
    }
    out[i] = c;
  }

  return out.join("");
}

// JSX text node between tags: >Some Text< — must start with an uppercase
// letter and contain at least 3 chars to avoid matching stray punctuation
// or SVG/geometry noise.
const JSX_TEXT_RE = /(?<![{`=])>\s*([A-Z][A-Za-zÀ-ÿ0-9 ,.'’…:/&()%-]{2,})\s*<(?!\/?script)/g;

// Only these attributes carry user-facing language. Everything else
// (className, style, data-*, id, href, xmlns, viewBox, fill, stroke*,
// x1/y1/x2/y2, width, height, type, key, htmlFor, aria-hidden,
// aria-controls, aria-expanded, aria-selected, aria-labelledby) is
// structural/DOM/CSS, not text.
const USER_FACING_ATTR_RE = /\b(aria-label|title|placeholder|alt|label)=\{?"([A-Z][^"{}]{2,})"\}?/g;

function isBenign(text: string): boolean {
  if (/^\d+$/.test(text)) return true;
  return false;
}

/** 0-based char offset -> 1-based line number. */
function lineAt(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

// Scan the WHOLE (comment-stripped) content rather than line-by-line, so a
// JSX text node that wraps onto its own line (e.g. a fragment child on its
// own line between two tag lines) is still caught — `\s` in the regexes
// already spans newlines.
function findViolations(relPath: string, rawContent: string): string[] {
  const violations: string[] = [];
  const content = stripComments(rawContent);

  for (const m of content.matchAll(JSX_TEXT_RE)) {
    const text = m[1].trim();
    if (isBenign(text)) continue;
    const idx = (m.index ?? 0) + m[0].indexOf(m[1]);
    violations.push(`${relPath}:${lineAt(content, idx)}: JSX text literal "${text}"`);
  }

  for (const m of content.matchAll(USER_FACING_ATTR_RE)) {
    const [, attr, text] = m;
    if (isBenign(text)) continue;
    const idx = (m.index ?? 0) + m[0].indexOf(text);
    violations.push(`${relPath}:${lineAt(content, idx)}: ${attr}="${text}"`);
  }

  return violations;
}

describe("i18n guard — mosaic-blocks ships zero hardcoded user-facing strings", () => {
  const files = walk(ROOT_DIR);

  it("scans every non-test component .tsx file under src/components/", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has zero hardcoded literal violations", () => {
    const allViolations: string[] = [];

    for (const file of files) {
      const rel = path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/");
      const content = fs.readFileSync(file, "utf-8");
      allViolations.push(...findViolations(rel, content));
    }

    if (allViolations.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `i18n guard violations (${allViolations.length}):\n${allViolations.join("\n")}`,
      );
    }

    expect(allViolations).toEqual([]);
  });
});
