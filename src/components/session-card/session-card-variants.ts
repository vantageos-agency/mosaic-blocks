/**
 * sessionCardVariants — pure CVA variant functions for MosaicSessionCard.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root card container variants */
export const sessionCardVariants = cva(
  [
    "rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
  {
    variants: {
      variant: {
        default: "p-5",
        compact: "flex items-center justify-between gap-3 p-3",
      },
      selectable: {
        true: "cursor-pointer hover:shadow-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      selectable: false,
    },
  },
);
