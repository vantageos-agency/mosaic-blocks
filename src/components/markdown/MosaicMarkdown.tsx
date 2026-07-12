/**
 * MosaicMarkdown — presentational, dependency-free markdown renderer
 *
 * Renders a subset of markdown (headings, paragraphs, ordered/unordered
 * lists, links, bold/italic, inline code, fenced code blocks, tables,
 * blockquotes, horizontal rules) straight from a `content: string` prop.
 *
 * SECURITY — non-negotiable: `content` is assumed to come from an untrusted
 * source (an LLM's own generated text). This component NEVER parses raw HTML
 * out of that string and NEVER uses `dangerouslySetInnerHTML`: every markdown
 * token is turned into React elements built from parsed TEXT, so anything
 * that looks like an HTML tag (`<script>…</script>`, `<img onerror=…>`) is
 * rendered as an inert text node, never as an active DOM element. Link
 * `href`s are scheme-checked (`http:`/`https:`/`mailto:`/relative only), after
 * every ASCII control character is stripped from the whole string (not just
 * the edges) so a scheme obfuscated with an internal control character (e.g.
 * a TAB inserted mid-`javascript:`) cannot slip past as scheme-less —
 * `javascript:`/`data:` and any other scheme are rejected and the link
 * degrades to its plain label text. Every external link renders with
 * `rel="noopener noreferrer"` and `target="_blank"`.
 *
 * DEPENDENCY POLICY: this library's `dependencies` are currently limited to
 * `@base-ui/react` and `class-variance-authority`. A full markdown renderer
 * (react-markdown, marked, remark, streamdown…) was deliberately NOT added
 * — none of them are declared here, in `dependencies` or otherwise. Instead
 * this file implements a minimal, dependency-free block + inline parser
 * covering the required subset. See this package's PR description for the
 * explicit statement of this choice.
 *
 * Code blocks: no syntax highlighter is bundled (would be a hidden
 * dependency and/or heavy runtime cost). The optional `renderCodeBlock` prop
 * is the host's extension point — pass a highlighter of your choice
 * (Shiki, Prism, etc.) and this component defers to it entirely; omit it and
 * a plain `<pre><code>` block is rendered.
 *
 * No "use client" — prepend-use-client.mjs adds it to dist. Presentational:
 * zero network calls, zero side effects beyond rendering.
 *
 * @example
 * <MosaicMarkdown content={"# Title\n\nSome **bold** text with a [link](https://example.com)."} />
 *
 * @example
 * // Host-provided syntax highlighting
 * <MosaicMarkdown
 *   content={agentReply}
 *   renderCodeBlock={({ language, code }) => <MyHighlighter language={language}>{code}</MyHighlighter>}
 * />
 */

import type * as React from "react";
import {
  markdownBlockquoteVariants,
  markdownCodeBlockVariants,
  markdownEmphasisVariants,
  markdownHeadingVariants,
  markdownHrVariants,
  markdownInlineCodeVariants,
  markdownLinkVariants,
  markdownListItemVariants,
  markdownListVariants,
  markdownParagraphVariants,
  markdownRootVariants,
  markdownTableCellVariants,
  markdownTableVariants,
  markdownTableWrapperVariants,
} from "./markdown-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Allow-list link scheme check. `javascript:`, `data:`, `vbscript:` and any
 * other active/opaque scheme are rejected — only `http:`, `https:`,
 * `mailto:`, or a scheme-less (relative/anchor) URL are considered safe.
 *
 * This guarantee holds on its own, independent of any host-runtime behavior:
 * every ASCII control character (`\x00`-`\x20`, which includes tab, newline,
 * and carriage return) is stripped from the ENTIRE string — not just the
 * leading/trailing edges — before the scheme is matched. Without this, a
 * scheme obfuscated with an internal control character (e.g. `java` + TAB +
 * `script:...`) would fail the scheme regex, get treated as scheme-less, and
 * be returned unmodified; only React's own href-sanitization would then
 * block it at render time — a filter this component must not rely on.
 */
function sanitizeHref(rawHref: string): string | null {
  // Strip every ASCII control character (\x00-\x20) anywhere in the string,
  // not merely at the edges: trim() alone only removes edge whitespace and
  // leaves an internally-inserted control character (e.g. a TAB placed
  // mid-scheme) untouched — exactly the obfuscation vector this guards
  // against.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — stripping control chars is the security fix itself
  const href = rawHref.replace(/[\x00-\x20]/g, "");
  if (!href) return null;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(href);
  if (!schemeMatch) return href; // scheme-less: relative path, anchor, etc.
  const scheme = schemeMatch[1].toLowerCase();
  return scheme === "http" || scheme === "https" || scheme === "mailto" ? href : null;
}

// ── Inline parsing ──────────────────────────────────────────────────────────

type IdSource = { next: () => number };

function makeIdSource(): IdSource {
  let current = 0;
  return {
    next: () => {
      current += 1;
      return current;
    },
  };
}

/**
 * Turns a run of inline markdown text into React nodes. Recognizes, in
 * priority order: inline code (`` `code` ``), links (`[label](href)`), bold
 * (`**text**`), italic (`*text*`). Everything else — including anything that
 * LOOKS like an HTML tag — is treated as plain text and never parsed as
 * markup, so it can never execute.
 */
function parseInline(text: string, ids: IdSource): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer.length > 0) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);

    const codeMatch = /^`([^`]+)`/.exec(rest);
    if (codeMatch) {
      flush();
      nodes.push(
        <code key={ids.next()} className={markdownInlineCodeVariants()}>
          {codeMatch[1]}
        </code>,
      );
      i += codeMatch[0].length;
      continue;
    }

    const linkMatch = /^\[([^\]]*)\]\(((?:[^()]|\([^()]*\))*)\)/.exec(rest);
    if (linkMatch) {
      flush();
      const label = linkMatch[1];
      const safeHref = sanitizeHref(linkMatch[2]);
      if (safeHref) {
        nodes.push(
          <a
            key={ids.next()}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className={markdownLinkVariants()}
          >
            {parseInline(label, ids)}
          </a>,
        );
      } else {
        nodes.push(...parseInline(label, ids));
      }
      i += linkMatch[0].length;
      continue;
    }

    const boldMatch = /^\*\*([^*]+)\*\*/.exec(rest);
    if (boldMatch) {
      flush();
      nodes.push(
        <strong key={ids.next()} className={markdownEmphasisVariants({ tone: "strong" })}>
          {parseInline(boldMatch[1], ids)}
        </strong>,
      );
      i += boldMatch[0].length;
      continue;
    }

    const italicMatch = /^\*([^*]+)\*/.exec(rest);
    if (italicMatch) {
      flush();
      nodes.push(
        <em key={ids.next()} className={markdownEmphasisVariants({ tone: "emphasis" })}>
          {parseInline(italicMatch[1], ids)}
        </em>,
      );
      i += italicMatch[0].length;
      continue;
    }

    buffer += text[i];
    i += 1;
  }

  flush();
  return nodes;
}

// ── Block parsing ─────────────────────────────────────────────────────────────

type Block =
  | { id: number; kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { id: number; kind: "paragraph"; text: string }
  | { id: number; kind: "list"; ordered: boolean; items: { id: number; text: string }[] }
  | { id: number; kind: "blockquote"; text: string }
  | { id: number; kind: "hr" }
  | { id: number; kind: "code"; language: string | undefined; code: string }
  | { id: number; kind: "table"; header: string[]; rows: string[][] };

const FENCE_RE = /^```(\S*)\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const HR_RE = /^(-{3,}|\*{3,}|_{3,})$/;
const UNORDERED_ITEM_RE = /^[-*+]\s+/;
const ORDERED_ITEM_RE = /^\d+\.\s+/;
const BLOCKQUOTE_LINE_RE = /^>\s?/;
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseBlocks(content: string): Block[] {
  const lines = content.split(/\r?\n/);
  const blocks: Block[] = [];
  let id = 0;
  const nextId = () => {
    id += 1;
    return id;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const fenceMatch = FENCE_RE.exec(line);
    if (fenceMatch) {
      const language = fenceMatch[1] || undefined;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({ id: nextId(), kind: "code", language, code: codeLines.join("\n") });
      continue;
    }

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      blocks.push({
        id: nextId(),
        kind: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    if (HR_RE.test(line.trim())) {
      blocks.push({ id: nextId(), kind: "hr" });
      i += 1;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[i + 1])) {
      const header = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ id: nextId(), kind: "table", header, rows });
      continue;
    }

    if (BLOCKQUOTE_LINE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && BLOCKQUOTE_LINE_RE.test(lines[i])) {
        quoteLines.push(lines[i].replace(BLOCKQUOTE_LINE_RE, ""));
        i += 1;
      }
      blocks.push({ id: nextId(), kind: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (UNORDERED_ITEM_RE.test(line)) {
      const items: { id: number; text: string }[] = [];
      while (i < lines.length && UNORDERED_ITEM_RE.test(lines[i])) {
        items.push({ id: nextId(), text: lines[i].replace(UNORDERED_ITEM_RE, "") });
        i += 1;
      }
      blocks.push({ id: nextId(), kind: "list", ordered: false, items });
      continue;
    }

    if (ORDERED_ITEM_RE.test(line)) {
      const items: { id: number; text: string }[] = [];
      while (i < lines.length && ORDERED_ITEM_RE.test(lines[i])) {
        items.push({ id: nextId(), text: lines[i].replace(ORDERED_ITEM_RE, "") });
        i += 1;
      }
      blocks.push({ id: nextId(), kind: "list", ordered: true, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE_RE.test(lines[i]) &&
      !HEADING_RE.test(lines[i]) &&
      !UNORDERED_ITEM_RE.test(lines[i]) &&
      !ORDERED_ITEM_RE.test(lines[i]) &&
      !BLOCKQUOTE_LINE_RE.test(lines[i]) &&
      !HR_RE.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ id: nextId(), kind: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMarkdownProps {
  /**
   * Markdown source to render. Treated as UNTRUSTED (e.g. straight from an
   * LLM reply): no raw HTML in this string is ever parsed as active markup.
   */
  content: string;
  /**
   * Extension point for fenced-code-block rendering (e.g. host-side syntax
   * highlighting). When omitted, code renders in a plain `<pre><code>` block
   * with no highlighting and no bundled highlighter dependency.
   */
  renderCodeBlock?: (props: { language: string | undefined; code: string }) => React.ReactNode;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMarkdown — production markdown-rendering atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: parses `content` into a minimal block/inline AST and
 * renders it as React elements. No network call, no raw-HTML injection.
 */
export function MosaicMarkdown({ content, renderCodeBlock, className, ref }: MosaicMarkdownProps) {
  const blocks = parseBlocks(content);
  const ids = makeIdSource();

  return (
    <div ref={ref} data-slot="markdown" className={cn(markdownRootVariants(), className)}>
      {blocks.map((block) => {
        if (block.kind === "heading") {
          const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
          return (
            <HeadingTag key={block.id} className={markdownHeadingVariants({ level: block.level })}>
              {parseInline(block.text, ids)}
            </HeadingTag>
          );
        }

        if (block.kind === "paragraph") {
          return (
            <p key={block.id} className={markdownParagraphVariants()}>
              {parseInline(block.text, ids)}
            </p>
          );
        }

        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={block.id} className={markdownListVariants({ ordered: block.ordered })}>
              {block.items.map((item) => (
                <li key={item.id} className={markdownListItemVariants()}>
                  {parseInline(item.text, ids)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.kind === "blockquote") {
          return (
            <blockquote key={block.id} className={markdownBlockquoteVariants()}>
              {parseInline(block.text, ids)}
            </blockquote>
          );
        }

        if (block.kind === "hr") {
          return <hr key={block.id} className={markdownHrVariants()} />;
        }

        if (block.kind === "code") {
          if (renderCodeBlock) {
            return (
              <div key={block.id}>
                {renderCodeBlock({ language: block.language, code: block.code })}
              </div>
            );
          }
          return (
            <pre
              key={block.id}
              data-slot="markdown-code-block"
              {...(block.language ? { "data-language": block.language } : {})}
              className={markdownCodeBlockVariants()}
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        // table
        return (
          <div key={block.id} className={markdownTableWrapperVariants()}>
            <table className={markdownTableVariants()}>
              <thead>
                <tr>
                  {block.header.map((cell) => (
                    <th key={ids.next()} className={markdownTableCellVariants({ header: true })}>
                      {parseInline(cell, ids)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={ids.next()}>
                    {row.map((cell) => (
                      <td key={ids.next()} className={markdownTableCellVariants({ header: false })}>
                        {parseInline(cell, ids)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

MosaicMarkdown.displayName = "MosaicMarkdown";
