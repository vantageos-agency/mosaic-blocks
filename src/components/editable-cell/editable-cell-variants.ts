/**
 * editableCellVariants — pure CVA variant function for MosaicEditableCell.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const editableCellVariants = cva(
  ["inline-flex w-full items-center rounded-sm px-1.5 py-1 text-sm"],
  {
    variants: {
      disabled: {
        true: "cursor-not-allowed text-muted-foreground",
        false: "cursor-text hover:bg-accent/50",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);
