/**
 * non-shipped.mjs
 *
 * The single definition of which source files a registry item does NOT ship
 * (tests, stories). Shared by build-registry-items.mjs and
 * registry-json-derive.mjs: never a second copy.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Non-shipped files: items carry component sources only.
//
// registry.json lists every non-`.test` source of a component directory,
// stories included (registry-json-derive.mjs used to filter `.test.tsx?` only), and
// build-registry-items.mjs used to inline each listed file verbatim. The exclusion is
// derived from the repo's own conventions, never typed:
//   - test files:   the `include` globs of tsconfig.test.json, the repo's own
//                   declaration of its test-file set (vitest.config.ts
//                   declares no `include`; importing vitest/config here is not
//                   an option, it loads esbuild, which fails under jsdom);
//   - story files:  the `stories` glob of .storybook/main.ts, read at run time;
//   - `__tests__/`: the repo's test directory (vitest.config.ts excludes
//                   `src/__tests__/derived/**`; tests live under `__tests__`).
// Anything this script cannot read or translate fails loud, never skips.

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

function readTestGlobs() {
  const cfgPath = join(repoRoot, "tsconfig.test.json");
  if (!existsSync(cfgPath)) {
    throw new Error(`${cfgPath} not found — cannot derive the test-file exclusion`);
  }
  const include = JSON.parse(readFileSync(cfgPath, "utf8")).include;
  if (!Array.isArray(include) || include.length === 0) {
    throw new Error(`${cfgPath} has no include[] — cannot derive the test-file exclusion`);
  }
  return include;
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

export const NON_SHIPPED_MATCHERS = [...readTestGlobs(), ...readStoriesGlobs()].map(globToRegExp);

export function isShipped(sourcePath) {
  if (sourcePath.split("/").includes("__tests__")) return false;
  return !NON_SHIPPED_MATCHERS.some((re) => re.test(sourcePath));
}
