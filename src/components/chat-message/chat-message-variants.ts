/**
 * chatMessageVariants — pure CVA variant functions for MosaicChatMessage.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root row alignment — user messages align end, assistant messages align start. */
export const chatMessageContainerVariants = cva(["flex w-full min-w-0"], {
  variants: {
    align: {
      start: "justify-start",
      end: "justify-end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

/** Bubble surface — user gets a bounded chat bubble, assistant flows full-width. */
export const chatMessageBubbleVariants = cva(["min-w-0"], {
  variants: {
    role: {
      user: [
        "max-w-[85%] rounded-[18px] border border-border/40 bg-muted/70 px-3 py-1.5",
        "text-[15px] leading-6 text-foreground shadow-sm",
      ],
      assistant: "w-full max-w-none text-sm leading-relaxed text-foreground",
    },
  },
  defaultVariants: {
    role: "assistant",
  },
});

/** Tool-call status glyph/tone — running / completed / denied / error. */
export const chatMessageToolStatusVariants = cva(["text-xs font-medium"], {
  variants: {
    status: {
      running: "text-muted-foreground",
      completed: "text-emerald-600 dark:text-emerald-500",
      denied: "text-destructive",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    status: "running",
  },
});
