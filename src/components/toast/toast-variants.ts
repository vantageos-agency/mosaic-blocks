/**
 * toastVariants — pure CVA variant functions for MosaicToast / MosaicToastProvider.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root toast card container variants by variant. */
export const toastCardVariants = cva(
  ["flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg sm:max-w-sm"],
  {
    variants: {
      variant: {
        success: "border-border bg-card",
        error: "border-destructive/40 bg-destructive/5",
        info: "border-border bg-card",
        warning: "border-amber-500/40 bg-amber-500/5",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

/** Title text variants by variant. */
export const toastTitleVariants = cva(["text-sm font-medium"], {
  variants: {
    variant: {
      success: "text-foreground",
      error: "text-destructive",
      info: "text-foreground",
      warning: "text-amber-600 dark:text-amber-400",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

/** Dismiss button variants — a single visual treatment across every variant. */
export const toastDismissButtonVariants = cva([
  "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
]);

/** Provider stack positioning — anchors the toast stack in a screen corner/edge. */
export const toastProviderPositionVariants = cva(
  ["pointer-events-none fixed z-50 flex flex-col gap-2 p-4"],
  {
    variants: {
      position: {
        "top-right": "top-0 right-0 items-end",
        "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
        "bottom-right": "bottom-0 right-0 items-end",
        "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
      },
    },
    defaultVariants: {
      position: "top-right",
    },
  },
);
