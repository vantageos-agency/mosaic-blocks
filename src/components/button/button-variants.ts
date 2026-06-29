/**
 * buttonVariants — pure CVA variant function for MosaicButton.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in
 * React or @base-ui/react/button (which are in Button.tsx but not here).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base classes — identical to styleui base (adapted for Tailwind v4)
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "rounded-md border border-transparent bg-clip-padding",
    "text-sm font-medium select-none",
    "transition-all outline-none",
    "focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
    "group/button shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-foreground text-primary-foreground hover:bg-foreground/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/10 hover:bg-destructive/20 text-destructive focus-visible:border-destructive/40",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground shadow-xs",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        sm: "h-8 gap-1 rounded-[10px] px-2.5",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-9",
        "icon-sm": "size-8 rounded-[10px]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
