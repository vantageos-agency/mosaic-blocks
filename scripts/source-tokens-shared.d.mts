/**
 * Hand-authored type declarations for source-tokens-shared.mjs (plain
 * JavaScript, `node`-runnable with no build step). Keep in lockstep with the
 * JSDoc types in the .mjs; `tsc --noEmit -p tsconfig.test.json` fails loudly
 * if a test uses an export in a way this file does not describe.
 */

import type * as TypeScript from "typescript";

export class SourceReadRefusal extends Error {
  constructor(what: string);
  what: string;
}

export const JSX_TEXT_KINDS: string[];

export function loadTypeScript(): typeof TypeScript;

export function deriveUnclassifiedTextKinds(tsApi: typeof TypeScript): Map<number, string>;

export interface SourceLiteral {
  kind: "string" | "template";
  start: number;
  end: number;
  parts: Array<[number, number]>;
  node: TypeScript.Node;
}

export interface SourceTokens {
  sourceFile: TypeScript.SourceFile;
  literals: SourceLiteral[];
  comments: Array<[number, number]>;
  regexes: Array<[number, number]>;
  texts: Array<[number, number]>;
}

export function readSourceTokens(
  tsApi: typeof TypeScript,
  text: string,
  options: { fileName: string; label?: string; ignoreKinds?: string[] },
): SourceTokens;

export function blankRanges(
  text: string,
  ranges: Array<[number, number]>,
  options?: { keepCarriageReturn?: boolean },
): string;
