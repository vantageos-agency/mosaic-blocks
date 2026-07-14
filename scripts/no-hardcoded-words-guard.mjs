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
 *   - Any I/O failure (dist/index.cjs missing, unreadable, etc.) throws and
 *     exits non-zero — a guard that cannot read its own input must not
 *     report a clean bill of health.
 *   - This guard is EXPECTED to fail loudly on current `main` (14+ known
 *     offenders, several more this generic derivation additionally finds —
 *     e.g. `roleConfig` badge labels "Owner"/"Admin"/"Member"). That failure
 *     is the point: it now gives every remaining fix a machine-derived list
 *     of file+line to work from, instead of a human re-typing the count.
 *
 * Usage: node scripts/no-hardcoded-words-guard.mjs
 *   Scans dist/index.cjs (override via NO_HARDCODED_WORDS_DIST for probes).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_PATH =
  process.env.NO_HARDCODED_WORDS_DIST ?? resolve(process.cwd(), "dist", "index.cjs");

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
    throw new Error(
      "no-hardcoded-words-guard: found `function MosaicClerkWebhookHandler(` but no opening `{` — cannot bound its scope. Refusing to guess.",
    );
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
  throw new Error(
    "no-hardcoded-words-guard: `function MosaicClerkWebhookHandler(`'s body never closes (unbalanced braces) — cannot bound its scope. Refusing to guess.",
  );
}

function main() {
  let text;
  try {
    text = readFileSync(DIST_PATH, "utf8");
  } catch (err) {
    throw new Error(
      `no-hardcoded-words-guard: cannot read ${DIST_PATH} — run \`pnpm build\` first. Refusing to report a clean ` +
        `bill of health when the artifact under test could not even be opened. Underlying error: ${err.message}`,
    );
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

  if (deduped.length > 0) {
    const details = deduped
      .map((v) => `  - ${DIST_PATH}:${v.line} — "${v.snippet}"\n      ${v.reason}`)
      .join("\n");
    console.error(
      `no-hardcoded-words-guard: BLOCKED — SIN-01 violation(s): this library must ship ZERO user-facing words of its own (every user-facing string is a HOST-supplied prop). Found ${deduped.length} offender(s) in ${DIST_PATH}:\n${details}\n\nFix: replace each with a prop the host supplies. If a literal is genuinely NOT user-facing, declare it with \`// allow-hardcoded-word: <reason>\` immediately above the source statement (not in this guard's exclusion list).`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `no-hardcoded-words-guard: OK — ${DIST_PATH} carries zero hardcoded user-facing words.`,
  );
}

main();
