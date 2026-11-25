#!/usr/bin/env node
/**
 * registry-json-derive.mjs — derives `registry.json`'s item list from
 * `src/index.ts`, the same producer/consumer idiom `docs-counts.mjs` already
 * applies to the README/catalog counts (Day 129 doctrine — "dériver, jamais
 * taper", `.claude/rules/derive-never-type.md`).
 *
 * Why this exists: `registry.json` (shadcn schema, see docs/USAGE.md §2 and
 * docs/ARCHITECTURE.md) is documented as exposing "each component" for
 * copy-paste install via the shadcn CLI — i.e. it is meant to MIRROR the
 * package's exported component surface, one item per component directory
 * under `src/components/`. It was hand-typed once (67 items) and never
 * touched again while the barrel grew past 265 exports across 114 component
 * directories. Two real components (among ~48) were in the built bundle and
 * entirely absent from `registry.json` — a real external consumer read the
 * file as the export surface, concluded the component did not exist, and
 * believed themselves blocked. That is the hand-typed-inventory defect this
 * script closes: the item list is derived, never retyped.
 *
 * What is DERIVED (never hand-typed, this script is the sole producer):
 *   - The SET of items and which directory/files back each one — read
 *     straight from `src/index.ts`'s export statements. A directory present
 *     in the export surface but absent from `registry.json` is impossible
 *     to construct by hand from here on: this script is the only writer.
 *   - `type` (registry:ui / registry:hook / registry:lib) — read from the
 *     export name's naming convention (`use*` -> hook) and the primary
 *     file's own extension/shape (`.ts` handler with no JSX -> lib).
 *   - `title` — the primary exported component/hook name, verbatim.
 *   - `dependencies` — the UNION of the bare packages imported by EVERY file
 *     of the item (its `files` list, not the primary only), matched against
 *     the eligible set, itself DERIVED from package.json `peerDependencies` +
 *     `dependencies` minus react/react-dom (never a hand-typed allowlist).
 *     Subpath imports (`"pkg/sub"`) count as `pkg`. An item file importing a
 *     bare package that is neither eligible, react/react-dom, nor a node
 *     builtin makes the derivation THROW naming file + package — never a
 *     silent drop. It is ALWAYS the derived value, for every item, new or
 *     existing: an existing item's saved `dependencies` is never preserved
 *     (a preserved list goes stale the moment a file's imports change, and
 *     did — items kept packages named only in comments and missed packages
 *     their files import). Only real import statements count: comments and
 *     string literals are masked before the scan. `--check` names every item
 *     whose saved list differs from the derivation.
 *   - `files` — every shipped (non-test, non-story) source file that actually exists in that
 *     component's directory, read from disk.
 *
 * What stays CURATED CONTENT, deliberately NOT overwritten by this script
 * once written once (an existing registry.json item's `description` is
 * preserved verbatim on every re-run — same "content vs state" distinction
 * `docs/components-catalog.md`'s curated subset already documents in
 * `docs-counts.mjs`'s header):
 *   - `description` — a human-authored one-line summary. For an entry that
 *     does not exist yet, this script seeds it from the primary file's own
 *     leading JSDoc comment (still DERIVED — read off the artifact, not
 *     invented) so the file never regresses to silently missing prose; a
 *     maintainer may hand-polish the wording afterwards without the next
 *     `derive` run reverting it.
 *
 * Modes:
 *   pnpm registry:derive          -> rewrites registry.json in place
 *   pnpm registry:derive --check  -> writes nothing; exits non-zero, NAMING
 *                                    every missing/stale component or item whose
 *                                    dependencies drifted from its imports, if the
 *                                    live registry.json disagrees with what
 *                                    src/index.ts currently exports
 *
 * Exit codes (three states — a refusal is never mistakable for a violation):
 *   0  clean (--check: registry.json is the derivation; otherwise: written/printed)
 *   1  VIOLATION — every artifact was read and something in it is wrong: an item
 *      missing or stale, saved dependencies that drifted from the imports, or a
 *      file importing a package package.json does not declare
 *      (`DerivationViolation`, the ONLY error class that maps to 1)
 *   2  REFUSING TO JUDGE: <what> — the script could not read something it needs
 *      (an unreadable/absent/malformed file, an export form or a dynamic import
 *      it cannot read, a declared exception it cannot apply, conflicting flags).
 *      Fail-closed: ANY other error, including an unexpected one, maps here —
 *      the domain is "violation, or could not judge", never a third silent case.
 *
 * Fail-closed by construction: any file this script expects to read (the
 * barrel, a component's primary file) that is unreadable is a LOUD error —
 * never a silent skip. `--check` finding nothing wrong prints the covered
 * count; it never exits 0 by falling through an empty scan (see the
 * `expectedDirs.size === 0` guard below).
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  componentBarrels,
  extractRealExports,
  maskCommentsAndStrings,
  scanExportStatements,
} from "./docs-counts-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INDEX_TS = join(ROOT, "src/index.ts");
const REGISTRY_JSON = join(ROOT, "registry.json");
const COMPONENTS_DIR = join(ROOT, "src/components");
const PACKAGE_JSON = join(ROOT, "package.json");

const CHECK = process.argv.includes("--check");
// `--stdout`: print the derived registry.json to stdout, write NOTHING. It lets a
// caller compare the derivation with the committed file (`cmp registry.json
// <(node scripts/registry-json-derive.mjs --stdout)`) without copying files around;
// the release-artifacts guard uses it to accept a registry.json that IS the derivation.
const STDOUT = process.argv.includes("--stdout");
if (CHECK && STDOUT) {
  console.error(
    "registry-json-derive: REFUSING TO JUDGE: --check and --stdout are mutually exclusive.",
  );
  process.exit(2);
}

/**
 * A defect FOUND in artifacts that were fully read (exit 1). Every other error
 * this script raises — or meets — means it could not read something, and is a
 * refusal to judge (exit 2). See the exit-code table in the header.
 */
export class DerivationViolation extends Error {}

/**
 * Reads a file, throwing a named, actionable error instead of letting a
 * bare ENOENT reach the top — fail-closed, never a silent empty string.
 * @param {string} path
 * @returns {string}
 */
function readFileOrThrow(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `registry-json-derive: cannot read \`${relative(ROOT, path)}\` — refusing to derive registry.json from an unreadable artifact. ${err.message}`,
    );
  }
}

/**
 * Reads and parses a JSON file, naming the file when it is not JSON or not the
 * expected shape — a malformed artifact is unreadable, never a bare SyntaxError.
 * @param {string} path
 * @returns {any}
 */
function readJsonOrThrow(path) {
  const raw = readFileOrThrow(path);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `registry-json-derive: \`${relative(ROOT, path)}\` is not valid JSON — refusing to derive from it. ${err.message}`,
    );
  }
}

/**
 * DECLARED DIVERGENCE (never silent): re-exports from these module paths are
 * real public API but are NOT shadcn registry items (the registry mirrors
 * component directories under src/components/). They are accepted by name
 * here, where the next reader sees it. Any OTHER non-component source makes
 * the derivation fail loud — a new path is a decision, never a silent skip.
 * @type {ReadonlySet<string>}
 */
const NON_REGISTRY_SOURCES = new Set([
  "./version.js",
  "./placeholder.js",
  "./hooks/useMediaQuery.js",
]);

/**
 * Parses src/index.ts's FULL export domain (census = `scanExportStatements`,
 * shared with docs-counts-shared.mjs). Every export statement is either
 * read into a registry export, accepted as a declared non-registry
 * re-export, or makes this function THROW naming the line: there is no
 * `continue` / `return []` on an unrecognised form.
 *
 * Covered: `export [type] { A, B as C } from "./components/<dir>/<File>.js"`
 * (-> registry exports), the same from a NON_REGISTRY_SOURCES path
 * (declared, skipped). Loud failure: bare `export *`, `export * as NS`,
 * local `export const/let/var/function/class/interface/type/enum/...`,
 * `export default`, `export { local }` with no `from`, an undeclared source
 * path, a component-path source without the `.js` suffix, an inline `type`
 * specifier modifier, and a value `as` alias in a component barrel.
 * @param {string} [src] defaults to the real src/index.ts
 * @returns {Array<{ name: string, dir: string, file: string, isType: boolean }>}
 */
export function parseBarrelExports(src = readFileOrThrow(INDEX_TS), label = "src/index.ts") {
  const out = [];
  const valueNames = new Set();
  for (const st of scanExportStatements(src)) {
    const where = `${label}:${st.line} (${st.text.replace(/\s+/g, " ").trim()})`;
    if (st.kind !== "named-reexport") {
      throw new Error(
        `registry-json-derive: unreadable export form \`${st.kind}${st.keyword ? ` ${st.keyword}` : ""}\` at ${where} — it cannot be mapped to a component directory, so the derived registry.json would silently omit it. Re-export it from a \`./components/<dir>/<File>.js\` barrel, or extend this script (and declare it) to cover the form.`,
      );
    }
    const comp = /^\.\/components\/(.+)\.js$/.exec(st.source);
    if (!comp && !NON_REGISTRY_SOURCES.has(st.source)) {
      throw new Error(
        `registry-json-derive: export source \`${st.source}\` at ${where} is neither a \`./components/<dir>/<File>.js\` barrel nor a declared NON_REGISTRY_SOURCES path — refusing to ignore it silently.`,
      );
    }
    for (const sp of st.specifiers) {
      if (sp.inlineType) {
        throw new Error(
          `registry-json-derive: inline \`type\` specifier modifier on \`${sp.local}\` at ${where} is not read by this script — use \`export type { ... }\` instead.`,
        );
      }
      if (!st.isType && sp.local !== sp.exported && comp) {
        throw new Error(
          `registry-json-derive: value alias \`${sp.local} as ${sp.exported}\` at ${where} — the registry slug is derived from the export name and an alias would make it ambiguous. Declare and handle the alias, or drop it.`,
        );
      }
      if (!st.isType) valueNames.add(sp.exported);
    }
    if (!comp) continue; // declared non-registry re-export (checked above)
    const relPath = comp[1];
    const dir = dirname(relPath);
    const file = relPath.slice(dir.length + 1);
    for (const sp of st.specifiers) {
      out.push({ name: sp.exported, dir, file, isType: st.isType });
    }
  }
  // Cross-check against the SINGLE shared definition of "named value export"
  // (G1's extractRealExports): every value name it counts must have been
  // accounted for above — a second, independent reading of the same file.
  // extractRealExports masks comments itself, so the raw source is passed.
  const shared = extractRealExports(src);
  const unaccounted = [...shared].filter((n) => !valueNames.has(n));
  const phantom = [...valueNames].filter((n) => !shared.has(n));
  if (unaccounted.length > 0 || phantom.length > 0) {
    throw new Error(
      `registry-json-derive: census mismatch against docs-counts-shared extractRealExports — value exports it counts but this parse did not account for: [${unaccounted.join(", ")}]; accounted here but not counted there: [${phantom.join(", ")}].`,
    );
  }
  if (out.length === 0) {
    throw new Error(
      `registry-json-derive: parsed ZERO export statements out of ${label} — the barrel's export syntax changed and this script can no longer read it. Refusing to derive an empty registry.json.`,
    );
  }
  return out;
}

/**
 * The export domain of the whole component surface: `parseBarrelExports` over every component
 * barrel (`componentBarrels`, shared with docs-counts: src/index.ts first, then every other
 * component entry of package.json "exports" — today src/grid.ts and src/registre.ts). A
 * component moved behind its own entry stays a registry item.
 * @param {string} [root] repository root
 * @returns {Array<{ name: string, dir: string, file: string, isType: boolean }>}
 */
export function parseSurfaceExports(root = ROOT) {
  const out = [];
  for (const { path } of componentBarrels(root)) {
    out.push(...parseBarrelExports(readFileOrThrow(join(root, path)), path));
  }
  return out;
}

/**
 * @param {string} dir component directory, relative to src/components
 * @param {(sourcePath: string) => boolean} isShipped non-shipped.mjs's predicate
 * @returns {string[]} shipped (non-test, non-story), non-declaration source files that exist on disk
 */
function sourceFilesIn(dir, isShipped) {
  const abs = join(COMPONENTS_DIR, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch (err) {
    throw new Error(
      `registry-json-derive: cannot list \`src/components/${dir}\` — a directory the barrel points at is unreadable. ${err.message}`,
    );
  }
  return entries
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => isShipped(`src/components/${dir}/${f}`))
    .filter((f) => !f.endsWith(".d.ts"))
    .sort()
    .filter((f) => {
      try {
        return statSync(join(abs, f)).isFile();
      } catch (err) {
        throw new Error(
          `registry-json-derive: cannot stat \`src/components/${dir}/${f}\` — a listed file is unreadable. ${err.message}`,
        );
      }
    });
}

/**
 * DECLARED DIVERGENCE (never silent — see .claude/rules/derive-never-type.md
 * and .claude/rules/guard-formulation-census.md): the default rule below is
 * ONE registry item per component directory. Exactly one directory in the
 * whole tree, `multi-tenant/multi-tenant-provider`, genuinely backs TWO
 * independent, separately-installable shadcn units — `MosaicMultiTenantProvider`
 * (a provider component) and `useEffectiveWorkspaceId` (a standalone hook
 * that happens to live alongside it). Folding them into one item would hide
 * the hook from `npx shadcn add .../use-effective-workspace-id`. This is a
 * one-time, human-reviewed exception, written here where the next reader
 * sees it — not a silent exclusion buried in a filter.
 * @type {Map<string, string[]>} dir -> ordered list of primary export names,
 *   each becoming its own registry item, each owning ONLY its own file.
 */
const MULTI_PRIMARY_DIRS = new Map([
  ["multi-tenant/multi-tenant-provider", ["MosaicMultiTenantProvider", "useEffectiveWorkspaceId"]],
]);

/**
 * DECLARED DIVERGENCE: directories whose exports span several component entries (the root,
 * "./grid", "./registre"). The default primary is the first value export in barrel order, and
 * with several barrels that order is a fact about how the barrels are read, not about the
 * component. Each directory here is pinned to the primary (and so the published slug) it had
 * before its components moved to those entries; the item still owns every shipped file of the
 * directory.
 * @type {Map<string, string>} dir -> primary export name
 */
const PINNED_PRIMARY_DIRS = new Map([
  ["registre", "GrilleRegistre"],
  ["document-review", "MosaicDocumentTable"],
]);

/**
 * Derives the shadcn-registry slug for a primary export name: `Mosaic`
 * prefix stripped and kebab-cased with a `mosaic-` prefix for components
 * (e.g. `MosaicClerkWebhookHandler` -> `mosaic-clerk-webhook-handler`,
 * matching directory `webhook-handler` only by coincidence — the slug is
 * derived from the EXPORT NAME, never the directory, so a directory whose
 * name differs from its component's own name still gets the right slug);
 * hooks keep their own camelCase name kebab-cased as-is (e.g.
 * `useEffectiveWorkspaceId` -> `use-effective-workspace-id`).
 * @param {string} exportName
 * @param {boolean} isHook
 * @returns {string}
 */
function slugFor(exportName, isHook) {
  // Dash inserted lowercase->uppercase and acronym-boundary, matching the
  // existing hand-chosen names exactly — including `MosaicFeature3Col` ->
  // `mosaic-feature-3col` (digit+uppercase stays fused: no dash between "3"
  // and "Col", only between "Feature" and "3Col").
  const kebab = (s) =>
    s
      .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
  if (isHook) return kebab(exportName);
  const stripped = exportName.startsWith("Mosaic") ? exportName.slice("Mosaic".length) : exportName;
  return `mosaic-${kebab(stripped)}`;
}

/**
 * Extracts the primary export(s) for a directory. Default: the export whose
 * PascalCase name matches `Mosaic<PascalCase(lastSegment)>` or
 * `use<PascalCase(...)>`, falling back to the first non-type export found
 * (matches every existing multi-file registry item, e.g. mosaic-org-panel,
 * mosaic-agent-composer). `MULTI_PRIMARY_DIRS` overrides this for the one
 * directory that genuinely backs more than one installable unit.
 * @param {Array<{name:string,dir:string,file:string,isType:boolean}>} exportsInDir
 * @param {string} dir
 * @returns {Array<{name:string,dir:string,file:string,isType:boolean}>}
 */
function primaryExports(exportsInDir, dir) {
  const real = exportsInDir.filter((e) => !e.isType);
  if (MULTI_PRIMARY_DIRS.has(dir)) {
    return MULTI_PRIMARY_DIRS.get(dir).map((wantedName) => {
      const found = real.find((e) => e.name === wantedName);
      if (!found) {
        throw new Error(
          `registry-json-derive: MULTI_PRIMARY_DIRS declares \`${wantedName}\` for \`src/components/${dir}\`, but no component barrel exports it. Update the declared exception.`,
        );
      }
      return found;
    });
  }
  if (PINNED_PRIMARY_DIRS.has(dir)) {
    const wantedName = PINNED_PRIMARY_DIRS.get(dir);
    const found = real.find((e) => e.name === wantedName);
    if (!found) {
      throw new Error(
        `registry-json-derive: PINNED_PRIMARY_DIRS declares \`${wantedName}\` for \`src/components/${dir}\`, but no component barrel exports it. Update the declared exception.`,
      );
    }
    return [found];
  }
  const last = dir.split("/").pop();
  const pascal = last
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
  const wanted = new Set([`Mosaic${pascal}`, `use${pascal}`]);
  const exact = real.find((e) => wanted.has(e.name));
  if (exact) return [exact];
  if (real.length === 0) {
    throw new Error(
      `registry-json-derive: directory \`src/components/${dir}\` has only type exports in the component barrels — no primary component/hook export found.`,
    );
  }
  return [real[0]];
}

/**
 * @param {string} name export name
 * @returns {"registry:hook" | "registry:ui"}
 */
function typeForExportName(name) {
  return /^use[A-Z]/.test(name) ? "registry:hook" : "registry:ui";
}

/**
 * Reads the primary file's leading `/** ... *\/` JSDoc block and returns its
 * first paragraph (up to the first blank comment line), stripped of `*`
 * decoration — DERIVED off the artifact, never invented.
 * @param {string} absPath
 * @returns {string}
 */
function leadingJsDocSummary(absPath) {
  const text = readFileOrThrow(absPath);
  // Not anchored at column 0: many component files open with a `"use
  // client";` directive before the JSDoc block. We still only take the
  // FIRST `/** ... */` block in the file (the file's own header comment),
  // never one further down (e.g. a per-prop doc comment).
  const m = /\/\*\*([\s\S]*?)\*\//.exec(text);
  if (!m) {
    return "(no leading JSDoc found — describe this component and replace this placeholder)";
  }
  const lines = m[1].split("\n").map((l) => l.replace(/^\s*\*\s?/, "").trimEnd());
  const paragraph = [];
  for (const line of lines) {
    if (line.trim() === "" && paragraph.length > 0) break;
    if (line.trim() === "") continue;
    paragraph.push(line);
  }
  return paragraph.join(" ").trim();
}

/** Packages that are the host's own runtime, never an item dependency. */
const HOST_RUNTIME = new Set(["react", "react-dom"]);
const BUILTINS = new Set(builtinModules);

/**
 * The packages an item may list in `dependencies`: package.json
 * `peerDependencies` + `dependencies`, minus react/react-dom. Derived from the
 * manifest on every run — a package becomes eligible by being declared there.
 * @param {{peerDependencies?: Record<string,string>, dependencies?: Record<string,string>}} pkgJson
 * @returns {Set<string>}
 */
export function eligibleDependencies(pkgJson) {
  return new Set(
    [
      ...Object.keys(pkgJson.peerDependencies ?? {}),
      ...Object.keys(pkgJson.dependencies ?? {}),
    ].filter((n) => !HOST_RUNTIME.has(n)),
  );
}

/**
 * Every module specifier of a source file. Census of forms (ES/TypeScript
 * module grammar): `import … from "x"`, `import type … from "x"`,
 * `export … from "x"`, side-effect `import "x"`, dynamic `import("x")`
 * (incl. `typeof import("x")`), `require("x")`. Comments are masked out and
 * keywords are matched on a string-blanked copy, so prose inside a comment or
 * a string literal is never read as an import. A dynamic import/require whose
 * argument is not a string literal THROWS — it cannot be read, so it is not
 * skipped.
 * @param {string} absPath
 * @returns {string[]}
 */
function specifiersIn(absPath) {
  const text = readFileOrThrow(absPath);
  // Token-read (a TypeScript parse by the file's own extension): a regex literal
  // or JSX text holding a quote can no longer open a fake string over the
  // import lines below it, and a file that does not parse REFUSES (a
  // SourceReadRefusal, exit 2 here) instead of yielding a half-masked copy.
  const kept = maskCommentsAndStrings(text, true, absPath);
  const blanked = maskCommentsAndStrings(text, false, absPath);
  const out = [];
  // Not a quote scanner: `quoteIdx` is the opening delimiter of a string TOKEN
  // (found in `blanked`, where only token delimiters survive), and the closing
  // one is the next same quote in `kept`. A module specifier carries no escaped
  // quote, so the first same quote is its closing delimiter; a specifier that
  // did would not be a package name, and `packageOf` / the declared-dependency
  // check below would refuse it by name.
  const literalAt = (quoteIdx) => {
    const q = kept[quoteIdx];
    const close = kept.indexOf(q, quoteIdx + 1);
    return kept.slice(quoteIdx + 1, close);
  };
  for (const m of blanked.matchAll(/\b(?:from|import)\s*(["'])/g)) {
    out.push(literalAt(m.index + m[0].length - 1));
  }
  for (const m of blanked.matchAll(/(?<![.\w$])(?:import|require)\s*\(\s*/g)) {
    const at = m.index + m[0].length;
    const ch = blanked[at];
    if ((ch !== '"' && ch !== "'" && ch !== "`") || (ch === "`" && literalAt(at).includes("${"))) {
      throw new Error(
        `registry-json-derive: \`${relative(ROOT, absPath)}\` has a non-literal \`${m[0].trim()}…)\` — its package cannot be read, refusing to derive its dependencies.`,
      );
    }
    out.push(literalAt(at));
  }
  return out;
}

/** `@scope/name/sub` -> `@scope/name`; `name/sub` -> `name`. */
function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * The item's `dependencies`: union over EVERY file of the item of the bare
 * packages it imports, sorted. Relative specifiers, node builtins and
 * react/react-dom are not dependencies; anything else not in `eligible`
 * THROWS naming the file and the package — never a silent drop.
 * @param {string[]} absPaths every file of the item
 * @param {Set<string>} eligible
 * @returns {string[]}
 */
export function dependenciesOfFiles(absPaths, eligible) {
  const deps = new Set();
  for (const absPath of absPaths) {
    for (const spec of specifiersIn(absPath)) {
      if (spec.startsWith(".") || spec.startsWith("/")) continue;
      if (spec.startsWith("node:") || BUILTINS.has(spec) || BUILTINS.has(packageOf(spec))) continue;
      const pkg = packageOf(spec);
      if (HOST_RUNTIME.has(pkg)) continue;
      if (!eligible.has(pkg)) {
        throw new DerivationViolation(
          `registry-json-derive: \`${relative(ROOT, absPath)}\` imports \`${spec}\` — package \`${pkg}\` is not declared in package.json peerDependencies/dependencies. Declare it, or a host installing this item from the registry will not get it.`,
        );
      }
      deps.add(pkg);
    }
  }
  return [...deps].sort();
}

/**
 * @returns {Map<string, Array<{name:string,dir:string,file:string,isType:boolean}>>}
 */
function groupByDir(exportsFlat) {
  const map = new Map();
  for (const e of exportsFlat) {
    if (!map.has(e.dir)) map.set(e.dir, []);
    map.get(e.dir).push(e);
  }
  return map;
}

/** @param {(sourcePath: string) => boolean} isShipped non-shipped.mjs's predicate */
function main(isShipped) {
  const ELIGIBLE_DEPENDENCIES = eligibleDependencies(readJsonOrThrow(PACKAGE_JSON));
  const exportsFlat = parseSurfaceExports();
  const byDir = groupByDir(exportsFlat);

  if (byDir.size === 0) {
    throw new Error(
      "registry-json-derive: zero component directories derived from the component barrels — refusing to write/verify an empty registry.json.",
    );
  }

  const existing = readJsonOrThrow(REGISTRY_JSON);
  if (
    existing === null ||
    typeof existing !== "object" ||
    !Array.isArray(existing.items) ||
    !existing.items.every(
      (it) => it !== null && typeof it === "object" && typeof it.name === "string",
    )
  ) {
    throw new Error(
      "registry-json-derive: `registry.json` has no `items` list of named entries — its shape cannot be read, refusing to compare against it.",
    );
  }
  const existingBySlug = new Map(existing.items.map((it) => [it.name, it]));

  const derivedItems = [];
  const missing = [];
  /** existing items whose saved `dependencies` differ from the derivation */
  const depsDrift = [];

  for (const [dir, exportsInDir] of [...byDir.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const primaries = primaryExports(exportsInDir, dir);
    const isMultiPrimary = MULTI_PRIMARY_DIRS.has(dir);
    const allDirFiles = sourceFilesIn(dir, isShipped);
    if (allDirFiles.length === 0) {
      throw new Error(
        `registry-json-derive: \`src/components/${dir}\` contains no source files on disk.`,
      );
    }

    for (const primary of primaries) {
      const isHook = typeForExportName(primary.name) === "registry:hook";
      const slug = slugFor(primary.name, isHook);
      const existingItem = existingBySlug.get(slug);

      const primaryAbsTsx = join(COMPONENTS_DIR, dir, `${primary.file}.tsx`);
      const primaryAbsTs = join(COMPONENTS_DIR, dir, `${primary.file}.ts`);
      const primaryAbs = existsSync(primaryAbsTsx)
        ? primaryAbsTsx
        : existsSync(primaryAbsTs)
          ? primaryAbsTs
          : (() => {
              throw new Error(
                `registry-json-derive: neither \`${relative(ROOT, primaryAbsTsx)}\` nor \`${relative(ROOT, primaryAbsTs)}\` exists on disk for export \`${primary.name}\`.`,
              );
            })();

      // Default: this item owns every source file in the directory (matches
      // existing multi-file items like mosaic-agent-composer, mosaic-toast).
      // MULTI_PRIMARY_DIRS exception: each primary owns ONLY its own file —
      // a declared divergence (see MULTI_PRIMARY_DIRS's own comment above).
      const ownFiles = isMultiPrimary
        ? allDirFiles.filter((f) => f === `${primary.file}.tsx` || f === `${primary.file}.ts`)
        : allDirFiles;
      const files = ownFiles.map((f) => ({
        path: `src/components/${dir}/${f}`,
        type: isHook ? "registry:hook" : "registry:ui",
      }));
      if (files.length === 0) {
        throw new Error(
          `registry-json-derive: MULTI_PRIMARY_DIRS entry \`${primary.name}\` in \`src/components/${dir}\` matched no file on disk.`,
        );
      }

      // Scanned for EVERY item, preserved or not: an undeclared import fails loud anywhere.
      const derivedDependencies = dependenciesOfFiles(
        files.map((f) => join(ROOT, f.path)),
        ELIGIBLE_DEPENDENCIES,
      );

      if (!existingItem) {
        missing.push(slug);
      } else {
        const saved = [...(existingItem.dependencies ?? [])].sort();
        if (saved.join("\n") !== derivedDependencies.join("\n")) {
          depsDrift.push(
            `${slug} (saved [${saved.join(", ")}], derived [${derivedDependencies.join(", ")}])`,
          );
        }
      }

      derivedItems.push({
        name: slug,
        type: isHook ? "registry:hook" : (existingItem?.type ?? "registry:ui"),
        title: existingItem?.title ?? primary.name,
        description: existingItem?.description ?? leadingJsDocSummary(primaryAbs),
        // Always derived, never preserved from existingItem: dependencies are
        // STATE read off the item's imports, not curated content.
        dependencies: derivedDependencies,
        files,
      });
    }
  }

  // Stale: an existing item whose backing directory no longer exists in the
  // barrel at all (removed/renamed component) — fail-closed, never silently
  // dropped without naming it.
  const stale = existing.items
    .map((it) => it.name)
    .filter((slug) => !derivedItems.some((d) => d.name === slug));

  if (CHECK) {
    if (missing.length === 0 && stale.length === 0 && depsDrift.length === 0) {
      console.log(
        `registry-json-derive --check: OK — registry.json covers all ${derivedItems.length} exported component director${derivedItems.length === 1 ? "y" : "ies"}.`,
      );
      return;
    }
    const lines = [];
    if (missing.length > 0) {
      lines.push(
        `MISSING from registry.json (exported by a component barrel, absent here): ${missing.join(", ")}`,
      );
    }
    if (depsDrift.length > 0) {
      lines.push(`DEPENDENCIES differ from the items' real imports: ${depsDrift.join("; ")}`);
    }
    if (stale.length > 0) {
      lines.push(
        `STALE in registry.json (no longer backed by any component barrel export): ${stale.join(", ")}`,
      );
    }
    console.error(
      `registry-json-derive --check: BLOCKED —\n  ${lines.join("\n  ")}\n\nFix: run \`pnpm registry:derive\` (no --check) to regenerate registry.json.`,
    );
    process.exitCode = 1;
    return;
  }

  const out = {
    $schema: existing.$schema,
    name: existing.name,
    homepage: existing.homepage,
    items: derivedItems,
  };
  if (STDOUT) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }
  writeFileSync(REGISTRY_JSON, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `registry-json-derive: wrote registry.json — ${derivedItems.length} item(s) (was ${existing.items.length}). ${missing.length} newly added: ${missing.join(", ") || "(none)"}.`,
  );
}

// Run only when invoked directly, so tests can import `parseBarrelExports`.
// Exit mapping (header table): DerivationViolation -> 1; anything else -> 2.
// non-shipped.mjs is imported HERE, dynamically, not statically at the top: it
// reads tsconfig.test.json and .storybook/main.ts while it is evaluated, and a
// static import that throws at evaluation would end the process before this
// handler exists — an unreadable file exiting 1, exactly like a violation.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { isShipped } = await import("./non-shipped.mjs");
    main(isShipped);
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).replace(
      /^registry-json-derive: /,
      "",
    );
    if (err instanceof DerivationViolation) {
      console.error(`registry-json-derive: BLOCKED — ${message}`);
      process.exitCode = 1;
    } else {
      console.error(`registry-json-derive: REFUSING TO JUDGE: ${message}`);
      process.exitCode = 2;
    }
  }
}
