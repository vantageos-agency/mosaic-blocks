/**
 * Guard test — no "lying prop contract".
 *
 * Doctrine (Eta arbitration, memory-card review): a prop is required EXACTLY
 * where it is used. A required field that is declared for a variant/branch
 * but never actually read while rendering that branch is a "lying prop
 * contract" — the library forces every host to supply a value it never
 * displays.
 *
 * Trigger: 3 occurrences found in one day, all caught only by eyeballing the
 * diff — 619 tests green / typecheck 0 / lint 0 / CI green every single time.
 * No test bit.
 *
 * SECOND trigger (why this file was rewritten): the guard's FIRST version
 * shipped green while being BLIND. It knew exactly one gating form
 * (`x === "lit" && (...)`) and one union shape (required discriminant), so
 * `MosaicMemoryCard` — the very component it was written for — fell straight
 * through: its default union member declares an OPTIONAL discriminant
 * (`variant?: "detailed"`), which the member regex could not match, so the
 * whole component was silently classified "no union → out of scope". A dead
 * required prop injected into its `compact` branch kept the guard at
 * "4 passed". A matcher that knows one phrasing, plus a silent "out of scope"
 * escape, fails OPEN — it lets falsehood through.
 *
 * Both defects are fixed here, and the fix is PROVEN by the mutation probe
 * below rather than asserted.
 *
 * ── What is analyzed ────────────────────────────────────────────────────────
 * Every exported type/interface in a component file that carries a
 * DISCRIMINANT — i.e. either:
 *   (a) a discriminated union: `type T = | { k: "a"; ... } | { k: "b"; ... }`
 *       (the discriminant may be OPTIONAL on a member — `k?: "a"` — which is
 *       how a DEFAULT variant is spelled), possibly reached through an
 *       intersection (`type Props = Base & Variants`), an interface
 *       `extends`, or a union of named interfaces
 *       (`type Props = DotsProps | SegmentsProps`); or
 *   (b) a flat type with a field whose type is a literal union, written
 *       inline (`status: "a" | "b"`) or behind a type alias
 *       (`status: MosaicDocumentUploadFileStatus`). This covers DATA-ITEM
 *       discriminants (e.g. `MosaicDocumentUploadFile.status`), where the
 *       same lying-contract failure mode exists on the item type.
 *
 * A field declared REQUIRED (no `?`) inside ONE union member is required on
 * that member's literal alone. A field declared required on a shared base /
 * flat type is required on EVERY literal.
 *
 * ── Gating forms recognized (inventoried from the real library, not guessed) ─
 * For discriminant D and literal L, the source that renders when D === L:
 *   1. `X.D === "L" && ( ... )`             → region owned by L
 *   2. `X.D !== "L" ? ( A ) : ( B )`        → A owned by ¬L, B owned by L
 *   3. `X.D === "L" ? ( A ) : ( B )`        → A owned by L,  B owned by ¬L
 *   4. `if (X.D === "L") { ... return ... }` → block owned by L, and the code
 *                                              AFTER the if-block owned by ¬L
 *                                              (early return — MosaicStepPipeline)
 *   5. `const isFoo = X.D === "L";` … `isFoo ? ( A ) : ( B )` / `isFoo && ( A )`
 * The `X.` prefix is optional (`props.variant`, `file.status`, or a bare
 * destructured `variant`). Text inside NO region is unconditional and counts
 * as read on every literal.
 *
 * ── Fail-CLOSED, never fail-open ───────────────────────────────────────────
 * If a type declares per-branch required fields (fields inside union members)
 * but the guard cannot locate any gated region for that discriminant, that is
 * NOT "out of scope" — it is a BLIND SPOT of the guard itself, and the test
 * FAILS loudly naming the component, the type and the discriminant. The
 * previous silent `return []` escape is gone. A guard that ignores in silence
 * is a guard with a hole.
 *
 * ── Exemptions: written, named, justified — never silent ────────────────────
 * See EXEMPTIONS below. Each entry names the type, the discriminant, and WHY.
 * The only way to let an exception through is to write it down.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS_ROOT = path.resolve(__dirname, "..", "components");
const FIXTURES_ROOT = path.resolve(__dirname, "fixtures");

/**
 * Written, named, justified exemptions. `type` + `discriminant` identify the
 * declaration; the guard then reports nothing for it.
 *
 * Currently EMPTY — there is no component in the library that needs one.
 *
 * In particular, the one documented DIVERGENCE in the library —
 * `MosaicUrlScraper.imageAlt`, required on the whole `status: "success"`
 * branch but only invoked when `content.image` is present — needs NO
 * exemption entry: this guard checks at BRANCH granularity (`"success"` vs
 * `"idle"`/`"loading"`/`"error"`), not at the granularity of a nested
 * conditional INSIDE a branch. `imageAlt` IS read somewhere within the
 * `success` region, which is exactly what its contract claims. Narrowing
 * further would demand a second nested union for one optional prop and make
 * the type hostile to the host — a deliberate, declared divergence (see
 * MosaicUrlScraper.tsx's own JSDoc). It is asserted as an explicit MUST_PASS
 * case below rather than hidden behind an exemption.
 */
const EXEMPTIONS: { component: string; reason: string }[] = [];

/**
 * Public components that are NOT plain `export function` declarations in
 * src/components, and therefore cannot be resolved to a props type by the
 * signature scan. Each is listed BY NAME with the reason it is out of the
 * lying-prop-contract failure mode. Silence is not permitted: the coverage
 * test asserts the public surface is exactly
 * (analyzed ∪ no-discriminant ∪ exempt ∪ these).
 */
const NON_FUNCTION_PUBLIC_EXPORTS: { component: string; reason: string }[] = [
  {
    component: "MosaicField",
    reason:
      "`export const MosaicField = Object.assign(MosaicFieldRoot, {...})` — a namespace object, not a component with its own props type. Its parts (MosaicFieldLabel/Control/Description/Error) are analyzed individually below.",
  },
  {
    component: "MosaicFieldLabel",
    reason: "Re-exported member of the MosaicField namespace object (see above).",
  },
  {
    component: "MosaicFieldControl",
    reason: "Re-exported member of the MosaicField namespace object (see above).",
  },
  {
    component: "MosaicFieldDescription",
    reason: "Re-exported member of the MosaicField namespace object (see above).",
  },
  {
    component: "MosaicFieldError",
    reason: "Re-exported member of the MosaicField namespace object (see above).",
  },
  {
    component: "MosaicMessageListDesktop",
    reason:
      "Alias re-export (`export { MessageListDesktop as MosaicMessageListDesktop }`) of a local function — the underlying function IS analyzed under its local name.",
  },
  {
    component: "MosaicMessageListMobile",
    reason: "Alias re-export of a local function — the underlying function IS analyzed.",
  },
  {
    component: "MosaicAgentListDesktop",
    reason: "Alias re-export of a local function — the underlying function IS analyzed.",
  },
  {
    component: "MosaicAgentListMobile",
    reason: "Alias re-export of a local function — the underlying function IS analyzed.",
  },
  {
    component: "MosaicMarketplaceListDesktop",
    reason: "Alias re-export of a local function — the underlying function IS analyzed.",
  },
  {
    component: "MosaicMarketplaceListMobile",
    reason: "Alias re-export of a local function — the underlying function IS analyzed.",
  },
  {
    component: "MosaicClerkWebhookHandler",
    reason:
      "Not a React component — a server-side Clerk->Convex webhook handler (.ts). It renders nothing, so it has no branch that can lie about a prop.",
  },
];

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

// ── Comment stripping (same shape as i18n-no-hardcoded-literals.test.ts) ────

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
    if (c === "'" || c === '"' || c === "`") {
      state = c === "'" ? "single" : c === '"' ? "double" : "template";
      out[i] = c;
      continue;
    }
    out[i] = c;
  }

  return out.join("");
}

// ── Bracket helpers ─────────────────────────────────────────────────────────

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

/** Skip whitespace forward from `i`. */
function skipWs(s: string, i: number): number {
  let j = i;
  while (j < s.length && /\s/.test(s[j])) j++;
  return j;
}

// ── Type resolution ─────────────────────────────────────────────────────────

type Field = { name: string; optional: boolean; type: string };

/**
 * Depth-aware scan of the DIRECT fields of an object-type body (which may be
 * a concatenation of several `{ ... }` bodies).
 *
 * This replaces a `/(?:^|[{;])\s*(\w+)(\??)\s*:/g` regex that CONSUMED its
 * `;` delimiter: under `matchAll`, consuming the separator means the next
 * field's leading `;` is already eaten, so the scan could only ever see
 * EVERY OTHER field. `MosaicDocumentUploadFile.status` was being skipped that
 * way — the discriminant itself went missing and the whole type fell out of
 * analysis, silently. Off-by-one alternation in a "cheap" regex is exactly
 * how a guard goes blind.
 *
 * Fields are collected only at depth 1 (direct members), so a NESTED object
 * value (e.g. `statusLabels: { uploading: string; success: string }`) does not
 * leak its inner keys in as phantom top-level fields. Parenthesised /
 * bracketed type text (function types, generics, arrays) is skipped wholesale.
 */
function scanFields(text: string): Field[] {
  const fields: Field[] = [];
  let depth = 0;
  let expectName = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (c === "{") {
      depth++;
      if (depth === 1) expectName = true;
      i++;
      continue;
    }
    if (c === "}") {
      depth--;
      expectName = false;
      i++;
      continue;
    }
    if (c === "(" || c === "[") {
      const close = findMatchingClose(text, i, c, c === "(" ? ")" : "]");
      i = close === -1 ? text.length : close + 1;
      continue;
    }
    if (c === ";" || c === ",") {
      if (depth === 1) expectName = true;
      i++;
      continue;
    }
    if (expectName) {
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      const match = /^(\w+)(\??)\s*:/.exec(text.slice(i));
      if (match) {
        const typeStart = i + match[0].length;
        // Field type = text up to the `;`/`,` that closes it at THIS depth.
        let j = typeStart;
        let typeDepth = 0;
        while (j < text.length) {
          const t = text[j];
          if (t === "{" || t === "(" || t === "[") typeDepth++;
          else if (t === "}" || t === ")" || t === "]") {
            if (typeDepth === 0) break; // closing the enclosing object
            typeDepth--;
          } else if ((t === ";" || t === ",") && typeDepth === 0) break;
          j++;
        }
        fields.push({
          name: match[1],
          optional: match[2] === "?",
          type: text.slice(typeStart, j).trim(),
        });
        i = j;
        expectName = false;
        continue;
      }
      expectName = false;
    }
    i++;
  }

  return fields;
}

/**
 * Required (no `?`) direct field names of `body`, excluding the discriminant.
 */
function extractRequiredFieldNames(body: string, discriminant: string): string[] {
  const names = scanFields(body)
    .filter((f) => !f.optional && f.name !== discriminant)
    .map((f) => f.name);
  return [...new Set(names)];
}

type ResolvedSpan =
  | { kind: "flat"; text: string }
  | { kind: "union"; discriminant: string; members: { literal: string; text: string }[] };

/**
 * Discriminant head of a union member: `{ k: "lit"` OR `{ k?: "lit"`.
 * The `\??` is the fix for the blind spot that let MosaicMemoryCard through —
 * a DEFAULT variant is spelled with an OPTIONAL discriminant.
 */
const MEMBER_HEAD_RE = /^\{\s*(\w+)\??\s*:\s*"([^"]+)"/;

/**
 * Resolve a named type to its declaration span(s). Handles:
 *   - `interface N { ... }` / `interface N extends B { ... }` (base folded in)
 *   - `type N = { ... }`
 *   - `type N = | { k: "a" } | { k: "b" }`        (inline discriminated union)
 *   - `type N = A & B` / `type N = A & { ... }`   (intersection)
 *   - `type N = A | B` with A, B named interfaces (union of interfaces —
 *     MosaicStepPipeline's shape)
 */
function resolveTypeSpans(content: string, name: string, seen = new Set<string>()): ResolvedSpan[] {
  if (seen.has(name)) return [];
  seen.add(name);

  const interfaceRe = new RegExp(`(?:export\\s+)?interface\\s+${name}\\b([^{]*)\\{`);
  const interfaceMatch = content.match(interfaceRe);
  if (interfaceMatch && interfaceMatch.index !== undefined) {
    const openIdx = interfaceMatch.index + interfaceMatch[0].length - 1;
    const closeIdx = findMatchingClose(content, openIdx, "{", "}");
    if (closeIdx === -1) return [];
    const spans: ResolvedSpan[] = [{ kind: "flat", text: content.slice(openIdx, closeIdx) }];
    const extendsMatch = interfaceMatch[1].match(/extends\s+([\w\s,]+)/);
    if (extendsMatch) {
      for (const base of extendsMatch[1].split(",").map((b) => b.trim())) {
        if (/^\w+$/.test(base)) spans.push(...resolveTypeSpans(content, base, seen));
      }
    }
    return spans;
  }

  const typeAliasRe = new RegExp(`(?:export\\s+)?type\\s+${name}\\s*=\\s*`);
  const typeAliasMatch = content.match(typeAliasRe);
  if (!typeAliasMatch || typeAliasMatch.index === undefined) return [];
  const cursor = skipWs(content, typeAliasMatch.index + typeAliasMatch[0].length);

  // Inline object-union / single object shape.
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
      const discMatch = memberText.match(MEMBER_HEAD_RE);
      if (discMatch) {
        discriminant = discMatch[1];
        members.push({ literal: discMatch[2], text: memberText });
      }
      c = skipWs(content, closeIdx + 1);
      if (content[c] === "|") continue;
      break;
    }
    if (members.length >= 2) return [{ kind: "union", discriminant, members }];
    if (members.length === 1) return [{ kind: "flat", text: members[0].text }];
    return [];
  }

  const semiIdx = findTopLevelChar(content, cursor, ";");
  const rhs = content.slice(cursor, semiIdx === -1 ? content.length : semiIdx);

  // Union of NAMED interfaces (`type Props = DotsProps | SegmentsProps`).
  const unionParts = splitTopLevel(rhs, "|").map((p) => p.trim());
  if (unionParts.length >= 2 && unionParts.every((p) => /^\w+$/.test(p))) {
    const members: { literal: string; text: string }[] = [];
    let discriminant = "";
    for (const part of unionParts) {
      const text = resolveTypeSpans(content, part, new Set(seen))
        .filter((s): s is Extract<ResolvedSpan, { kind: "flat" }> => s.kind === "flat")
        .map((s) => s.text)
        .join("\n");
      const discMatch = text.match(/(?:^|[{;])\s*(\w+)\??\s*:\s*"([^"]+)"\s*;/);
      if (discMatch) {
        discriminant = discMatch[1];
        members.push({ literal: discMatch[2], text });
      }
    }
    if (members.length >= 2) return [{ kind: "union", discriminant, members }];
  }

  // Intersection / bare reference.
  const spans: ResolvedSpan[] = [];
  for (const rawPart of splitTopLevel(rhs, "&")) {
    const part = rawPart.trim();
    if (part.startsWith("{") && part.endsWith("}")) {
      spans.push({ kind: "flat", text: part });
      continue;
    }
    const identifier = part.replace(/<[\s\S]*>$/, "").trim();
    if (!/^\w+$/.test(identifier)) continue;
    spans.push(...resolveTypeSpans(content, identifier, seen));
  }
  return spans;
}

/** Resolve a literal-union type ALIAS (`type S = "a" | "b" | "c";`) to its literals. */
function resolveLiteralAlias(content: string, name: string): string[] | null {
  const re = new RegExp(`(?:export\\s+)?type\\s+${name}\\s*=\\s*((?:\\s*\\|?\\s*"[^"]+")+)\\s*;`);
  const match = content.match(re);
  if (!match) return null;
  const literals = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return literals.length >= 2 ? literals : null;
}

type Discriminated = {
  typeName: string;
  discriminant: string;
  literals: string[];
  required: Map<string, Set<string>>;
  /** True when fields are declared PER BRANCH (inside union members). Drives fail-closed. */
  hasPerBranchDecls: boolean;
};

function analyzeType(content: string, typeName: string): Discriminated | null {
  const spans = resolveTypeSpans(content, typeName);
  if (spans.length === 0) return null;

  const unionSpan = spans.find(
    (s): s is Extract<ResolvedSpan, { kind: "union" }> => s.kind === "union",
  );

  if (unionSpan) {
    const { discriminant, members } = unionSpan;
    const literals = members.map((m) => m.literal);
    const required = new Map<string, Set<string>>();
    for (const member of members) {
      for (const field of extractRequiredFieldNames(member.text, discriminant)) {
        const set = required.get(field) ?? new Set<string>();
        set.add(member.literal);
        required.set(field, set);
      }
    }
    const perBranchCount = required.size;
    // Shared base fields (the flat side of `Base & Union`) → required on every literal.
    for (const span of spans) {
      if (span.kind !== "flat") continue;
      for (const field of extractRequiredFieldNames(span.text, discriminant)) {
        if (required.has(field)) continue;
        required.set(field, new Set(literals));
      }
    }
    return { typeName, discriminant, literals, required, hasPerBranchDecls: perBranchCount > 0 };
  }

  // Flat type with a literal-union field — inline or behind an alias.
  const flatText = spans
    .filter((s): s is Extract<ResolvedSpan, { kind: "flat" }> => s.kind === "flat")
    .map((s) => s.text)
    .join("\n");
  if (!flatText) return null;

  let discriminant = "";
  let literals: string[] = [];

  // The discriminant is the first direct field whose type is a literal union,
  // written inline (`status: "a" | "b"`) or behind a type alias
  // (`status: MosaicDocumentUploadFileStatus`).
  for (const field of scanFields(flatText)) {
    if (/^"[^"]+"(\s*\|\s*"[^"]+")+$/.test(field.type)) {
      discriminant = field.name;
      literals = [...field.type.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      break;
    }
    if (/^\w+$/.test(field.type)) {
      const aliasLiterals = resolveLiteralAlias(content, field.type);
      if (aliasLiterals) {
        discriminant = field.name;
        literals = aliasLiterals;
        break;
      }
    }
  }
  if (!discriminant || literals.length < 2) return null;

  const required = new Map<string, Set<string>>();
  for (const field of extractRequiredFieldNames(flatText, discriminant)) {
    required.set(field, new Set(literals));
  }
  // A flat type declares NOTHING per-branch, so an absent gating region means
  // "this type simply isn't branched on" (e.g. MosaicMemoryData.scope, merely
  // formatted) — legitimately skippable, not a blind spot.
  return { typeName, discriminant, literals, required, hasPerBranchDecls: false };
}

// ── Gated-region extraction ─────────────────────────────────────────────────

type Region = { owners: Set<string>; start: number; end: number };

/**
 * Every region of the component body whose rendering is gated on `discriminant`.
 * Recognizes all five forms inventoried from the real library (file header).
 * Each region carries the SET of literals for which it renders — `!==` and
 * ternary else-arms own the complement.
 */
function findGatedRegions(body: string, discriminant: string, allLiterals: string[]): Region[] {
  const regions: Region[] = [];
  const complement = (lit: string) => new Set(allLiterals.filter((l) => l !== lit));

  const parenAt = (i: number): { start: number; end: number } | null => {
    const open = skipWs(body, i);
    if (body[open] !== "(") return null;
    const close = findMatchingClose(body, open, "(", ")");
    return close === -1 ? null : { start: open, end: close };
  };

  /**
   * A ternary ARM starting at `i`. Form 7: the arms are very often NOT
   * parenthesised — `{mode === "edit" ? saveChangesLabel : createItemLabel}`
   * is the shape that made MosaicModuleForm invisible. So: use the paren span
   * when there is one, otherwise take the bare expression up to the first
   * `terminator` seen at bracket-depth 0.
   */
  const armAt = (i: number, terminators: string[]): { start: number; end: number } | null => {
    const start = skipWs(body, i);
    if (start >= body.length) return null;
    if (body[start] === "(") return parenAt(start);
    let depth = 0;
    for (let j = start; j < body.length; j++) {
      const c = body[j];
      if (c === "(" || c === "{" || c === "[") depth++;
      else if (c === ")" || c === "}" || c === "]") {
        if (depth === 0) return { start, end: j - 1 }; // closed the enclosing container
        depth--;
      } else if (depth === 0 && terminators.includes(c)) {
        return { start, end: j - 1 };
      }
    }
    return { start, end: body.length - 1 };
  };

  // Forms 1-4: a direct comparison against a literal.
  const cmpRe = new RegExp(`[\\w.]*\\b${discriminant}\\s*(===|!==)\\s*"([^"]+)"`, "g");
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = cmpRe.exec(body))) {
    const [, operator, literal] = match;
    const trueOwners = operator === "===" ? new Set([literal]) : complement(literal);
    const falseOwners = operator === "===" ? complement(literal) : new Set([literal]);
    let after = skipWs(body, match.index + match[0].length);

    // Form 1: `&& ( ... )`
    if (body.startsWith("&&", after)) {
      const span = parenAt(after + 2);
      if (span) regions.push({ owners: trueOwners, start: span.start, end: span.end });
      continue;
    }

    // Forms 2-3-7: `? A : B` — arms parenthesised OR bare (see armAt).
    if (body[after] === "?") {
      const trueSpan = armAt(after + 1, [":"]);
      if (!trueSpan) continue;
      regions.push({ owners: trueOwners, start: trueSpan.start, end: trueSpan.end });
      after = skipWs(body, trueSpan.end + 1);
      if (body[after] === ":") {
        const falseSpan = armAt(after + 1, [";", ","]);
        if (falseSpan) {
          regions.push({ owners: falseOwners, start: falseSpan.start, end: falseSpan.end });
        }
      }
      continue;
    }

    // Form 4: early return — `if (X.D === "L") { ... return ... }`
    const ifIdx = body.lastIndexOf("if", match.index);
    if (ifIdx === -1) continue;
    const ifOpen = skipWs(body, ifIdx + 2);
    if (body[ifOpen] !== "(") continue;
    const ifClose = findMatchingClose(body, ifOpen, "(", ")");
    if (ifClose <= match.index) continue;
    const blockOpen = skipWs(body, ifClose + 1);
    if (body[blockOpen] !== "{") continue;
    const blockClose = findMatchingClose(body, blockOpen, "{", "}");
    if (blockClose === -1) continue;
    regions.push({ owners: trueOwners, start: blockOpen, end: blockClose });
    // If the gated block RETURNS, everything after it renders only for ¬L.
    if (/\breturn\b/.test(body.slice(blockOpen, blockClose))) {
      regions.push({ owners: falseOwners, start: blockClose + 1, end: body.length - 1 });
    }
  }

  // Form 5: `const isFoo = X.D === "L";` … `isFoo ? ( A ) : ( B )` / `isFoo && ( A )`
  const boolRe = new RegExp(
    `\\bconst\\s+(\\w+)\\s*=\\s*[\\w.]*\\b${discriminant}\\s*(===|!==)\\s*"([^"]+)"\\s*;`,
    "g",
  );
  const bools: { name: string; trueOwners: Set<string>; falseOwners: Set<string> }[] = [];
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = boolRe.exec(body))) {
    const [, name, operator, literal] = match;
    bools.push({
      name,
      trueOwners: operator === "===" ? new Set([literal]) : complement(literal),
      falseOwners: operator === "===" ? complement(literal) : new Set([literal]),
    });
  }
  for (const bool of bools) {
    const useRe = new RegExp(`\\b${bool.name}\\s*(\\?|&&)`, "g");
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
    while ((match = useRe.exec(body))) {
      const trueSpan = parenAt(match.index + match[0].length);
      if (!trueSpan) continue;
      regions.push({ owners: bool.trueOwners, start: trueSpan.start, end: trueSpan.end });
      if (match[1] !== "?") continue;
      const after = skipWs(body, trueSpan.end + 1);
      if (body[after] !== ":") continue;
      const falseSpan = parenAt(after + 1);
      if (falseSpan) {
        regions.push({ owners: bool.falseOwners, start: falseSpan.start, end: falseSpan.end });
      }
    }
  }

  return regions;
}

/**
 * EVERY function body in the file, each returned separately.
 *
 * Not just the first exported component: gating form 6 in this library is
 * DELEGATION — a dispatcher gates on the discriminant and forwards the props
 * to a branch sub-component that does the actual reading:
 *
 *   export function MosaicStepPipeline(props: MosaicStepPipelineProps) {
 *     if (props.variant === "segments") return <MosaicStepPipelineSegments {...props} />;
 *     return <MosaicStepPipelineDots {...props} />;
 *   }
 *   function MosaicStepPipelineSegments({ steps, progressAriaLabel, ... }) { ... }
 *
 * Scanning only the dispatcher made `steps` and `progressAriaLabel` look
 * "never read" in both branches — a false positive. Bodies are kept SEPARATE
 * (not concatenated) so that form 4's "everything after the early-return
 * block" region cannot spill out of its own function and wrongly claim the
 * next function's text.
 *
 * Destructuring (`const { a, b } = props;` and the parameter destructuring
 * pattern itself) is blanked: naming a prop in a destructuring pattern is not
 * READING it, and leaving it in would make every field look unconditionally
 * read.
 */
type FnDecl = {
  name: string;
  propsType: string | null;
  body: string;
  /** `{ clerkSignIn: ClerkSignIn }` -> field `clerkSignIn` is READ as `ClerkSignIn`. */
  renames: Map<string, string>;
};

/**
 * Destructuring RENAMES in the parameter pattern. `function MosaicSignInLayout({
 * clerkSignIn: ClerkSignIn, ... })` then renders `<ClerkSignIn />` — the field
 * name `clerkSignIn` never appears in the body, so without this map it looks
 * "never read at all" (a false positive I hit on all three auth layouts).
 * Excludes default values (`currentIndex = 0`) and nested patterns.
 */
function extractParamRenames(params: string): Map<string, string> {
  const renames = new Map<string, string>();
  for (const m of params.matchAll(/(\w+)\s*:\s*([A-Za-z_$][\w$]*)\s*(?=[,}])/g)) {
    renames.set(m[1], m[2]);
  }
  return renames;
}

function extractFunctionDecls(content: string): FnDecl[] {
  const decls: FnDecl[] = [];
  // `<[^>]*>` allows a GENERIC signature — `export function MosaicDataTable<T>(`
  // was invisible without it, and fell through as an UNCOVERED public export.
  const fnRe = /\bfunction\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = fnRe.exec(content))) {
    const name = match[1];
    const parenOpen = content.indexOf("(", match.index + match[0].length - 1);
    const parenClose = findMatchingClose(content, parenOpen, "(", ")");
    if (parenClose === -1) continue;
    const braceOpen = content.indexOf("{", parenClose);
    if (braceOpen === -1) continue;
    const between = content.slice(parenClose + 1, braceOpen);
    if (/[;)]/.test(between)) continue;
    const braceClose = findMatchingClose(content, braceOpen, "{", "}");
    if (braceClose === -1) continue;

    // Props type from the signature: `(props: T)` or `({ ... }: T)`, possibly
    // generic (`: MosaicDataTableProps<T>`).
    const params = content.slice(parenOpen, parenClose + 1);
    const typeMatch = params.match(/:\s*(\w+)(?:<[^>]*>)?\s*\)?\s*$/);
    decls.push({
      name,
      propsType: typeMatch ? typeMatch[1] : null,
      renames: extractParamRenames(params),
      body: content
        .slice(braceOpen, braceClose)
        .replace(/const\s*\{[\s\S]*?\}\s*=\s*\w+\s*;/g, (m) => " ".repeat(m.length)),
    });
  }
  return decls;
}

/**
 * The bodies relevant to ONE component: its own body, plus the bodies of any
 * function in the same file that it references (one level of delegation —
 * MosaicStepPipeline -> MosaicStepPipelineSegments/Dots).
 *
 * Scoped PER COMPONENT rather than per FILE: many files export several
 * components (6 in org-panel, 6 in card, 5 in tooltip, 4 in tabs...), and a
 * file-wide read set would let component A's use of a name mask component B's
 * dead prop of the same name.
 */
function bodiesForComponent(decls: FnDecl[], component: FnDecl): string[] {
  const bodies = [component.body];
  for (const other of decls) {
    if (other.name === component.name) continue;
    if (new RegExp(`\\b${other.name}\\b`).test(component.body)) bodies.push(other.body);
  }
  return bodies;
}

// ── Violation assembly ──────────────────────────────────────────────────────

/**
 * What the guard DID with one exported component. "I could not analyze it" and
 * "it is clean" MUST NOT produce the same output — that equivalence is what
 * hid three successive blind spots behind the same green. Every public
 * component ends up in exactly one of these verdicts, and the coverage test
 * asserts the union covers 100% of the public surface.
 */
type Verdict =
  | { component: string; status: "ANALYZED"; discriminant: string; literals: string[] }
  | { component: string; status: "NOT-BRANCHED"; reason: string }
  | { component: string; status: "NO-DISCRIMINANT"; reason: string }
  | { component: string; status: "EXEMPT"; reason: string }
  | { component: string; status: "BLIND-SPOT"; detail: string };

type FileReport = { violations: string[]; verdicts: Verdict[] };

function analyzeFile(relPath: string, rawContent: string): FileReport {
  const content = stripComments(rawContent);
  const decls = extractFunctionDecls(content);
  const violations: string[] = [];
  const verdicts: Verdict[] = [];

  // EVERY exported component of the file, not just the first.
  const exportedComponents = decls.filter((d) =>
    new RegExp(`export\\s+function\\s+${d.name}\\b`).test(content),
  );

  for (const component of exportedComponents) {
    const exempt = EXEMPTIONS.find((e) => e.component === component.name);
    if (exempt) {
      verdicts.push({ component: component.name, status: "EXEMPT", reason: exempt.reason });
      continue;
    }

    if (!component.propsType) {
      verdicts.push({
        component: component.name,
        status: "NO-DISCRIMINANT",
        reason: "no named props type in the signature (no props, or inline type)",
      });
      continue;
    }

    // Candidate types = the props type itself PLUS the item types it
    // references (`files: MosaicDocumentUploadFile[]`). The lying-contract
    // failure mode lives on ITEM types too: MosaicDocumentUploadFile.status is
    // a discriminant, and a required item field never read for a given status
    // is the same lie.
    const candidateTypes = [component.propsType];
    for (const span of resolveTypeSpans(content, component.propsType)) {
      if (span.kind !== "flat") continue;
      for (const field of scanFields(span.text)) {
        const referenced = field.type.replace(/\[\]$/, "").trim();
        if (/^\w+$/.test(referenced) && referenced !== component.propsType) {
          candidateTypes.push(referenced);
        }
      }
    }

    const analysis = candidateTypes
      .map((t) => analyzeType(content, t))
      .find((a): a is Discriminated => a !== null);

    const bodies = bodiesForComponent(decls, component);

    /**
     * Is `field` read in `text`? A param destructuring RENAME means the field
     * is read under its LOCAL name (`{ clerkSignIn: ClerkSignIn }` -> the body
     * says `<ClerkSignIn />`), so both names count.
     *
     * A `{...props}` spread is deliberately NOT treated as "reads everything":
     * that short-circuit made the guard blind again (MosaicStepPipeline's
     * dispatcher spreads props, so every dead prop looked read). The delegate's
     * body is already included by bodiesForComponent, so a field forwarded by a
     * spread is found where it is actually consumed — or correctly reported
     * dead when nothing consumes it.
     */
    const readsField = (field: string, text: string): boolean => {
      if (new RegExp(`\\b${field}\\b`).test(text)) return true;
      const local = component.renames.get(field);
      return local !== undefined && new RegExp(`\\b${local}\\b`).test(text);
    };

    if (!analysis) {
      // No discriminant anywhere — there is no BRANCH that can lie. But a
      // required prop that is read NOWHERE is still a lying contract, just an
      // unconditional one, and this is where dozens of components live. They
      // are NOT waved through: the weaker invariant is enforced on all of
      // them. (Without this, a dead required prop on any of the ~96
      // NO-DISCRIMINANT public components was invisible.)
      verdicts.push({
        component: component.name,
        status: "NO-DISCRIMINANT",
        reason: `props type "${component.propsType}" (and the item types it references) have no discriminated union and no literal-union field — no branch to lie about; all required props checked for "read at all"`,
      });
      const flatText = resolveTypeSpans(content, component.propsType)
        .filter((s): s is Extract<ResolvedSpan, { kind: "flat" }> => s.kind === "flat")
        .map((s) => s.text)
        .join("\n");
      for (const field of extractRequiredFieldNames(flatText, "")) {
        if (bodies.some((b) => readsField(field, b))) continue;
        violations.push(
          `${relPath}: required prop "${field}" of component "${component.name}" is never read at all — remove it or render it`,
        );
      }
      continue;
    }

    const { discriminant, literals, required, hasPerBranchDecls } = analysis;

    // Regions are computed PER body: an early-return region must not spill
    // across a function boundary.
    const scanned = bodies.map((body) => ({
      body,
      regions: findGatedRegions(body, discriminant, literals),
    }));
    const totalRegions = scanned.reduce((n, s) => n + s.regions.length, 0);

    if (totalRegions === 0) {
      if (hasPerBranchDecls) {
        // FAIL-CLOSED. Fields are declared PER BRANCH, so branching MUST
        // exist — the guard simply cannot see it. Say so; never return a
        // silent green.
        verdicts.push({
          component: component.name,
          status: "BLIND-SPOT",
          detail: `discriminant "${discriminant}" (${literals.join(" | ")}) declared per-branch in "${component.propsType}", but no gated region found`,
        });
        violations.push(
          `${relPath}: cannot locate gated regions for discriminant "${discriminant}" in component "${component.name}" — guard blind spot (teach findGatedRegions the gating form, or add a written EXEMPTIONS entry)`,
        );
        continue;
      }

      // The discriminant exists but nothing branches on it (e.g.
      // MosaicTooltip's `side`, merely forwarded to the positioner). There is
      // no branch, so no branch can lie. This is NOT silence: the component is
      // recorded as NOT-BRANCHED in the coverage inventory, AND every required
      // field is still held to the weaker-but-real invariant "must be read
      // somewhere at all" — a required prop read nowhere is a lying contract
      // too, just an unconditional one.
      verdicts.push({
        component: component.name,
        status: "NOT-BRANCHED",
        reason: `discriminant "${discriminant}" (${literals.join(" | ")}) is never branched on — no per-branch declarations; all required props checked for "read at all"`,
      });
      // Both the analyzed type's fields AND the component's OWN props fields —
      // the discriminant may have come from an ITEM type, in which case
      // `required` holds the item's fields and the props would go unchecked.
      const notBranchedFlat = resolveTypeSpans(content, component.propsType)
        .filter((s): s is Extract<ResolvedSpan, { kind: "flat" }> => s.kind === "flat")
        .map((s) => s.text)
        .join("\n");
      const notBranchedFields = new Set([
        ...required.keys(),
        ...extractRequiredFieldNames(notBranchedFlat, discriminant),
      ]);
      for (const field of notBranchedFields) {
        if (bodies.some((b) => readsField(field, b))) continue;
        violations.push(
          `${relPath}: required prop "${field}" of component "${component.name}" is never read at all — remove it or render it`,
        );
      }
      continue;
    }

    verdicts.push({ component: component.name, status: "ANALYZED", discriminant, literals });

    for (const [field, requiredOn] of required) {
      const readOn = new Set<string>();
      let readUnconditionally = false;

      for (const { body, regions } of scanned) {
        const chars = body.split("");
        for (const region of regions) {
          for (let i = region.start; i <= Math.min(region.end, chars.length - 1); i++) {
            chars[i] = " ";
          }
        }
        if (readsField(field, chars.join(""))) readUnconditionally = true;

        for (const region of regions) {
          if (!readsField(field, body.slice(region.start, region.end + 1))) continue;
          for (const owner of region.owners) readOn.add(owner);
        }
      }

      if (readUnconditionally) continue; // read outside every gate → all literals

      for (const literal of requiredOn) {
        if (readOn.has(literal)) continue;
        violations.push(
          `${relPath}: required prop "${field}" is never read when ${discriminant}="${literal}" — declare it on the branch that renders it`,
        );
      }
    }

    // The discriminant may have come from an ITEM type (e.g.
    // MosaicModuleFormField.type), in which case `required` above holds the
    // ITEM's fields and the component's OWN props were never checked at all.
    // Every component's props are held to the universal invariant regardless of
    // which type supplied the discriminant.
    const propsFlatText = resolveTypeSpans(content, component.propsType)
      .filter((s): s is Extract<ResolvedSpan, { kind: "flat" }> => s.kind === "flat")
      .map((s) => s.text)
      .join("\n");
    for (const field of extractRequiredFieldNames(propsFlatText, discriminant)) {
      if (required.has(field)) continue; // already covered by the per-branch check
      if (bodies.some((b) => readsField(field, b))) continue;
      violations.push(
        `${relPath}: required prop "${field}" of component "${component.name}" is never read at all — remove it or render it`,
      );
    }
  }

  return { violations, verdicts };
}

function findViolations(relPath: string, rawContent: string): string[] {
  return analyzeFile(relPath, rawContent).violations;
}

// ── Mutation probe: prove the guard BITES on REAL code ──────────────────────

/**
 * Each probe injects a dead REQUIRED field into a REAL component's real branch
 * (in memory — the file on disk is never touched) and asserts the guard names
 * it. A guard that only passes its own fixtures proves nothing but that its
 * matcher understands itself; these probes prove it bites the shapes that
 * actually ship, one per distinct gating form found in the library.
 *
 * `anchor` must exist verbatim in the source — if a refactor moves it, the
 * probe fails LOUDLY rather than silently testing nothing (the "mutation that
 * never landed" trap, which produces a false green).
 */
const MUTATION_PROBES: {
  file: string;
  anchor: string;
  inject: string;
  probeField: string;
  expectLiteral: string;
  gatingForm: string;
}[] = [
  {
    file: "memory-card/MosaicMemoryCard.tsx",
    anchor: `variant: "compact";`,
    inject: `variant: "compact";\n      gammaProbeLabel: string;`,
    probeField: "gammaProbeLabel",
    expectLiteral: "compact",
    gatingForm: "negative ternary + optional discriminant",
  },
  {
    file: "step-pipeline/MosaicStepPipeline.tsx",
    anchor: `variant: "segments";`,
    inject: `variant: "segments";\n  gammaProbeLabel: string;`,
    probeField: "gammaProbeLabel",
    expectLiteral: "segments",
    gatingForm: "early return from a union of named interfaces",
  },
  {
    file: "document-upload/MosaicDocumentUpload.tsx",
    anchor: "status: MosaicDocumentUploadFileStatus;",
    inject: "status: MosaicDocumentUploadFileStatus;\n  gammaProbeLabel: string;",
    probeField: "gammaProbeLabel",
    expectLiteral: "uploading",
    gatingForm: "item-level discriminant behind a literal-union type alias",
  },
  {
    // Landed on main via PR #55 — now REAL code, so it is probed as real code
    // rather than only as a historical fixture.
    file: "url-scraper/MosaicUrlScraper.tsx",
    anchor: `status: "loading";`,
    inject: `status: "loading";\n      gammaProbeLabel: string;`,
    probeField: "gammaProbeLabel",
    expectLiteral: "loading",
    gatingForm: "&& gate on a props-level discriminated union",
  },
  {
    // The component that exposed hole #3: not reachable when only ONE
    // component per file was analyzed, and gated by a BARE (unparenthesised)
    // ternary — `{mode === "edit" ? saveChangesLabel : createItemLabel}`.
    file: "module-library/MosaicModuleLibrary.tsx",
    anchor: `mode: "create";`,
    inject: `mode: "create";\n      gammaProbe2: string;`,
    probeField: "gammaProbe2",
    expectLiteral: "create",
    gatingForm: "bare (unparenthesised) ternary arms, on a non-sole component of the file",
  },
];

/**
 * Probes for components that are NOT the first export of a multi-export file.
 * These assert the guard reaches EVERY exported component, not just the first —
 * the failure that hid MosaicModuleForm and would have hidden dozens more
 * (6 in org-panel, 6 in card, 5 in tooltip, 4 in tabs, ...).
 *
 * The injected prop is dead everywhere, so the expected verdict is the
 * unconditional form: "never read at all".
 */
const MULTI_EXPORT_PROBES: {
  file: string;
  component: string;
  ordinal: string;
  anchor: string;
  inject: string;
  probeField: string;
}[] = [
  {
    file: "module-library/MosaicModuleLibrary.tsx",
    component: "MosaicModuleLibrary",
    ordinal: "2nd of 2 exported components",
    anchor: "export interface MosaicModuleLibraryProps {",
    inject: "export interface MosaicModuleLibraryProps {\n  gammaProbe3: string;",
    probeField: "gammaProbe3",
  },
  {
    file: "activity-feed/MosaicActivityFeed.tsx",
    component: "MosaicActivityFeed",
    ordinal: "2nd of 2 exported components",
    anchor: "export interface MosaicActivityFeedProps {",
    inject: "export interface MosaicActivityFeedProps {\n  gammaProbe4: string;",
    probeField: "gammaProbe4",
  },
];

// ── Suite ───────────────────────────────────────────────────────────────────

describe("no-lying-prop-contract guard — a required prop must be read exactly where it is required", () => {
  it("MUST_BLOCK: historical MosaicMemoryCard (c71d640) — formatUsageCount dead in compact", () => {
    const violations = findViolations(
      "MosaicMemoryCard.tsx",
      fs.readFileSync(path.join(FIXTURES_ROOT, "MosaicMemoryCard.c71d640.tsx"), "utf-8"),
    );
    expect(
      violations.some((v) => v.includes('"formatUsageCount"') && v.includes('variant="compact"')),
      `expected a violation naming formatUsageCount + variant="compact", got:\n${violations.join("\n")}`,
    ).toBe(true);
  });

  it("MUST_BLOCK: historical MosaicUrlScraper (fcb0329) — 4 props dead in idle", () => {
    const violations = findViolations(
      "MosaicUrlScraper.tsx",
      fs.readFileSync(path.join(FIXTURES_ROOT, "MosaicUrlScraper.fcb0329.tsx"), "utf-8"),
    );
    for (const field of ["loadingMessage", "resetButtonLabel", "openLinkAriaLabel", "imageAlt"]) {
      expect(
        violations.some((v) => v.includes(`"${field}"`) && v.includes('status="idle"')),
        `expected a violation naming ${field} + status="idle", got:\n${violations.join("\n")}`,
      ).toBe(true);
    }
  });

  it.each(MUTATION_PROBES)(
    "MUST_BLOCK (mutation probe, REAL code): $file — dead required prop in the $expectLiteral branch [$gatingForm]",
    ({ file, anchor, inject, probeField, expectLiteral }) => {
      const source = fs.readFileSync(path.join(COMPONENTS_ROOT, file), "utf-8");

      // The mutation must LAND. If the anchor is gone, fail loudly — a probe
      // that silently mutates nothing is a false green.
      expect(
        source.includes(anchor),
        `mutation probe anchor not found in ${file}: ${JSON.stringify(anchor)} — the component was refactored; update the probe (a probe that does not land tests nothing).`,
      ).toBe(true);

      const mutated = source.replace(anchor, inject);
      expect(mutated).not.toBe(source);
      expect(mutated).toContain(`${probeField}: string;`);

      const violations = findViolations(file, mutated);
      expect(
        violations.some((v) => v.includes(`"${probeField}"`) && v.includes(`="${expectLiteral}"`)),
        `guard did NOT bite the injected dead prop "${probeField}" in ${file} (${expectLiteral} branch). Violations were:\n${violations.join("\n") || "(none)"}`,
      ).toBe(true);
    },
  );

  it.each(MULTI_EXPORT_PROBES)(
    "MUST_BLOCK (multi-export probe): $component ($ordinal of $file) — the guard reaches components that are NOT the first export",
    ({ file, component, anchor, inject, probeField }) => {
      const source = fs.readFileSync(path.join(COMPONENTS_ROOT, file), "utf-8");

      expect(
        source.includes(anchor),
        `multi-export probe anchor not found in ${file}: ${JSON.stringify(anchor)} — update the probe (a probe that does not land tests nothing).`,
      ).toBe(true);

      const mutated = source.replace(anchor, inject);
      expect(mutated).not.toBe(source);
      expect(mutated).toContain(`${probeField}: string;`);

      const violations = findViolations(file, mutated);
      expect(
        violations.some((v) => v.includes(`"${probeField}"`) && v.includes(component)),
        `guard did NOT bite the dead prop "${probeField}" on ${component} (${file}) — it is not the first export of its file, which is exactly the hole this probe exists to catch. Violations were:\n${violations.join("\n") || "(none)"}`,
      ).toBe(true);
    },
  );

  it.each(MUTATION_PROBES)(
    "MUST_PASS (mutation probe control): $file is clean WITHOUT the injected prop",
    ({ file }) => {
      const violations = findViolations(
        file,
        fs.readFileSync(path.join(COMPONENTS_ROOT, file), "utf-8"),
      );
      expect(violations, `expected zero violations, got:\n${violations.join("\n")}`).toEqual([]);
    },
  );

  it("MUST_PASS: assumed divergence — MosaicUrlScraper (d370859) imageAlt on the whole success branch", () => {
    const violations = findViolations(
      "MosaicUrlScraper.tsx",
      fs.readFileSync(path.join(FIXTURES_ROOT, "MosaicUrlScraper.d370859.tsx"), "utf-8"),
    );
    expect(violations, `expected zero violations, got:\n${violations.join("\n")}`).toEqual([]);
  });

  it("MUST_PASS: every live component under src/components/ is clean AND fully analyzable (no blind spot)", () => {
    const files = walkComponents(COMPONENTS_ROOT);
    expect(files.length).toBeGreaterThan(20);

    const allViolations: string[] = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/");
      allViolations.push(...findViolations(rel, fs.readFileSync(file, "utf-8")));
    }

    if (allViolations.length > 0) {
      console.error(
        `no-lying-prop-contract violations (${allViolations.length}):\n${allViolations.join("\n")}`,
      );
    }

    expect(allViolations).toEqual([]);
  });

  /**
   * THE COVERAGE INVENTORY — the rule the first three versions were missing:
   * SILENCE IS NOT A VERDICT.
   *
   * Three successive blind spots all produced the same green as a clean
   * library. As long as "I could not analyze it" and "it is clean" look
   * identical from the outside, a green proves nothing.
   *
   * Source of truth = the Mosaic* VALUE exports of src/index.ts (the actual
   * public surface). Every one of them must land in exactly one bucket:
   *   ANALYZED · NOT-BRANCHED · NO-DISCRIMINANT · EXEMPT · NON-FUNCTION
   * and BLIND-SPOT must be empty. A public component that is neither analyzed
   * nor explicitly written off FAILS this test by name.
   */
  it("COVERAGE: every public Mosaic* export is ANALYZED or written off with a reason — none silently skipped", () => {
    const indexSource = fs.readFileSync(path.resolve(__dirname, "..", "index.ts"), "utf-8");

    // Public Mosaic* VALUE exports (type-only exports are not components).
    const publicExports = new Set<string>();
    const exportBlockRe = /export(?:\s+type)?\s*\{([^}]*)\}\s*from\s*"[^"]+";/gs;
    let block: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
    while ((block = exportBlockRe.exec(indexSource))) {
      if (block[0].trimStart().startsWith("export type")) continue;
      for (const raw of block[1].split(",")) {
        const entry = raw.trim();
        if (!entry || /^type\s/.test(entry)) continue;
        const parts = entry.split(/\s+as\s+/);
        const name = parts[parts.length - 1].trim();
        if (name.startsWith("Mosaic")) publicExports.add(name);
      }
    }
    expect(
      publicExports.size,
      "extracted zero public Mosaic* exports from src/index.ts — the export syntax changed and this coverage check silently stopped checking. Fix the parser.",
    ).toBeGreaterThan(100);

    // What the guard actually did, component by component, across the library.
    const verdicts = new Map<string, Verdict>();
    for (const file of walkComponents(COMPONENTS_ROOT)) {
      const rel = path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/");
      for (const verdict of analyzeFile(rel, fs.readFileSync(file, "utf-8")).verdicts) {
        verdicts.set(verdict.component, verdict);
      }
    }

    const nonFunction = new Set(NON_FUNCTION_PUBLIC_EXPORTS.map((e) => e.component));

    const blindSpots = [...verdicts.values()].filter((v) => v.status === "BLIND-SPOT");
    const uncovered = [...publicExports].filter((n) => !verdicts.has(n) && !nonFunction.has(n));

    const bucket = (status: Verdict["status"]) =>
      [...publicExports].filter((n) => verdicts.get(n)?.status === status);

    const analyzed = bucket("ANALYZED");
    const notBranched = bucket("NOT-BRANCHED");
    const noDiscriminant = bucket("NO-DISCRIMINANT");
    const exempt = bucket("EXEMPT");

    console.error(
      [
        "",
        "── no-lying-prop-contract COVERAGE INVENTORY ─────────────────────",
        `public Mosaic* exports (src/index.ts) : ${publicExports.size}`,
        `  ANALYZED (discriminant + gating)    : ${analyzed.length}`,
        `  NOT-BRANCHED (enum never gated)     : ${notBranched.length}`,
        `  NO-DISCRIMINANT (no union at all)   : ${noDiscriminant.length}`,
        `  EXEMPT (written)                    : ${exempt.length}`,
        `  NON-FUNCTION (written)              : ${[...publicExports].filter((n) => nonFunction.has(n)).length}`,
        `  BLIND-SPOT                          : ${blindSpots.length}`,
        `  UNCOVERED (silently skipped)        : ${uncovered.length}`,
        "",
        `ANALYZED components: ${analyzed
          .map((n) => {
            const v = verdicts.get(n);
            return v?.status === "ANALYZED" ? `${n}[${v.discriminant}]` : n;
          })
          .join(", ")}`,
        "─────────────────────────────────────────────────────────────────",
      ].join("\n"),
    );

    expect(
      blindSpots,
      `guard BLIND SPOTS (it cannot see these components' branching):\n${blindSpots
        .map((v) => `  - ${v.component}: ${v.status === "BLIND-SPOT" ? v.detail : ""}`)
        .join("\n")}`,
    ).toEqual([]);

    expect(
      uncovered,
      `these PUBLIC components were neither analyzed nor written off — the guard skipped them SILENTLY, which is exactly the failure mode this test exists to kill:\n${uncovered
        .map((n) => `  - ${n}`)
        .join(
          "\n",
        )}\nFix: make them analyzable, or add a written NON_FUNCTION_PUBLIC_EXPORTS / EXEMPTIONS entry with a reason.`,
    ).toEqual([]);

    // The buckets must EXACTLY partition the public surface.
    const covered =
      analyzed.length +
      notBranched.length +
      noDiscriminant.length +
      exempt.length +
      [...publicExports].filter((n) => nonFunction.has(n)).length;
    expect(covered, "coverage buckets must sum to the full public surface").toBe(
      publicExports.size,
    );
  });
});
