/**
 * replyInputVariants — pure CVA variant functions for MosaicReplyInput.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root form container. */
export const replyInputRootVariants = cva([
  "min-w-0 rounded-[14px] border border-border bg-card shadow-sm transition-colors",
  "focus-within:ring-[1px] focus-within:ring-ring",
]);

/** Host-supplied thread-context region, shown above the textarea. */
export const replyInputContextVariants = cva([
  "truncate border-border border-b px-3 py-2 text-muted-foreground text-xs",
]);

/** Textarea input. */
export const replyInputTextareaVariants = cva([
  "max-h-40 min-h-12 w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm outline-none",
  "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
]);

/** Send / cancel action button, by tone. */
export const replyInputActionButtonVariants = cva(
  [
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2.5 text-xs transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-30",
  ],
  {
    variants: {
      tone: {
        send: "bg-foreground text-background hover:bg-foreground/90",
        cancel: "bg-foreground/10 text-foreground hover:bg-foreground/20",
      },
    },
    defaultVariants: {
      tone: "send",
    },
  },
);
