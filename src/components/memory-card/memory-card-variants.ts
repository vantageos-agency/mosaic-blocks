/**
 * memoryCardVariants — pure CVA variant functions for MosaicMemoryCard.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root card container variants */
export const memoryCardVariants = cva(
  [
    "group relative rounded-lg border border-border bg-card text-card-foreground shadow-sm",
    "transition-all",
  ],
  {
    variants: {
      variant: {
        detailed: "p-5 hover:shadow-lg",
        compact: "min-h-[80px] p-4",
      },
    },
    defaultVariants: {
      variant: "detailed",
    },
  },
);

/** Scope badge — colored per memory scope, bordered only in the detailed variant */
export const memoryScopeBadgeVariants = cva(
  ["inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"],
  {
    variants: {
      scope: {
        organization: "bg-purple-500/10 text-purple-500",
        workspace: "bg-blue-500/10 text-blue-500",
        user: "bg-green-500/10 text-green-500",
        chat: "bg-orange-500/10 text-orange-500",
      },
      bordered: {
        true: "border",
        false: "",
      },
    },
    compoundVariants: [
      { scope: "organization", bordered: true, className: "border-purple-500/20" },
      { scope: "workspace", bordered: true, className: "border-blue-500/20" },
      { scope: "user", bordered: true, className: "border-green-500/20" },
      { scope: "chat", bordered: true, className: "border-orange-500/20" },
    ],
    defaultVariants: {
      scope: "user",
      bordered: false,
    },
  },
);

/** Tag badge (detailed variant only) */
export const memoryTagBadgeVariants = cva([
  "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs",
]);

/** Actions menu trigger button — hover-reveal in detailed, always visible in compact */
export const memoryActionsMenuTriggerVariants = cva(
  [
    "inline-flex items-center justify-center rounded-md text-muted-foreground transition-opacity",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
  {
    variants: {
      variant: {
        detailed: "h-11 w-11 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        compact: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "detailed",
    },
  },
);
