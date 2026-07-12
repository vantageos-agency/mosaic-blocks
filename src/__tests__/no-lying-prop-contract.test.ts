/**
 * Guard test — no "lying prop contract".
 *
 * Doctrine (Eta arbitration, memory-card review): a prop is required EXACTLY
 * where it is used. A required prop that is declared for a variant/branch
 * but never actually read while rendering that variant/branch is a "lying
 * prop contract" — the library forces every host to supply a value it never
 * displays.
 *
 * Trigger: 3 occurrences found in one day, all caught only by eyeballing the
 * diff — 619 tests green / typecheck 0 / lint 0 / CI green every single
 * time. No test bit. This guard is the structural fix: a required prop must
 * be read inside the JSX region(s) it is actually required for.
 *
 * Scope: components whose props form a discriminated union on a literal
 * field (e.g. `{ status: "idle" } | { status: "loading"; loadingMessage:
 * string }`), OR a flat props interface with an optional literal-union field
 * (e.g. `variant?: "detailed" | "compact"`) branched on in the component
 * body via a `condition === "literal"` ternary or `&&` guard.
 *
 * Algorithm (static, textual — same style as i18n-no-hardcoded-literals.test.ts
 * and readme-matches-exports.test.ts: no TS compiler / AST library, plain
 * regex + balanced-bracket scanning over the source text):
 *
 *   1. Find the discriminant field's full literal set — either from the
 *      discriminated union's own members (`{ status: "idle" }`, `{ status:
 *      "loading" }`, ...) or, if there is no union, from a flat field
 *      declaration `field?: "a" | "b" | "c"`.
 *   2. For each field declared REQUIRED (no `?`) anywhere in the props type:
 *      - if declared inside ONE union member only → it is required on that
 *        member's literal alone.
 *      - if declared on the shared/base type (outside every union member,
 *        or the component's props type is flat, i.e. no union at all) → it
 *        is required on EVERY literal of the discriminant's full set.
 *   3. Find every JSX region gated by the discriminant (`X.field === "lit"
 *      && (...)`, or a `isX ? (...) : (...)` ternary where `isX` is defined
 *      as `<expr> === "lit"`) and record, for each literal, the source text
 *      of the region that renders when the discriminant equals that literal.
 *   4. For each required field, compute `requiredOn` (from step 2) minus
 *      `readOn` (the set of literals whose region text references the field
 *      identifier). A field referenced OUTSIDE every gated region (i.e. in
 *      the always-rendered part of the JSX) is read on every literal — it is
 *      never flagged, by construction (its `readOn` is the full set).
 *      Any literal left in the difference is a violation, reported as:
 *      `<file>: required prop "<field>" is never read when <discriminant>="<literal>" — declare it on the branch that renders it`
 *
 * Exemptions (written, not silent):
 *   - Callback props (`onEdit`, `onScrape`, `onReset`, ...) are still checked
 *     like any other required field — no blanket exemption. They pass
 *     naturally when genuinely used across all branches (e.g. `onScrape` is
 *     wired to the form's `onSubmit`, outside any status gate).
 *   - `imageAlt` on `MosaicUrlScraper`'s `"success"` branch (fixture
 *     `MosaicUrlScraper.d370859.tsx`): required on the WHOLE `"success"`
 *     member, invoked only when `content.image` is present — a deliberate,
 *     documented divergence (a second nested union for one optional prop
 *     would make the type hostile to the host). This guard checks at
 *     BRANCH granularity (`"success"` vs `"idle"/"loading"/"error"`), not at
 *     the nested-conditional-inside-a-branch granularity, so this case
 *     passes by construction — no special-case code needed, and none is
 *     added. Documented here so a future reader doesn't mistake the absence
 *     of a check for an oversight.
 *   - Non-discriminated-union components (no literal-union branching found
 *     at all) are skipped entirely — this guard only targets the specific
 *     "lying prop contract on a branch" failure mode, not all possible prop
 *     misuse.
 *
 * RED baseline (this guard's own reason to exist): run against
 * `src/__tests__/fixtures/MosaicMemoryCard.c71d640.tsx` (formatUsageCount
 * dead in "compact", historical commit c71d640) and
 * `src/__tests__/fixtures/MosaicUrlScraper.fcb0329.tsx` (loadingMessage /
 * resetButtonLabel / openLinkAriaLabel / imageAlt all dead in "idle",
 * historical commit fcb0329) — both MUST fail the analyzer, proving it
 * bites on real historical defects. GREEN: the live `src/components/**`
 * tree (fixed) and the assumed-divergence fixture
 * `MosaicUrlScraper.d370859.tsx` (imageAlt) both pass with zero violations.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS_ROOT = path.resolve(__dirname, "..", "components");
const FIXTURES_ROOT = path.resolve(__dirname, "fixtures");

// ── File discovery ──────────────────────────────────────────────────────────

function walkComponents(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkComponents(full, out);
      continue;
    }
    if (
      entry.name.endsWith(".tsx") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".stories.tsx") &&
      !entry.name.endsWith(".spec.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

// ── Comment stripping (reused shape from i18n-no-hardcoded-literals.test.ts) ─

function stripComments(source: string): string {
  const out: string[] = new Array(source.length);
  type State = "normal" | "single" | "double" | "template" | "line-comment" | "block-comment";
  let state: State = "normal";

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (state === "line-comment") {
      out[i] = c === "\n" ? c : " ";
      if (c === "\n") state = "normal";
      continue;
    }
    if (state === "block-comment") {
      if (c === "*" && next === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        i++;
        state = "normal";
      } else {
        out[i] = c === "\n" ? "\n" : " ";
      }
      continue;
    }
    if (state === "single") {
      out[i] = c;
      if (c === "'" && prev !== "\\") state = "normal";
      continue;
    }
    if (state === "double") {
      out[i] = c;
      if (c === '"' && prev !== "\\") state = "normal";
      continue;
    }
    if (state === "template") {
      out[i] = c;
      if (c === "`" && prev !== "\\") state = "normal";
      continue;
    }
    // state === "normal"
    if (c === "/" && next === "/") {
      state = "line-comment";
      out[i] = " ";
      continue;
    }
    if (c === "/" && next === "*") {
      state = "block-comment";
      out[i] = " ";
      continue;
    }
    if (c === "'") {
      state = "single";
      out[i] = c;
      continue;
    }
    if (c === '"') {
      state = "double";
      out[i] = c;
      continue;
    }
    if (c === "`") {
      state = "template";
      out[i] = c;
      continue;
    }
    out[i] = c;
  }

  return out.join("");
}

// ── Balanced-bracket scan ────────────────────────────────────────────────────

/** Index of the char matching `openChar` at `openIndex`, scanning forward. */
function findMatchingClose(
  source: string,
  openIndex: number,
  openChar: string,
  closeChar: string,
): number {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === openChar) depth++;
    else if (source[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ── Step 1 + 2: discriminant literal set + required-field-to-literals map ──

type RequiredMap = Map<string, Set<string>>; // fieldName -> literals it is required on

/**
 * Extract required (no `?`) top-level field names declared directly inside
 * `body`, excluding the discriminant field itself. Matches lines shaped like
 * `fieldName: <type>;` (not `fieldName?: <type>;`). Nested object/
 * function-type bodies are not recursed into — one level of props fields is
 * exactly what these component prop types use.
 */
function extractRequiredFieldNames(body: string, discriminant: string): string[] {
  const names: string[] = [];
  const fieldRe = /(?:^|[{;])\s*(\w+)(\??)\s*:/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = fieldRe.exec(body))) {
    const [, name, optionalMarker] = match;
    if (name === discriminant) continue;
    if (optionalMarker === "?") continue;
    names.push(name);
  }
  return [...new Set(names)];
}

/** A resolved type declaration: either one flat object span, or several
 * discriminated-union member spans (each tagged with its own literal). */
type ResolvedSpan =
  | { kind: "flat"; text: string }
  | { kind: "union"; discriminant: string; members: { literal: string; text: string }[] };

/**
 * Find `(?:export )?(?:interface|type) <name>` and resolve it to its own
 * declaration's source text — handling three shapes actually used in this
 * codebase:
 *   - `interface Name { ... }` / `type Name = { ... }` → one flat span.
 *   - `type Name = | { lit: "a"; ... } | { lit: "b"; ... } | ...;` → a union
 *     span with one member per literal, SCOPED to this declaration only
 *     (not the whole file — this is what avoids leaking an unrelated
 *     type's literal-union field into this component's analysis).
 *   - `type Name = A & B;` → resolve `A` and `B` recursively and return the
 *     concatenation of their own resolved spans.
 * Returns `null` if `name` cannot be found/resolved (out of scope).
 */
function resolveTypeSpans(content: string, name: string, seen = new Set<string>()): ResolvedSpan[] {
  if (seen.has(name)) return [];
  seen.add(name);

  const interfaceRe = new RegExp(`(?:export\\s+)?interface\\s+${name}\\b[^{]*\\{`);
  const interfaceMatch = content.match(interfaceRe);
  if (interfaceMatch && interfaceMatch.index !== undefined) {
    const openIdx = interfaceMatch.index + interfaceMatch[0].length - 1;
    const closeIdx = findMatchingClose(content, openIdx, "{", "}");
    if (closeIdx === -1) return [];
    return [{ kind: "flat", text: content.slice(openIdx, closeIdx) }];
  }

  const typeAliasRe = new RegExp(`(?:export\\s+)?type\\s+${name}\\s*=\\s*`);
  const typeAliasMatch = content.match(typeAliasRe);
  if (!typeAliasMatch || typeAliasMatch.index === undefined) return [];
  let cursor = typeAliasMatch.index + typeAliasMatch[0].length;
  while (/\s/.test(content[cursor])) cursor++;

  // Union shape: optional leading `|`, then `{ ... }` members separated by `|`.
  if (content[cursor] === "|" || content[cursor] === "{") {
    const members: { literal: string; text: string }[] = [];
    let discriminant = "";
    let c = cursor;
    while (true) {
      while (c < content.length && (content[c] === "|" || /\s/.test(content[c]))) c++;
      if (content[c] !== "{") break;
      const closeIdx = findMatchingClose(content, c, "{", "}");
      if (closeIdx === -1) break;
      const memberText = content.slice(c, closeIdx + 1);
      const discMatch = memberText.match(/^\{\s*(\w+)\s*:\s*"([^"]+)"/);
      if (discMatch) {
        discriminant = discMatch[1];
        members.push({ literal: discMatch[2], text: memberText });
      }
      c = closeIdx + 1;
      while (/\s/.test(content[c])) c++;
      if (content[c] === "|") continue;
      break;
    }
    if (members.length >= 2) return [{ kind: "union", discriminant, members }];
    if (members.length === 1) return [{ kind: "flat", text: members[0].text }];
    return [];
  }

  // Intersection / bare identifier shape: `A & B` (or a single `A`, or `A &
  // { inline object }`), up to the top-level (depth-0) `;` — depth-aware so
  // an inline object member's OWN field-terminating `;` is never mistaken
  // for the type alias's terminator.
  const semiIdx = findTopLevelChar(content, cursor, ";");
  const rhsEnd = semiIdx === -1 ? content.length : semiIdx;
  const parts = splitTopLevel(content.slice(cursor, rhsEnd), "&").map((p) => p.trim());
  const spans: ResolvedSpan[] = [];
  for (const part of parts) {
    if (part.startsWith("{") && part.endsWith("}")) {
      spans.push({ kind: "flat", text: part });
      continue;
    }
    const identifier = part.replace(/<[\s\S]*>$/, "").trim();
    if (!/^\w+$/.test(identifier)) continue; // not a plain identifier reference — skip
    spans.push(...resolveTypeSpans(content, identifier, seen));
  }
  return spans;
}

/** Index of the first occurrence of `char` at bracket-depth 0, from `start`. */
function findTopLevelChar(content: string, start: number, char: string): number {
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    const c = content[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === char && depth === 0) return i;
  }
  return -1;
}

/** Split `text` on `separator`, only at bracket-depth 0. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/**
 * Find the main exported component's props-type NAME: `export function Name(
 * ... : PropsTypeName)` (single-param signature) or `export function Name({
 * ... }: PropsTypeName)` (destructured signature).
 */
function findComponentPropsTypeName(content: string): string | null {
  const re = /export function \w+\s*\([\s\S]*?:\s*(\w+)\)/;
  const match = content.match(re);
  return match ? match[1] : null;
}

/**
 * Build the required-field -> required-literals map for one component
 * source file. Returns `null` if the component has no branching structure
 * this guard understands (out of scope, not a violation).
 */
function buildRequiredMap(
  content: string,
): { discriminant: string; literals: string[]; required: RequiredMap } | null {
  const propsTypeName = findComponentPropsTypeName(content);
  if (!propsTypeName) return null;

  const spans = resolveTypeSpans(content, propsTypeName);
  let unionSpan = spans.find(
    (s): s is Extract<ResolvedSpan, { kind: "union" }> => s.kind === "union",
  );

  if (!unionSpan) {
    // No real discriminated-union member found — fall back to an INLINE
    // literal-union field on a flat span, e.g. `variant?: "detailed" |
    // "compact";` (MosaicMemoryCard.tsx's pre-fix shape: one flat interface,
    // no separate union type at all). Scoped to this component's OWN
    // resolved flat span(s) only — never the whole file — so an unrelated
    // component's cosmetic enum field (e.g. MosaicTooltip's `side?: "top" |
    // "bottom" | "left" | "right"`) can never leak in as a false positive.
    for (const span of spans) {
      if (span.kind !== "flat") continue;
      const inlineRe = /(\w+)\??\s*:\s*("(?:[^"]+)"(?:\s*\|\s*"[^"]+")+)\s*;/;
      const match = span.text.match(inlineRe);
      if (!match) continue;
      const field = match[1];
      const literals = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      unionSpan = { kind: "union", discriminant: field, members: [] };
      unionSpan.members = literals.map((literal) => ({ literal, text: "" }));
      break;
    }
  }
  if (!unionSpan) return null; // no real branching found in this component's OWN props type — out of scope

  const { discriminant, members } = unionSpan;
  const literals = members.map((m) => m.literal);
  const required: RequiredMap = new Map();

  for (const member of members) {
    for (const field of extractRequiredFieldNames(member.text, discriminant)) {
      const set = required.get(field) ?? new Set<string>();
      set.add(member.literal);
      required.set(field, set);
    }
  }

  // Base (shared) required fields: declared on the OTHER (flat) span(s) of
  // the props type's intersection, e.g. `MosaicMemoryCardBaseProps` in
  // `Base & Variant` — or, for the un-fixed pre-union shape, resolveTypeSpans
  // already folded the single flat interface's ONE member into a synthetic
  // 1-member "union" via the `findFlatLiteralUnionField`-equivalent path
  // below, so this loop only ever sees genuinely separate base spans.
  for (const span of spans) {
    if (span.kind !== "flat") continue;
    for (const field of extractRequiredFieldNames(span.text, discriminant)) {
      if (required.has(field)) continue;
      required.set(field, new Set(literals));
    }
  }

  return { discriminant, literals, required };
}

// ── Step 3: gated-JSX region extraction ─────────────────────────────────────

type Region = { literal: string; text: string };

/**
 * Find every JSX region gated by `<discriminant> === "literal"`, covering
 * both syntaxes actually used in this codebase:
 *   - `<expr>.<discriminant> === "literal" && ( ... )`
 *   - `isXxx ? ( ... ) : ( ... )` where `const isXxx = <expr> === "literal";`
 *     appears earlier in the function body (2-way boolean branch — the
 *     ternary's true side is `literal`, the false side is every OTHER
 *     literal in the discriminant's full set).
 */
function findGatedRegions(content: string, discriminant: string, allLiterals: string[]): Region[] {
  const regions: Region[] = [];

  // `X.discriminant === "literal" && (`
  const andGuardRe = new RegExp(`\\w+(?:\\.${discriminant})\\s*===\\s*"([^"]+)"\\s*&&\\s*\\(`, "g");
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = andGuardRe.exec(content))) {
    const openIdx = content.indexOf("(", match.index);
    const closeIdx = findMatchingClose(content, openIdx, "(", ")");
    if (closeIdx === -1) continue;
    regions.push({ literal: match[1], text: content.slice(openIdx, closeIdx) });
  }

  // `const isXxx = <expr> === "literal";` ... `isXxx ? ( ... ) : ( ... )`
  const boolAssignRe = new RegExp(
    `\\bconst\\s+(is[A-Za-z0-9]+)\\s*=\\s*[\\w.]*${discriminant}\\s*===\\s*"([^"]+)"`,
    "g",
  );
  const boolLiterals = new Map<string, string>();
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = boolAssignRe.exec(content))) {
    boolLiterals.set(match[1], match[2]);
  }
  // Also handle the direct-narrowing ternary form: `props.discriminant !== "literal" ? (` (true side excludes literal)
  const notEqTernaryRe = new RegExp(
    `[\\w.]*${discriminant}\\s*!==\\s*"([^"]+)"\\s*\\?\\s*\\(`,
    "g",
  );
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = notEqTernaryRe.exec(content))) {
    const trueOpenIdx = content.indexOf("(", match.index);
    const trueCloseIdx = findMatchingClose(content, trueOpenIdx, "(", ")");
    if (trueCloseIdx === -1) continue;
    const excludedLiteral = match[1];
    const trueLiterals = allLiterals.filter((l) => l !== excludedLiteral);
    for (const lit of trueLiterals) {
      regions.push({ literal: lit, text: content.slice(trueOpenIdx, trueCloseIdx) });
    }
    const rest = content.slice(trueCloseIdx + 1);
    const elseMatch = rest.match(/^\s*:\s*\(/);
    if (elseMatch) {
      const elseOpenIdx = trueCloseIdx + 1 + rest.indexOf("(");
      const elseCloseIdx = findMatchingClose(content, elseOpenIdx, "(", ")");
      if (elseCloseIdx !== -1) {
        regions.push({ literal: excludedLiteral, text: content.slice(elseOpenIdx, elseCloseIdx) });
      }
    }
  }

  for (const [boolName, literal] of boolLiterals) {
    const ternaryRe = new RegExp(`\\b${boolName}\\s*\\?\\s*\\(`, "g");
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
    while ((match = ternaryRe.exec(content))) {
      const trueOpenIdx = content.indexOf("(", match.index);
      const trueCloseIdx = findMatchingClose(content, trueOpenIdx, "(", ")");
      if (trueCloseIdx === -1) continue;
      regions.push({ literal, text: content.slice(trueOpenIdx, trueCloseIdx) });

      const rest = content.slice(trueCloseIdx + 1);
      const elseMatch = rest.match(/^\s*:\s*\(/);
      if (elseMatch) {
        const elseOpenIdx = trueCloseIdx + 1 + rest.indexOf("(");
        const elseCloseIdx = findMatchingClose(content, elseOpenIdx, "(", ")");
        if (elseCloseIdx !== -1) {
          const otherLiterals = allLiterals.filter((l) => l !== literal);
          for (const otherLiteral of otherLiterals) {
            regions.push({ literal: otherLiteral, text: content.slice(elseOpenIdx, elseCloseIdx) });
          }
        }
      }
    }
  }

  return regions;
}

/** Every `&&`-gated / ternary-gated region's start index, used to compute the "always" (unconditional) text. */
function computeUnconditionalText(
  content: string,
  discriminant: string,
  allLiterals: string[],
): string {
  // Cheap approximation: remove every gated region's text from the full
  // content. What remains (including duplicated fragments from ternary
  // false-arms attributed to multiple literals) is treated as "unconditional"
  // — good enough to catch fields wired outside any status/variant gate
  // (form inputs, always-visible menu, etc.), which is this function's only
  // purpose.
  let remaining = content;
  for (const region of findGatedRegions(content, discriminant, allLiterals)) {
    remaining = remaining.replace(region.text, " ");
  }
  return remaining;
}

// ── Step 4: assemble violations ──────────────────────────────────────────────

/**
 * Slice out the exported component FUNCTION body only (from `export
 * function Name(` to its matching closing brace). Region/unconditional-usage
 * detection must be scoped to the actual render code — not the type
 * declarations above it, where every field name trivially appears once in
 * its own declaration and would otherwise be misread as "read
 * unconditionally".
 */
function extractComponentBody(content: string): string {
  const fnHeadRe = /export function \w+\s*\([\s\S]*?\)\s*(?::[\s\S]*?)?\{/;
  const match = content.match(fnHeadRe);
  if (!match || match.index === undefined) return content;
  const openBraceIdx = match.index + match[0].length - 1;
  const closeIdx = findMatchingClose(content, openBraceIdx, "{", "}");
  if (closeIdx === -1) return content;
  return stripDestructuringFromProps(content.slice(openBraceIdx, closeIdx));
}

/**
 * Strip `const { a, b, c } = props;` destructuring assignments. Destructuring
 * every prop name into a local binding is NOT "reading" any of them — it
 * merely names them — so leaving these statements in would make every
 * required field look "read unconditionally" (present in the un-gated part
 * of the function body) regardless of whether the resulting local variable
 * is ever actually referenced inside a gated JSX region. Must be stripped
 * BEFORE gated-region / unconditional-usage detection runs.
 */
function stripDestructuringFromProps(body: string): string {
  const destructureRe = /const\s*\{[\s\S]*?\}\s*=\s*props\s*;/g;
  return body.replace(destructureRe, " ");
}

function findViolations(relPath: string, rawContent: string): string[] {
  const content = stripComments(rawContent);
  const built = buildRequiredMap(content);
  if (!built) return [];

  const { discriminant, literals, required } = built;
  const componentBody = extractComponentBody(content);
  const regions = findGatedRegions(componentBody, discriminant, literals);
  // No JSX region is actually gated on this discriminant at all (e.g. a
  // cosmetic `routing?: "hash" | "path" | "virtual"` field that is merely
  // forwarded, never branched on) → this component has no real per-branch
  // rendering for this guard to check. Out of scope, not a violation.
  if (regions.length === 0) return [];
  const unconditionalText = computeUnconditionalText(componentBody, discriminant, literals);

  const violations: string[] = [];

  for (const [field, requiredOn] of required) {
    const fieldRe = new RegExp(`\\b${field}\\b`);
    if (fieldRe.test(unconditionalText)) continue; // read outside every gate → covers all literals

    const readOn = new Set<string>();
    for (const region of regions) {
      if (fieldRe.test(region.text)) readOn.add(region.literal);
    }

    for (const literal of requiredOn) {
      if (readOn.has(literal)) continue;
      violations.push(
        `${relPath}: required prop "${field}" is never read when ${discriminant}="${literal}" — declare it on the branch that renders it`,
      );
    }
  }

  return violations;
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe("no-lying-prop-contract guard — a required prop must be read exactly where it is required", () => {
  it("MUST_BLOCK: historical MosaicMemoryCard (c71d640) — formatUsageCount dead in compact", () => {
    const fixturePath = path.join(FIXTURES_ROOT, "MosaicMemoryCard.c71d640.tsx");
    const violations = findViolations(
      "MosaicMemoryCard.tsx",
      fs.readFileSync(fixturePath, "utf-8"),
    );
    expect(
      violations.some((v) => v.includes('"formatUsageCount"') && v.includes('variant="compact"')),
      `expected a violation naming formatUsageCount + variant="compact", got:\n${violations.join("\n")}`,
    ).toBe(true);
  });

  it("MUST_BLOCK: historical MosaicUrlScraper (fcb0329) — 4 props dead in idle", () => {
    const fixturePath = path.join(FIXTURES_ROOT, "MosaicUrlScraper.fcb0329.tsx");
    const violations = findViolations(
      "MosaicUrlScraper.tsx",
      fs.readFileSync(fixturePath, "utf-8"),
    );
    for (const field of ["loadingMessage", "resetButtonLabel", "openLinkAriaLabel", "imageAlt"]) {
      expect(
        violations.some((v) => v.includes(`"${field}"`) && v.includes('status="idle"')),
        `expected a violation naming ${field} + status="idle", got:\n${violations.join("\n")}`,
      ).toBe(true);
    }
  });

  it("MUST_PASS: assumed divergence — MosaicUrlScraper (d370859) imageAlt on the whole success branch", () => {
    const fixturePath = path.join(FIXTURES_ROOT, "MosaicUrlScraper.d370859.tsx");
    const violations = findViolations(
      "MosaicUrlScraper.tsx",
      fs.readFileSync(fixturePath, "utf-8"),
    );
    expect(violations, `expected zero violations, got:\n${violations.join("\n")}`).toEqual([]);
  });

  it("MUST_PASS: every live component under src/components/ has zero lying-prop-contract violations", () => {
    const files = walkComponents(COMPONENTS_ROOT);
    expect(files.length).toBeGreaterThan(20);

    const allViolations: string[] = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/");
      const content = fs.readFileSync(file, "utf-8");
      allViolations.push(...findViolations(rel, content));
    }

    if (allViolations.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `no-lying-prop-contract violations (${allViolations.length}):\n${allViolations.join("\n")}`,
      );
    }

    expect(allViolations).toEqual([]);
  });
});
