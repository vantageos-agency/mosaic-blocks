/**
 * Generic column model. Ships no field name and no label of its own: ids, labels
 * and accessors all come from the host.
 */

export type FieldValue = string | number | boolean | null;

export interface ReviewColumn<T> {
  /** Stable column id. */
  id: string;
  /** Host-supplied label (the host owns the language). */
  label: string;
  /** Whether the column is shown before the user changes anything. */
  defaultVisible: boolean;
  /** Reads this column's value from a row. */
  accessor: (row: T) => FieldValue;
  /** False for derived columns that must never be typed by hand. Defaults to true. */
  editable?: boolean;
}

/** Explicit visibility per column id; an absent id falls back to `defaultVisible`. */
export type ColumnVisibility = Readonly<Record<string, boolean>>;

function assertKnown<T>(columns: readonly ReviewColumn<T>[], ids: Iterable<string>): void {
  const known = new Set(columns.map((c) => c.id));
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error(`document-review: visibility names unknown column "${id}"`);
    }
  }
}

export function initialColumnVisibility<T>(columns: readonly ReviewColumn<T>[]): ColumnVisibility {
  return Object.fromEntries(columns.map((c) => [c.id, c.defaultVisible]));
}

export function toggleColumnVisibility<T>(
  columns: readonly ReviewColumn<T>[],
  visibility: ColumnVisibility,
  id: string,
): ColumnVisibility {
  assertKnown(columns, [id]);
  const column = columns.find((c) => c.id === id) as ReviewColumn<T>;
  const current = visibility[id] ?? column.defaultVisible;
  return { ...visibility, [id]: !current };
}

/** Columns to show, in column order. An unknown id in `visibility` throws, naming it. */
export function visibleColumns<T>(
  columns: readonly ReviewColumn<T>[],
  visibility: ColumnVisibility,
): ReviewColumn<T>[] {
  assertKnown(columns, Object.keys(visibility));
  return columns.filter((c) => visibility[c.id] ?? c.defaultVisible);
}
