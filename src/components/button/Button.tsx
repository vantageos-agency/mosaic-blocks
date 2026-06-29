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
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { buttonVariants } from "./button-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

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
