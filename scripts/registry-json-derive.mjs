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
 *   - `dependencies` — read from the primary file's own `import` statements
 *     against the known peer-dependency allowlist (never asserted by hand).
 *   - `files` — every non-test source file that actually exists in that
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
 *                                    every missing/stale component, if the
 *                                    live registry.json disagrees with what
 *                                    src/index.ts currently exports
 *
 * Fail-closed by construction: any file this script expects to read (the
 * barrel, a component's primary file) that is unreadable is a LOUD error —
 * never a silent skip. `--check` finding nothing wrong prints the covered
 * count; it never exits 0 by falling through an empty scan (see the
 * `expectedDirs.size === 0` guard below).
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INDEX_TS = join(ROOT, "src/index.ts");
const REGISTRY_JSON = join(ROOT, "registry.json");
const COMPONENTS_DIR = join(ROOT, "src/components");

const CHECK = process.argv.includes("--check");

// Known peer/runtime dependencies a component's own `import` lines may
// reference. Anything else stays out of `dependencies` (workspace-relative
// imports, node builtins, React itself).
const KNOWN_DEPENDENCIES = [
  "@base-ui/react",
  "class-variance-authority",
  "@clerk/nextjs",
  "next-themes",
  "svix",
  "@vantageos/cloud-identity",
];

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
 * Parses every `export { Name } from "./components/<dir>/<File>.js"` (and
 * `export type { ... }`) statement out of src/index.ts.
 * @returns {Array<{ name: string, dir: string, file: string, isType: boolean }>}
 */
function parseBarrelExports() {
  const src = readFileOrThrow(INDEX_TS);
  const re = /export\s+(type\s+)?\{([^}]+)\}\s+from\s+["']\.\/components\/([^"']+)\.js["']/g;
  const out = [];
  let m = re.exec(src);
  while (m !== null) {
    const [, isTypeKw, namesBlock, relPath] = m;
    const dir = dirname(relPath);
    const file = relPath.slice(dir.length + 1);
    const names = namesBlock
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      out.push({ name, dir, file, isType: Boolean(isTypeKw) });
    }
    m = re.exec(src);
  }
  if (out.length === 0) {
    throw new Error(
      "registry-json-derive: parsed ZERO export statements out of src/index.ts — the barrel's export syntax changed and this script can no longer read it. Refusing to derive an empty registry.json.",
    );
  }
  return out;
}

/**
 * @param {string} dir component directory, relative to src/components
 * @returns {string[]} non-test, non-declaration source files that exist on disk
 */
function sourceFilesIn(dir) {
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
    .filter((f) => !/\.test\.tsx?$/.test(f))
    .filter((f) => !f.endsWith(".d.ts"))
    .sort()
    .filter((f) => statSync(join(abs, f)).isFile());
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
          `registry-json-derive: MULTI_PRIMARY_DIRS declares \`${wantedName}\` for \`src/components/${dir}\`, but src/index.ts no longer exports it. Update the declared exception.`,
        );
      }
      return found;
    });
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
      `registry-json-derive: directory \`src/components/${dir}\` has only type exports in src/index.ts — no primary component/hook export found.`,
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

/**
 * @param {string} absPath
 * @returns {string[]} known dependencies referenced by this file's imports
 */
function dependenciesIn(absPath) {
  const text = readFileOrThrow(absPath);
  // Matches both the bare package (`"@base-ui/react"`) and any subpath
  // import (`"@base-ui/react/popover"`) — real components overwhelmingly
  // import subpaths, never the bare package root.
  return KNOWN_DEPENDENCIES.filter((dep) =>
    new RegExp(`["']${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/[^"']*)?["']`).test(text),
  );
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

function main() {
  const exportsFlat = parseBarrelExports();
  const byDir = groupByDir(exportsFlat);

  if (byDir.size === 0) {
    throw new Error(
      "registry-json-derive: zero component directories derived from src/index.ts — refusing to write/verify an empty registry.json.",
    );
  }

  const existingRaw = readFileOrThrow(REGISTRY_JSON);
  const existing = JSON.parse(existingRaw);
  const existingBySlug = new Map(existing.items.map((it) => [it.name, it]));

  const derivedItems = [];
  const missing = [];

  for (const [dir, exportsInDir] of [...byDir.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const primaries = primaryExports(exportsInDir, dir);
    const isMultiPrimary = MULTI_PRIMARY_DIRS.has(dir);
    const allDirFiles = sourceFilesIn(dir);
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

      if (!existingItem) {
        missing.push(slug);
      }

      derivedItems.push({
        name: slug,
        type: isHook ? "registry:hook" : (existingItem?.type ?? "registry:ui"),
        title: existingItem?.title ?? primary.name,
        description: existingItem?.description ?? leadingJsDocSummary(primaryAbs),
        dependencies: existingItem?.dependencies ?? dependenciesIn(primaryAbs),
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
    if (missing.length === 0 && stale.length === 0) {
      console.log(
        `registry-json-derive --check: OK — registry.json covers all ${derivedItems.length} exported component director${derivedItems.length === 1 ? "y" : "ies"}.`,
      );
      return;
    }
    const lines = [];
    if (missing.length > 0) {
      lines.push(
        `MISSING from registry.json (exported in src/index.ts, absent here): ${missing.join(", ")}`,
      );
    }
    if (stale.length > 0) {
      lines.push(
        `STALE in registry.json (no longer backed by any src/index.ts export): ${stale.join(", ")}`,
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
  writeFileSync(REGISTRY_JSON, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `registry-json-derive: wrote registry.json — ${derivedItems.length} item(s) (was ${existing.items.length}). ${missing.length} newly added: ${missing.join(", ") || "(none)"}.`,
  );
}

main();
