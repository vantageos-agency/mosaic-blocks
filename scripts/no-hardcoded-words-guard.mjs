#!/usr/bin/env node
/**
 * no-hardcoded-words-guard.mjs — enforces SIN-01: this library ships ZERO
 * user-facing words of its own. Every user-facing string is a prop the HOST
 * application supplies (bilingual FR+EN by design — see CLAUDE.md). A word
 * baked into the bundle is a word no host can localize, and a silent breach
 * of the one rule this library exists to keep.
 *
 * WHY THIS SCANS THE BUILT ARTIFACT, NOT SOURCE (2026-07-14):
 * a source-level grep sees each file in isolation and only the ONE shape its
 * author thought to grep for. The audit that preceded this guard ran THREE
 * TIMES against `src/**` and under-counted THREE TIMES — the first pass knew
 * only `children:`, and silently missed `aria-label`, `placeholder`, and
 * template-literal CONCATENATION entirely. What ships is `dist/index.cjs`;
 * that is the only artifact a consumer ever imports, so it is the only
 * artifact worth being right about. Scanning it also catches anything a
 * build-time transform introduces that source review would never see.
 *
 * WHY THE FORM-DOMAIN IS DERIVED, NOT ENUMERATED (per
 * .claude/rules/guard-formulation-census.md): the disease this guard exists
 * to close IS "a guard that knows one formulation of the thing it guards".
 * So this guard does not special-case `children:` vs `aria-label:` vs
 * `placeholder:` vs concatenation as separate detectors keyed on prop name —
 * a fifth prop name would silently reopen the same hole. Instead it tokenizes
 * EVERY string and template literal in the bundle and classifies by CONTENT
 * SHAPE (does this look like human language?), which is prop-name-agnostic by
 * construction: it catches a hardcoded word wherever it is assigned, today or
 * in a form nobody has invented yet.
 *
 * Two independent, ADDITIVE passes:
 *
 *   PASS A — content-shape classification (generic, prop-name-agnostic).
 *     A candidate literal is prose if:
 *       - it has >=2 space-separated alpha tokens and is NOT entirely a
 *         Tailwind/CSS-utility class list ("Name is required" fails the
 *         utility shape on "Name"/"is"/"required"; "flex items-center gap-2"
 *         passes it — every token matches the utility token shape); OR
 *       - it is a single ALL-CAPS alpha word, length >= 2 ("AI"); OR
 *       - it is a single TitleCase alpha word, length >= 3 ("Owner").
 *     Anything containing a letter that matches NONE of the pass rules below
 *     AND none of the violation rules above is UNKNOWN — reported loudly,
 *     never silently dropped (fail-closed, per derive-never-type.md).
 *
 *   PASS B — spec-derived attribute-value rule (closed, standardized set).
 *     `aria-label`, `aria-description`, `aria-roledescription`, `alt`,
 *     `placeholder`, `title` are WAI-ARIA / HTML attributes whose value IS,
 *     by specification, human-readable accessible/display text — never a
 *     technical enum. ANY non-empty literal assigned to one of these keys is
 *     a violation regardless of its shape. This is what catches the
 *     `placeholder: "acme-inc"` case: a lowercase, hyphenated single token
 *     that PASS A's shape rules alone would wave through as an ordinary
 *     `data-slot`/CSS-utility-shaped identifier. The attribute list itself is
 *     the W3C/WHATWG-standardized set of text-bearing attributes — sourced
 *     from the spec, not from memory of this bug's own known offenders.
 *
 * DERIVED, DOCUMENTED EXCLUSIONS (never a silent skip):
 *   - The ECMAScript module directive `"use client"` / `"use server"` /
 *     `"use strict"` — a single, closed, reserved compiler pragma, not a
 *     family of human phrases.
 *   - `.displayName = "<Name>"` — a React DevTools-only internal label,
 *     never rendered to an end user.
 *   - `Object.defineProperty(exports, "<Name>", ...)` — a CJS export
 *     identifier name, never rendered.
 *   - `.key === "<Value>"` / `.key !== "<Value>"` comparisons against a
 *     value in the W3C UI Events `KeyboardEvent.key` spec set
 *     (https://www.w3.org/TR/uievents-key/) — a closed, standardized,
 *     non-linguistic key name. A `.key` comparison against a value OUTSIDE
 *     that spec set is NOT silently passed — it fails loud, naming the
 *     unrecognized value, because guessing it is "probably fine" is exactly
 *     the silent escape hatch this guard exists to forbid.
 *   - `MosaicClerkWebhookHandler`'s own function body — server-side error
 *     strings that are never rendered to an end user (they cross a webhook
 *     boundary, not a UI boundary). This is the ONE declared exclusion in
 *     this guard, named here, at the point a reader will see it — not buried
 *     in a hidden list. It is scoped by finding the function's own matching
 *     `{ ... }` braces in the bundle text (`findWebhookHandlerFunctionSpan`),
 *     NOT by an esbuild `// <path>` boundary comment: this guard's own probe
 *     caught that the bundle carries only TWO such comments in ~14,000+
 *     lines, so "everything after the handler's boundary comment" would have
 *     silently exempted every unrelated component bundled after it too — the
 *     exact fail-open blind spot this guard exists to forbid. A precise
 *     function-body span cannot leak into adjacent, unrelated code.
 *
 * FILE ATTRIBUTION — DELIBERATELY NOT ATTEMPTED: an earlier revision tried to
 * name each offender's "owning source file" via those same sparse boundary
 * comments. It was WRONG for most of the bundle (nearly everything got
 * attributed to whichever boundary happened to precede it, regardless of
 * which component actually wrote it) — actively misleading, worse than no
 * attribution. Without a sourcemap-consuming dependency (out of scope: this
 * PR may not touch `package.json`), this guard instead reports the one
 * position it CAN verify honestly: `dist/index.cjs:<line>`. Still fully
 * machine-derived and still enough to `grep` straight to the offending
 * built line — just not a claim about which `src/**` file wrote it.
 *
 * WRITTEN ESCAPE HATCH (rare, per-literal, anchored):
 *   `// allow-hardcoded-word: <reason>` on its own line, immediately
 *   preceding the offending statement in SOURCE. Anchored at start-of-line,
 *   exactly like release-artifacts-guard's marker — an unanchored version
 *   would (as it did there) disable itself the moment a commit message or
 *   doc comment merely MENTIONS the marker in prose (this guard's own probe
 *   verifies exactly that immunity — see the probe script).
 *
 *   POSITION MATTERS, confirmed empirically while building this guard's
 *   probe: esbuild (unminified) STRIPS a `//` comment placed immediately
 *   before a `return (` statement, a JSX attribute, or a JSX child — none of
 *   those ever reach `dist/index.cjs`, so a marker placed there is silently
 *   ineffective (the guard would still fail, but for the wrong reason: the
 *   comment never existed to test against). A `//` comment interleaved
 *   BETWEEN the properties of an object literal or the arguments of a
 *   call/array (e.g. between two `label:`/`className:` entries in a config
 *   object, or between two class-name strings passed to `cn(...)`) DOES
 *   survive — that is the only position this escape hatch can rely on. If
 *   the offending literal is JSX children/attribute text, move it into a
 *   named object-literal constant first (which is what the fix should be
 *   doing anyway — hardcoded JSX text has no valid excuse in this library).
 *
 * FAIL-CLOSED BY CONSTRUCTION:
 *   - Any candidate this guard cannot confidently classify as legitimate is
 *     a VIOLATION labelled "unclassified shape" — never a silent pass.
 *   - Any I/O/scope failure this guard cannot measure through (dist/index.cjs
 *     missing/unreadable, or the one function-body span it must bound
 *     unparseable) prints `REFUSING TO JUDGE: ...` naming what could not be
 *     read and exits 2 — a THIRD, DISTINCT exit code from both exit 1 (a
 *     real, measured violation) and exit 0 (a real, measured clean tree).
 *     A scaffolding failure and an actual violation must never share a code:
 *     any CI caller that treats "non-zero" as "hardcoded word found" would
 *     otherwise misreport a broken build as a content defect.
 *   - This guard is EXPECTED to fail loudly on current `main` (14+ known
 *     offenders, several more this generic derivation additionally finds —
 *     e.g. `roleConfig` badge labels "Owner"/"Admin"/"Member"). That failure
 *     is the point: it now gives every remaining fix a machine-derived list
 *     of file+line to work from, instead of a human re-typing the count.
 *
 * Usage: node scripts/no-hardcoded-words-guard.mjs
 *   Scans dist/index.cjs relative to the current working directory — always
 *   the real artifact at its real path, never redirectable. An earlier
 *   revision accepted a `NO_HARDCODED_WORDS_DIST` override so probes could
 *   point the guard at a scratch clone's build without `cd`-ing into it.
 *   That is exactly the shape of a silent bypass: any caller (a probe, CI,
 *   a careless script) can aim the guard at an arbitrary file — including a
 *   trivially "clean" or empty one — and collect a green that says nothing
 *   about what the project actually ships. Every probe/test invocation below
 *   instead `cd`s into the directory holding the real `dist/index.cjs` (or
 *   moves/mutates that real file directly) before invoking this script with
 *   no environment override at all.
 *
 * RATCHET (2026-07-14) — WHY THIS GUARD MERGES TODAY INSTEAD OF WAITING FOR
 * EVERY OFFENDER TO BE FIXED FIRST:
 *   "Merge the guard last, once every offender in every in-flight PR is
 *   fixed" sounds safer but is strictly worse: it leaves the bundle
 *   COMPLETELY unprotected — including against a brand-new offender someone
 *   introduces tomorrow — for as long as the LAST of several independent
 *   fix PRs takes to land, with no guarantee they land in the same order
 *   they were written. A ratchet instead makes this guard protective FROM
 *   THE MOMENT IT MERGES: it declares today's known offenders as a BASELINE
 *   (below, in the code, never a hidden dotfile), and enforces three rules
 *   that together make regression structurally impossible while giving every
 *   fix PR credit the moment it lands:
 *
 *     1. A NEW offender (any value not already in BASELINE) — BLOCK. This is
 *        what makes today's merge immediately effective: a hardcoded word
 *        introduced tomorrow, in a component the baseline never mentions, is
 *        caught today, not "eventually, once the guard is unconditional".
 *     2. A BASELINE row's declared `maxCount` must always EQUAL the actual,
 *        DERIVED occurrence count in the bundle — never merely "not below"
 *        it. BLOCK in BOTH directions: the count growing past `maxCount`
 *        (the ratchet's pawl), AND `maxCount` being declared ABOVE the
 *        actual count (a loose/inflated budget). The second direction
 *        closes a real hole found by mutation: widening `maxCount` from 8
 *        to 99 by hand changed nothing the guard could see under a
 *        "current > maxCount only" check, because the bundle's actual count
 *        never moved — only the declared ceiling did, silently, in the
 *        guard's own source. Comparing against the count DERIVED from
 *        `dist/index.cjs` on every run — instead of trusting whatever number
 *        is written in BASELINE — means `maxCount` can only ever be edited
 *        DOWN to match reality, so the ratchet is monotone BY CONSTRUCTION,
 *        not by anyone remembering to be careful. It is also what makes the
 *        reviewer's own probe pass: re-injecting a FIXED string (once its
 *        count is correctly lowered to 0 and the entry removed, per rule 3)
 *        makes it a brand-new offender under rule 1 — RED, by construction,
 *        not by a special case.
 *     3. A BASELINE entry whose value no longer appears in the bundle at all
 *        (count 0) — BLOCK, with a message naming exactly which line to
 *        delete from BASELINE below. This is what forces every fix PR to
 *        shrink the list instead of leaving a stale, silently-ignored entry
 *        behind — a baseline that never shrinks is a permanent exemption
 *        wearing a ratchet's clothing.
 *
 *   When BASELINE is empty, rules 2 and 3 are vacuously satisfied and rule 1
 *   alone makes this guard equivalent to a plain "zero tolerance" guard — no
 *   special-casing is needed to remove the ratchet once the cleanup is done;
 *   deleting the last BASELINE entry is enough.
 *
 *   BASELINE VALUES ARE DEDUPLICATED BY LITERAL VALUE, NOT BY LINE NUMBER:
 *   the bundle's line numbers shift on every rebuild as unrelated code moves
 *   around, so pinning to `dist/index.cjs:<line>` (as the original prose
 *   grid) would falsely read as "new offender" (line moved) or "stale entry"
 *   (line no longer holds that value) on every single unrelated commit —
 *   noise that would train reviewers to stop trusting this guard within a
 *   week. The literal STRING VALUE is what a fix PR actually removes; that
 *   is what the ratchet tracks, so a value can appear on several distinct
 *   lines and the ratchet still tracks it as one row with one occurrence
 *   COUNT (e.g. "Select " appears in 8 places in this bundle today — fixing
 *   one instance lowers the count to 7, not to zero, and the row updates
 *   accordingly; only when the LAST occurrence is fixed does the row become
 *   stale and rule 3 forces its deletion).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// No environment override — the guard always scans the real artifact at its
// real path, relative to the current working directory. See the header
// comment ("Usage") for why an override was removed rather than added-to.
const DIST_PATH = resolve(process.cwd(), "dist", "index.cjs");

// ---------------------------------------------------------------------------
// Spec-derived closed sets — sourced from an external standard, never from
// memory of this bug's own past offenders (per guard-formulation-census.md:
// "une API, un type, un schéma... l'ensemble est ÉNUMÉRABLE").
// ---------------------------------------------------------------------------

// W3C UI Events KeyboardEvent.key values (https://www.w3.org/TR/uievents-key/)
// that this codebase compares `.key` against. Non-linguistic by spec.
const KEYBOARD_EVENT_KEY_VALUES = new Set([
  " ",
  "Enter",
  "Escape",
  "Tab",
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

// ECMAScript reserved module-level directives. A closed set of exactly
// three strings defined by the language, not a family of phrases.
const LANGUAGE_DIRECTIVES = new Set(["use client", "use server", "use strict"]);

// WAI-ARIA / HTML attributes whose value is, BY SPECIFICATION, human-facing
// accessible or display text. https://www.w3.org/TR/wai-aria-1.2/ (aria-*),
// https://html.spec.whatwg.org/ (alt, title, placeholder).
const TEXT_BEARING_ATTRIBUTES = [
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "alt",
  "placeholder",
  "title",
];

// A Tailwind v4/CSS-utility (or npm module specifier) token shape: an
// ENTIRELY lowercase run of the punctuation Tailwind's own arbitrary-value
// syntax and npm scoped-package names actually use — variant prefixes
// (hover:, dark:, sm:, group-, peer-...), arbitrary values
// (`[&_svg:not([class*='size-'])]:size-4`, `bg-[oklch(1_0_0_/_0.8)]`), scoped
// package specifiers (`@base-ui/react/button`). Prose is never entirely
// lowercase-plus-punctuation in this way; a single stray UPPERCASE letter
// anywhere in the token takes it out of this shape. Derived from what utility
// class / import-specifier strings in THIS bundle actually contain, not a
// list of specific class names (https://tailwindcss.com/docs — arbitrary
// values).
const UTILITY_TOKEN_RE = /^[a-z0-9@!\-_./%:*'()[\]&,#=>]+$/;

// A camelCase (or PascalCase-free, lowercase-led) identifier: starts with a
// lowercase letter, contains at least one internal uppercase letter, no
// spaces or punctuation. Prose words are never camelCase — this shape is a
// strong, structural signal of a technical identifier/attribute value (SVG
// presentation attributes like `currentColor`, `viewBox`, DOM property-style
// values), independent of any specific name list.
const CAMEL_CASE_IDENTIFIER_RE = /^[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/;

// A bare URL. Not linguistic content by construction (RFC 3986) — flagging
// every namespace/schema URL a component embeds would just retype this
// guard's job as "find every href", not "find every hardcoded word".
const URL_RE = /^https?:\/\//;

// A CSS function-call fragment left over from splitting a template literal
// on its `${...}` interpolation (e.g. `` `translateX(-${value}%)` `` splits
// into the static segments "translateX(-" and "%)"). A bare CSS function
// name immediately followed by its opening paren (and an optional unary
// minus for the first argument) is a value, never a rendered word.
const CSS_FUNCTION_FRAGMENT_RE = /^[a-z][a-zA-Z]*\(-?$/;

// Injected `<style>`-tag CSS text (this library ships a handful of raw
// `@keyframes`/`@media` blocks for motion-reduced-safe animations). CSS
// at-rule keywords are a closed, standardized set (CSS Syntax spec,
// https://www.w3.org/TR/css-syntax-3/#at-rules) — their presence is a
// structural signal that the whole literal is a stylesheet fragment, not
// prose, regardless of how many space-separated "words" it also contains.
const CSS_AT_RULE_RE = /@(?:keyframes|media|supports|font-face|layer)\b/;

const ESCAPE_MARKER_RE = /^\s*\/\/\s*allow-hardcoded-word:\s*(\S.+)$/;

// ---------------------------------------------------------------------------
// RATCHET BASELINE — declared HERE, in the code, where a reader will see it —
// never a hidden dotfile or a separate exclusion list. Every row is today's
// KNOWN, not-yet-fixed offender: the literal VALUE (deduplicated across every
// line it appears on — see the header comment on why line numbers are not the
// key), the CURRENT occurrence count in dist/index.cjs (derived on
// 2026-07-14 by running this guard pre-ratchet — never hand-guessed), and WHY
// it is still here. Each row is scheduled for removal by the PR that fixes
// its last remaining occurrence — see the ratchet rules in the header comment
// for exactly how that removal is enforced (rule 3: a row whose count drops
// to 0 MUST be deleted, or the guard blocks and names it).
//
// This baseline may only ever SHRINK (rule 2) — see PR #99/#100/#101 and
// follow-ups for the fixes in flight.
const BASELINE = [];

/**
 * @param {string} str
 * @returns {boolean}
 */
function isUtilityClassList(str) {
  const tokens = str.trim().split(/\s+/);
  if (tokens.length < 2) return false;
  return tokens.every((t) => UTILITY_TOKEN_RE.test(t));
}

/**
 * Decode `\uXXXX` / `\xXX` escape sequences that esbuild emits verbatim (as
 * literal backslash-u-hex text) instead of the actual code point, so glyph
 * classification below sees the REAL character (e.g. "✓" -> "✓") rather
 * than the ASCII letter "u" that happens to sit inside the escape spelling.
 * Also decodes the standard single-character JS escapes (`\n`, `\t`, `\r`,
 * `\\`) — a literal `"\n"` (a paragraph-separator string this bundle ships)
 * otherwise reads as the two characters backslash+"n", and "n" IS a letter,
 * so it was reaching classification as an unclassified single-letter token
 * instead of being recognized as "no linguistic content at all" (an actual
 * newline has no letters). Any OTHER backslash escape (`\"`, `\/`, ...) is
 * left as-is — this guard only needs to unmask literal symbol/whitespace
 * escapes, not fully re-implement a JS string-literal parser.
 * @param {string} str
 * @returns {string}
 */
function decodeUnicodeEscapes(str) {
  return str
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16))) // \u{1F9E0} (emoji)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\\\/g, "\\");
}

/**
 * PASS A — generic content-shape classification. Returns `null` if the
 * literal is legitimate (documented reason attached via console reasoning,
 * not needed at runtime), or a violation reason string if it is not.
 * @param {string} str
 * @returns {string | null}
 */
function classifyContentShape(str) {
  const trimmed = decodeUnicodeEscapes(str).trim();
  if (trimmed === "") return null; // empty literal carries no word
  if (LANGUAGE_DIRECTIVES.has(trimmed)) return null; // reserved JS directive

  // No letter at all: glyphs, numbers, CSS selectors, punctuation. Not a
  // language by construction ("‹ › ↑ ↓ × −" etc. — brief's own examples).
  if (!/\p{L}/u.test(trimmed)) return null;

  // Injected stylesheet text (whole literal), regardless of its word count.
  if (CSS_AT_RULE_RE.test(trimmed)) return null;

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  if (tokens.length >= 2) {
    if (isUtilityClassList(trimmed)) return null; // pure CSS-utility class list
    return "multi-word phrase, not a pure CSS-utility class list — reads as prose";
  }

  // Single token.
  const token = tokens[0];
  if (UTILITY_TOKEN_RE.test(token)) return null; // css-utility token / kebab identifier / scoped package specifier
  if (URL_RE.test(token)) return null; // bare URL, not linguistic content
  if (CAMEL_CASE_IDENTIFIER_RE.test(token)) return null; // technical identifier (currentColor, viewBox, ...)
  if (CSS_FUNCTION_FRAGMENT_RE.test(token)) return null; // template-literal split fragment of a CSS function call
  if (/^[A-Z]+$/.test(token) && token.length >= 2)
    return "single ALL-CAPS word — reads as a badge/label, not an enum value";
  if (/^[A-Z][a-z]+$/.test(token) && token.length >= 3)
    return "single TitleCase word — reads as display text, not a technical identifier";

  // Fail-closed: anything with a letter that matched none of the rules
  // above (mixed case, unexpected punctuation mix, etc.) is UNKNOWN — never
  // silently passed.
  return `unclassified shape ("${token}") — cannot confirm this is not user-facing text; classify explicitly or add a declared // allow-hardcoded-word marker`;
}

/**
 * Find every top-level template literal in `text`, tracking `${...}` brace
 * depth so a backtick encountered INSIDE an interpolation (i.e. a nested
 * template literal used as part of that interpolation's own expression) is
 * never mistaken for this literal's closing backtick. See the call site
 * comment for the real bundle case this fixes.
 * @param {string} text
 * @returns {Array<{ start: number, inner: string }>}
 */
function findTemplateLiterals(text) {
  const results = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "`") {
      i++;
      continue;
    }
    const start = i;
    i++;
    const innerStart = i;
    let braceDepth = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (braceDepth === 0 && ch === "`") {
        i++; // consume closing backtick
        break;
      }
      if (ch === "$" && text[i + 1] === "{") {
        braceDepth++;
        i += 2;
        continue;
      }
      if (braceDepth > 0 && ch === "{") {
        braceDepth++;
        i++;
        continue;
      }
      if (braceDepth > 0 && ch === "}") {
        braceDepth--;
        i++;
        continue;
      }
      i++;
    }
    results.push({ start, inner: text.slice(innerStart, i - 1) });
  }
  return results;
}

/**
 * Replace every JS REGEX LITERAL in `text` with spaces of the SAME LENGTH
 * (never removing characters, so every later line number stays correct).
 *
 * WHY THIS EXISTS: this bundle ships components that build markdown/rich
 * text parsers using regex literals containing an escaped backtick, e.g.
 * `` /^`([^`]+)`/ ``. `findTemplateLiterals`'s brace/backtick scanner has no
 * concept of "this backtick is inside a regex, not a template literal" — it
 * saw the regex's OWN backtick as the start of a nested template literal and
 * went hunting for a closing backtick possibly hundreds of lines away,
 * corrupting every string/template-literal candidate in between into
 * meaningless code fragments (confirmed on real material during this guard's
 * own probe development — see PR description). Masking regex literals BEFORE
 * the quote/template scanners run removes the ambiguity at the source.
 *
 * Regex-vs-division disambiguation is a classic, genuinely ambiguous JS
 * lexing problem without a full parser. This uses the standard practical
 * heuristic (a `/` is a regex opener when it follows an operator/keyword
 * context, not an identifier or a closing `)`/`]`) — sufficient for
 * distinguishing regex literals from division in formatted, non-obfuscated
 * bundle output; a full tokenizer is out of scope for a bundle-text guard.
 * @param {string} text
 * @returns {string}
 */
function maskRegexLiterals(text) {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // Line and block comments must be skipped WHOLESALE before any regex
    // detection: a block comment's closing `*/` slash was being misread as
    // a REGEX OPENER (its preceding char `*` doesn't look like division),
    // then hunting for the next unrelated `/` as its "close" and masking
    // everything in between — including real strings — into garbage. This
    // was caught on real material (bundle line ~10611) during this guard's
    // own development.
    if (ch === "/" && text[i + 1] === "/") {
      let k = i;
      while (k < text.length && text[k] !== "\n") k++;
      result += text.slice(i, k);
      i = k;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const k = end === -1 ? text.length : end + 2;
      result += text.slice(i, k);
      i = k;
      continue;
    }
    if (ch === "/") {
      // Look at the last non-whitespace character already emitted to decide
      // regex-opener vs division — division follows an identifier, digit,
      // `)`, or `]`; a regex literal follows everything else (operators,
      // `(`, `,`, `:`, `;`, `{`, `[`, `!`, `&`, `|`, `?`, `=`, or start-of-text).
      let j = result.length - 1;
      while (j >= 0 && /\s/.test(result[j])) j--;
      const prevChar = j >= 0 ? result[j] : "";
      const looksLikeDivision = /[A-Za-z0-9_$)\]]/.test(prevChar);
      if (!looksLikeDivision) {
        const regexStart = i;
        let k = i + 1;
        let inCharClass = false;
        let closed = false;
        while (k < text.length) {
          const c2 = text[k];
          if (c2 === "\\") {
            k += 2;
            continue;
          }
          if (c2 === "\n") break; // a real regex literal never spans a raw newline
          if (c2 === "[") inCharClass = true;
          else if (c2 === "]") inCharClass = false;
          else if (c2 === "/" && !inCharClass) {
            k++; // consume closing slash
            while (k < text.length && /[a-z]/.test(text[k])) k++; // flags
            closed = true;
            break;
          }
          k++;
        }
        if (closed) {
          result += " ".repeat(k - regexStart);
          i = k;
          continue;
        }
        // Not actually a regex literal (no closing `/` before a newline) —
        // fall through and emit this character as-is; it was division or a
        // stray slash, not a regex.
      }
    }
    result += ch;
    i++;
  }
  return result;
}

/**
 * Extract every string/template-literal candidate from the bundle text,
 * with its 1-based line number and the ~80 chars preceding it (for
 * context-based exclusions: displayName, defineProperty(exports, ...),
 * `.key === `).
 * @param {string} text
 * @returns {Array<{ line: number, value: string, precedingContext: string, isTextAttributeValue: boolean }>}
 */
function extractCandidates(text) {
  const candidates = [];
  // Track line numbers by counting newlines up to each match's start index.
  const newlineOffsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") newlineOffsets.push(i + 1);
  }
  function lineForIndex(idx) {
    // Binary search for the greatest newline offset <= idx.
    let lo = 0;
    let hi = newlineOffsets.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (newlineOffsets[mid] <= idx) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1; // 1-based
  }

  const textAttrAlternation = TEXT_BEARING_ATTRIBUTES.join("|");
  // Matches `"aria-label": "value"` / `aria-label: "value"` / `title: "value"`
  // — quoted or bare object key, immediately followed by a string literal.
  // The exact byte offset of the captured value (group 1) is what lets us
  // mark the matching candidate below as a text-bearing-attribute value.
  const textAttrRe = new RegExp(
    `(?:"(?:${textAttrAlternation})"|\\b(?:${textAttrAlternation}))\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    "g",
  );
  const textAttrValueSpans = new Set();
  let m;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((m = textAttrRe.exec(text))) {
    const valueStart = m.index + m[0].length - 1 - m[1].length;
    textAttrValueSpans.add(valueStart);
  }

  // Double-quoted string literals.
  const dqRe = /"(?:[^"\\]|\\.)*"/g;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((m = dqRe.exec(text))) {
    const raw = m[0];
    const value = raw.slice(1, -1);
    const start = m.index;
    candidates.push({
      line: lineForIndex(start),
      value,
      precedingContext: text.slice(Math.max(0, start - 80), start),
      rawStart: start,
    });
  }

  // Single-quoted string literals (some minifiers/tools emit these).
  const sqRe = /'(?:[^'\\]|\\.)*'/g;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((m = sqRe.exec(text))) {
    const raw = m[0];
    const value = raw.slice(1, -1);
    const start = m.index;
    candidates.push({
      line: lineForIndex(start),
      value,
      precedingContext: text.slice(Math.max(0, start - 80), start),
      rawStart: start,
    });
  }

  // Template literals: split on `${...}` interpolations, each STATIC segment
  // becomes its own candidate — this is what catches the concatenation form
  // (`` `Edit ${label}` ``: the static segment "Edit " is the hardcoded word).
  //
  // A plain `` /`(?:[^`\\]|\\.)*`/g `` pairing regex mis-parses a template
  // literal whose interpolation itself contains a NESTED template literal
  // (e.g. `` `Notifications${count > 0 ? ` (${count})` : ""}` `` — real code
  // in this bundle): it terminates at the FIRST unescaped backtick, which is
  // the nested literal's OPENING backtick, not the outer literal's closing
  // one, and silently truncates everything after it. `findTemplateLiterals`
  // instead tracks `${...}` brace depth so a backtick encountered WHILE
  // inside an interpolation is correctly treated as part of that
  // interpolation's own (nested) template, not as this literal's terminator.
  for (const { start, inner } of findTemplateLiterals(text)) {
    // An injected stylesheet's `@media`/`@keyframes` marker can land in ONE
    // static segment while an interpolation (e.g. `repeat(${n}, minmax(...))`)
    // splits the surrounding CSS across several — classifying segment-by-segment
    // would see the marker in segment 1 only and misjudge every other segment
    // of the SAME literal as prose. Check the whole un-split literal first.
    if (CSS_AT_RULE_RE.test(inner)) continue;
    const segments = inner.split(/\$\{(?:[^{}]|\{[^{}]*\})*\}/);
    for (const seg of segments) {
      if (seg.trim() === "") continue;
      candidates.push({
        line: lineForIndex(start),
        value: seg,
        precedingContext: text.slice(Math.max(0, start - 80), start),
        rawStart: start,
      });
    }
  }

  // Mark which candidates are the VALUE of a text-bearing attribute (PASS B).
  // `rawStart` points at the opening quote of a double-quoted candidate, so
  // the value itself starts one byte later.
  for (const c of candidates) {
    c.isTextAttributeValue = textAttrValueSpans.has(c.rawStart + 1);
  }

  return candidates;
}

/**
 * The ONE declared, path-based exclusion in this guard (see header comment):
 * server-side webhook error strings, never rendered to an end user.
 *
 * WHY THIS IS SCOPED BY FUNCTION BODY, NOT BY A `// src/<path>` BOUNDARY
 * COMMENT: an earlier version of this guard tried to attribute every
 * candidate to its "owning source file" via the `// src/<path>` comments
 * esbuild occasionally preserves — but the bipolar probe caught that this
 * bundle carries only TWO such comments total (`src/version.ts` near the
 * top, and this handler's own boundary near the bottom), covering barely a
 * quarter of the file each. Scoping the exclusion to "everything after the
 * webhook-handler's boundary comment" would have silently exempted every
 * OTHER unrelated component that happens to be bundled after it (confirmed:
 * real tag-input/combobox code sits past that boundary with no boundary
 * comment of its own to end the exemption) — the exact fail-open, silent
 * angle-mold this guard exists to forbid. Scanning for the function's own
 * matching closing brace is precise, derived from the artifact itself, and
 * cannot leak into adjacent code no matter how the bundle is laid out.
 * @param {string} text
 * @returns {{ start: number, end: number } | null} character offsets [start, end)
 */
function findWebhookHandlerFunctionSpan(text) {
  const marker = "function MosaicClerkWebhookHandler(";
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return null; // handler removed/renamed — nothing to exclude
  const bodyStart = text.indexOf("{", markerIndex);
  if (bodyStart === -1) {
    console.error(
      "REFUSING TO JUDGE: no-hardcoded-words-guard found `function MosaicClerkWebhookHandler(` " +
        "but no opening `{` — cannot bound its scope, and cannot report a clean bill of health " +
        "while unable to measure. Refusing to guess.",
    );
    process.exit(2);
  }
  let depth = 0;
  let i = bodyStart;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start: markerIndex, end: i + 1 };
    }
    i++;
  }
  console.error(
    "REFUSING TO JUDGE: no-hardcoded-words-guard found `function MosaicClerkWebhookHandler(`'s " +
      "body never closes (unbalanced braces) — cannot bound its scope, and cannot report a clean " +
      "bill of health while unable to measure. Refusing to guess.",
  );
  process.exit(2);
}

function main() {
  let text;
  try {
    text = readFileSync(DIST_PATH, "utf8");
  } catch (err) {
    console.error(
      `REFUSING TO JUDGE: no-hardcoded-words-guard cannot read ${DIST_PATH} — run \`pnpm build\` first. Refusing ` +
        `to report a clean bill of health when the artifact under test could not even be opened. Underlying error: ${err.message}`,
    );
    process.exit(2);
    return;
  }

  // ---------------------------------------------------------------------
  // REFUSAL — the artifact opened cleanly but is empty, or too small/absent
  // the structural landmarks any genuine build of this library carries.
  //
  // WHY THIS EXISTS (found by re-deriving the refusal DOMAIN from every
  // TERMINAL PATH of main(), not from `grep '^\s*throw'`): a `grep` for
  // `throw` only ever finds a refusal that ANNOUNCES itself. It is
  // structurally blind to the opposite defect — a path that should refuse
  // but instead falls through to a normal PASS. Before this check existed,
  // `printf '' > dist/index.cjs && node scripts/no-hardcoded-words-guard.mjs`
  // printed "OK — carries zero hardcoded user-facing words... this guard is
  // now absolute" and exited 0:
  // a `pnpm build` that silently produced NOTHING got a clean bill of
  // health, because an empty/near-empty string has no candidate literals
  // for either pass to flag, and `findWebhookHandlerFunctionSpan` treats "no
  // marker found" as "handler removed/renamed" (a legitimate state) rather
  // than "nothing was ever built". That is a FAIL-OPEN, the opposite defect
  // from the three throw-sites above (which all failed closed) — and it is
  // reachable precisely because nothing in the pre-fix code ever asked "does
  // this look like a real build at all?".
  //
  // The landmark checked is derived from what THIS project's own build
  // toolchain (tsup/esbuild, see tsup.config.ts) actually emits into every
  // CJS bundle it has ever produced — a `require(...)` call for at least the
  // first external dependency — not a number invented for this guard. A
  // build that emits zero `require(` calls and/or is implausibly small has
  // not built this library; there is nothing here to certify either way.
  // ---------------------------------------------------------------------
  const MIN_PLAUSIBLE_BUNDLE_BYTES = 1000;
  if (text.trim().length === 0) {
    console.error(
      `REFUSING TO JUDGE: no-hardcoded-words-guard read ${DIST_PATH} but it is empty (0 bytes of non-whitespace content). A real build of this library is never empty — this looks like \`pnpm build\` silently produced nothing. Refusing to report a clean bill of health on an artifact that was never actually built.`,
    );
    process.exit(2);
    return;
  }
  if (text.length < MIN_PLAUSIBLE_BUNDLE_BYTES || !/require\(/.test(text)) {
    console.error(
      `REFUSING TO JUDGE: no-hardcoded-words-guard read ${DIST_PATH} (${text.length} byte(s)) but it does not look like a real built CJS bundle of this library — every genuine build emits multiple \`require(...)\` calls and is well over ${MIN_PLAUSIBLE_BUNDLE_BYTES} bytes. Refusing to report a clean bill of health on content that was never actually built (or was truncated/corrupted before this guard ran).`,
    );
    process.exit(2);
    return;
  }

  const webhookHandlerSpan = findWebhookHandlerFunctionSpan(text);
  // Regex literals are masked to spaces of IDENTICAL length before
  // extraction — this preserves every offset/line-number computation below
  // while removing the ambiguity a raw backtick inside a regex literal (e.g.
  // `` /^`([^`]+)`/ ``) would otherwise create for the template-literal
  // scanner. See maskRegexLiterals's own comment for the real bundle case.
  const maskedText = maskRegexLiterals(text);
  const candidates = extractCandidates(maskedText);
  const lines = maskedText.split("\n");

  const violations = [];

  for (const c of candidates) {
    // Declared, function-scoped exclusion (the ONE in this guard — see
    // header): server-side webhook error strings, never rendered to a user.
    if (
      webhookHandlerSpan &&
      c.rawStart >= webhookHandlerSpan.start &&
      c.rawStart < webhookHandlerSpan.end
    )
      continue;

    // Written per-literal escape hatch: `// allow-hardcoded-word: <reason>`
    // anchored at start-of-line, checked on the few lines immediately
    // preceding this literal's line in the BUNDLE text (comments survive
    // unminified esbuild output — see tsup.config.ts).
    const windowStart = Math.max(0, c.line - 4);
    const precedingLines = lines.slice(windowStart, c.line - 1);
    const markerLine = precedingLines.find((l) => ESCAPE_MARKER_RE.test(l));
    if (markerLine) continue;

    // Context-based structural exclusions (never rendered to a user).
    if (/\.displayName\s*=\s*$/.test(c.precedingContext)) continue;
    if (/Object\.defineProperty\(\s*exports,\s*$/.test(c.precedingContext)) continue;
    if (/\brequire\(\s*$/.test(c.precedingContext)) continue; // CJS module specifier, not user text
    // SVG `d` (path data) attribute — a coordinate/command mini-language
    // defined by the SVG spec (https://www.w3.org/TR/SVG/paths.html), never
    // rendered as text. Scoped tightly to the exact `d:` key so it cannot
    // accidentally swallow an unrelated single-letter prop.
    if (/\bd:\s*$/.test(c.precedingContext)) continue;
    if (/\.key\s*(?:===|!==)\s*$/.test(c.precedingContext)) {
      if (KEYBOARD_EVENT_KEY_VALUES.has(c.value)) continue;
      violations.push({
        line: c.line,
        snippet: c.value,
        reason: `compared against \`.key\` but "${c.value}" is not in the standardized KeyboardEvent.key set — cannot confirm this is not user-facing text`,
      });
      continue;
    }
    // Same standardized key set, but referenced from an ARRAY/`Set([...])`
    // membership list rather than a direct `.key === ` comparison (e.g.
    // `new Set(["ArrowUp", "ArrowDown", "Home", "End"])` — real code in this
    // bundle). Scoped narrowly: the value must ALREADY be a member of the
    // closed spec set (content check) AND be immediately preceded by `[` or
    // `,` (array-literal-position context check) — both conditions, not
    // either alone, so this cannot silently exempt an unrelated string that
    // merely happens to share text with a key name.
    if (KEYBOARD_EVENT_KEY_VALUES.has(c.value) && /[[,]\s*$/.test(c.precedingContext)) continue;

    // PASS B — spec-derived text-bearing attribute value: always a
    // violation regardless of shape (this is what catches placeholder:
    // "acme-inc").
    if (c.isTextAttributeValue) {
      if (c.value.trim() === "") continue;
      violations.push({
        line: c.line,
        snippet: c.value,
        reason:
          "value of a WAI-ARIA/HTML text-bearing attribute (aria-label/alt/placeholder/title/...) — spec says this is always human-facing text",
      });
      continue;
    }

    // PASS A — generic content-shape classification.
    const shapeViolation = classifyContentShape(c.value);
    if (shapeViolation) {
      violations.push({ line: c.line, snippet: c.value, reason: shapeViolation });
    }
  }

  // De-duplicate identical (line, snippet) pairs — the same literal can be
  // reached via more than one extraction pass (e.g. a plain double-quoted
  // string is never double-counted, but defensive dedupe costs nothing and
  // guards against a future extractor overlap silently inflating the count).
  const seen = new Set();
  const deduped = [];
  for (const v of violations) {
    const key = `${v.line}::${v.snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(v);
  }
  deduped.sort((a, b) => a.line - b.line);

  // ---------------------------------------------------------------------
  // RATCHET — classify every violation against BASELINE. See the header
  // comment ("RATCHET") for the three rules this enforces.
  // ---------------------------------------------------------------------
  const baselineByValue = new Map(BASELINE.map((b) => [b.value, b]));
  const currentCountByValue = new Map();
  for (const v of deduped) {
    currentCountByValue.set(v.snippet, (currentCountByValue.get(v.snippet) ?? 0) + 1);
  }

  // Rule 1 — any violation whose value has NO baseline entry at all.
  const newOffenders = deduped.filter((v) => !baselineByValue.has(v.snippet));

  // Rule 2 — a baseline value's DECLARED `maxCount` must always equal the
  // ARTIFACT's actual current occurrence count — never merely be "not lower
  // than" it. `maxCount` is not read from anyone's memory: it is DERIVED
  // from `dist/index.cjs` right here, every run. Two directions of drift,
  // both blocked, for the SAME underlying reason (a declared number that
  // does not match reality):
  //
  //   - current > maxCount  → the row GREW: a new site emitted an existing
  //     baseline string. The ratchet's pawl.
  //   - current < maxCount  → the row's declared budget is LOOSE: someone
  //     (or a careless future edit) set `maxCount` ABOVE what the bundle
  //     actually contains. A budget above reality is slack — a standing
  //     licence to add up to (maxCount - current) MORE occurrences of an
  //     already-known offender with the guard staying silently green. This
  //     is the exact hole a reviewer proved by mutation: widening `maxCount`
  //     from 8 to 99 changed nothing the guard could see, because the old
  //     rule only compared "did it grow past declared", never "is declared
  //     above what is actually there". Comparing against the DERIVED actual
  //     count instead of trusting the declared number closes it: `maxCount`
  //     can now only ever be lowered to match reality, so — by construction,
  //     not by discipline — it can only ever decrease over time. Stale (0
  //     occurrences) is handled separately by rule 3 below, so this rule
  //     only fires while the row is still genuinely present in the bundle.
  const grownEntries = [];
  const looseEntries = [];
  for (const entry of BASELINE) {
    const current = currentCountByValue.get(entry.value) ?? 0;
    if (current === 0) continue; // rule 3's concern, not rule 2's
    if (current > entry.maxCount) {
      grownEntries.push({ entry, current });
    } else if (current < entry.maxCount) {
      looseEntries.push({ entry, current });
    }
  }

  // Rule 3 — a baseline entry whose value no longer appears AT ALL.
  const staleEntries = BASELINE.filter(
    (entry) => (currentCountByValue.get(entry.value) ?? 0) === 0,
  );

  if (
    newOffenders.length > 0 ||
    grownEntries.length > 0 ||
    looseEntries.length > 0 ||
    staleEntries.length > 0
  ) {
    const sections = [];

    if (newOffenders.length > 0) {
      const details = newOffenders
        .map((v) => `  - ${DIST_PATH}:${v.line} — "${v.snippet}"\n      ${v.reason}`)
        .join("\n");
      sections.push(
        `NEW offender(s) not in BASELINE (${newOffenders.length}) — this library must ship ZERO user-facing words of its own (every user-facing string is a HOST-supplied prop):\n${details}\n\nFix: replace each with a prop the host supplies, or if genuinely not user-facing, declare it with \`// allow-hardcoded-word: <reason>\` immediately above the source statement.`,
      );
    }

    if (grownEntries.length > 0) {
      const details = grownEntries
        .map(
          ({ entry, current }) =>
            `  - "${entry.value}" — BASELINE declares maxCount=${entry.maxCount}, but ${DIST_PATH} now has ${current} occurrence(s). The baseline may only ever SHRINK.`,
        )
        .join("\n");
      sections.push(`BASELINE entry GREW (${grownEntries.length}):\n${details}`);
    }

    if (looseEntries.length > 0) {
      const details = looseEntries
        .map(
          ({ entry, current }) =>
            `  - "${entry.value}" — BASELINE declares maxCount=${entry.maxCount}, but ${DIST_PATH} actually has only ${current} occurrence(s). A budget above reality is a licence to regress without the guard ever noticing — lower maxCount to ${current} in scripts/no-hardcoded-words-guard.mjs.`,
        )
        .join("\n");
      sections.push(
        `BASELINE entry's declared maxCount is ABOVE the actual bundle count (${looseEntries.length}):\n${details}`,
      );
    }

    if (staleEntries.length > 0) {
      const details = staleEntries
        .map(
          (entry) =>
            `  - "${entry.value}" (declared maxCount=${entry.maxCount}) no longer appears anywhere in ${DIST_PATH}. Delete this row from BASELINE in scripts/no-hardcoded-words-guard.mjs — a fixed offender left in BASELINE is a stale, silent exemption.`,
        )
        .join("\n");
      sections.push(
        `STALE BASELINE entrie(s) (${staleEntries.length}) — must be removed:\n${details}`,
      );
    }

    console.error(
      `no-hardcoded-words-guard: BLOCKED — SIN-01 ratchet violation(s).\n\n${sections.join("\n\n")}`,
    );
    process.exitCode = 1;
    return;
  }

  const baselineTotal = BASELINE.reduce((sum, e) => sum + e.maxCount, 0);
  if (BASELINE.length === 0) {
    console.log(
      `no-hardcoded-words-guard: OK — ${DIST_PATH} carries zero hardcoded user-facing words. BASELINE is empty: this guard is now absolute.`,
    );
  } else {
    console.log(
      `no-hardcoded-words-guard: OK (ratchet held) — ${DIST_PATH} carries no NEW offenders and no BASELINE row grew or went stale. ${BASELINE.length} declared baseline row(s), ${baselineTotal} allowed occurrence(s) remaining to be fixed by in-flight PRs.`,
    );
  }
}

main();
