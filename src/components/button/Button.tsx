/**
 * MosaicButton — @base-ui/react Button primitive
 *
 * Ported from heyfabrika/styleui (MIT) with namespace and import adaptations.
 * Source: https://github.com/heyfabrika/styleui/blob/main/components/ui/button.tsx
 *
 * Uses @base-ui/react/button as the headless base per ADR-0001.
 * Styling: Tailwind v4 + cva variants. No tailwind-merge needed (single source).
 * API: data-slot="button" attribution, ref as regular prop (React 19).
 */

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
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

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicButtonProps
  extends Omit<ButtonPrimitive.Props, "ref">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  /** ref is typed as HTMLElement to preserve the original public API surface */
  ref?: React.Ref<HTMLElement>;
}

/**
 * MosaicButton — production Button atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/button (ADR-0001). Headless, accessible by default.
 * Accepts all native button props + variant/size from cva.
 *
 * @example
 * <MosaicButton variant="secondary" size="lg">Save</MosaicButton>
 * <MosaicButton variant="destructive" disabled>Delete</MosaicButton>
 */
export function MosaicButton({ className, variant, size, ref, ...props }: MosaicButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref as React.Ref<HTMLButtonElement>}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

MosaicButton.displayName = "MosaicButton";

export { buttonVariants };
