/**
 * MosaicCallout — inline bordered notice
 *
 * Style-only component: a bordered box carrying a required title and
 * optional children/icon, supplied entirely by the host.
 *
 * variant="info"    -> role="status"  (non-urgent, ambient notice)
 * variant="warning" -> role="alert"   (urgent, must be announced)
 *
 * data-slot="callout" for composability.
 * Design tokens: Tailwind v4 semantic classes only. No hardcoded colors.
 */

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { calloutVariants } from "./callout-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicCalloutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof calloutVariants> {
  /** Required — the host owns the copy, no default text is generated. */
  title: string;
  children?: React.ReactNode;
  /** Host-supplied icon, rendered as-is. */
  icon?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicCallout — inline notice with a semantic role driven by variant.
 *
 * @example
 * <MosaicCallout variant="info" title="Heads up">
 *   Optional supporting copy supplied by the host.
 * </MosaicCallout>
 * <MosaicCallout variant="warning" title="Action required" icon={<WarnIcon />} />
 */
export function MosaicCallout({
  variant = "info",
  title,
  children,
  icon,
  className,
  ref,
  ...props
}: MosaicCalloutProps) {
  const role = variant === "warning" ? "alert" : "status";

  return (
    <div
      ref={ref}
      role={role}
      data-slot="callout"
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  );
}

MosaicCallout.displayName = "MosaicCallout";
