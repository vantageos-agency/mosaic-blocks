/**
 * Export-domain guard for `parseBarrelExports` in scripts/registry-json-derive.mjs.
 *
 * Before this fix parseBarrelExports read ONLY `export { … } from "./components/…"`;
 * every other export form in src/index.ts was invisible and the derived
 * registry.json could lie without failing (guard-formulation-census).
 *
 * CENSUS of export forms — derived from the ES/TypeScript export grammar and
 * from `scanExportStatements` in scripts/docs-counts-shared.mjs (the shared
 * census also used by `extractRealExports`). One case per form below, each a
 * mutation of the REAL src/index.ts with its landing asserted first.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanExportStatements } from "../../scripts/docs-counts-shared.mjs";
import { parseBarrelExports } from "../../scripts/registry-json-derive.mjs";

const INDEX_PATH = path.resolve(__dirname, "..", "index.ts");
const real = (): string => readFileSync(INDEX_PATH, "utf-8");
const occurrences = (hay: string, needle: string): number => hay.split(needle).length - 1;

/** MUST_COVER: forms the script reads (or declares non-registry) without failing. */
const COVERED: Array<[string, string]> = [
  ["export { A } from non-registry declared source", 'export { version } from "./version.js";'],
  [
    "export type { } from non-registry declared source",
    'export type { ZedT } from "./version.js";',
  ],
  [
    "export { A } from ./components (value barrel)",
    'export { MosaicZedPrimary } from "./components/zed-dir/MosaicZedPrimary.js";',
  ],
  [
    "export type { A as B } from ./components (type alias)",
    'export type { ZedP as ZedQ } from "./components/zed-dir/MosaicZedPrimary.js";',
  ],
];

/** MUST_BLOCK: forms the script cannot read, each must throw naming the line. */
const BLOCKED: Array<[string, string, RegExp]> = [
  [
    "export { A } from undeclared source",
    'export { ZedA } from "./zed.js";',
    /undeclared|NON_REGISTRY_SOURCES/,
  ],
  [
    "export { A as B } from undeclared source",
    'export { ZedA as ZedB } from "./zed.js";',
    /NON_REGISTRY_SOURCES/,
  ],
  [
    "export type { } from undeclared source",
    'export type { ZedT } from "./zed.js";',
    /NON_REGISTRY_SOURCES/,
  ],
  ["export * from", 'export * from "./zed.js";', /unreadable export form `star`/],
  ["export * as ns from", 'export * as ZedNS from "./zed.js";', /unreadable export form `star-as`/],
  ["export const", "export const ZedC = 1;", /`declaration const`/],
  ["export let", "export let ZedL = 1;", /`declaration let`/],
  ["export var", "export var ZedV = 1;", /`declaration var`/],
  ["export function", "export function zedFn() {}", /`declaration function`/],
  ["export async function", "export async function zedAsync() {}", /`declaration async function`/],
  ["export class", "export class ZedK {}", /`declaration class`/],
  ["export default", "export default 1;", /unreadable export form `default`/],
  ["export { local } without from", "export { zedLocal };", /unreadable export form `named-local`/],
  ["export interface", "export interface ZedI {}", /`declaration interface`/],
  ["export type alias", "export type ZedTA = string;", /`declaration type`/],
  ["export enum", "export enum ZedE { A }", /`declaration enum`/],
  [
    "value alias in a component barrel",
    'export { MosaicChatSidebar as MosaicZedAlias } from "./components/chat-sidebar/MosaicChatSidebar.js";',
    /value alias/,
  ],
  [
    "component path without .js suffix",
    'export { ZedNoExt } from "./components/chat-sidebar/ZedNoExt";',
    /NON_REGISTRY_SOURCES/,
  ],
  [
    "inline type modifier",
    'export { type ZedInline } from "./components/chat-sidebar/MosaicChatSidebar.js";',
    /inline `type` specifier/,
  ],
  ["unknown export token", "export = 1;", /cannot read the `export` statement/],
];

describe("parseBarrelExports — export domain (mutation on REAL src/index.ts, one per form)", () => {
  it("MUST_PASS: the unmodified real tree parses and yields component exports", () => {
    const out = parseBarrelExports(real());
    expect(out.length).toBeGreaterThan(100);
    expect(out.some((e) => e.name === "MosaicChatSidebar" && !e.isType)).toBe(true);
  });

  it("MUST_PASS: parseBarrelExports() with no argument reads the real file and equals the explicit read", () => {
    expect(parseBarrelExports()).toEqual(parseBarrelExports(real()));
  });

  it("MUST_PASS: comments and strings containing `export` do not trip the scanner", () => {
    const src = `${real()}\n// export const NotReal = 1;\n/* export default 2; */\nconst s = "export class X {}";\n`;
    expect(parseBarrelExports(src)).toEqual(parseBarrelExports(real()));
  });

  for (const [form, line] of COVERED.slice(0, 2)) {
    it(`MUST_COVER: ${form} is read without failing, adds no registry export`, () => {
      const mutated = `${real()}\n${line}\n`;
      expect(occurrences(mutated, line), "mutation did not land").toBe(
        occurrences(real(), line) + 1,
      );
      expect(parseBarrelExports(mutated)).toEqual(parseBarrelExports(real()));
    });
  }

  it("MUST_COVER: a value barrel from ./components is READ (adds the export, with its dir/file)", () => {
    const [, line] = COVERED[2];
    const mutated = `${real()}\n${line}\n`;
    expect(occurrences(mutated, line), "mutation did not land").toBe(occurrences(real(), line) + 1);
    // The shared G1 cross-check demands the name be known to extractRealExports too,
    // which it is — the read must add exactly one entry.
    const out = parseBarrelExports(mutated);
    const base = parseBarrelExports(real());
    expect(out.length).toBe(base.length + 1);
    expect(out.at(-1)).toEqual({
      name: "MosaicZedPrimary",
      dir: "zed-dir",
      file: "MosaicZedPrimary",
      isType: false,
    });
  });

  it("MUST_COVER: `export type { A as B }` from ./components is READ as a type under its exported name", () => {
    const [, line] = COVERED[3];
    const mutated = `${real()}\n${line}\n`;
    expect(occurrences(mutated, line), "mutation did not land").toBe(occurrences(real(), line) + 1);
    expect(parseBarrelExports(mutated).at(-1)).toEqual({
      name: "ZedQ",
      dir: "zed-dir",
      file: "MosaicZedPrimary",
      isType: true,
    });
  });

  for (const [form, line, pattern] of BLOCKED) {
    it(`MUST_BLOCK: ${form} fails loud, naming the line`, () => {
      const mutated = `${real()}\n${line}\n`;
      expect(occurrences(mutated, line), "mutation did not land").toBe(
        occurrences(real(), line) + 1,
      );
      const expectedLine = real().split("\n").length + 1;
      expect(() => parseBarrelExports(mutated)).toThrow(pattern);
      expect(() => parseBarrelExports(mutated)).toThrow(
        new RegExp(`src/index\\.ts:${expectedLine}`),
      );
    });
  }

  it("MUST_BLOCK: an `export` hidden mid-line trips the census", () => {
    const mutated = `${real()}\nconst a = 1; export const ZedMid = 2;\n`;
    expect(() => parseBarrelExports(mutated)).toThrow(/census mismatch/);
  });

  it("scanExportStatements covers every form in the census (kinds)", () => {
    const kinds = new Set(
      [
        'export { a } from "./x.js";',
        "export { a };",
        'export * from "./x.js";',
        'export * as N from "./x.js";',
        "export const a = 1;",
        "export default 1;",
      ].flatMap((l) => scanExportStatements(l).map((s) => s.kind)),
    );
    expect([...kinds].sort()).toEqual(
      ["declaration", "default", "named-local", "named-reexport", "star", "star-as"].sort(),
    );
  });
});
