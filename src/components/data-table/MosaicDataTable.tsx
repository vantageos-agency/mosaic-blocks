/**
 * MosaicDataTable — generic sortable data table
 *
 * Presentational atom. Fully generic over row type T.
 * Supports client-side sort (asc/desc) by any sortable column.
 * No icon library dependency — sort indicator via inline text chars.
 * Design tokens: border-border, bg-muted, hover:bg-muted/50, text-muted-foreground.
 * Pattern: Button.tsx (data-slot, inline cn, React 19 ref prop, displayName, JSDoc).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 *
 * Closes issue #23 — mosaic-data-table.
 *
 * @example
 * // Basic usage
 * const columns: MosaicDataTableColumn<User>[] = [
 *   { key: "name", header: "Name", sortable: true },
 *   { key: "email", header: "Email" },
 * ];
 * <MosaicDataTable columns={columns} rows={users} getRowKey={(r) => r.id} />
 *
 * @example
 * // With custom render + bilingual empty state
 * <MosaicDataTable
 *   columns={columns}
 *   rows={[]}
 *   emptyState={<MosaicEmptyState title="Aucune donnée" />}
 * />
 */

import { useState } from "react";
import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicDataTableColumn<T> {
  /** Unique key — used to access row[key] for default rendering and sorting. */
  key: string;
  /** Column header label (ReactNode for i18n / icons). */
  header: React.ReactNode;
  /**
   * Custom cell renderer. Receives the full row object.
   * When absent, falls back to `String(row[key])`.
   * Note: sort operates on the raw `row[key]` value, not the rendered output.
   */
  render?: (row: T) => React.ReactNode;
  /** Make this column sortable (clicking header cycles asc → desc). */
  sortable?: boolean;
  /** Horizontal alignment of header + cells. */
  align?: "left" | "right" | "center";
  /** Additional Tailwind classes forwarded to every `<th>` and `<td>` in this column. */
  className?: string;
}

export interface MosaicDataTableProps<T> {
  /** Column definitions. */
  columns: MosaicDataTableColumn<T>[];
  /** Array of row data objects. */
  rows: T[];
  /**
   * Stable key extractor for React reconciliation.
   * Prefer providing this — default falls back to `index` which can cause flicker.
   */
  getRowKey?: (row: T, index: number) => string | number;
  /**
   * Master sortable toggle. When `false`, overrides per-column `sortable`.
   * When `true` (default), per-column `sortable` decides per-column behaviour.
   * @default true
   */
  sortable?: boolean;
  /**
   * Content rendered when `rows` is empty.
   * Pass a `<MosaicEmptyState />` with a translated title for FR/EN support.
   * When absent, `emptyMessage` is shown as plain muted text.
   */
  emptyState?: React.ReactNode;
  /**
   * Plain-text empty-state message shown when `rows` is empty and
   * `emptyState` is not provided. Required — the host owns the language
   * (e.g. `t('DataTable.empty')`). No default, no fallback.
   */
  emptyMessage: string;
  /** Additional Tailwind classes for the root `<table>` element. */
  className?: string;
  /** React 19 ref prop — no forwardRef wrapper needed. */
  ref?: React.Ref<HTMLTableElement>;
  /**
   * Trailing content rendered inside a `<tfoot>` row, after the last data
   * row. Mount your own IntersectionObserver sentinel here to keep your
   * existing infinite-scroll pattern (e.g. Convex `usePaginatedQuery`) —
   * `MosaicDataTable` does not impose a button-driven pager.
   *
   * @example
   * <MosaicDataTable
   *   columns={columns}
   *   rows={results}
   *   emptyMessage="Aucune donnée"
   *   footerSlot={<div ref={sentinelRef} />}
   * />
   */
  footerSlot?: React.ReactNode;
  /**
   * Simple load-more affordance for consumers without their own sentinel.
   * Optional as a feature — a table with no `pagination` renders exactly
   * as before. When provided, `loadMoreLabel` and `loadingLabel` are
   * REQUIRED (no default, no fallback) — the host owns the language.
   */
  pagination?: MosaicDataTablePagination;
}

/**
 * Load-more pagination config. Required as a whole (no partial shape) —
 * when a consumer opts into the simple pagination affordance, both labels
 * must be supplied. There is no English default anywhere in this type.
 */
export interface MosaicDataTablePagination {
  /** Whether more rows are available to fetch. */
  hasMore: boolean;
  /** Invoked when the load-more affordance is activated. */
  onLoadMore: () => void;
  /**
   * Label for the load-more button. Required — the host owns the
   * language (e.g. `t('DataTable.loadMore')`).
   */
  loadMoreLabel: string;
  /**
   * Announcement shown (and read by assistive tech via `aria-live`)
   * while more rows are being fetched. Required — the host owns the
   * language.
   */
  loadingLabel: string;
  /** True while a load-more fetch is in flight. @default false */
  isLoadingMore?: boolean;
}

// ── Sort state ────────────────────────────────────────────────────────────────

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

// ── Default comparator ────────────────────────────────────────────────────────

function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicDataTable — generic sortable data table for @vantageos/mosaic-blocks.
 *
 * Renders a semantic `<table>` with typed columns and rows. Optional client-side
 * sort per column. Empty state slot. Fully accessible: `scope="col"`,
 * `aria-sort` on sorted column.
 *
 * @example
 * <MosaicDataTable<Agent>
 *   columns={[
 *     { key: "name", header: "Agent", sortable: true },
 *     { key: "status", header: "Status" },
 *   ]}
 *   rows={agents}
 *   getRowKey={(r) => r.id}
 *   emptyState={<MosaicEmptyState title="No agents" />}
 * />
 */
export function MosaicDataTable<T>({
  columns,
  rows,
  getRowKey,
  sortable: masterSortable = true,
  emptyState,
  emptyMessage,
  className,
  ref,
  footerSlot,
  pagination,
}: MosaicDataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  // ── Sort toggle ────────────────────────────────────────────────────────────

  function handleHeaderClick(col: MosaicDataTableColumn<T>) {
    if (!masterSortable || !col.sortable) return;
    setSort((prev) => {
      if (prev?.key === col.key) {
        return { key: col.key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key: col.key, direction: "asc" };
    });
  }

  // ── Sorted rows ────────────────────────────────────────────────────────────

  const sortedRows = sort
    ? [...rows].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort.key];
        const bVal = (b as Record<string, unknown>)[sort.key];
        const cmp = defaultCompare(aVal, bVal);
        return sort.direction === "asc" ? cmp : -cmp;
      })
    : rows;

  // ── Alignment helper ───────────────────────────────────────────────────────

  function alignClass(align?: "left" | "right" | "center") {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  }

  // ── aria-sort helper ───────────────────────────────────────────────────────

  function ariaSort(col: MosaicDataTableColumn<T>): React.AriaAttributes["aria-sort"] {
    if (!sort || sort.key !== col.key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  // ── Sort indicator ─────────────────────────────────────────────────────────

  function sortIndicator(col: MosaicDataTableColumn<T>): React.ReactNode {
    if (!masterSortable || !col.sortable) return null;
    if (!sort || sort.key !== col.key) {
      return (
        <span
          aria-hidden="true"
          className="ml-1 inline-block select-none text-xs text-muted-foreground opacity-40"
        >
          ↕
        </span>
      );
    }
    return (
      <span aria-hidden="true" className="ml-1 inline-block select-none text-xs">
        {sort.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <table
      ref={ref}
      data-slot="data-table"
      className={cn("w-full border-collapse text-sm", className)}
    >
      <thead data-slot="data-table-header">
        <tr data-slot="data-table-header-row" className="border-b border-border bg-muted">
          {columns.map((col, colIndex) => {
            const isSortable = masterSortable && col.sortable;
            return (
              <th
                key={colIndex}
                data-slot="data-table-th"
                scope="col"
                aria-sort={ariaSort(col)}
                tabIndex={isSortable ? 0 : undefined}
                onClick={isSortable ? () => handleHeaderClick(col) : undefined}
                onKeyDown={
                  isSortable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleHeaderClick(col);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "px-4 py-3 font-medium text-muted-foreground",
                  alignClass(col.align),
                  col.className,
                  isSortable &&
                    "cursor-pointer select-none hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {col.header}
                {sortIndicator(col)}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody data-slot="data-table-body">
        {sortedRows.length === 0 ? (
          <tr data-slot="data-table-empty-row">
            <td
              data-slot="data-table-empty-cell"
              colSpan={columns.length}
              className="px-4 py-12 text-center text-muted-foreground"
            >
              {emptyState ?? emptyMessage}
            </td>
          </tr>
        ) : (
          sortedRows.map((row, index) => {
            const key = getRowKey ? getRowKey(row, index) : index;
            return (
              <tr
                key={key}
                data-slot="data-table-row"
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                {columns.map((col, colIndex) => {
                  const rawVal = (row as Record<string, unknown>)[col.key];
                  const cell = col.render ? col.render(row) : String(rawVal ?? "");
                  return (
                    <td
                      key={colIndex}
                      data-slot="data-table-td"
                      className={cn(
                        "px-4 py-3 text-foreground",
                        alignClass(col.align),
                        col.className,
                      )}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>

      {(footerSlot || pagination) && (
        <tfoot data-slot="data-table-footer">
          <tr data-slot="data-table-footer-row">
            <td
              data-slot="data-table-footer-cell"
              colSpan={columns.length}
              className="px-4 py-3 text-center"
            >
              {footerSlot}
              {pagination && (
                <div
                  data-slot="data-table-pagination"
                  aria-live="polite"
                  className="flex items-center justify-center"
                >
                  {pagination.isLoadingMore ? (
                    <span className="text-sm text-muted-foreground">{pagination.loadingLabel}</span>
                  ) : (
                    pagination.hasMore && (
                      <button
                        type="button"
                        data-slot="data-table-load-more"
                        onClick={pagination.onLoadMore}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {pagination.loadMoreLabel}
                      </button>
                    )
                  )}
                </div>
              )}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

MosaicDataTable.displayName = "MosaicDataTable";
