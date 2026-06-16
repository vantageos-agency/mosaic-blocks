/**
 * MosaicInputGroup — composition wrapper for MosaicInput with addons
 *
 * Lays out an optional prefix addon + children (MosaicInput) + optional suffix
 * horizontally. Plain <div> wrapper — no base-ui primitive needed.
 * data-slot="input-group".
 *
 * Design tokens: Tailwind v4 semantic classes only.
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

// Omit 'prefix' from HTMLAttributes because the DOM attribute is `string | undefined`
// but our `prefix` prop accepts any ReactNode.
export interface MosaicInputGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** Element rendered before the input (icon, text addon, etc.) */
  prefix?: React.ReactNode;
  /** Element rendered after the input (icon, text addon, etc.) */
  suffix?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * MosaicInputGroup — wraps MosaicInput with optional prefix/suffix addons.
 *
 * @example
 * <MosaicInputGroup prefix={<SearchIcon />}>
 *   <MosaicInput placeholder="Search…" />
 * </MosaicInputGroup>
 *
 * <MosaicInputGroup
 *   prefix={<span>https://</span>}
 *   suffix={<span>.com</span>}
 * >
 *   <MosaicInput placeholder="yoursite" />
 * </MosaicInputGroup>
 */
export function MosaicInputGroup({
  prefix,
  suffix,
  className,
  children,
  ref,
  ...props
}: MosaicInputGroupProps) {
  return (
    <div
      ref={ref}
      data-slot="input-group"
      className={cn("flex items-center", className)}
      {...props}
    >
      {prefix ? (
        <div
          data-slot="input-group-prefix"
          className="flex shrink-0 items-center text-sm text-muted-foreground"
        >
          {prefix}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
      {suffix ? (
        <div
          data-slot="input-group-suffix"
          className="flex shrink-0 items-center text-sm text-muted-foreground"
        >
          {suffix}
        </div>
      ) : null}
    </div>
  );
}

MosaicInputGroup.displayName = "MosaicInputGroup";
