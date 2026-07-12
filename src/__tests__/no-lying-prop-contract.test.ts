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
const EXEMPTIONS: { type: string; discriminant: string; reason: string }[] = [];

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

function findDeclaredTypeNames(content: string): string[] {
  const names: string[] = [];
  for (const m of content.matchAll(/(?:export\s+)?(?:interface|type)\s+(\w+)\b/g)) names.push(m[1]);
  return [...new Set(names)];
}

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

    // Forms 2-3: `? ( A ) : ( B )`
    if (body[after] === "?") {
      const trueSpan = parenAt(after + 1);
      if (!trueSpan) continue;
      regions.push({ owners: trueOwners, start: trueSpan.start, end: trueSpan.end });
      after = skipWs(body, trueSpan.end + 1);
      if (body[after] === ":") {
        const falseSpan = parenAt(after + 1);
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
function extractFunctionBodies(content: string): string[] {
  const bodies: string[] = [];
  const fnRe = /\bfunction\s+\w+\s*\(/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((match = fnRe.exec(content))) {
    const parenOpen = content.indexOf("(", match.index);
    const parenClose = findMatchingClose(content, parenOpen, "(", ")");
    if (parenClose === -1) continue;
    const braceOpen = content.indexOf("{", parenClose);
    if (braceOpen === -1) continue;
    // Guard against a return-type annotation containing a `{` before the body.
    const between = content.slice(parenClose + 1, braceOpen);
    if (/[;)]/.test(between)) continue;
    const braceClose = findMatchingClose(content, braceOpen, "{", "}");
    if (braceClose === -1) continue;
    bodies.push(
      content
        .slice(braceOpen, braceClose)
        .replace(/const\s*\{[\s\S]*?\}\s*=\s*\w+\s*;/g, (m) => " ".repeat(m.length)),
    );
  }
  return bodies;
}

// ── Violation assembly ──────────────────────────────────────────────────────

function findViolations(relPath: string, rawContent: string): string[] {
  const content = stripComments(rawContent);
  const bodies = extractFunctionBodies(content);
  if (bodies.length === 0) return [];

  const violations: string[] = [];

  for (const typeName of findDeclaredTypeNames(content)) {
    const analysis = analyzeType(content, typeName);
    if (!analysis) continue;

    const { discriminant, literals, required, hasPerBranchDecls } = analysis;

    if (EXEMPTIONS.some((e) => e.type === typeName && e.discriminant === discriminant)) continue;

    // Regions are computed PER function body (see extractFunctionBodies): an
    // early-return region must not spill across a function boundary.
    const analyzed = bodies.map((body) => ({
      body,
      regions: findGatedRegions(body, discriminant, literals),
    }));
    const totalRegions = analyzed.reduce((n, a) => n + a.regions.length, 0);

    if (totalRegions === 0) {
      // FAIL-CLOSED. A type that declares required fields PER BRANCH, whose
      // discriminant the guard finds no gating for ANYWHERE in the file, is a
      // BLIND SPOT — exactly the failure that let MosaicMemoryCard through.
      // Never silent.
      if (hasPerBranchDecls) {
        violations.push(
          `${relPath}: cannot locate gated regions for discriminant "${discriminant}" in type "${typeName}" — guard blind spot (teach findGatedRegions the gating form, or add a written EXEMPTIONS entry)`,
        );
      }
      continue;
    }

    for (const [field, requiredOn] of required) {
      const fieldRe = new RegExp(`\\b${field}\\b`);
      const readOn = new Set<string>();
      let readUnconditionally = false;

      for (const { body, regions } of analyzed) {
        // Unconditional text of THIS body = the body minus its gated regions.
        // A body with no regions at all (e.g. a branch sub-component the
        // dispatcher delegates to) is entirely unconditional — reads there
        // count for every literal, which is correct: the dispatcher already
        // proved that body only runs for its own branch, and any field it
        // reads is genuinely consumed.
        const chars = body.split("");
        for (const region of regions) {
          for (let i = region.start; i <= Math.min(region.end, chars.length - 1); i++) {
            chars[i] = " ";
          }
        }
        if (fieldRe.test(chars.join(""))) readUnconditionally = true;

        for (const region of regions) {
          if (!fieldRe.test(body.slice(region.start, region.end + 1))) continue;
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
  }

  return violations;
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
});
