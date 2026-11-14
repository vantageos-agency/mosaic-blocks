// The caller passes the table's current display order; this module never derives its own.

export type NavDirection = "prev" | "next";

// Arrow keys inside a field move the caret or the option, never the row.
export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable === true)
  );
}

/** Neighbour row id, or null at either end or when the current id is not listed. */
export function neighbourRowId(
  orderedRowIds: readonly string[],
  currentRowId: string,
  direction: NavDirection,
): string | null {
  const index = orderedRowIds.indexOf(currentRowId);
  if (index === -1) return null;
  const neighbourIndex = index + (direction === "next" ? 1 : -1);
  if (neighbourIndex < 0 || neighbourIndex >= orderedRowIds.length) return null;
  return orderedRowIds[neighbourIndex] ?? null;
}
