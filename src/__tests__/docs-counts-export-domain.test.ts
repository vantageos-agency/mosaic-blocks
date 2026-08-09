/**
 * Unit guard for `extractRealExports` in scripts/docs-counts-shared.mjs.
 *
 * The function is the SINGLE definition of "how many named value exports
 * does src/index.ts have" (see docs-counts-shared.mjs header). Before this
 * fix it only recognised the barrel `export { … } from "…";` form and was
 * BLIND to `export const/function/class NAME` and `export * from "…";` —
 * a mutation adding either shape left the derived count unchanged, so a
 * wrong export count could pass silently (guard-formulation-census: a
 * domain-counter that knows only one syntactic shape fails OPEN on every
 * other one).
 *
 * One mutation PER export form, on the REAL src/index.ts, grep-asserted
 * landed before the count is read — matching the mutation-proof standard
 * this repo holds every count-derivation guard to (derive-never-type.md,
 * guard-formulation-census.md, measurement-integrity.md).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { extractRealExports } from "../../scripts/docs-counts-shared.mjs";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const INDEX_PATH = path.join(REPO_ROOT, "src", "index.ts");

function realIndexSource(): string {
  return readFileSync(INDEX_PATH, "utf-8");
}

describe("extractRealExports — export domain coverage (mutation-proven, one per form)", () => {
  it("MUST_PASS: the real src/index.ts barrel-only baseline count is exact (no false positive)", () => {
    const source = realIndexSource();
    const names = extractRealExports(source);
    // Sanity floor: the repo has well over 100 real barrel exports today.
    // This is not a hardcoded expected total (that would be a typed value —
    // derive-never-type violation); it only proves the function still
    // extracts a plausible non-zero, non-degenerate count from real source.
    expect(names.size).toBeGreaterThan(100);
    expect(names.has("MosaicButton")).toBe(true);
  });

  it("MUST_BLOCK form 1/3 (const): `export const MosaicProbeZZ = 1;` on REAL src/index.ts moves the count — proven hole before this fix", () => {
    const before = extractRealExports(realIndexSource());
    const mutated = `${realIndexSource()}\nexport const MosaicProbeZZ = 1;\n`;
    expect(mutated, "mutation did not land in the in-memory source").toContain(
      "export const MosaicProbeZZ = 1;",
    );

    const after = extractRealExports(mutated);
    expect(after.size, "extractRealExports must be blind no longer").toBe(before.size + 1);
    expect(after.has("MosaicProbeZZ")).toBe(true);
  });

  it("MUST_BLOCK form 2/3 (function): `export function mosaicProbeFn() {}` on REAL src/index.ts moves the count", () => {
    const before = extractRealExports(realIndexSource());
    const mutated = `${realIndexSource()}\nexport function mosaicProbeFn() {}\n`;
    expect(mutated).toContain("export function mosaicProbeFn() {}");

    const after = extractRealExports(mutated);
    expect(after.size).toBe(before.size + 1);
    expect(after.has("mosaicProbeFn")).toBe(true);
  });

  it("MUST_BLOCK form 3/3 (class): `export class MosaicProbeClass {}` on REAL src/index.ts moves the count", () => {
    const before = extractRealExports(realIndexSource());
    const mutated = `${realIndexSource()}\nexport class MosaicProbeClass {}\n`;
    expect(mutated).toContain("export class MosaicProbeClass {}");

    const after = extractRealExports(mutated);
    expect(after.size).toBe(before.size + 1);
    expect(after.has("MosaicProbeClass")).toBe(true);
  });

  it('MUST_BLOCK the export-star form: a BARE `export * from "…";` is not silently under-counted — it fails LOUD, naming the site', () => {
    const mutated = `${realIndexSource()}\nexport * from "./components/skeleton/skeleton-variants.js";\n`;
    expect(mutated).toContain('export * from "./components/skeleton/skeleton-variants.js";');

    expect(() => extractRealExports(mutated)).toThrowError(/bare "export \* from/);
    let thrown: Error | undefined;
    try {
      extractRealExports(mutated);
    } catch (e) {
      thrown = e as Error;
    }
    expect(thrown?.message).toContain("skeleton-variants.js");
    expect(thrown?.message).toMatch(/src\/index\.ts:\d+/);
  });

  it('a namespaced `export * as NS from "…";` IS enumerable and is counted (NS itself is a real binding)', () => {
    const before = extractRealExports(realIndexSource());
    const mutated = `${realIndexSource()}\nexport * as MosaicProbeNS from "./components/skeleton/skeleton-variants.js";\n`;
    expect(mutated).toContain("export * as MosaicProbeNS from");

    const after = extractRealExports(mutated);
    expect(after.size).toBe(before.size + 1);
    expect(after.has("MosaicProbeNS")).toBe(true);
  });

  it("MUST_PASS: `export type {...}` blocks are still excluded (types are not value exports)", () => {
    const source = [
      'export { MosaicAlpha } from "./a.js";',
      'export type { MosaicAlphaProps } from "./a.js";',
    ].join("\n");
    const names = extractRealExports(source);
    expect(names.has("MosaicAlpha")).toBe(true);
    expect(names.has("MosaicAlphaProps")).toBe(false);
    expect(names.size).toBe(1);
  });
});

describe("extractRealExports — restoration discipline", () => {
  afterEach(() => {
    // This suite never writes to disk (all mutations are in-memory strings
    // fed straight to extractRealExports), so there is nothing to restore —
    // asserted here so a future edit that DOES start writing to src/index.ts
    // is forced to add the restoration step this comment documents.
    const source = realIndexSource();
    expect(source).not.toContain("MosaicProbeZZ");
    expect(source).not.toContain("mosaicProbeFn");
    expect(source).not.toContain("MosaicProbeClass");
    expect(source).not.toContain("MosaicProbeNS");
  });

  it("src/index.ts on disk carries none of this suite's probe mutations", () => {
    expect(realIndexSource()).not.toContain("MosaicProbeZZ");
  });
});
