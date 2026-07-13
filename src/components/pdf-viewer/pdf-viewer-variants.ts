/**
 * pdfViewerVariants — pure CVA variant functions for MosaicPdfViewer.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Frame container — hosts the iframe + the loading/error overlay. */
export const pdfViewerFrameVariants = cva([
  "relative min-h-64 w-full flex-1 overflow-hidden rounded-lg border border-border bg-card",
]);

/** Loading / error status region rendered over the frame. */
export const pdfViewerStatusVariants = cva(
  ["flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm"],
  {
    variants: {
      tone: {
        loading: "text-muted-foreground",
        error: "text-destructive",
      },
    },
    defaultVariants: {
      tone: "loading",
    },
  },
);

/** Toolbar icon buttons — page navigation + zoom controls. */
export const pdfViewerToolbarButtonVariants = cva([
  "inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-border text-sm",
  "transition-colors hover:bg-accent/50 disabled:opacity-50 disabled:hover:bg-transparent",
]);
