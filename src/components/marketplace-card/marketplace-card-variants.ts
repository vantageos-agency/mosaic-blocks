/**
 * marketplaceCardVariants — pure CVA variant function for MosaicMarketplaceCard.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const marketplaceCardVariants = cva(
  ["rounded-xl border border-border bg-card p-4 transition-shadow", "hover:shadow-md"],
  {
    variants: {
      variant: {
        default: "flex flex-col gap-3",
        compact: "flex flex-row items-center gap-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
