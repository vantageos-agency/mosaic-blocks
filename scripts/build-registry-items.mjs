#!/usr/bin/env node
/**
 * build-registry-items.mjs
 *
 * Generates per-item shadcn-CLI-installable registry JSON files under r/
 * from registry.json (the single source of truth for the item list).
 *
 * registry.json entries carry only {path, type} pointers per file. The
 * shadcn CLI installs from a per-item JSON that carries file CONTENT inline.
 * This script reads each cited source file from disk and emits that inline
 * form, adding `content` (file text). No `target` is emitted: for registry:ui,
 * registry:hook and registry:lib the shadcn CLI then installs into the
 * consumer's components.json alias (ui / hooks / lib) and rewrites imports;
 * an explicit `target` would bypass both. `target` is only required by the
 * schema for registry:file / registry:page, which no item uses.
 *
 * Usage:
 *   node scripts/build-registry-items.mjs                # all items
 *   node scripts/build-registry-items.mjs mosaic-accordion [more-name ...]
 *
 * Fails loudly (non-zero exit, named item + path) on any unreadable or
 * empty source file, an item with no files[], or a relative import that
 * would not resolve once installed. Never silently skips.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NON_SHIPPED_MATCHERS, globToRegExp, isShipped } from "./non-shipped.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const registryPath = join(repoRoot, "registry.json");
const outDir = join(repoRoot, "r");

// Non-shipped files (tests, stories): the exclusion lives in non-shipped.mjs,
// shared with registry-json-derive.mjs so there is exactly one copy.
export { NON_SHIPPED_MATCHERS, globToRegExp, isShipped };

// Package identity (name + version) is READ from package.json, never typed:
// the pinned registryDependencies URL below is derived from it, so a release
// bump moves every URL with it and the committed r/ drifts until regenerated.
export function readPackageIdentity(root = repoRoot) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (!pkg.name || !pkg.version) {
    throw new Error(
      `package.json at ${root} has no name/version — cannot pin registryDependencies`,
    );
  }
  return { name: pkg.name, version: pkg.version };
}

// A cross-item registryDependency is a VERSION-PINNED jsdelivr URL of the
// sibling item's r/ file inside the published npm package, so the shadcn CLI
// resolves it without any registry host of ours and never floats to a newer
// version than the one the item was generated with.
export function pinnedItemUrl(itemName, { name, version }) {
  return `https://cdn.jsdelivr.net/npm/${name}@${version}/r/${itemName}.json`;
}

export function deriveTarget(sourcePath) {
  return `components/ui/${basename(sourcePath)}`;
}

export function loadRegistry() {
  if (!existsSync(registryPath)) {
    throw new Error(`registry.json not found at ${registryPath}`);
  }
  const raw = readFileSync(registryPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`registry.json is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed.items)) {
    throw new Error("registry.json has no items[] array — cannot derive item list");
  }
  return parsed.items;
}

// Relative-import contract (decision: REWRITE to the registry alias, derive
// the dependency, refuse what cannot be mapped).
//
// Every file is flattened to `components/ui/<basename>`, so a specifier that
// crosses item directories (`../device-provider/X.js`) cannot resolve once
// installed. Files carry no `target`, so the CLI flattens them into the consumer's
// ui alias and the consumer's components.json aliases remain authoritative.
// Instead the generator rewrites each cross-item import to the alias form the
// shadcn CLI itself rewrites to the consumer's `aliases.ui`:
//   `@/components/ui/<Basename>`  (CLI: transformImport, `^@/components/ui` -> aliases.ui)
// and adds the imported item to `registryDependencies`, DERIVED from the import
// graph (path -> owning item), never from a hand list. Extension is dropped
// (`X.js` -> `X`) so resolution never depends on a `.js` -> `.tsx` mapping.
//   - `./<name>` resolving to a file of the SAME item       -> left as is
//   - `./<name>` resolving to ANOTHER item's file           -> left as is (same
//     directory survives flattening); owner added to registryDependencies
//   - `../<dir>/<name>` resolving to a shipped registry file -> rewritten to the
//     alias; owner added to registryDependencies (own item: rewritten, no dep)
//   - anything else (resolves to no shipped registry file, deeper/odd paths,
//     basename shared by another shipped file)               -> REFUSED by name
const RELATIVE_IMPORT_RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["'](\.\.?\/[^"']*|\.\.?)["']/g;

export function findRelativeImports(source) {
  return [...source.matchAll(RELATIVE_IMPORT_RE)].map((m) => m[1]);
}

function resolveToRegistryPath(fromPath, spec, pathToItem) {
  const base = posix.join(posix.dirname(fromPath), spec);
  const stem = base.replace(/\.(m|c)?jsx?$/, "");
  const candidates = [base, `${stem}.tsx`, `${stem}.ts`, `${base}.tsx`, `${base}.ts`];
  return candidates.find((c) => pathToItem.has(c));
}

export function buildPathIndex(items) {
  const pathToItem = new Map();
  for (const it of items)
    for (const f of (it.files ?? []).filter((x) => isShipped(x.path)))
      pathToItem.set(f.path, it.name);
  return pathToItem;
}

export function buildItem(
  item,
  { root = repoRoot, pathToItem = new Map(), pkg = readPackageIdentity(root) } = {},
) {
  if (!Array.isArray(item.files) || item.files.length === 0) {
    throw new Error(`item "${item.name}" has no files[] — cannot generate inline content`);
  }
  const derived = new Set();

  const shipped = item.files.filter((file) => isShipped(file.path));
  if (shipped.length === 0) {
    throw new Error(`item "${item.name}" has no shippable source file (only stories/tests listed)`);
  }

  const files = shipped.map((file) => {
    const absPath = join(root, file.path);
    if (!existsSync(absPath)) {
      throw new Error(`item "${item.name}": source file not found on disk: ${file.path}`);
    }
    const content = readFileSync(absPath, "utf8");
    if (content.length === 0) {
      throw new Error(`item "${item.name}": source file is empty: ${file.path}`);
    }
    const rewritten = content.replace(RELATIVE_IMPORT_RE, (whole, spec) => {
      const where = `item "${item.name}": ${file.path} imports "${spec}"`;
      const hit = /^\.{1,2}\/[^"']+$/.test(spec)
        ? resolveToRegistryPath(file.path, spec, pathToItem)
        : undefined;
      if (hit === undefined) {
        throw new Error(
          `${where} — resolves to no shipped registry file, cannot map it to an alias`,
        );
      }
      const owner = pathToItem.get(hit);
      if (owner !== item.name) derived.add(owner);
      if (/^\.\/[^/]+$/.test(spec)) return whole;
      if (!/^\.\.\/[^/.][^/]*\/[^/]+$/.test(spec)) {
        throw new Error(
          `${where} — not a "./<name>" or "../<dir>/<name>" import, cannot map it to an alias`,
        );
      }
      const flat = basename(hit);
      const clash = [...pathToItem.keys()].filter((p) => p !== hit && basename(p) === flat);
      if (clash.length > 0) {
        throw new Error(
          `${where} — basename "${flat}" is shared with ${clash.join(", ")}; the flat alias would be ambiguous`,
        );
      }
      const alias = `@/${deriveTarget(hit).replace(/\.[^/.]+$/, "")}`;
      return whole.replace(spec, alias);
    });
    return {
      ...file,
      content: rewritten,
    };
  });

  // Cross-item dependencies (names owned by a registry item) become pinned
  // URLs; anything else a hand-declared dependency names is kept verbatim.
  const itemNames = new Set(pathToItem.values());
  const registryDependencies = [
    ...new Set([...(item.registryDependencies ?? []), ...[...derived].sort()]),
  ].map((dep) => (itemNames.has(dep) ? pinnedItemUrl(dep, pkg) : dep));

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies ?? [],
    registryDependencies,
    files,
    type: item.type,
    ...(item.categories ? { categories: item.categories } : {}),
  };
}

export function serializeItem(built) {
  return `${JSON.stringify(built, null, 2)}\n`;
}

function main() {
  const filters = process.argv.slice(2);
  const items = loadRegistry();
  const pathToItem = buildPathIndex(items);

  const selected = filters.length > 0 ? items.filter((i) => filters.includes(i.name)) : items;

  if (filters.length > 0) {
    const missing = filters.filter((name) => !items.some((i) => i.name === name));
    if (missing.length > 0) {
      throw new Error(`requested item(s) not found in registry.json: ${missing.join(", ")}`);
    }
  }

  // All-or-nothing: build and validate every selected item first, write only
  // when none was refused, so a refusal never leaves a half-regenerated r/.
  const built = [];
  const refusals = [];
  for (const item of selected) {
    try {
      built.push([item.name, buildItem(item, { pathToItem })]);
    } catch (err) {
      refusals.push(err.message);
    }
  }
  if (refusals.length > 0) {
    for (const r of refusals) console.error(`build-registry-items: REFUSED — ${r}`);
    throw new Error(`${refusals.length} of ${selected.length} item(s) refused, nothing written`);
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  for (const [name, item] of built) {
    writeFileSync(join(outDir, `${name}.json`), serializeItem(item), "utf8");
  }

  console.log(`build-registry-items: wrote ${built.length} item(s) to ${outDir}/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`build-registry-items: FAILED — ${err.message}`);
    process.exit(1);
  }
}
