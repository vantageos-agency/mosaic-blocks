#!/usr/bin/env node
/**
 * sync-versions.mjs — propagates versions.ts catalog into package.json files.
 *
 * Pattern adapted from awslabs/nx-plugin-for-aws (Apache 2.0).
 *
 * Usage: node scripts/sync-versions.mjs
 *   or:  pnpm sync-versions
 *
 * The script is idempotent: running it twice produces the same result.
 * Key order inside each dependency section is preserved (existing keys stay
 * in place; catalog-managed keys are updated in-place).
 *
 * TypeScript is not needed at runtime: the catalog is parsed from
 * src/versions.ts via a deterministic regex. The file format is fixed by
 * convention — any edit that breaks the regex is a CI error, not a runtime
 * one (the vitest drift test will catch it first).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Load versions catalog — parse src/versions.ts with a deterministic regex.
//    The file has a fixed shape (as const object, one key per line, double
//    quotes). No runtime TypeScript compilation needed.
// ---------------------------------------------------------------------------

/** @returns {Record<string, string>} */
function loadVersions() {
  const src = readFileSync(resolve(root, "src/versions.ts"), "utf8");
  // Extract the object literal between `= {` and `} as const`
  const block = src.match(/export const versions\s*=\s*\{([\s\S]*?)\}\s*as\s*const/)?.[1];
  if (!block) {
    throw new Error(
      "sync-versions: could not parse versions.ts — unexpected format. " +
        "Expected `export const versions = { ... } as const`.",
    );
  }
  /** @type {Record<string,string>} */
  const result = {};
  for (const line of block.split("\n")) {
    // Match: "key": "value"  or  key: "value"
    const m = line.match(/^\s*"?([^":\s]+)"?\s*:\s*"([^"]+)"/);
    if (m) result[m[1]] = m[2];
  }
  return result;
}

// ---------------------------------------------------------------------------
// 2. Patch helpers
// ---------------------------------------------------------------------------

/**
 * Update a dependency section in a parsed package.json object.
 * Only keys that already exist in the section AND appear in the catalog are
 * updated. No injection, no removal — pure in-place version sync.
 *
 * @param {Record<string,unknown>} pkg
 * @param {string} section
 * @param {Record<string,string>} catalog
 * @returns {boolean} true if any value changed
 */
function patchSection(pkg, section, catalog) {
  const current = /** @type {Record<string,string>|undefined} */ (pkg[section]);
  if (!current) return false;
  let changed = false;
  for (const [key, value] of Object.entries(catalog)) {
    if (key in current && current[key] !== value) {
      current[key] = value;
      changed = true;
    }
  }
  return changed;
}

/**
 * Read, patch, and write a package.json file.
 *
 * @param {string} pkgPath absolute path to package.json
 * @param {Record<string,string>} catalog
 * @param {string} label human-readable label for logging
 */
function syncPackageJson(pkgPath, catalog, label) {
  const raw = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw);

  const sections = ["dependencies", "devDependencies", "peerDependencies"];
  let anyChanged = false;
  for (const section of sections) {
    if (patchSection(pkg, section, catalog)) anyChanged = true;
  }

  const serialized = `${JSON.stringify(pkg, null, 2)}\n`;
  if (anyChanged || serialized !== raw) {
    writeFileSync(pkgPath, serialized, "utf8");
    console.log(`[sync-versions] updated  ${label}`);
  } else {
    console.log(`[sync-versions] no-change ${label}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Main
// ---------------------------------------------------------------------------

const catalog = loadVersions();
console.log(`[sync-versions] catalog loaded — ${Object.keys(catalog).length} entries`);

syncPackageJson(resolve(root, "package.json"), catalog, "package.json (lib)");
syncPackageJson(resolve(root, "sandbox/package.json"), catalog, "sandbox/package.json");

console.log("[sync-versions] done.");
