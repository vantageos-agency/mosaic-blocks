/**
 * chatComposerVariants — pure CVA variant functions for MosaicChatComposer.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root form container. */
export const chatComposerRootVariants = cva([
  "min-w-0 rounded-[14px] border border-border bg-card shadow-sm transition-colors",
  "focus-within:ring-[1px] focus-within:ring-ring",
]);

/** Textarea input. */
export const chatComposerTextareaVariants = cva([
  "max-h-40 min-h-12 w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm outline-none",
  "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
]);

/** Send / stop action button, by tone. */
export const chatComposerActionButtonVariants = cva(
  ["inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"],
  {
    variants: {
      tone: {
        send: "bg-foreground text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30",
        stop: "cursor-pointer bg-foreground/15 text-foreground hover:bg-foreground/25",
      },
    },
    defaultVariants: {
      tone: "send",
    },
  },
);
