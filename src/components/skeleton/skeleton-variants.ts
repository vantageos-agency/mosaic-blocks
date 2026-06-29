/**
 * skeletonVariants — pure CVA variant function for MosaicSkeleton.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React
 * (which is imported in MosaicSkeleton.tsx but not here).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const skeletonVariants = cva(
  // Base: animate-pulse + muted background token
  ["animate-pulse", "bg-muted"],
  {
    variants: {
      variant: {
        /** Rounded block — generic rectangular placeholder (cards, images, sections) */
        default: "rounded-md",
        /** Text line — h-4 rounded, for single/multi-line text placeholders */
        text: "h-4 rounded",
        /** Circle — rounded-full aspect-square, for avatars and icons */
        circle: "rounded-full aspect-square",
        /** Button-shaped — h-9 rounded-md, mirrors MosaicButton default size */
        button: "h-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
