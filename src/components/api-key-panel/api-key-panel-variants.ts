/**
 * apiKeyPanelVariants — pure CVA variant functions for MosaicApiKeyPanel.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Per-provider tab button variants — active vs. inactive. */
export const apiKeyPanelTabVariants = cva(
  [
    "flex-1 cursor-pointer rounded-md border px-2.5 py-1.5 text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
  {
    variants: {
      active: {
        true: "border-ring bg-accent text-foreground",
        false: "border-transparent text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

/** Masked key input variants — normal vs. invalid (status === "invalid"). */
export const apiKeyPanelInputVariants = cva(
  [
    "min-h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none",
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
export const apiKeyPanelMessageVariants = cva(["text-sm"], {
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
