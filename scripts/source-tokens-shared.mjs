/**
 * source-tokens-shared.mjs — the ONE reader of string/comment/regex tokens for
 * every script in this package that has to look inside JS/TS/TSX source text
 * (task k17dchnw3f2fqgjeqw10mn9b9h8jvfcm; first written inside
 * scripts/no-hardcoded-words-guard.mjs under task k171ya0nn2244kqjvv63fxq5558jjkyy).
 *
 * WHY A PARSE. A hand-written scanner decides what is a string by looking at
 * quote characters. A quote character is a delimiter only in code. An
 * apostrophe in a comment (`// the column's width`) or a quote inside a regex
 * literal (`/'/`) pairs with the NEXT quote below it and forms a fake string
 * spanning real code (a false positive), and every real string between two
 * such apostrophes is swallowed into the fake pair and never seen (a false
 * negative). Pairing quotes across text is the single-formulation defect, so
 * the text is read from the TOKENS of a full TypeScript parse
 * (`typescript` is a devDependency of this package; no new dependency). A full
 * parse, not the bare scanner: the bare scanner cannot tell a regex literal
 * from a division.
 *
 * DOMAIN, derived from `ts.SyntaxKind` (typescript's own enum), never from
 * memory: every TOKEN kind whose name says it carries text is classified
 * below, and a kind that is neither classified nor named by the caller as
 * ignorable REFUSES the read (SourceReadRefusal, the kind named) — never a
 * silent skip.
 *   - text-bearing, returned as literals: StringLiteral (single- and
 *     double-quoted), NoSubstitutionTemplateLiteral, and the static parts of a
 *     template with substitutions (TemplateHead / TemplateMiddle /
 *     TemplateTail) of a TemplateExpression or of a TemplateLiteralType.
 *   - never contribute text, never pair quotes: RegularExpressionLiteral
 *     (returned as `regexes`), and comments (SingleLineCommentTrivia,
 *     MultiLineCommentTrivia — a JSDoc block is a multi-line comment —
 *     returned as `comments`).
 *   - wordless by definition: NumericLiteral, BigIntLiteral.
 *   - REFUSED if met, unless the caller lists the kind in `ignoreKinds`: every
 *     other token kind the derivation returns — today JsxText,
 *     JsxTextAllWhiteSpaces, JSDocCommentTextToken, NonTextFileMarkerTrivia.
 *     A caller that reads TSX SOURCE (where JsxText is ordinary) passes
 *     `ignoreKinds: JSX_TEXT_KINDS`: it declares, at its own call site, that it
 *     judges string literals only and that JSX text is neither a string nor
 *     code for its purposes. The ranges are returned as `texts` so the caller
 *     can blank them.
 * COMPLETENESS PROOF: every non-whitespace character of the text must lie
 * inside a token or a comment; a character in neither is text this reader did
 * not see, and that is a refusal, never a pass.
 *
 * FAIL-CLOSED: a parse error, a missing `parseDiagnostics`, an unclassified
 * text-bearing kind, a template part outside a template, an unread character,
 * an unknown file extension — each throws SourceReadRefusal naming it. No
 * return of an empty result stands in for "could not read".
 */

import { createRequire } from "node:module";

/** Thrown whenever the reader cannot read the text token by token. `.what` is the reason. */
export class SourceReadRefusal extends Error {
  /** @param {string} what */
  constructor(what) {
    super(what);
    this.name = "SourceReadRefusal";
    this.what = what;
  }
}

/** @param {string} what */
function refuse(what) {
  throw new SourceReadRefusal(what);
}

const TEXT_BEARING_STRING_KINDS = ["StringLiteral", "NoSubstitutionTemplateLiteral"];
const TEXT_BEARING_TEMPLATE_PART_KINDS = ["TemplateHead", "TemplateMiddle", "TemplateTail"];
const NEVER_TEXT_KINDS = ["RegularExpressionLiteral"];
const WORDLESS_LITERAL_KINDS = ["NumericLiteral", "BigIntLiteral"];

/**
 * The JSX text token kinds. A caller reading TSX source and judging string
 * literals only passes these as `ignoreKinds` (see the header).
 */
export const JSX_TEXT_KINDS = ["JsxText", "JsxTextAllWhiteSpaces"];

let cachedTs;
/**
 * Load the `typescript` package synchronously (the scanners that call this are
 * synchronous). A missing package is a refusal, never a fallback to scanning
 * quote characters in raw text.
 * @returns {typeof import("typescript")}
 */
export function loadTypeScript() {
  if (cachedTs) return cachedTs;
  try {
    cachedTs = createRequire(import.meta.url)("typescript");
  } catch (err) {
    refuse(
      `cannot load the \`typescript\` parser (run \`pnpm install\`); refusing to fall back to scanning quote characters in raw text. Underlying error: ${err.message}`,
    );
  }
  return cachedTs;
}

/**
 * Derive, from the enum itself, the token kinds whose NAME says they can carry
 * text and that this module does not classify; refuse if a classified name is
 * not a member of the enum.
 * @param {typeof import("typescript")} tsApi
 * @returns {Map<number, string>} kind -> name, for every token kind that is NOT classified
 */
export function deriveUnclassifiedTextKinds(tsApi) {
  const classified = new Set([
    ...TEXT_BEARING_STRING_KINDS,
    ...TEXT_BEARING_TEMPLATE_PART_KINDS,
    ...NEVER_TEXT_KINDS,
    ...WORDLESS_LITERAL_KINDS,
  ]);
  for (const name of classified) {
    if (typeof tsApi.SyntaxKind[name] !== "number")
      refuse(
        `declares token kind "${name}" but typescript's SyntaxKind has no such member (typescript ${tsApi.version})`,
      );
  }
  const unclassified = new Map();
  for (const name of Object.keys(tsApi.SyntaxKind)) {
    const kind = tsApi.SyntaxKind[name];
    if (typeof kind !== "number" || /^(First|Last)/.test(name)) continue;
    if (kind >= tsApi.SyntaxKind.FirstNode) continue; // a node, not a token
    if (!/Literal|Template|Text/.test(name)) continue;
    if (classified.has(name)) continue;
    unclassified.set(kind, name);
  }
  return unclassified;
}

/**
 * The script kind a file name states. An extension this module has no kind for
 * is a refusal: guessing a grammar would mis-parse silently.
 * @param {typeof import("typescript")} tsApi
 * @param {string} fileName
 */
function scriptKindFor(tsApi, fileName) {
  const ext = /\.([a-z]+)$/i.exec(fileName)?.[1]?.toLowerCase();
  switch (ext) {
    case "ts":
    case "mts":
    case "cts":
      return tsApi.ScriptKind.TS;
    case "tsx":
      return tsApi.ScriptKind.TSX;
    case "js":
    case "mjs":
    case "cjs":
      return tsApi.ScriptKind.JS;
    case "jsx":
      return tsApi.ScriptKind.JSX;
    default:
      return refuse(
        `has no script kind for "${fileName}" (extension "${ext ?? ""}"); known: ts mts cts tsx js mjs cjs jsx`,
      );
  }
}

/**
 * @typedef {object} SourceLiteral
 * @property {"string"|"template"} kind  "string": StringLiteral or NoSubstitutionTemplateLiteral
 *   (one part, the text between the delimiters); "template": a template with
 *   substitutions (one part per static segment, in order)
 * @property {number} start  offset of the opening delimiter (the quote or backtick)
 * @property {number} end    offset just past the closing delimiter
 * @property {Array<[number, number]>} parts  [start, end) of each static text segment
 * @property {import("typescript").Node} node  the token (string) or the template node (template)
 */

/**
 * Parse `text` and return its string-bearing tokens, comments, regex literals
 * and ignored text tokens, all as offsets into `text`.
 *
 * `literals` is in visit order: a template is listed BEFORE the literals
 * nested in its substitutions. Sort by `end` for the reverse (post-order).
 *
 * @param {typeof import("typescript")} tsApi
 * @param {string} text
 * @param {{ fileName: string, label?: string, ignoreKinds?: string[] }} options
 *   `label` names the text in refusals (default: fileName).
 * @returns {{
 *   sourceFile: import("typescript").SourceFile,
 *   literals: SourceLiteral[],
 *   comments: Array<[number, number]>,
 *   regexes: Array<[number, number]>,
 *   texts: Array<[number, number]>,
 * }}
 * @throws {SourceReadRefusal}
 */
export function readSourceTokens(tsApi, text, options) {
  const { fileName, label = fileName, ignoreKinds = [] } = options;
  const { SyntaxKind } = tsApi;
  const sf = tsApi.createSourceFile(
    fileName,
    text,
    tsApi.ScriptTarget.Latest,
    /* setParentNodes */ true,
    scriptKindFor(tsApi, fileName),
  );
  const parseErrors = sf.parseDiagnostics;
  if (!Array.isArray(parseErrors))
    refuse(
      `cannot read typescript's parse diagnostics (typescript ${tsApi.version} exposes no parseDiagnostics) so it cannot tell a parsed bundle from a mis-parsed one`,
    );
  if (parseErrors.length > 0) {
    const first = parseErrors[0];
    const where = sf.getLineAndCharacterOfPosition(first.start ?? 0);
    refuse(
      `could not parse ${label} (${parseErrors.length} syntax error(s); first at line ${where.line + 1}, column ${where.character + 1}: ${tsApi.flattenDiagnosticMessageText(first.messageText, " ")})`,
    );
  }

  const unclassifiedTextKinds = deriveUnclassifiedTextKinds(tsApi);
  // kind number -> its own name. `SyntaxKind[n]` is NOT usable for this: the
  // enum carries range aliases (FirstTemplateToken, LastLiteralToken, ...) that
  // share a number with a real kind, and the reverse lookup returns the alias.
  const kindOf = (names) => new Set(names.map((n) => SyntaxKind[n]));
  const stringKinds = kindOf(TEXT_BEARING_STRING_KINDS);
  const templatePartKinds = kindOf(TEXT_BEARING_TEMPLATE_PART_KINDS);
  const neverTextKinds = kindOf(NEVER_TEXT_KINDS);
  const ignoredKinds = new Set();
  for (const name of ignoreKinds) {
    const kind = SyntaxKind[name];
    if (typeof kind !== "number" || !unclassifiedTextKinds.has(kind))
      refuse(
        `was told to ignore token kind "${name}", which is not an unclassified text-bearing token kind of typescript ${tsApi.version}`,
      );
    ignoredKinds.add(kind);
  }
  // Nodes that own template parts: TemplateExpression (`a${b}c`) and
  // TemplateLiteralType (a type-level `a${B}c`). Both carry `head` and
  // `templateSpans[].literal`. A TemplateLiteralType kind absent from this
  // typescript simply cannot occur.
  const templateOwnerKinds = new Set(
    ["TemplateExpression", "TemplateLiteralType"]
      .map((n) => SyntaxKind[n])
      .filter((k) => typeof k === "number"),
  );

  const literals = [];
  const commentRanges = new Map(); // pos -> end
  const tokenRanges = []; // every token's [start, end)
  const regexes = [];
  const texts = [];
  const handledTemplateParts = new Set();

  const addComments = (ranges) => {
    for (const r of ranges ?? []) commentRanges.set(r.pos, r.end);
  };

  const visit = (node) => {
    if (node.kind >= SyntaxKind.FirstNode) {
      if (node.kind >= SyntaxKind.FirstJSDocNode && node.kind <= SyntaxKind.LastJSDocNode) return; // comment text, covered via trivia
      if (templateOwnerKinds.has(node.kind)) {
        const partNodes = [node.head, ...node.templateSpans.map((s) => s.literal)];
        const parts = [];
        for (const part of partNodes) {
          handledTemplateParts.add(part);
          const lastIsTail = part.kind === SyntaxKind.TemplateTail;
          // head: `...${  middle: }...${  tail: }...`
          parts.push([part.getStart(sf) + 1, part.end - (lastIsTail ? 1 : 2)]);
        }
        literals.push({
          kind: "template",
          start: node.head.getStart(sf),
          end: node.end,
          parts,
          node,
        });
      }
      for (const child of node.getChildren(sf)) visit(child);
      return;
    }
    // ---- a token ----
    const isIgnoredText = ignoredKinds.has(node.kind);
    // A JSX text token cannot contain a comment, though the scanner reads `//`
    // at its start as one: its "comments" are text.
    if (!isIgnoredText) {
      addComments(tsApi.getLeadingCommentRanges(text, node.pos));
      addComments(tsApi.getTrailingCommentRanges(text, node.pos));
    }
    const start = node.getStart(sf);
    if (node.kind === SyntaxKind.EndOfFileToken) return;
    tokenRanges.push([start, node.end]);
    if (isIgnoredText) {
      texts.push([start, node.end]);
      return;
    }
    if (neverTextKinds.has(node.kind)) {
      regexes.push([start, node.end]);
      return;
    }
    if (stringKinds.has(node.kind)) {
      literals.push({
        kind: "string",
        start,
        end: node.end,
        parts: [[start + 1, node.end - 1]],
        node,
      });
      return;
    }
    if (templatePartKinds.has(node.kind)) {
      if (!handledTemplateParts.has(node))
        refuse(`met a template-part token (kind ${node.kind}) outside a template at offset ${start}`);
      return;
    }
    if (unclassifiedTextKinds.has(node.kind))
      refuse(
        `met a text-bearing token kind it does not classify: ${unclassifiedTextKinds.get(node.kind)} at offset ${start}`,
      );
  };
  visit(sf);

  // COMPLETENESS PROOF: every non-whitespace character of the text must be
  // inside a token or a comment. A character in neither is text this reader
  // did not see; that is a refusal, never a pass.
  const covered = [...tokenRanges, ...commentRanges].sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  for (const [s, e] of covered) {
    if (s > cursor && /\S/.test(text.slice(cursor, s)))
      refuse(`left unread text between offsets ${cursor} and ${s} (neither a token nor a comment)`);
    if (e > cursor) cursor = e;
  }
  if (/\S/.test(text.slice(cursor)))
    refuse(`left unread text after offset ${cursor} (neither a token nor a comment)`);

  return {
    sourceFile: sf,
    literals,
    comments: [...commentRanges.entries()],
    regexes,
    texts,
  };
}

/**
 * Replace every character of each range with a space, keeping line breaks, so
 * the result has the SAME length and every offset and line number stays valid.
 * Overlapping or nested ranges are tolerated (the earlier range wins).
 * @param {string} text
 * @param {Array<[number, number]>} ranges
 * @param {{ keepCarriageReturn?: boolean }} [options] keep `\r` too (default: only `\n` survives)
 * @returns {string}
 */
export function blankRanges(text, ranges, options = {}) {
  const keep = options.keepCarriageReturn ? /[^\n\r]/g : /[^\n]/g;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  let out = "";
  let at = 0;
  for (const [s, e] of sorted) {
    if (s < at) continue;
    out += text.slice(at, s) + text.slice(s, e).replace(keep, " ");
    at = e;
  }
  return out + text.slice(at);
}
