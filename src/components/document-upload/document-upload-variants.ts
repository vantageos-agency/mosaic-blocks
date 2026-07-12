/**
 * documentUploadVariants — pure CVA variant functions for MosaicDocumentUpload.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Drop-zone container variants — idle vs. drag-over. */
export const documentUploadDropZoneVariants = cva(
  [
    "flex flex-col items-center justify-center text-center",
    "rounded-lg border-2 border-dashed p-8 gap-2",
    "transition-colors cursor-pointer",
  ],
  {
    variants: {
      dragActive: {
        true: "border-ring bg-accent/40",
        false: "border-border hover:border-ring/50",
      },
    },
    defaultVariants: {
      dragActive: false,
    },
  },
);

/** Per-file row container variants by upload status. */
export const documentUploadFileRowVariants = cva(
  ["flex items-start gap-3 rounded-lg border p-4 transition-colors"],
  {
    variants: {
      status: {
        uploading: "border-border bg-card",
        success: "border-border bg-card",
        error: "border-destructive/40 bg-destructive/5",
      },
    },
    defaultVariants: {
      status: "uploading",
    },
  },
);

/** Status badge text variants by upload status. */
export const documentUploadStatusLabelVariants = cva(["text-xs font-medium"], {
  variants: {
    status: {
      uploading: "text-muted-foreground",
      success: "text-foreground",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    status: "uploading",
  },
});

/** Progress bar track variants (uploading state only). */
export const documentUploadProgressTrackVariants = cva(
  ["h-1.5 w-full overflow-hidden rounded-full bg-muted"],
  {
    variants: {},
    defaultVariants: {},
  },
);

/** Progress bar fill variants. */
export const documentUploadProgressFillVariants = cva(
  ["h-full rounded-full bg-foreground transition-[width]"],
  {
    variants: {},
    defaultVariants: {},
  },
);
