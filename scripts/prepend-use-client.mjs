#!/usr/bin/env node
/**
 * prepend-use-client.mjs
 *
 * Prepends `"use client";` to the bundled ESM and CJS output files so that
 * Next.js App Router consumers don't crash at module-eval during SSR.
 *
 * Why this script exists:
 *   tsup/esbuild strips "use client" directives when bundling multiple modules
 *   into a single output file (it treats them as "module level directives" and
 *   silently drops them). This library is 100% interactive — all 42 source
 *   modules carry the directive, there are zero server components. The directive
 *   must appear as the *first line* of the published dist so App Router can
 *   detect it at parse-time. Closes #25.
 *
 * Why not esbuild-plugin-preserve-directives:
 *   That plugin works by mutating `result.outputFiles` in an `onEnd` callback,
 *   which is only populated when esbuild is invoked with `write: false`. tsup
 *   writes files directly, so outputFiles is always empty — the plugin is a
 *   no-op in this build setup.
 *
 * Why not tsup banner option:
 *   tsup/esbuild also strips banner-injected directives at the same pass it
 *   strips source directives (tested: head -1 dist/index.js still shows the
 *   import statement, not the banner).
 *
 * This script runs after `tsup` via the `build` script in package.json and
 * before copy-assets (order: tsup → prepend-use-client → copy-assets).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { NON_COMPONENT_ENTRIES } from "./docs-counts-shared.mjs";

const DIRECTIVE = '"use client";\n';
const ROOT = resolve(import.meta.dirname, "..");

// Every JavaScript entry declared in package.json "exports" is a client-component entry and gets
// the directive (today ".", "./grid" and "./registre"), read from the exports map so
// a new entry cannot be missed. The declared exceptions are NON_COMPONENT_ENTRIES ("./server",
// server-safe by design), shared with docs-counts and the no-hardcoded-words guard.
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const TARGETS = Object.entries(pkg.exports)
  .filter(([subpath, target]) => typeof target === "object" && !NON_COMPONENT_ENTRIES.has(subpath))
  .flatMap(([subpath, target]) => {
    if (!target.import || !target.require) {
      throw new Error(
        `prepend-use-client: export "${subpath}" lacks an import or require target — cannot tell which built files carry the directive.`,
      );
    }
    return [resolve(ROOT, target.import), resolve(ROOT, target.require)];
  });
if (TARGETS.length === 0) {
  throw new Error("prepend-use-client: no client-component entry found in package.json exports.");
}

for (const filePath of TARGETS) {
  const content = readFileSync(filePath, "utf8");

  if (content.startsWith('"use client"')) {
    console.log(`prepend-use-client: ${filePath} already has directive, skipping`);
    continue;
  }

  writeFileSync(filePath, DIRECTIVE + content, "utf8");
  console.log(`prepend-use-client: ${filePath} ✓`);
}
