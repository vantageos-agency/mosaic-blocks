/**
 * stepPipelineVariants — pure CVA variant functions for MosaicStepPipeline.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root pipeline container variants */
export const stepPipelineVariants = cva(["flex", "items-stretch"], {
  variants: {
    orientation: {
      horizontal: "flex-row items-center w-full",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

/** Individual step indicator (circle/icon area) variants by status */
export const stepIndicatorVariants = cva(
  [
    "flex items-center justify-center shrink-0",
    "rounded-full border-2 font-semibold text-sm select-none",
    "transition-colors",
  ],
  {
    variants: {
      status: {
        done: "bg-foreground text-background border-foreground",
        current: "bg-background text-foreground border-foreground ring-2 ring-ring ring-offset-2",
        upcoming: "bg-muted text-muted-foreground border-border",
      },
      orientation: {
        horizontal: "size-8",
        vertical: "size-8",
      },
    },
    defaultVariants: {
      status: "upcoming",
      orientation: "horizontal",
    },
  },
);

/** Connector line between steps */
export const stepConnectorVariants = cva(["shrink-0 transition-colors"], {
  variants: {
    status: {
      done: "bg-foreground",
      current: "bg-border",
      upcoming: "bg-border",
    },
    orientation: {
      horizontal: "h-px flex-1 min-w-4",
      vertical: "w-px self-stretch min-h-4 ml-4",
    },
  },
  defaultVariants: {
    status: "upcoming",
    orientation: "horizontal",
  },
});

/** Step label text variants */
export const stepLabelVariants = cva(["text-sm font-medium transition-colors"], {
  variants: {
    status: {
      done: "text-foreground",
      current: "text-foreground",
      upcoming: "text-muted-foreground",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});

/** Step description text variants */
export const stepDescriptionVariants = cva(["text-xs transition-colors"], {
  variants: {
    status: {
      done: "text-muted-foreground",
      current: "text-muted-foreground",
      upcoming: "text-muted-foreground/60",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});
