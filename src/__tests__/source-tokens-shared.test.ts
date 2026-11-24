/**
 * Contract of scripts/source-tokens-shared.mjs — the ONE parse-based reader of
 * string / comment / regex tokens behind the no-hardcoded-words guard, the
 * theme-tokens-declared guard, and maskCommentsAndStrings (task
 * k17dchnw3f2fqgjeqw10mn9b9h8jvfcm).
 *
 * The class under test: a hand-written scanner pairs quote characters over
 * text. A quote inside a comment or a regex literal is not a delimiter, yet it
 * pairs with the next quote and forms a fake string over real code. Every case
 * below puts such a quote BEFORE a real string and asserts the real string is
 * still read, with its exact offsets.
 */

import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  JSX_TEXT_KINDS,
  SourceReadRefusal,
  blankRanges,
  deriveUnclassifiedTextKinds,
  loadTypeScript,
  readSourceTokens,
} from "../../scripts/source-tokens-shared.mjs";

const tsApi = loadTypeScript();
const read = (text: string, fileName = "x.ts", ignoreKinds: string[] = []) =>
  readSourceTokens(tsApi, text, { fileName, ignoreKinds });
const stringsOf = (text: string, fileName = "x.ts") =>
  read(text, fileName).literals.map((l) => l.parts.map(([s, e]) => text.slice(s, e)).join("|"));

describe("readSourceTokens — a quote is a delimiter only where the grammar says so", () => {
  it("reads strings of every quote form with exact offsets", () => {
    const text = "const a = 'one'; const b = \"two\"; const c = `three`;";
    const lits = read(text).literals;
    expect(lits.map((l) => text.slice(l.start, l.end))).toEqual(["'one'", '"two"', "`three`"]);
    expect(stringsOf(text)).toEqual(["one", "two", "three"]);
  });

  it.each([
    ["an apostrophe in a // comment", "// the column's width\nconst a = 'real';"],
    ["an apostrophe in a block comment", "/* the column's width */\nconst a = 'real';"],
    ["an apostrophe in a JSDoc block", "/** the column's width */\nconst a = 'real';"],
    ["a quote inside a regex literal", "const re = /'/; const a = 'real';"],
    ["a double quote inside a regex class", "const re = /[\"']/g; const a = 'real';"],
    ["a quote after a division", "const d = 4 / 2; const a = 'real';"],
  ])("still reads the real string after %s", (_label, text) => {
    expect(text).toContain("'real'"); // the form landed
    expect(stringsOf(text)).toContain("real");
    expect(stringsOf(text).filter((s) => s !== "real")).toEqual([]);
  });

  it("returns comments and regex literals as ranges, never as literals", () => {
    const text = "// it's\nconst r = /'x'/; /* don't */ const a = 'y';";
    const r = read(text);
    expect(r.comments.map(([s, e]) => text.slice(s, e))).toEqual(["// it's", "/* don't */"]);
    expect(r.regexes.map(([s, e]) => text.slice(s, e))).toEqual(["/'x'/"]);
    expect(r.literals).toHaveLength(1);
  });

  it("splits a template with substitutions into its static parts, nested literals apart", () => {
    const text = "const t = `a ${f('in')} b ${c} d`;";
    const r = read(text);
    const tpl = r.literals.find((l) => l.kind === "template");
    expect(tpl?.parts.map(([s, e]) => text.slice(s, e))).toEqual(["a ", " b ", " d"]);
    expect(
      r.literals.filter((l) => l.kind === "string").map((l) => text.slice(l.start, l.end)),
    ).toEqual(["'in'"]);
  });

  it("reads the parts of a template literal TYPE", () => {
    const text = "type K = `on${string}Change`;";
    const tpl = read(text).literals.find((l) => l.kind === "template");
    expect(tpl?.parts.map(([s, e]) => text.slice(s, e))).toEqual(["on", "Change"]);
  });
});

describe("readSourceTokens — fail closed, never an empty result standing for 'could not read'", () => {
  it("refuses text that does not parse, naming the label and the position", () => {
    const text = "const a = 'unterminated;\nconst b = 1;";
    expect(() => readSourceTokens(tsApi, text, { fileName: "x.ts", label: "LABEL.ts" })).toThrow(
      SourceReadRefusal,
    );
    expect(() => readSourceTokens(tsApi, text, { fileName: "x.ts", label: "LABEL.ts" })).toThrow(
      /could not parse LABEL\.ts .*line 1/,
    );
  });

  it("refuses an extension it has no grammar for", () => {
    expect(() => read("a", "x.css")).toThrow(/no script kind for "x\.css"/);
  });

  it("refuses JSX text unless the caller declares it ignorable, naming the kind", () => {
    const text = "const a = <p>hello</p>;";
    expect(() => read(text, "x.tsx")).toThrow(/does not classify: JsxText at offset/);
    const ok = read(text, "x.tsx", JSX_TEXT_KINDS);
    expect(ok.texts.map(([s, e]) => text.slice(s, e))).toEqual(["hello"]);
  });

  it("refuses an ignoreKinds name that is not an unclassified text-bearing kind", () => {
    expect(() => read("a", "x.ts", ["StringLiteral"])).toThrow(/told to ignore token kind/);
    expect(() => read("a", "x.ts", ["NoSuchKind"])).toThrow(/told to ignore token kind/);
  });

  it("does not read `//` at the start of JSX text as a comment", () => {
    const text = "const a = <p>// not a comment, it's text</p>; const b = 'real';";
    const r = read(text, "x.tsx", JSX_TEXT_KINDS);
    expect(r.comments).toEqual([]);
    expect(r.literals.map((l) => text.slice(l.start, l.end))).toEqual(["'real'"]);
  });
});

describe("token-kind census — derived from ts.SyntaxKind, never remembered", () => {
  it("names the text-bearing token kinds the reader does not classify (they refuse unless ignored)", () => {
    const names = [...deriveUnclassifiedTextKinds(tsApi).values()];
    // The kinds known today; a NEW kind typescript adds appears in the derived
    // list and refuses at read time, whatever this test lists.
    expect(names).toEqual(
      expect.arrayContaining([
        "JsxText",
        "JsxTextAllWhiteSpaces",
        "JSDocCommentTextToken",
        "NonTextFileMarkerTrivia",
      ]),
    );
    // A classified kind is never in the unclassified set.
    for (const classified of [
      "StringLiteral",
      "NoSubstitutionTemplateLiteral",
      "TemplateHead",
      "TemplateMiddle",
      "TemplateTail",
      "RegularExpressionLiteral",
      "NumericLiteral",
      "BigIntLiteral",
    ]) {
      expect(names).not.toContain(classified);
      expect(typeof ts.SyntaxKind[classified as keyof typeof ts.SyntaxKind]).toBe("number");
    }
  });
});

describe("blankRanges", () => {
  it("keeps length and line breaks", () => {
    const text = "ab\ncd\nef";
    const out = blankRanges(text, [[1, 7]]);
    expect(out).toBe("a \n  \n f");
    expect(out).toHaveLength(text.length);
  });
});
