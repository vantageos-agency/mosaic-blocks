/**
 * tagInputVariants — pure CVA variant functions for MosaicTagInput.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root container — wraps tags + input, bordered like a text field. */
export const tagInputRootVariants = cva([
  "flex w-full flex-wrap items-center gap-1.5 rounded-md border border-border",
  "bg-background px-2 py-1.5 text-sm shadow-xs",
  "focus-within:ring-ring focus-within:ring-[3px]",
  "has-[input[aria-disabled='true']]:cursor-not-allowed has-[input[aria-disabled='true']]:opacity-50",
]);

/** One tag chip. */
export const tagInputTagVariants = cva([
  "inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5",
  "text-sm text-accent-foreground",
]);

/** Remove button inside a tag chip. */
export const tagInputRemoveButtonVariants = cva([
  "inline-flex size-4 shrink-0 items-center justify-center rounded-sm",
  "text-accent-foreground/70 outline-none transition-colors",
  "hover:bg-accent-foreground/10 hover:text-accent-foreground",
  "focus-visible:ring-ring focus-visible:ring-[2px]",
]);

/** Bare text input where new tags are typed. */
export const tagInputFieldVariants = cva([
  "min-w-[6ch] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-foreground outline-none",
  "placeholder:text-muted-foreground",
]);
