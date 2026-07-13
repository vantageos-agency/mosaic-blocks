/**
 * templateAgentCardVariants — pure CVA variant functions for MosaicTemplateAgentCard.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root card container variants — selected state only. */
export const templateAgentCardVariants = cva(
  [
    "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
    "transition-all hover:border-primary/50",
  ],
  {
    variants: {
      selected: {
        true: "ring-2 ring-primary border-primary bg-primary/5",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

/** Category / agent-count / usage-count badge. */
export const templateAgentCardBadgeVariants = cva([
  "inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium",
]);

/** Tag chip, including the "+N" overflow chip. */
export const templateAgentCardTagVariants = cva([
  "inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground",
]);
