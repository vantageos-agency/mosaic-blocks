#!/usr/bin/env node
/**
 * census.mjs — which packages each built entry of the package loads, and whether the root entry
 * loads a package a consumer may legitimately not have installed.
 *
 * Class of failure: a peer dependency that only some components need is imported by the root
 * entry. Every consumer of the root then has to install it, and a bundler resolving the root
 * entry fails on the missing package even when the consumer never renders those components.
 *
 * What it reads: every entry declared in package.json "exports" that points at built JavaScript,
 * both formats (import and require). The bare package specifiers come from a TypeScript parse of
 * each file, never from a text search: `import … from`, `export … from`, a side-effect `import`,
 * `import x = require()`, a `require("…")` call (eager in CommonJS) and an `import("…")` call
 * (lazy, listed separately). A `require` or `import()` whose argument is not a string literal
 * refuses the run, naming the file and line: the census cannot say what it loads.
 *
 * What it asserts (exit 1 on a violation, exit 2 when it cannot judge):
 *   1. the root entry (".") loads no `ag-grid-*` package, no `@heroui/react` and no
 *      `lucide-react` eagerly;
 *   2. the grid entry ("./grid") loads `ag-grid-community` and `ag-grid-react` and no HeroUI or
 *      lucide; the registre entry ("./registre") loads `@heroui/react` and `lucide-react` and no
 *      AG Grid (PEER_ISOLATION);
 *   3. every package the root entry loads eagerly is a dependency or a NON-optional peer.
 *
 * Run from anywhere after `pnpm build`: node e2e/root-without-grid/census.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");

function refuse(message) {
  console.error(`census: REFUSING TO JUDGE: ${message}`);
  process.exit(2);
}

let ts;
try {
  ts = createRequire(resolve(ROOT, "package.json"))("typescript");
} catch (err) {
  refuse(`cannot load typescript from the repository's node_modules (${err.message})`);
}

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

/** "@scope/name/sub" -> "@scope/name"; "name/sub" -> "name". */
function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function isBare(specifier) {
  return !specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("node:");
}

/** @returns {{ eager: Set<string>, lazy: Set<string> }} bare package names loaded by the file */
function specifiersOf(relPath) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) refuse(`${relPath} does not exist — run \`pnpm build\` first`);
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const eager = new Set();
  const lazy = new Set();
  const add = (set, node) => {
    if (!ts.isStringLiteralLike(node)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      refuse(`${relPath}:${line + 1} loads a module whose name is not a string literal`);
    }
    if (isBare(node.text)) set.add(packageOf(node.text));
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) {
      add(eager, node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      add(eager, node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        add(lazy, node.arguments[0]);
      } else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
        if (node.arguments.length !== 1) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          refuse(`${relPath}:${line + 1} calls require with ${node.arguments.length} arguments`);
        }
        add(eager, node.arguments[0]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  // Positive control: every built entry of this package loads at least one package eagerly (the
  // component entries load react, the server entry class-variance-authority). A parse that finds
  // none has stopped reading the file, and its empty set would read as "clean".
  if (eager.size === 0) refuse(`${relPath}: no eager package load found — the parse is blind`);
  return { eager, lazy };
}

const exportsField = pkg.exports;
if (!exportsField || typeof exportsField !== "object") refuse("package.json has no exports map");

/** @type {Map<string, Array<{ file: string, eager: Set<string>, lazy: Set<string> }>>} */
const entries = new Map();
for (const [subpath, target] of Object.entries(exportsField)) {
  if (typeof target === "string") {
    if (target.endsWith(".js") || target.endsWith(".cjs")) {
      refuse(`export ${subpath} is a bare string pointing at JavaScript (${target})`);
    }
    console.log(`census: ${subpath} -> ${target} (not JavaScript, not read)`);
    continue;
  }
  const files = [target.import, target.require].filter(Boolean);
  if (files.length === 0) refuse(`export ${subpath} has neither an import nor a require target`);
  entries.set(
    subpath,
    files.map((file) => ({ file, ...specifiersOf(file) })),
  );
}

const optionalPeers = new Set(
  Object.entries(pkg.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta?.optional === true)
    .map(([name]) => name),
);
const requiredPeers = Object.keys(pkg.peerDependencies ?? {}).filter((n) => !optionalPeers.has(n));
const alwaysInstalled = new Set([...Object.keys(pkg.dependencies ?? {}), ...requiredPeers]);

for (const [subpath, files] of entries) {
  for (const { file, eager, lazy } of files) {
    console.log(`census: ${subpath} ${file} eager=[${[...eager].sort().join(", ")}]`);
    console.log(`census: ${subpath} ${file} lazy=[${[...lazy].sort().join(", ")}]`);
  }
}

// What each component entry may and must load eagerly. The root carries the core blocks only:
// the AG Grid components live behind "./grid" and the HeroUI registry-screen blocks behind
// "./registre", so none of their peers reaches a consumer of the root.
const PEER_ISOLATION = new Map([
  [
    ".",
    { must: [], never: ["ag-grid-community", "ag-grid-react", "@heroui/react", "lucide-react"] },
  ],
  [
    "./grid",
    { must: ["ag-grid-community", "ag-grid-react"], never: ["@heroui/react", "lucide-react"] },
  ],
  [
    "./registre",
    { must: ["@heroui/react", "lucide-react"], never: ["ag-grid-community", "ag-grid-react"] },
  ],
]);

const violations = [];
const root = entries.get(".");
if (!root) refuse('package.json exports has no "." entry');
for (const { file, eager } of root) {
  for (const name of eager) {
    if (name.startsWith("ag-grid-")) violations.push(`root ${file} loads ${name} eagerly`);
    if (!alwaysInstalled.has(name)) {
      violations.push(
        `root ${file} loads ${name} eagerly, but it is neither a dependency nor a required peer`,
      );
    }
  }
}
for (const [subpath, { must, never }] of PEER_ISOLATION) {
  const files = entries.get(subpath);
  if (!files) {
    violations.push(`package.json exports has no "${subpath}" entry`);
    continue;
  }
  for (const { file, eager } of files) {
    for (const name of must) {
      if (!eager.has(name)) violations.push(`${subpath} ${file} does not load ${name}`);
    }
    for (const name of never) {
      if (eager.has(name)) violations.push(`${subpath} ${file} loads ${name} eagerly`);
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) console.log(`census: VIOLATION ${v}`);
  console.log(`census: FAIL (${violations.length} violation(s))`);
  process.exit(1);
}
console.log("census: PASS");
