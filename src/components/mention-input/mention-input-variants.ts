/**
 * mentionInputVariants — pure CVA variant functions for MosaicMentionInput.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React or
 * @base-ui/react.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** The text input itself. */
export const mentionInputFieldVariants = cva([
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
  "outline-none transition-colors placeholder:text-muted-foreground",
  "focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
]);

/** The mentionable-entries list surface. */
export const mentionListVariants = cva(["m-0 max-h-64 list-none overflow-y-auto p-1"]);

/** A single entry row inside the list — active variant highlights the roving selection. */
export const mentionListItemVariants = cva(
  ["cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none"],
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
