/**
 * parse-guard.mjs
 *
 * Uses the TypeScript compiler API to parse every src/**\/*.ts + src/**\/*.tsx
 * file and collect syntactic diagnostics. Exits non-zero if ANY file has a
 * parse/syntax error — catches curly-as-delimiter / bundle-breaking parse
 * errors before they merge.
 *
 * Mirror of the vantage-immo #89 bundleGuard pattern (fix-pattern m978csm3).
 *
 * Usage:
 *   node scripts/parse-guard.mjs
 *   pnpm parse-guard
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");

// ── Project root (one level up from scripts/) ─────────────────────────────────
const root = new URL("..", import.meta.url).pathname;
const srcDir = resolve(root, "src");

// ── Collect all .ts / .tsx files under src/ ───────────────────────────────────
function collectFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, results);
    } else if (/\.(tsx?)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

const files = collectFiles(srcDir);

if (files.length === 0) {
  console.error("parse-guard: no .ts/.tsx files found under src/ — check your setup.");
  process.exit(1);
}

console.log(`parse-guard: scanning ${files.length} file(s) under src/`);

// ── Minimal compiler options — syntax check only, no type resolution needed ───
const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
};

// ── Custom host that serves our in-memory files ───────────────────────────────
const fileMap = new Map(files.map((f) => [f, readFileSync(f, "utf-8")]));

const host = {
  getSourceFile(fileName, langVersion) {
    const text = fileMap.get(fileName);
    return text !== undefined ? ts.createSourceFile(fileName, text, langVersion, true) : undefined;
  },
  writeFile() {},
  getDefaultLibFileName: () => "lib.d.ts",
  useCaseSensitiveFileNames: () => true,
  getCanonicalFileName: (f) => f,
  getCurrentDirectory: () => root,
  getNewLine: () => "\n",
  fileExists: (f) => fileMap.has(f),
  readFile: (f) => fileMap.get(f),
};

// ── Build program and collect syntactic diagnostics ───────────────────────────
const program = ts.createProgram({ rootNames: files, options: compilerOptions, host });

let totalErrors = 0;

for (const filePath of files) {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) continue;

  const diagnostics = program.getSyntacticDiagnostics(sourceFile);
  for (const diag of diagnostics) {
    const rel = relative(root, filePath);
    const pos =
      diag.file && diag.start !== undefined
        ? ts.getLineAndCharacterOfPosition(diag.file, diag.start)
        : { line: 0, character: 0 };
    const message = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
    console.error(`parse-guard ERROR  ${rel}:${pos.line + 1}:${pos.character + 1}  ${message}`);
    totalErrors++;
  }
}

if (totalErrors > 0) {
  console.error(`\nparse-guard: ${totalErrors} syntax error(s) found. Fix before merging.`);
  process.exit(1);
} else {
  console.log("parse-guard: all files OK — no syntax errors detected.");
}
