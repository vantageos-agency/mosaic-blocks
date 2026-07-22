/**
 * MosaicEditableCell — table cell with double-click-to-edit
 *
 * Composes MosaicInput. Double-click enters edit mode; Enter validates
 * and commits; Escape cancels and restores the original value. A failed
 * `validate` blocks the commit and surfaces its error message inline.
 *
 * data-slot="editable-cell" on the wrapper.
 */

import * as React from "react";
import { MosaicInput } from "../input/MosaicInput.js";
import { editableCellVariants } from "./editable-cell-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicEditableCellProps {
  value: string;
  onCommit: (next: string) => void;
  onCancel?: () => void;
  /** Returns an error message to block the commit, or null to allow it. */
  validate?: (next: string) => string | null;
  /** Required — the host owns the language, no default fallback. */
  editAriaLabel: string;
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicEditableCell — double-click to edit a table cell.
 *
 * @example
 * <MosaicEditableCell
 *   value={row.name}
 *   onCommit={(next) => save(row.id, next)}
 *   validate={(next) => (next.trim() ? null : t('EditableCell.required'))}
 *   editAriaLabel={t('EditableCell.editLabel')}
 * />
 */
export function MosaicEditableCell({
  value,
  onCommit,
  onCancel,
  validate,
  editAriaLabel,
  disabled,
  className,
  ref,
}: MosaicEditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);

  function startEdit() {
    if (disabled) return;
    setDraft(value);
    setError(null);
    setIsEditing(true);
  }

  function commit() {
    const message = validate ? validate(draft) : null;
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setIsEditing(false);
    onCommit(draft);
  }

  function cancel() {
    setDraft(value);
    setError(null);
    setIsEditing(false);
    onCancel?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commit();
    } else if (event.key === "Escape") {
      cancel();
    }
  }

  if (!isEditing) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        data-slot="editable-cell"
        disabled={disabled}
        aria-label={editAriaLabel}
        className={cn(editableCellVariants({ disabled }), "text-left", className)}
        onDoubleClick={startEdit}
        onKeyDown={(event) => {
          if (!disabled && event.key === "Enter") {
            startEdit();
          }
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="editable-cell"
      className={cn("flex flex-col gap-1", className)}
    >
      <MosaicInput
        aria-label={editAriaLabel}
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
      />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

MosaicEditableCell.displayName = "MosaicEditableCell";

export { editableCellVariants };
