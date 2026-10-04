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
 * form, adding `content` (file text) and `target` (derived install path).
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const registryPath = join(repoRoot, "registry.json");
const outDir = join(repoRoot, "r");

// Non-shipped files: items carry component sources only.
//
// registry.json lists every non-`.test` source of a component directory,
// stories included (registry-json-derive.mjs filters `.test.tsx?` only), and
// this script used to inline each listed file verbatim. The exclusion is
// derived from the repo's own conventions, never typed:
//   - test files:   vitest's own default `include` glob (vitest/config
//                   configDefaults.include) — the runner `pnpm test` uses,
//                   vitest.config.ts declares no `include` of its own;
//   - story files:  the `stories` glob of .storybook/main.ts, read at run time;
//   - `__tests__/`: the repo's test directory (vitest.config.ts excludes
//                   `src/__tests__/derived/**`; tests live under `__tests__`).
// Anything this script cannot read or translate fails loud, never skips.
const { configDefaults } = await import("vitest/config");

/** Glob -> RegExp for the constructs the sources above use; throws on any other. */
export function globToRegExp(glob) {
  let out = "";
  const closers = [];
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    const two = glob.slice(i, i + 2);
    if (glob.slice(i, i + 3) === "**/") {
      out += "(?:.*/)?";
      i += 2;
    } else if (c === "*") out += "[^/]*";
    else if ((two === "?(" || two === "@(") && /[?@]/.test(c)) {
      out += "(?:";
      closers.push(two === "?(" ? ")?" : ")");
      i += 1;
    } else if (c === "{") {
      out += "(?:";
      closers.push(")");
    } else if (c === "(") {
      throw new Error(`unsupported glob construct "(" in "${glob}"`);
    } else if ((c === ")" || c === "}") && closers.length > 0) out += closers.pop();
    else if (c === "," && closers.length > 0) out += "|";
    else if (c === "|" && closers.length > 0) out += "|";
    else if (c === "[") {
      const end = glob.indexOf("]", i);
      if (end < 0) throw new Error(`unterminated "[" in glob "${glob}"`);
      out += glob.slice(i, end + 1);
      i = end;
    } else if (c === "?") out += "[^/]";
    else if (/[!+]/.test(c) && glob[i + 1] === "(") {
      throw new Error(`unsupported glob construct "${two}" in "${glob}"`);
    } else out += c.replace(/[.^$|\\)]/g, "\\$&");
  }
  if (closers.length > 0) throw new Error(`unbalanced group in glob "${glob}"`);
  return new RegExp(`^${out}$`);
}

function readStoriesGlobs() {
  const mainPath = join(repoRoot, ".storybook", "main.ts");
  if (!existsSync(mainPath)) {
    throw new Error(
      `storybook config not found at ${mainPath} — cannot derive the stories exclusion`,
    );
  }
  const m = readFileSync(mainPath, "utf8").match(/\bstories:\s*\[([^\]]*)\]/);
  const globs = m ? [...m[1].matchAll(/["']([^"']+)["']/g)].map((g) => g[1]) : [];
  if (globs.length === 0) {
    throw new Error(`no stories glob found in ${mainPath} — cannot derive the stories exclusion`);
  }
  return globs.map((g) => posix.normalize(posix.join(".storybook", g)));
}

export const NON_SHIPPED_MATCHERS = [...configDefaults.include, ...readStoriesGlobs()].map(
  globToRegExp,
);

export function isShipped(sourcePath) {
  if (sourcePath.split("/").includes("__tests__")) return false;
  return !NON_SHIPPED_MATCHERS.some((re) => re.test(sourcePath));
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

// Relative-import contract (decision: REFUSE, do not derive).
//
// Every file is flattened to `components/ui/<basename>`, so the only relative
// specifier that still resolves after install is a same-directory `./<name>`.
// A `../x/Y` specifier is broken by the flattening itself, whether or not the
// target is also a registry item: deriving `registryDependencies` from it would
// advertise an item as installable while the installed file still fails to
// resolve. So the generator does not derive; it refuses what it cannot make
// installable, naming the item, the file and the import.
//   - specifier not of the form `./<name>`            -> refused (path does not survive flattening)
//   - `./<name>` resolving to no registry file         -> refused (not shipped)
//   - `./<name>` resolving to ANOTHER item's file      -> allowed only when that item
//     is declared in the item's registryDependencies in registry.json
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

export function buildItem(item, { root = repoRoot, pathToItem = new Map() } = {}) {
  if (!Array.isArray(item.files) || item.files.length === 0) {
    throw new Error(`item "${item.name}" has no files[] — cannot generate inline content`);
  }
  const declared = new Set(item.registryDependencies ?? []);

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
    for (const spec of findRelativeImports(content)) {
      const where = `item "${item.name}": ${file.path} imports "${spec}"`;
      if (!/^\.\/[^/]+$/.test(spec)) {
        throw new Error(
          `${where} — not a same-directory "./<name>" import; files are flattened to components/ui/, so it will not resolve once installed`,
        );
      }
      const hit = resolveToRegistryPath(file.path, spec, pathToItem);
      if (hit === undefined) {
        throw new Error(`${where} — resolves to no registry file, so it is not shipped`);
      }
      const owner = pathToItem.get(hit);
      if (owner !== item.name && !declared.has(owner)) {
        throw new Error(
          `${where} — belongs to item "${owner}", which is not declared in registryDependencies`,
        );
      }
    }
    return {
      ...file,
      content,
      target: deriveTarget(file.path),
    };
  });

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
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
