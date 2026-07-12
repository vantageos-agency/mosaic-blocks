/**
 * urlScraperVariants — pure CVA variant functions for MosaicUrlScraper.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** URL input variants — normal vs. locally-invalid. */
export const urlScraperInputVariants = cva(
  [
    "min-h-9 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none",
    "transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  ],
  {
    variants: {
      invalid: {
        true: "border-destructive",
        false: "border-border",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

/** Inline message text variants by tone. */
export const urlScraperMessageVariants = cva(["text-sm"], {
  variants: {
    tone: {
      error: "text-destructive",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    tone: "muted",
  },
});

/** Loading / success / error card container variants. */
export const urlScraperCardVariants = cva(["flex flex-col gap-2 rounded-lg border p-4"], {
  variants: {
    tone: {
      neutral: "border-border bg-card",
      error: "border-destructive/40 bg-destructive/5",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});
