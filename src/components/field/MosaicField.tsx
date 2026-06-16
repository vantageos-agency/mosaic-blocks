/**
 * MosaicField — @base-ui/react Field primitive
 *
 * Wires Field.Root + Field.Label + Field.Control + Field.Description + Field.Error
 * with full a11y associations (htmlFor, aria-describedby, aria-errormessage).
 *
 * API: data-slot="field" on root. Compound component pattern via static props.
 * Styling: Tailwind v4 semantic tokens only, no hardcoded colors.
 */

import { Field } from "@base-ui/react/field";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Root ─────────────────────────────────────────────────────────────────────

export interface MosaicFieldProps extends React.ComponentPropsWithoutRef<typeof Field.Root> {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

function MosaicFieldRoot({ className, children, ref, ...props }: MosaicFieldProps) {
  return (
    <Field.Root
      ref={ref}
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {children}
    </Field.Root>
  );
}
MosaicFieldRoot.displayName = "MosaicField";

// ── Label ─────────────────────────────────────────────────────────────────────

export interface MosaicFieldLabelProps extends React.ComponentPropsWithoutRef<typeof Field.Label> {
  className?: string;
  ref?: React.Ref<HTMLLabelElement>;
}

function MosaicFieldLabel({ className, children, ref, ...props }: MosaicFieldLabelProps) {
  return (
    <Field.Label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground",
        "data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </Field.Label>
  );
}
MosaicFieldLabel.displayName = "MosaicField.Label";

// ── Control ───────────────────────────────────────────────────────────────────

export interface MosaicFieldControlProps
  extends React.ComponentPropsWithoutRef<typeof Field.Control> {
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

function MosaicFieldControl({ className, ref, ...props }: MosaicFieldControlProps) {
  return <Field.Control ref={ref} className={cn(className)} {...props} />;
}
MosaicFieldControl.displayName = "MosaicField.Control";

// ── Description ───────────────────────────────────────────────────────────────

export interface MosaicFieldDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof Field.Description> {
  className?: string;
  ref?: React.Ref<HTMLParagraphElement>;
}

function MosaicFieldDescription({
  className,
  children,
  ref,
  ...props
}: MosaicFieldDescriptionProps) {
  return (
    <Field.Description
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </Field.Description>
  );
}
MosaicFieldDescription.displayName = "MosaicField.Description";

// ── Error ─────────────────────────────────────────────────────────────────────

export interface MosaicFieldErrorProps extends React.ComponentPropsWithoutRef<typeof Field.Error> {
  className?: string;
  /** Force-show the error even without native validity state */
  show?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function MosaicFieldError({
  className,
  children,
  show: _show,
  ref,
  ...props
}: MosaicFieldErrorProps) {
  const show = _show;
  return (
    <Field.Error
      ref={ref}
      match={show === true ? true : undefined}
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </Field.Error>
  );
}
MosaicFieldError.displayName = "MosaicField.Error";

// ── Compound export ────────────────────────────────────────────────────────────

export const MosaicField = Object.assign(MosaicFieldRoot, {
  Label: MosaicFieldLabel,
  Control: MosaicFieldControl,
  Description: MosaicFieldDescription,
  Error: MosaicFieldError,
});

export { MosaicFieldLabel, MosaicFieldControl, MosaicFieldDescription, MosaicFieldError };
