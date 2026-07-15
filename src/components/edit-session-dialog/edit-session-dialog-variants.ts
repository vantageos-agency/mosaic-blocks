/**
 * editSessionDialogVariants — pure CVA variant functions for
 * MosaicEditSessionDialog.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Form body vertical layout. */
export const editSessionDialogBodyVariants = cva(["flex flex-col gap-4"]);

/** Field group (label + control + helper/error) vertical layout. */
export const editSessionDialogFieldVariants = cva(["flex flex-col gap-1.5"]);

/** Field error text. */
export const editSessionDialogErrorVariants = cva(["text-xs font-medium text-destructive"]);

/** Footer action row. */
export const editSessionDialogFooterVariants = cva([
  "flex items-center justify-end gap-3 border-t border-border pt-4",
]);

/** Submit / cancel button variants by intent. */
export const editSessionDialogButtonVariants = cva(
  [
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      intent: {
        cancel: "border border-border bg-background hover:bg-muted",
        save: "border border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
      },
    },
    defaultVariants: {
      intent: "cancel",
    },
  },
);
