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
 *   ORDER OF JUDGEMENT: the PASS C rendered-child position is decided BEFORE
 *   any exemption keyed on the literal's CONTENT. The KeyboardEvent.key
 *   exemption below therefore applies ONLY to a literal PASS C proved is NOT a
 *   rendered child; a key-set word ("Delete", "Home", ...) rendered as a JSX
 *   child is reported as the user-facing text it is. Its remaining domain is
 *   exactly three non-rendered positions: `.key ===`/`!==` operand, element of
 *   an array / `Set([...])` membership list, and the `case` label of a switch
 *   on `.key`.
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
 * Skip one string/template literal starting at `text[i]` (a quote or a
 * backtick) and return the index just past its closing delimiter, or -1 when
 * it never closes. Template interpolations are walked with brace depth so a
 * nested literal inside `${...}` cannot end the outer one early.
 * @param {string} text
 * @param {number} i
 * @returns {number}
 */
function skipLiteral(text, i) {
  const quote = text[i];
  let j = i + 1;
  if (quote !== "`") {
    while (j < text.length) {
      if (text[j] === "\\") {
        j += 2;
        continue;
      }
      if (text[j] === quote) return j + 1;
      if (text[j] === "\n") return -1;
      j++;
    }
    return -1;
  }
  while (j < text.length) {
    const ch = text[j];
    if (ch === "\\") {
      j += 2;
      continue;
    }
    if (ch === "`") return j + 1;
    if (ch === "$" && text[j + 1] === "{") {
      j += 2;
      let depth = 1;
      while (j < text.length && depth > 0) {
        const c = text[j];
        if (c === '"' || c === "'" || c === "`") {
          j = skipLiteral(text, j);
          if (j < 0) return -1;
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      if (depth > 0) return -1;
      continue;
    }
    j++;
  }
  return -1;
}

/**
 * DOMAIN of the members that can follow a value in a children expression.
 * Source: ECMA-262 (Array.prototype, String.prototype, Object.prototype, which
 * every array and string inherits). The member NAMES are derived at runtime
 * from the engine (`Object.getOwnPropertyNames`), never typed here; only the
 * classification of a name is declared, and the default for a name that is
 * not declared is RENDERED (the literals are kept). `assertDeclaredNamesExist`
 * refuses to start if a declared name is not a member of any of the three
 * prototypes, so a typo or a removed member cannot silently reclassify.
 *
 * A member whose RESULT cannot contain the receiver's elements (nor a string
 * built from them) lets the receiver's literals drop:
 *   - Array receiver, boolean result:  every, some, includes
 *   - Array receiver, number result:   indexOf, lastIndexOf, findIndex,
 *                                      findLastIndex, push, unshift, `length`
 *   - Array receiver, undefined:       forEach
 *   - Array receiver, iterator of numbers: keys
 *   - String receiver, boolean/number: includes, startsWith, endsWith,
 *                                      indexOf, lastIndexOf, search,
 *                                      localeCompare, codePointAt, charCodeAt,
 *                                      isWellFormed, `length`
 * Members that compose their result from the CALLBACK's return values, not
 * from the elements: map, flatMap. The element reaches the result only if the
 * callback lets it through its parameter; see callbackLetsElementThrough.
 * Everything else (join, toString, at, find, filter, slice, concat, flat,
 * split, replace, padStart, ...) returns the element, a string built from it,
 * or an array/iterator of it, all of which React renders -> kept as rendered.
 */
const ARRAY_MEMBERS_NOT_RETURNING_ELEMENTS = new Set([
  "every",
  "some",
  "includes",
  "indexOf",
  "lastIndexOf",
  "findIndex",
  "findLastIndex",
  "push",
  "unshift",
  "length",
  "forEach",
  "keys",
]);
const STRING_MEMBERS_NOT_RETURNING_ELEMENTS = new Set([
  "includes",
  "startsWith",
  "endsWith",
  "indexOf",
  "lastIndexOf",
  "search",
  "localeCompare",
  "codePointAt",
  "charCodeAt",
  "isWellFormed",
  "length",
]);
const ARRAY_MEMBERS_COMPOSED_FROM_CALLBACK = new Set(["map", "flatMap"]);

/**
 * Members whose ARGUMENTS cannot be part of the call's result: the result is a
 * boolean, a number, undefined, an iterator of numbers, or is derived from the
 * receiver alone while the argument is a predicate, a locale, a separator, a
 * pattern or a normalization form. A literal among their arguments is data.
 * Every other prototype member returns something built from its arguments
 * (join's separator, concat's operands, replace's replacement, padStart's pad,
 * ...) and keeps the argument literals as rendered.
 */
const CALL_ARGS_NOT_RETURNED = new Set([
  "every",
  "some",
  "includes",
  "indexOf",
  "lastIndexOf",
  "findIndex",
  "findLastIndex",
  "push",
  "unshift",
  "forEach",
  "keys",
  "startsWith",
  "endsWith",
  "search",
  "localeCompare",
  "normalize",
  "split",
  "match",
  "matchAll",
  "charAt",
  "charCodeAt",
  "codePointAt",
  "toLocaleString",
  "toLocaleDateString",
  "toLocaleTimeString",
  "toLocaleUpperCase",
  "toLocaleLowerCase",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
]);
/** Members that run a callback: a literal inside the callback body may or may not be returned, so it cannot be classified. */
const CALL_TAKES_CALLBACK = new Set([
  "map",
  "flatMap",
  "filter",
  "find",
  "findLast",
  "reduce",
  "reduceRight",
  "sort",
  "toSorted",
]);
/** Element constructors: the call returns an element; its text children are matched by their own `children:` key. */
const ELEMENT_CONSTRUCTORS = new Set(["jsx", "jsxs", "jsxDEV"]);
/** Global calls PROVEN to return their argument's text (String) or an array of their arguments. */
const GLOBAL_CALLS_RETURNING_ARGS = new Set(["String", "Array.of", "Array.from"]);
/** Words after which `(` opens a parenthesized expression, not a call (ECMA-262 §13 operators/keywords). */
const KEYWORDS_BEFORE_GROUP = new Set([
  "typeof",
  "void",
  "delete",
  "in",
  "instanceof",
  "of",
  "new",
  "return",
  "await",
  "yield",
  "case",
  "throw",
  "else",
  "do",
]);

function protoNames(proto) {
  return Object.getOwnPropertyNames(proto);
}

/** Every member name a receiver can be followed by, derived from the engine. */
function receiverMemberNames(receiver) {
  const names = new Set(protoNames(Object.prototype));
  if (receiver !== "string") for (const n of protoNames(Array.prototype)) names.add(n);
  if (receiver !== "array") for (const n of protoNames(String.prototype)) names.add(n);
  return names;
}
function arrayMemberNames() {
  return receiverMemberNames("array");
}

/**
 * Every member name a CALL can carry when the receiver's type is unknown:
 * the prototypes of the values a children expression formats (arrays,
 * strings, numbers, dates) plus Object.prototype.
 */
function callMemberNames() {
  const names = receiverMemberNames("either");
  for (const proto of [Number.prototype, Date.prototype])
    for (const n of protoNames(proto)) names.add(n);
  return names;
}

/** Refuse to start when a declared classification names something the engine does not have. */
function assertDeclaredNamesExist() {
  const all = callMemberNames();
  const declared = [
    ...ARRAY_MEMBERS_NOT_RETURNING_ELEMENTS,
    ...STRING_MEMBERS_NOT_RETURNING_ELEMENTS,
    ...ARRAY_MEMBERS_COMPOSED_FROM_CALLBACK,
    ...CALL_ARGS_NOT_RETURNED,
    ...CALL_TAKES_CALLBACK,
  ];
  const missing = declared.filter((n) => !all.has(n));
  if (missing.length > 0) {
    console.error(
      `no-hardcoded-words-guard: REFUSING TO JUDGE — declared member(s) ${missing.join(", ")} are not members of Array, String, Number, Date or Object prototypes on this engine.`,
    );
    process.exit(2);
  }
}
assertDeclaredNamesExist();

/** True when `name` returns nothing derived from the receiver's elements, for this receiver kind. */
function memberDropsReceiver(name, receiver) {
  if (receiver === "array") return ARRAY_MEMBERS_NOT_RETURNING_ELEMENTS.has(name);
  if (receiver === "string") return STRING_MEMBERS_NOT_RETURNING_ELEMENTS.has(name);
  // unknown receiver (a call result, a parenthesized value): drop only if the
  // name drops in EVERY prototype that has it.
  const inArray = protoNames(Array.prototype).includes(name);
  const inString = protoNames(String.prototype).includes(name);
  if (!inArray && !inString) return false;
  return (
    (!inArray || ARRAY_MEMBERS_NOT_RETURNING_ELEMENTS.has(name)) &&
    (!inString || STRING_MEMBERS_NOT_RETURNING_ELEMENTS.has(name))
  );
}

/**
 * Index of the character after the balanced close of the group opened at
 * `open` (`(`, `[` or `{`), skipping literals and comments; -1 if it cannot be
 * walked to its end.
 * @param {string} text
 * @param {number} open
 */
function skipBalanced(text, open) {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipLiteral(text, i);
      if (i < 0) return -1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const e = text.indexOf("*/", i + 2);
      if (e < 0) return -1;
      i = e + 2;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      const e = text.indexOf("\n", i);
      i = e < 0 ? text.length : e;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return -1;
}

/**
 * For `.map(cb)` / `.flatMap(cb)`: does the callback let the ELEMENT reach its
 * result? Proven NO only when the callback is an inline function whose first
 * parameter (a plain identifier, or none) is never read in the body except as
 * the React `key` (`key: p` in a props object, or the trailing third argument
 * of the jsx runtime call `jsx(type, { ... }, p)`). Any other read of the
 * parameter -> the element flows -> YES. A callback this cannot read (a
 * function reference, a destructured parameter, an unbalanced body) -> null.
 * @param {string} text
 * @param {number} openParen index of the `(` of the `.map(` call
 * @returns {boolean | null} true = element flows, false = proven not, null = cannot classify
 */
function callbackLetsElementThrough(text, openParen) {
  const end = skipBalanced(text, openParen);
  if (end < 0) return null;
  const inner = text.slice(openParen + 1, end - 1);
  const lead = inner.replace(/^(?:\s|\/\*[\s\S]*?\*\/)+/, "");
  let param = null;
  let bodyStart;
  const arrowRe = /^(?:\(\s*([\w$]+)\s*(?:,[^)]*)?\)|([\w$]+))\s*=>/.exec(lead);
  const arrowNoParamRe = /^\(\s*\)\s*=>/.exec(lead);
  const functionRe = /^function\s*[\w$]*\s*\(\s*(?:([\w$]+)\s*(?:,[^)]*)?)?\)/.exec(lead);
  if (arrowRe) {
    param = arrowRe[1] ?? arrowRe[2];
    bodyStart = arrowRe[0].length;
  } else if (arrowNoParamRe) {
    bodyStart = arrowNoParamRe[0].length;
  } else if (functionRe) {
    param = functionRe[1] ?? null;
    bodyStart = functionRe[0].length;
  } else {
    return null;
  }
  if (param === null) return false;
  let body = lead.slice(bodyStart);
  // Blank plain string literals so a word like "p-4" cannot read as the parameter.
  body = body.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (lit) => " ".repeat(lit.length));
  const id = param.replace(/\$/g, "\\$");
  body = body.replace(new RegExp(`\\bkey\\s*:\\s*${id}(?![\\w$])`, "g"), " ");
  body = body.replace(new RegExp(`(\\})\\s*,\\s*${id}\\s*(\\))`, "g"), "$1$2");
  return new RegExp(`(?<![\\w$.])${id}(?![\\w$])`).test(body);
}

/**
 * Decide what the form following a value (array literal, string literal,
 * call result, parenthesized value) does to the literals that value contains.
 * `pos` is the index just after the value's closing delimiter.
 * @param {string} text
 * @param {number} pos
 * @param {"array" | "string" | "either"} receiver
 * @returns {{ drop: true } | { drop: false } | { unreadable: string }}
 */
function classifyOperand(text, pos, receiver = "array") {
  let k = pos;
  while (k < text.length && /\s/.test(text[k])) k++;
  const rest = text.slice(k);
  const optional = rest.startsWith("?.");
  const head = optional ? rest.slice(2) : rest;
  const first = head[0];
  if (first === "(")
    return {
      unreadable: `${receiver === "array" ? "array literal" : `${receiver} value`} called as a function`,
    };
  if (first === "[") return { drop: false }; // index access: `["x"][0]` is the element itself
  if (first !== "." && !optional) return { drop: false }; // not an operand at all
  const nameMatch = /^\.?\s*([A-Za-z_$][\w$]*)\s*(\()?/.exec(head);
  if (!nameMatch) {
    return {
      unreadable: `member access after a ${receiver} value that is not a plain name (${JSON.stringify(rest.slice(0, 12))})`,
    };
  }
  const name = nameMatch[1];
  if (!receiverMemberNames(receiver).has(name)) {
    return {
      unreadable: `member \`${name}\` after a ${receiver} value is not a member of the prototypes that value inherits`,
    };
  }
  if (memberDropsReceiver(name, receiver)) return { drop: true };
  if (ARRAY_MEMBERS_COMPOSED_FROM_CALLBACK.has(name) && receiver !== "string") {
    if (!nameMatch[2]) return { unreadable: `\`.${name}\` after an array literal with no call` };
    const open = k + (optional ? 2 : 0) + nameMatch[0].lastIndexOf("(");
    const flows = callbackLetsElementThrough(text, open);
    if (flows === null) {
      return {
        unreadable: `\`.${name}\` callback not an inline function with a plain first parameter, so map callback cannot be read`,
      };
    }
    return { drop: !flows };
  }
  return { drop: false };
}

/**
 * PASS C — rendered-child POSITION (k1754vz2awga7e6yt49n1mn5nh8c58p6).
 *
 * PASS A decides by shape, and shape cannot tell the word "submit" from the
 * utility class "flex" or the enum value "compact": all three are one
 * lowercase token. So a lowercase word rendered as text passed PASS A as a
 * "utility token". The property that does tell them apart is POSITION, and
 * the position is fixed by the React JSX runtime contract (react.dev,
 * "Rendering lists" / `jsx(type, props)`): a string that is the value of the
 * `children` prop, or an element of a `children` array, is rendered as a
 * text node. esbuild's automatic runtime emits every JSX text child in
 * exactly that position (`jsx("b", { children: "submit" })`,
 * `jsxs("b", { children: [icon, " cancel"] })`), so the position is read from
 * the artifact, never guessed.
 *
 * RULE: inside a `children` value, EVERY string or template literal the walk
 * reaches is RENDERED, unless the walk PROVES that the expression holding it
 * does not return it. A literal the walk cannot place is never skipped: the
 * enclosing call is named and the guard exits 2.
 *
 * CENSUS of the expression kinds, derived from the ESTree Expression union
 * (https://github.com/estree/estree/blob/master/es2015.md and es2020.md, the
 * grammar esbuild emits for a `--format=cjs` bundle). This file walks TOKENS,
 * not a tree, so each ESTree kind is listed with the token that opens it and
 * its single disposition: WALKED (its literals are judged), PROVEN (its
 * literals are proven not returned), or REFUSED (exit 2, form named).
 *   Literal (string)          `"x"` `'x'`  WALKED: rendered, except an equality
 *                             operand, an `in` operand, an object key, a
 *                             string-receiver member that returns no text
 *                             (`"x".length`), and anything under PROVEN.
 *   TemplateLiteral           backtick     WALKED: static text rendered; every
 *                             `${ ... }` interpolation is walked in turn.
 *   TaggedTemplateExpression  tag`...`     REFUSED when it holds a literal
 *                             (the tag is a callee that is not classifiable).
 *   ArrayExpression           `[ ... ]`    WALKED: elements rendered; the member
 *                             that follows decides (classifyOperand).
 *   SpreadElement             `...x`       WALKED: `...` is not an index; the
 *                             spread value is walked like an element.
 *   ObjectExpression/Property `{ k: v }`   WALKED: values rendered, a quoted key
 *                             is not a value.
 *   ConditionalExpression     `a ? b : c`  WALKED: both branches rendered.
 *   LogicalExpression         `&& || ??`   WALKED: both operands rendered.
 *   BinaryExpression          `+` etc.     WALKED: both operands rendered;
 *                             equality / `in` operands are PROVEN (boolean).
 *   SequenceExpression        `a, b`       WALKED (inside a group).
 *   Parenthesized group       `( ... )`    WALKED: transparent; the member that
 *                             follows decides when the group holds a literal.
 *   MemberExpression          `x.y` `x[i]` `x?.y`  WALKED: a literal inside the
 *                             index brackets is a key (PROVEN not rendered); a
 *                             member after a value is classified by name.
 *   CallExpression/NewExpression  `f(...)` `new F(...)`  by callee:
 *                               element constructor jsx/jsxs/jsxDEV, incl. the
 *                               `(0, ns.jsx)` form -> PROVEN (text children are
 *                               matched by their own `children:` key);
 *                               String / Array.of / Array.from -> WALKED
 *                               (return their arguments);
 *                               a prototype member in CALL_ARGS_NOT_RETURNED
 *                               -> PROVEN; any other prototype member -> WALKED
 *                               (returns something built from its arguments);
 *                               a member that takes a callback (map, filter,
 *                               ...), createElement, a bare identifier such as
 *                               `fmt`, a computed callee, `new` -> REFUSED.
 *   ArrowFunction/Function    `=> ...`     WALKED as part of the enclosing call
 *                             (a literal in a callback body is judged by the
 *                             call's disposition: callback-taking -> REFUSED).
 *   BlockStatement            `{ ... }` after `=>` / `)` / `else` ...  WALKED
 *                             only inside a `return` expression; a literal in
 *                             any other statement is PROVEN not returned here.
 *   RegExpLiteral             `/.../`      REFUSED (its body can hold a quote
 *                             the walk would misread).
 *   Identifier, number, operators, `;`     carry no literal: skipped by design.
 *   Any other construct holding a literal inside an unclassified call is
 *   REFUSED through that call; there is no default silent skip.
 *
 * DECLARED DIVERGENCE: a lowercase word that reaches the screen through a
 * value which is NOT the children position (a `label: "save"` entry in a
 * config object, rendered later by `{item.label}`) is still not decidable
 * here: in that position it has the same shape as an enum value. It stays
 * PASS A's to judge, and PASS A passes a single lowercase token.
 * DECLARED DIVERGENCE: a word bound to a variable or object in a function body
 * (`const accent = x ?? "blue"`) and returned later through that identifier is
 * a data-flow question this token walk does not answer; it has the same shape
 * as the config-object case above and is PASS A's to judge.
 * DECLARED DIVERGENCE: the quoted-key form `"children": x` is matched like the
 * bare key; a computed key (`[k]: x` with k === "children") is not decidable
 * from the artifact and is not matched.
 * @param {string} text
 * @returns {{ starts: Set<number>, unreadable: Array<{ offset: number, reason: string }> }}
 *   opening-delimiter offsets of every literal in rendered-child position, and
 *   the offset + reason of every `children:` value that could not be walked
 */
function findRenderedChildLiterals(text) {
  const starts = new Set();
  const unreadable = [];
  const childrenKeyRe = /(?:\bchildren|"children"|'children')\s*:\s*/g;
  let m;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((m = childrenKeyRe.exec(text))) {
    const r = walkChildrenValue(text, m.index + m[0].length);
    if (r.unreadable) unreadable.push({ offset: m.index, reason: r.unreadable });
    else for (const s of r.collected) starts.add(s);
  }
  return { starts, unreadable };
}

/** Last non-space character before `i`, and its index (or "" / -1). */
function prevNonSpace(text, i) {
  let p = i - 1;
  while (p >= 0 && /\s/.test(text[p])) p--;
  return { ch: p >= 0 ? text[p] : "", at: p };
}

/** Classify the `(` at `open`: a parenthesized group, or a call with a disposition. */
function classifyParen(text, open, floor) {
  let before = text.slice(Math.max(floor, open - 300), open).replace(/\s+$/, "");
  if (before.endsWith("?.")) before = before.slice(0, -2).replace(/\s+$/, "");
  const last = before[before.length - 1] ?? "";
  if (/[\w$]/.test(last)) {
    const chain = /((?:[\w$]+\s*\??\.\s*)*[\w$]+)$/.exec(before)[1].replace(/\s+/g, "");
    const lead = before.slice(0, before.length - chain.length).replace(/\s+$/, "");
    const word = /([\w$]+)$/.exec(before)[1];
    if (KEYWORDS_BEFORE_GROUP.has(word) && !chain.includes(".")) return { kind: "group" };
    const name = chain.split(/\??\./).pop();
    const isMember = chain.includes(".") || lead.endsWith(".");
    return {
      kind: "call",
      ...classifyCallee(chain, name, isMember, lead.endsWith(".") && !chain.includes(".")),
    };
  }
  if (last === ")") {
    const zero = /\(\s*0\s*,\s*([\w$.]+)\s*\)$/.exec(before);
    if (zero) {
      const name = zero[1].split(".").pop();
      return { kind: "call", ...classifyCallee(zero[1], name, zero[1].includes("."), false) };
    }
    return {
      kind: "call",
      verdict: "unknown",
      display: `computed callee \`${before.slice(-24)}(...)\``,
    };
  }
  if (last === "]") {
    return {
      kind: "call",
      verdict: "unknown",
      display: `computed callee \`${before.slice(-24)}(...)\``,
    };
  }
  return { kind: "group" };
}

function classifyCallee(chain, name, isMember, bareMember) {
  const display = bareMember ? `.${name}(` : `${chain}(`;
  if (ELEMENT_CONSTRUCTORS.has(name)) return { verdict: "drop", display };
  if (GLOBAL_CALLS_RETURNING_ARGS.has(chain)) return { verdict: "flows", display };
  if (!isMember) return { verdict: "unknown", display };
  if (CALL_ARGS_NOT_RETURNED.has(name)) return { verdict: "drop", display };
  if (CALL_TAKES_CALLBACK.has(name)) return { verdict: "unknown", display };
  if (callMemberNames().has(name)) return { verdict: "flows", display };
  return { verdict: "unknown", display };
}

/**
 * Walk ONE `children` value starting at `from`; stop at its end (a `,` or a
 * closer at depth 0). Returns the offsets of the rendered literals, or the
 * reason the value could not be walked.
 * @param {string} text
 * @param {number} from
 * @returns {{ collected: number[] } | { unreadable: string }}
 */
function walkChildrenValue(text, from) {
  /** @type {Array<{ kind: string, mark: number, verdict?: string, display?: string, start?: number }>} */
  const stack = [];
  /** @type {number[]} */
  const collected = [];
  let i = from;

  /** Judge a literal opening at `i` (`end` = index after it). null = skip, number = collect, string = unreadable. */
  function judge(start, end, isTemplate) {
    const k = (() => {
      let q = end;
      while (q < text.length && /\s/.test(text[q])) q++;
      return q;
    })();
    const before = text.slice(Math.max(0, start - 8), start);
    const after = text.slice(k, k + 3);
    if (/[=!]==?\s*$/.test(before) || /^[=!]=/.test(after)) return { skip: true };
    if (/^in\s/.test(text.slice(k, k + 3))) return { skip: true }; // `"x" in obj` is a boolean
    // Inside a function body block, only a `return` expression hands a value to
    // the caller; a literal in any other statement is not returned HERE (a value
    // bound to a variable and returned later is the declared data-flow divergence).
    for (let q = stack.length - 1; q >= 0; q--) {
      if (stack[q].kind === "block") {
        if (!stack[q].returning) return { skip: true };
        break;
      }
    }
    if (stack.some((e) => e.kind === "index" || (e.kind === "call" && e.verdict === "drop")))
      return { skip: true };
    const unknownCall = stack.find((e) => e.kind === "call" && e.verdict === "unknown");
    if (unknownCall) {
      const shown = text.slice(start, Math.min(end, start + 24));
      return {
        unreadable: `literal ${shown} is inside the call \`${unknownCall.display}...)\` whose callee cannot be classified (not an element constructor, not a call proven to return its arguments, not one proven not to)`,
      };
    }
    const top = stack[stack.length - 1];
    if (!isTemplate && top && top.kind === "object") {
      const p = prevNonSpace(text, start).ch;
      if ((p === "{" || p === ",") && text[k] === ":") return { skip: true }; // object key
    }
    return { collect: true };
  }

  while (i < text.length) {
    const top = stack[stack.length - 1];
    const ch = text[i];

    if (top && top.kind === "template") {
      if (ch === "\\") {
        i += 2;
      } else if (ch === "`") {
        stack.pop();
        i++;
        if (top.pendingCollect && collected.length > top.mark) {
          // the template is an operand: the member that follows may drop its text
          const v = classifyOperand(text, i, "string");
          if (v.unreadable) return { unreadable: v.unreadable };
          if (v.drop) collected.length = top.mark;
        }
      } else if (ch === "$" && text[i + 1] === "{") {
        stack.push({ kind: "interp", mark: collected.length });
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      const end = skipLiteral(text, i);
      if (end < 0) return { unreadable: "unterminated literal or comment" };
      const j = judge(i, end, false);
      if (j.unreadable) return { unreadable: j.unreadable };
      if (j.collect) {
        const v = classifyOperand(text, end, "string");
        if (v.unreadable) return { unreadable: v.unreadable };
        if (!v.drop) collected.push(i);
      }
      i = end;
      continue;
    }
    if (ch === "`") {
      // validate the whole template is walkable before entering it
      const tend = skipLiteral(text, i);
      if (tend < 0) return { unreadable: "unterminated literal or comment" };
      if (/[\w$)\]]/.test(prevNonSpace(text, i).ch)) {
        return {
          unreadable: "tagged template literal: the tag is a callee that cannot be classified",
        };
      }
      const j = judge(i, tend, true);
      if (j.unreadable) return { unreadable: j.unreadable };
      const mark = collected.length;
      if (j.collect) collected.push(i);
      stack.push({ kind: "template", mark, pendingCollect: Boolean(j.collect) });
      i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const e = text.indexOf("*/", i + 2);
      if (e < 0) return { unreadable: "unterminated literal or comment" };
      i = e + 2;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      const e = text.indexOf("\n", i);
      i = e < 0 ? text.length : e;
      continue;
    }
    if (ch === "[") {
      const { ch: p, at } = prevNonSpace(text, i);
      const spread = text.slice(Math.max(0, at - 2), at + 1) === "...";
      const isIndex = !spread && /[\w$)\].]/.test(p) && at >= from;
      stack.push({ kind: isIndex ? "index" : "array", mark: collected.length });
      i++;
      continue;
    }
    if (ch === "(") {
      const c = classifyParen(text, i, from);
      stack.push({ ...c, mark: collected.length });
      i++;
      continue;
    }
    if (ch === "{") {
      // A `{` is a BLOCK (function body or statement) after `=>`, `)`, `else`,
      // `do`, `try`, `finally`, or at statement start inside a block; otherwise
      // an object literal. `) {` is never an object literal in expression position.
      const before = text.slice(Math.max(from, i - 12), i).replace(/\s+$/, "");
      const p = before[before.length - 1] ?? "";
      const inBlock = stack.length > 0 && stack[stack.length - 1].kind === "block";
      const isBlock =
        before.endsWith("=>") ||
        p === ")" ||
        /(?:^|[^\w$])(?:else|do|try|finally)$/.test(before) ||
        (inBlock && (p === ";" || p === "}" || p === "{"));
      stack.push(
        isBlock
          ? { kind: "block", mark: collected.length, returning: false }
          : { kind: "object", mark: collected.length },
      );
      i++;
      continue;
    }
    if (ch === ";") {
      if (top && top.kind === "block") top.returning = false;
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch) && !/[\w$.]/.test(text[i - 1] ?? "")) {
      const word = /^[\w$]+/.exec(text.slice(i, i + 40))[0];
      if (word === "return") {
        for (let q = stack.length - 1; q >= 0; q--) {
          if (stack[q].kind === "block") {
            stack[q].returning = true;
            break;
          }
        }
      }
      i += word.length;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.length === 0) break; // end of the children value
      const entry = stack.pop();
      i++;
      if (entry.kind === "interp") continue;
      const holdsLiteral = collected.length > entry.mark;
      if (ch === "]" && entry.kind === "array") {
        // The member that follows the array decides (the domain is derived in
        // classifyOperand); this site never drops on syntax.
        const v = classifyOperand(text, i, "array");
        if (v.unreadable) return { unreadable: v.unreadable };
        if (v.drop) collected.length = entry.mark;
      } else if (
        ch === ")" &&
        holdsLiteral &&
        (entry.kind === "group" || (entry.kind === "call" && entry.verdict === "flows"))
      ) {
        const v = classifyOperand(text, i, "either");
        if (v.unreadable) return { unreadable: v.unreadable };
        if (v.drop) collected.length = entry.mark;
      }
      continue;
    }
    if (ch === "," && stack.length === 0) break;
    i++;
  }
  return { collected };
}

/**
 * Extract every string/template-literal candidate from the bundle text,
 * with its 1-based line number and the ~80 chars preceding it (for
 * context-based exclusions: displayName, defineProperty(exports, ...),
 * `.key === `).
 * @param {string} text
 * @returns {{ candidates: Array<{ line: number, value: string, precedingContext: string, isTextAttributeValue: boolean, isRenderedChild: boolean }>, unreadableChildrenAt: Array<{ line: number, reason: string }> }}
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
  const renderedChildren = findRenderedChildLiterals(text);
  for (const c of candidates) {
    c.isTextAttributeValue = textAttrValueSpans.has(c.rawStart + 1);
    c.isRenderedChild = renderedChildren.starts.has(c.rawStart);
  }

  return {
    candidates,
    unreadableChildrenAt: renderedChildren.unreadable.map((u) => ({
      line: lineForIndex(u.offset),
      reason: u.reason,
    })),
  };
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
  const { candidates, unreadableChildrenAt } = extractCandidates(maskedText);
  if (unreadableChildrenAt.length > 0) {
    console.error(
      `REFUSING TO JUDGE: no-hardcoded-words-guard could not walk ${unreadableChildrenAt.length} \`children:\` value(s) to a verdict at ${unreadableChildrenAt.map((u) => `${DIST_PATH}:${u.line} (${u.reason})`).join("; ")}. A rendered-child literal it cannot delimit or classify is a literal it cannot judge; refusing rather than passing it.`,
    );
    process.exit(2);
    return;
  }
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
    // ORDER (rendered position first): the rendered-child POSITION decides
    // before ANY exemption by the literal's content. A KeyboardEvent.key word
    // ("Delete", "Home", ...) rendered as a JSX child is user-facing text;
    // the key-set exemptions below apply only to a literal PASS C has proven is
    // NOT a rendered child.
    // PASS C — rendered-child position (see findRenderedChildLiterals): a
    // string the React runtime renders as a text node is user-facing whatever
    // its shape; only a literal with no letter at all (a glyph) passes.
    if (c.isRenderedChild && /\p{L}/u.test(decodeUnicodeEscapes(c.value))) {
      violations.push({
        line: c.line,
        snippet: c.value,
        reason:
          "rendered JSX child (value or array element of `children`) — the React runtime renders it as a text node, so it is user-facing text whatever its case",
      });
      continue;
    }

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
    // Third and last key-set position: the `case "<Key>":` label of a switch
    // whose discriminant ends in `.key` (e.g. `switch (event.key) { case
    // "Tab": ... }`). A case label is a comparison operand, never rendered.
    // Both conditions again: spec-set member AND `case` position AND the
    // nearest preceding `switch (...)` header is on `.key`. Anything else
    // falls through to the shape pass and is reported, never silently passed.
    if (KEYBOARD_EVENT_KEY_VALUES.has(c.value) && /\bcase\s*$/.test(c.precedingContext)) {
      const switchAt = maskedText.lastIndexOf("switch (", c.rawStart);
      const headerEnd = switchAt === -1 ? -1 : maskedText.indexOf(") {", switchAt);
      if (
        headerEnd !== -1 &&
        headerEnd < c.rawStart &&
        /\.key\s*$/.test(maskedText.slice(switchAt + 8, headerEnd))
      )
        continue;
    }

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
