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

const DIRECTIVE = '"use client";\n';
const ROOT = resolve(import.meta.dirname, "..");

const TARGETS = [resolve(ROOT, "dist/index.js"), resolve(ROOT, "dist/index.cjs")];

for (const filePath of TARGETS) {
  const content = readFileSync(filePath, "utf8");

  if (content.startsWith('"use client"')) {
    console.log(`prepend-use-client: ${filePath} already has directive, skipping`);
    continue;
  }

  writeFileSync(filePath, DIRECTIVE + content, "utf8");
  console.log(`prepend-use-client: ${filePath} ✓`);
}
