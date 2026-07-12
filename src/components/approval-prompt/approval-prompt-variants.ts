/**
 * approvalPromptVariants — pure CVA variant functions for MosaicApprovalPrompt.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root card container variants by status. */
export const approvalPromptCardVariants = cva(["flex flex-col gap-3 rounded-lg border p-4"], {
  variants: {
    tone: {
      pending: "border-border bg-card",
      approved: "border-border bg-card",
      denied: "border-destructive/40 bg-destructive/5",
      error: "border-destructive/40 bg-destructive/5",
    },
  },
  defaultVariants: {
    tone: "pending",
  },
});

/** Decision badge / message text variants by tone. */
export const approvalPromptMessageVariants = cva(["text-sm"], {
  variants: {
    tone: {
      muted: "text-muted-foreground",
      approved: "text-foreground",
      denied: "text-destructive",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    tone: "muted",
  },
});

/** Approve / deny action button variants. */
export const approvalPromptButtonVariants = cva(
  [
    "min-h-9 inline-flex items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors disabled:opacity-50",
  ],
  {
    variants: {
      intent: {
        approve: "border-border hover:bg-accent/50",
        deny: "border-destructive/40 text-destructive hover:bg-destructive/5",
      },
    },
  },
);
