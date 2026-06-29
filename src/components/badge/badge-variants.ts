/**
 * badgeVariants — pure CVA variant function for MosaicBadge.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React
 * (which is imported in MosaicBadge.tsx but not here).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-full border border-transparent",
    "px-2.5 py-0.5",
    "text-xs font-semibold",
    "select-none whitespace-nowrap",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive: "bg-destructive text-destructive-foreground border-transparent",
        outline: "bg-background text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
