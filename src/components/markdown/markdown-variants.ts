/**
 * markdownVariants — pure CVA variant functions for MosaicMarkdown.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root container — resets first/last child margins so the block sits flush. */
export const markdownRootVariants = cva([
  "min-w-0 text-[15px] leading-6 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
]);

/** Heading variants, by level 1-6. */
export const markdownHeadingVariants = cva(["font-medium tracking-normal text-foreground"], {
  variants: {
    level: {
      1: "mt-7 mb-4 text-xl leading-7",
      2: "mt-6 mb-3 text-base leading-6",
      3: "mt-5 mb-2 text-sm leading-6",
      4: "mt-4 mb-2 text-sm leading-6",
      5: "mt-4 mb-2 text-xs leading-5",
      6: "mt-4 mb-2 text-xs leading-5 text-muted-foreground",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

/** Paragraph text. */
export const markdownParagraphVariants = cva(["mb-3 text-[15px] leading-6 text-foreground"]);

/** Ordered/unordered list container, by ordered flag. */
export const markdownListVariants = cva(["mb-3 flex flex-col gap-1.5 pl-8 text-[15px] leading-6"], {
  variants: {
    ordered: {
      true: "list-decimal",
      false: "list-disc",
    },
  },
  defaultVariants: {
    ordered: false,
  },
});

/** List item. */
export const markdownListItemVariants = cva(["pl-1 text-[15px] leading-6 text-foreground"]);

/** Blockquote. */
export const markdownBlockquoteVariants = cva([
  "mb-3 border-l-2 border-border pl-3 text-[15px] leading-6 text-muted-foreground",
]);

/** Horizontal rule. */
export const markdownHrVariants = cva(["my-4 border-border/70"]);

/** Inline emphasis (bold / italic). */
export const markdownEmphasisVariants = cva([], {
  variants: {
    tone: {
      strong: "font-medium text-foreground",
      emphasis: "italic",
    },
  },
});

/** Inline code span. */
export const markdownInlineCodeVariants = cva([
  "rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[0.92em] text-foreground",
]);

/** Fenced code block container. */
export const markdownCodeBlockVariants = cva([
  "mb-3 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[0.92em] text-foreground",
]);

/** External link. */
export const markdownLinkVariants = cva([
  "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground",
]);

/** Table wrapper (scroll container). */
export const markdownTableWrapperVariants = cva(["mb-3 w-full overflow-x-auto"]);

/** Table element. */
export const markdownTableVariants = cva(["w-full border-collapse text-[15px] leading-6"]);

/** Table cell, by header flag + column alignment. */
export const markdownTableCellVariants = cva(["border border-border px-3 py-1.5"], {
  variants: {
    header: {
      true: "bg-muted/40 font-medium text-foreground",
      false: "text-foreground",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    header: false,
    align: "left",
  },
});
