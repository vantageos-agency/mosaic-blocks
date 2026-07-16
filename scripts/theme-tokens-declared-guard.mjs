#!/usr/bin/env node
/**
 * theme-tokens-declared-guard.mjs — closes the class of defect found on
 * `main` (2026-07-16): `MosaicAppSidebar.tsx` consumes `bg-sidebar`,
 * `bg-sidebar-accent`, `border-sidebar-border`, `text-sidebar-foreground`,
 * and `src/styles.css` declared NONE of the four `--color-sidebar*`
 * variables those utilities resolve to (`grep -c sidebar src/styles.css` ->
 * 0 on `main @ c3e66dd`). A consumer installing this package without also
 * hand-authoring those variables gets an unstyled sidebar, silently — the
 * library names a dependency nowhere and never checks it exists.
 *
 * CONTRACT (bidirectional — same shape as SIN-01's ratchet, see
 * scripts/no-hardcoded-words-guard.mjs):
 *   - Every non-built-in Tailwind color TOKEN consumed by a color-bearing
 *     utility anywhere in `src/**` MUST have a matching `--color-<token>`
 *     declared in `src/styles.css`'s `@theme inline` block. Consumed but
 *     undeclared -> BLOCK, naming the token and every file/line it is used
 *     from.
 *   - Every custom `--color-<token>` declared in `src/styles.css` MUST be
 *     consumed by at least one utility somewhere in `src/**`. Declared but
 *     consumed nowhere -> BLOCK too — a stale row is a lie in the other
 *     direction (a promise the library no longer keeps, or never needed).
 *
 * WHY THE DOMAIN IS DERIVED, NOT ENUMERATED (per
 * .claude/rules/guard-formulation-census.md): the disease this guard exists
 * to close IS "a guard/grep that knows only ONE formulation of the thing it
 * scans". A naive `grep -rl -- -sidebar src/` (tried first while diagnosing
 * this exact defect) matches import PATHS
 * (`components/app-sidebar/MosaicAppSidebar`), CSS class NAMES unrelated to
 * this token family (`chat-sidebar-thread`), `@keyframes` identifiers
 * (`mosaic-sidebar-fade-in`), and prop names (`sidebarAriaLabel`) — none of
 * which are a Tailwind color utility. So this guard never matches on the
 * bare substring "sidebar": it tokenizes `className`/`cn(...)`/template
 * literal string content into individual whitespace-separated CLASS TOKENS,
 * then classifies each token structurally against:
 *   1. a DECLARED, SOURCE-CITED closed set of utility PREFIXES that Tailwind
 *      lets carry a color value (https://tailwindcss.com/docs/colors —
 *      "Using color utilities" lists exactly these utility families), and
 *   2. a DECLARED, SOURCE-CITED closed set of NON-COLOR SUFFIX KEYWORDS each
 *      of those prefixes also carries (side/width/style/position modifiers
 *      — e.g. `border-t`, `border-2`, `border-dashed`, `text-sm`,
 *      `bg-clip-text`, `ring-offset-2`, `shadow-sm`, `outline-none`,
 *      `divide-x`, `from-0%`) — these look like the prefix but are NOT a
 *      color token and must not be misread as one, and
 *   3. `tailwindcss/colors` (the package's OWN exported palette — read at
 *      run time from `node_modules`, never retyped from memory) to
 *      recognize Tailwind's BUILT-IN color families (`red`, `slate`, ...),
 *      which never need a `--color-*` declaration of their own.
 * A token surviving all three checks is a CUSTOM color token this library
 * itself must declare.
 *
 * FAIL-CLOSED BY CONSTRUCTION (per .claude/rules/derive-never-type.md):
 *   - Cannot read `src/styles.css`, cannot read `src/**`, cannot resolve
 *     `tailwindcss/colors` from this package's own `node_modules` -> REFUSE
 *     TO JUDGE (exit 2), never a silent pass.
 *   - A class token that matches a declared PREFIX but whose suffix is
 *     unrecognized by BOTH the non-color-suffix set AND the built-in
 *     palette AND does not parse as a plain lowercase-kebab identifier is
 *     never silently dropped — it is treated as a candidate custom token
 *     (the least-silent option: better a false BLOCK a human can override
 *     than a false pass that ships the exact defect this guard exists to
 *     catch).
 *
 * THREE-STATE EXIT CONTRACT (same shape as
 * scripts/pr-title-matches-diff-guard.mjs):
 *   0 = PASS — every consumed custom token is declared, every declared
 *       custom token is consumed.
 *   1 = VIOLATION — at least one undeclared-but-consumed or
 *       declared-but-unconsumed token found. Named explicitly.
 *   2 = REFUSES TO JUDGE — could not read its own inputs (source tree or
 *       stylesheet unreadable, `tailwindcss/colors` unresolvable). NEVER
 *       shares an exit code with a real violation — a CI step must be able
 *       to tell "the guard found a real problem" apart from "the guard
 *       could not even run" (see scripts/pr-title-matches-diff-guard.mjs's
 *       own three-state handling in .github/workflows/ci.yml for why this
 *       distinction is load-bearing).
 *
 * WRITTEN ESCAPE HATCH (rare, per-token, anchored — same shape as SIN-01's
 * `// allow-hardcoded-word:`): `// allow-undeclared-theme-token: <reason>`
 * on its own line immediately preceding the utility's usage in SOURCE, OR
 * `/* allow-stale-theme-token: <reason> *\/` immediately preceding the
 * `--color-<token>` declaration line in `src/styles.css`. A silent
 * exclusion list at the bottom of this file is exactly the anti-pattern
 * `.claude/rules/guard-formulation-census.md` forbids — any accepted
 * divergence is written at the point a reader sees it, never hidden.
 *
 * Usage: node scripts/theme-tokens-declared-guard.mjs
 *   Scans `src/**\/*.{ts,tsx}` (override via THEME_TOKENS_SRC_DIR for
 *   probes) and `src/styles.css` (override via THEME_TOKENS_STYLES_PATH).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SRC_DIR = resolve(REPO_ROOT, process.env.THEME_TOKENS_SRC_DIR ?? "src");
const STYLES_PATH = resolve(REPO_ROOT, process.env.THEME_TOKENS_STYLES_PATH ?? "src/styles.css");

// ---------------------------------------------------------------------------
// Declared, source-cited closed sets — never derived from memory of this
// bug's own known offenders (per guard-formulation-census.md).
// ---------------------------------------------------------------------------

// Utility PREFIXES Tailwind lets carry a color value.
// https://tailwindcss.com/docs/colors ("Using color utilities" — background,
// text, border, ring, ring-offset, divide, outline, decoration, placeholder,
// accent, caret, fill, stroke, shadow, and the gradient stop utilities
// from/via/to).
const COLOR_BEARING_PREFIXES = [
  "bg",
  "text",
  "border",
  "ring-offset",
  "ring",
  "divide",
  "outline",
  "decoration",
  "placeholder",
  "accent",
  "caret",
  "fill",
  "stroke",
  "shadow",
  "from",
  "via",
  "to",
];
// Sorted longest-prefix-first so "ring-offset" is tried before "ring" —
// otherwise "ring-offset-sidebar" would be misparsed as prefix "ring" +
// suffix "offset-sidebar".
COLOR_BEARING_PREFIXES.sort((a, b) => b.length - a.length);

// Per-prefix NON-COLOR suffix keywords — these share a prefix with a color
// utility but are a different Tailwind dimension entirely (side, width,
// style, position, background-attachment/repeat/size, box-shadow size,
// ring width, divide axis, gradient-stop position). Source:
// https://tailwindcss.com/docs/border-width,
// https://tailwindcss.com/docs/border-style,
// https://tailwindcss.com/docs/background-repeat,
// https://tailwindcss.com/docs/background-size,
// https://tailwindcss.com/docs/box-shadow,
// https://tailwindcss.com/docs/ring-width,
// https://tailwindcss.com/docs/divide-width,
// https://tailwindcss.com/docs/gradient-color-stops (stop positions),
// https://tailwindcss.com/docs/text-overflow,
// https://tailwindcss.com/docs/font-size.
const NON_COLOR_SUFFIXES = {
  border: new Set([
    "t",
    "r",
    "b",
    "l",
    "x",
    "y",
    "s",
    "e",
    "0",
    "2",
    "4",
    "8",
    "solid",
    "dashed",
    "dotted",
    "double",
    "hidden",
    "none",
    "collapse",
    "separate",
    "spacing",
  ]),
  text: new Set([
    "xs",
    "sm",
    "base",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
    "8xl",
    "9xl",
    "left",
    "center",
    "right",
    "justify",
    "start",
    "end",
    "ellipsis",
    "clip",
    "wrap",
    "nowrap",
    "balance",
    "pretty",
    "current",
    "inherit",
    "transparent",
  ]),
  bg: new Set([
    "none",
    "cover",
    "contain",
    "auto",
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "repeat",
    "no-repeat",
    "repeat-x",
    "repeat-y",
    "repeat-round",
    "repeat-space",
    "fixed",
    "local",
    "scroll",
    "clip-border",
    "clip-padding",
    "clip-content",
    "clip-text",
    "origin-border",
    "origin-padding",
    "origin-content",
    "blend-normal",
    "current",
    "transparent",
  ]),
  ring: new Set(["0", "1", "2", "4", "8", "inset", "current", "transparent"]),
  "ring-offset": new Set(["0", "1", "2", "4", "8", "current", "transparent"]),
  divide: new Set([
    "x",
    "y",
    "x-reverse",
    "y-reverse",
    "0",
    "2",
    "4",
    "8",
    "solid",
    "dashed",
    "dotted",
    "double",
    "none",
  ]),
  outline: new Set([
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
    "0",
    "1",
    "2",
    "4",
    "8",
    "offset-0",
    "offset-1",
    "offset-2",
    "offset-4",
    "offset-8",
    "current",
    "transparent",
  ]),
  decoration: new Set([
    "solid",
    "double",
    "dotted",
    "dashed",
    "wavy",
    "0",
    "1",
    "2",
    "4",
    "8",
    "auto",
    "from-font",
    "current",
    "transparent",
  ]),
  placeholder: new Set(["current", "transparent"]),
  accent: new Set(["auto", "current", "transparent"]),
  caret: new Set(["current", "transparent"]),
  fill: new Set(["none", "current", "transparent"]),
  stroke: new Set(["none", "current", "transparent", "0", "1", "2"]),
  shadow: new Set(["none", "xs", "sm", "md", "lg", "xl", "2xl", "inner", "current", "transparent"]),
  from: new Set(["0%", "5%", "10%", "current", "transparent"]),
  via: new Set(["0%", "5%", "10%", "current", "transparent"]),
  to: new Set(["0%", "5%", "10%", "current", "transparent"]),
};

// Numeric gradient-stop positions Tailwind allows (0%..100% in 5-unit
// steps for from/via/to) collapse to a single test rather than an
// exhaustive literal list.
const PERCENT_SUFFIX_RE = /^\d{1,3}%$/;

// Written per-token escape hatch, anchored at start-of-line (same shape as
// SIN-01's `// allow-hardcoded-word:` marker — an unanchored version would
// disable itself the instant a comment merely MENTIONS the marker in prose).
const ESCAPE_MARKER_RE = /^\s*(?:\/\/|\/\*)\s*allow-undeclared-theme-token:\s*\S.*$/;
const STALE_ESCAPE_MARKER_RE = /^\s*\/\*\s*allow-stale-theme-token:\s*\S.*\*\/\s*$/;

const CLASS_TOKEN_RE = /^[a-z][a-z0-9-]*(?:-\d{1,3})?(?:\/\d{1,3})?$/;

function listSourceFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    throw new Error(
      `theme-tokens-declared-guard: cannot list directory ${dir} — refusing to report a clean bill of ` +
        `health when the source tree could not even be read. Underlying error: ${err.message}`,
    );
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch (err) {
      throw new Error(
        `theme-tokens-declared-guard: cannot stat ${full} — refusing to guess. Underlying error: ${err.message}`,
      );
    }
    if (st.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Splits a prefix + suffix out of a single Tailwind class token, trying
 * longest prefixes first (so "ring-offset-x" is never mis-split as "ring" +
 * "offset-x"). Returns null if the token does not start with any declared
 * color-bearing prefix.
 */
function splitPrefix(token) {
  for (const prefix of COLOR_BEARING_PREFIXES) {
    if (token === prefix) return null; // bare prefix, e.g. "border" alone — no color token
    if (token.startsWith(`${prefix}-`)) {
      return { prefix, suffix: token.slice(prefix.length + 1) };
    }
  }
  return null;
}

/**
 * Loads tailwindcss's own exported color palette (never retyped from
 * memory — read live from this package's own dependency).
 */
function loadBuiltinColorFamilies() {
  const require = createRequire(import.meta.url);
  let colorsModulePath;
  try {
    colorsModulePath = require.resolve("tailwindcss/colors", { paths: [REPO_ROOT] });
  } catch (err) {
    throw new Error(
      `theme-tokens-declared-guard: cannot resolve \`tailwindcss/colors\` from this package's own node_modules — refusing to guess Tailwind's built-in color palette. Run \`pnpm install\` first. Underlying error: ${err.message}`,
    );
  }
  let mod;
  try {
    mod = require(colorsModulePath);
  } catch (err) {
    throw new Error(
      `theme-tokens-declared-guard: found but could not load ${colorsModulePath} — refusing to guess. ` +
        `Underlying error: ${err.message}`,
    );
  }
  const families = new Set(Object.keys(mod.default ?? mod));
  if (families.size === 0) {
    throw new Error(
      "theme-tokens-declared-guard: `tailwindcss/colors` resolved but exported ZERO color families — " +
        "this is the exact silent-escape-hatch shape this guard forbids. Refusing to treat an empty " +
        "palette as 'nothing is built-in'.",
    );
  }
  return families;
}

/**
 * Classifies a color-bearing utility's suffix into either "built-in"
 * (Tailwind ships it, e.g. red-500, current, transparent) or a bare custom
 * TOKEN NAME this library must declare (opacity modifier already stripped
 * by the caller).
 * @returns {{ kind: "builtin" } | { kind: "custom", token: string }}
 */
// Tailwind's `border-<side>-<rest>` / `divide-<axis>-<rest>` compound shape
// (https://tailwindcss.com/docs/border-width#individual-sides,
// https://tailwindcss.com/docs/divide-width#individual-sides): a side/axis
// letter can prefix EITHER a width number or a color, on both `border` and
// `divide`. Strip it before classifying the remainder, so `border-r-0`
// (width) and `border-l-transparent` (color) both resolve on their REAL
// suffix instead of the compound "r-0" / "l-transparent" string.
const SIDE_AXIS_RE = /^(t|r|b|l|s|e|x|y)-(.+)$/;

function classifySuffix(prefix, rawSuffix, builtinFamilies) {
  let suffix = rawSuffix;
  if (prefix === "border" || prefix === "divide") {
    const sideMatch = suffix.match(SIDE_AXIS_RE);
    if (sideMatch) suffix = sideMatch[2];
  }
  const nonColor = NON_COLOR_SUFFIXES[prefix];
  if (nonColor?.has(suffix)) return { kind: "builtin" };
  if (["from", "via", "to"].includes(prefix) && PERCENT_SUFFIX_RE.test(suffix)) {
    return { kind: "builtin" };
  }
  if (builtinFamilies.has(suffix)) return { kind: "builtin" }; // e.g. bg-current handled above; bg-white etc.
  // Tailwind built-in shaded family: "<family>-<shade>", family in the
  // package's own exported palette (e.g. "red-500", "slate-900").
  const shadeMatch = suffix.match(/^([a-z]+(?:-[a-z]+)*)-(\d{2,3})$/);
  if (shadeMatch && builtinFamilies.has(shadeMatch[1])) {
    return { kind: "builtin" };
  }
  return { kind: "custom", token: suffix };
}

function extractClassStringCandidates(text) {
  // className="...", cn("...", "..."), and template literals passed to
  // cn(...)/className={`...`} — same permissive string/backtick extraction
  // shape as scripts/no-hardcoded-words-guard.mjs, scoped here to
  // double-quoted / single-quoted / backtick literals anywhere in the file
  // (utility strings only ever appear as string literals in this codebase;
  // narrowing further to specific call sites would reintroduce the
  // single-formulation blind spot this guard exists to avoid).
  const literalRe = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g;
  const matches = [];
  for (let m = literalRe.exec(text); m !== null; m = literalRe.exec(text)) {
    const raw = m[0];
    const inner = raw.slice(1, -1);
    // Skip anything containing `${` — template interpolation makes token
    // boundaries unreliable; the STATIC segments around it are still
    // picked up by other literal matches / segments split below.
    const segments = inner.split(/\$\{[^}]*\}/);
    for (const seg of segments) {
      matches.push({ text: seg, index: m.index });
    }
  }
  return matches;
}

function lineForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function main() {
  let stylesText;
  try {
    stylesText = readFileSync(STYLES_PATH, "utf8");
  } catch (err) {
    console.error(
      `theme-tokens-declared-guard: REFUSES TO JUDGE — cannot read ${STYLES_PATH}. Underlying error: ${err.message}`,
    );
    process.exitCode = 2;
    return;
  }

  let builtinFamilies;
  let sourceFiles;
  try {
    builtinFamilies = loadBuiltinColorFamilies();
    sourceFiles = listSourceFiles(SRC_DIR);
  } catch (err) {
    console.error(`theme-tokens-declared-guard: REFUSES TO JUDGE — ${err.message}`);
    process.exitCode = 2;
    return;
  }

  // ---- Declared custom tokens (from `@theme inline` block) ----
  // `--color-<token>: var(--<token>);` — the library's own custom-token
  // declaration idiom (see src/styles.css's own header comment).
  const declaredTokenRe = /^\s*--color-([a-z0-9-]+):\s*var\(--\1\);\s*$/gm;
  const declared = new Map(); // token -> line number
  for (
    let dm = declaredTokenRe.exec(stylesText);
    dm !== null;
    dm = declaredTokenRe.exec(stylesText)
  ) {
    declared.set(dm[1], lineForIndex(stylesText, dm.index));
  }

  // ---- Consumed custom tokens (scan src/**) ----
  const consumedTokenSites = new Map(); // token -> [{file, line}]
  const escapedConsumedSites = new Set(); // "token" entries fully covered by escape marker (informational only)

  for (const file of sourceFiles) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch (err) {
      console.error(
        `theme-tokens-declared-guard: REFUSES TO JUDGE — cannot read ${file}. Underlying error: ${err.message}`,
      );
      process.exitCode = 2;
      return;
    }
    const lines = text.split("\n");
    const candidates = extractClassStringCandidates(text);
    for (const { text: seg, index } of candidates) {
      const tokens = seg.split(/\s+/).filter(Boolean);
      for (const rawToken of tokens) {
        const [tokenNoOpacity] = rawToken.split("/"); // strip opacity modifier, e.g. "/60"
        if (!CLASS_TOKEN_RE.test(rawToken)) continue; // not a plain utility-shaped token
        const split = splitPrefix(tokenNoOpacity);
        if (!split) continue;
        const classification = classifySuffix(split.prefix, split.suffix, builtinFamilies);
        if (classification.kind === "builtin") continue;

        const line = lineForIndex(text, index);
        // Written per-token escape hatch: checked on the lines immediately
        // preceding this token's line in SOURCE.
        const windowStart = Math.max(0, line - 4);
        const precedingLines = lines.slice(windowStart, line - 1);
        const markerLine = precedingLines.find((l) => ESCAPE_MARKER_RE.test(l));
        if (markerLine) {
          escapedConsumedSites.add(classification.token);
          continue;
        }

        const relFile = relative(REPO_ROOT, file);
        if (!consumedTokenSites.has(classification.token)) {
          consumedTokenSites.set(classification.token, []);
        }
        consumedTokenSites.get(classification.token).push({ file: relFile, line });
      }
    }
  }

  // ---- Direction 1: consumed but undeclared ----
  const undeclared = [];
  for (const [token, sites] of consumedTokenSites) {
    if (!declared.has(token)) undeclared.push({ token, sites });
  }

  // ---- Direction 2: declared but never consumed ----
  const stylesLines = stylesText.split("\n");
  const stale = [];
  for (const [token, line] of declared) {
    if (consumedTokenSites.has(token) || escapedConsumedSites.has(token)) continue;
    const precedingLine = stylesLines[line - 2] ?? "";
    if (STALE_ESCAPE_MARKER_RE.test(precedingLine)) continue;
    stale.push({ token, line });
  }

  if (undeclared.length === 0 && stale.length === 0) {
    console.log(
      `theme-tokens-declared-guard: OK — every custom color token consumed in ${relative(
        REPO_ROOT,
        SRC_DIR,
      )}/** is declared in ${relative(REPO_ROOT, STYLES_PATH)}, and every declared custom token is consumed.`,
    );
    return;
  }

  const sections = [];
  if (undeclared.length > 0) {
    const details = undeclared
      .map(({ token, sites }) => {
        const siteList = sites.map((s) => `      ${s.file}:${s.line}`).join("\n");
        return `  - --color-${token} — consumed but never declared in ${relative(REPO_ROOT, STYLES_PATH)}:\n${siteList}`;
      })
      .join("\n");
    sections.push(
      `UNDECLARED theme token(s) (${undeclared.length}) — a utility resolves to a CSS variable this library never sets, so any host installing it without hand-authoring the variable gets unstyled output:\n${details}\n\nFix: add \`--color-<token>: var(--<token>);\` to the \`@theme inline\` block, plus \`--<token>\` in :root and [data-theme="dark"], following the existing idiom — or if genuinely intentional, mark the usage site with \`// allow-undeclared-theme-token: <reason>\` immediately above it.`,
    );
  }
  if (stale.length > 0) {
    const details = stale
      .map(
        ({ token, line }) =>
          `  - --color-${token} (${relative(REPO_ROOT, STYLES_PATH)}:${line}) — declared but consumed nowhere in ${relative(REPO_ROOT, SRC_DIR)}/**`,
      )
      .join("\n");
    sections.push(
      `STALE theme token(s) (${stale.length}) — declared in ${relative(REPO_ROOT, STYLES_PATH)} but no utility anywhere in ${relative(REPO_ROOT, SRC_DIR)}/** resolves to it, a promise this library no longer keeps (or never needed):\n${details}\n\nFix: remove the row, or if it is a deliberately reserved rebrand hook, mark it with \`/* allow-stale-theme-token: <reason> */\` immediately above the declaration.`,
    );
  }

  console.error(
    `theme-tokens-declared-guard: BLOCKED — theme-token declaration mismatch.\n\n${sections.join("\n\n")}`,
  );
  process.exitCode = 1;
}

main();
