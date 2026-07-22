/**
 * calloutVariants — pure CVA variant function for MosaicCallout.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const calloutVariants = cva(
  ["flex items-start gap-2.5", "rounded-md border", "px-3 py-2.5", "text-sm"],
  {
    variants: {
      variant: {
        info: "border-info-500/30 bg-info-50 text-foreground",
        warning: "border-warning-500/30 bg-warning-50 text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);
