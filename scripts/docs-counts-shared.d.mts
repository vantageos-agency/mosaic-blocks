/**
 * Hand-authored type declarations for docs-counts-shared.mjs.
 *
 * The shared module is plain JavaScript (it must be `node`-runnable with no
 * build step, since scripts/docs-counts.mjs invokes it directly at runtime).
 * This declaration file gives `src/__tests__/readme-matches-exports.test.ts`
 * (compiled under tsconfig.test.json, `strict: true`) real types for every
 * export, instead of turning on `allowJs` project-wide or falling back to
 * implicit `any`. Keep this file's signatures in lockstep with the JSDoc
 * types in docs-counts-shared.mjs — `tsc --noEmit -p tsconfig.test.json`
 * fails loudly if a consumer uses an export in a way this file doesn't
 * describe.
 */

export type VersionTableRowStatus = "Current" | "Historical" | "unclassified";

export function extractRealExports(indexSource: string): Set<string>;
export function extractRealTypeExports(indexSource: string): Set<string>;
export function extractCitedMosaicTokens(doc: string): string[];
export function extractCatalogDocumentedMosaicNames(catalog: string): Set<string>;
export function extractVersionTableRowStatusByLine(doc: string): Map<number, VersionTableRowStatus>;
export function lineNumberAt(doc: string, index: number): number;
export function mosaicCountPatterns(): RegExp[];
export function totalExportsPatterns(): RegExp[];

export const HERO_RE: RegExp;
export const SECTION6_SUMMARY_RE: RegExp;
export const SECTION6_TOTAL_RE: RegExp;
export const CATALOG_HEADER_DOCUMENTED_RE: RegExp;
export const CATALOG_LIVE_LIB_RE: RegExp;
export const CATALOG_FOOTER_RE: RegExp;
