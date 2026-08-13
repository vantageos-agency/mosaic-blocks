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
 * empty source file, or an item with no files[]. Never silently skips.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const registryPath = join(repoRoot, "registry.json");
const outDir = join(repoRoot, "r");

function deriveTarget(sourcePath) {
  return `components/ui/${basename(sourcePath)}`;
}

function loadRegistry() {
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

function buildItem(item) {
  if (!Array.isArray(item.files) || item.files.length === 0) {
    throw new Error(`item "${item.name}" has no files[] — cannot generate inline content`);
  }

  const files = item.files.map((file) => {
    const absPath = join(repoRoot, file.path);
    if (!existsSync(absPath)) {
      throw new Error(`item "${item.name}": source file not found on disk: ${file.path}`);
    }
    const content = readFileSync(absPath, "utf8");
    if (content.length === 0) {
      throw new Error(`item "${item.name}": source file is empty: ${file.path}`);
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

function main() {
  const filters = process.argv.slice(2);
  const items = loadRegistry();

  const selected = filters.length > 0 ? items.filter((i) => filters.includes(i.name)) : items;

  if (filters.length > 0) {
    const missing = filters.filter((name) => !items.some((i) => i.name === name));
    if (missing.length > 0) {
      throw new Error(`requested item(s) not found in registry.json: ${missing.join(", ")}`);
    }
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  let written = 0;
  for (const item of selected) {
    const built = buildItem(item);
    const outPath = join(outDir, `${item.name}.json`);
    writeFileSync(outPath, `${JSON.stringify(built, null, 2)}\n`, "utf8");
    written += 1;
  }

  console.log(`build-registry-items: wrote ${written} item(s) to ${outDir}/`);
}

try {
  main();
} catch (err) {
  console.error(`build-registry-items: FAILED — ${err.message}`);
  process.exit(1);
}
