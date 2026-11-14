/**
 * MosaicDocumentCriteriaPanel — the review panel for one row.
 *
 * Built on MosaicTabs + MosaicResizableSplitPane + MosaicPdfViewer +
 * MosaicEditableCell. It OPENS ON COMPARE (document left, fields right) with no
 * interaction; the other tabs show the document alone or the fields alone. Every
 * field is editable (unless its column says otherwise) and shows a provenance
 * label supplied by the host. Editing reports a correction request carrying the
 * actor and the correction provenance. Prev/next walk the host's row order.
 *
 * No business vocabulary and no default copy: every word is in `labels` or in
 * the column model.
 */
import { useState } from "react";
import {
  type ColumnVisibility,
  type FieldCorrectionRequest,
  INITIAL_REVIEW_PANEL_TAB,
  REVIEW_PANEL_TABS,
  type ReviewColumn,
  type ReviewPanelTab,
  initialColumnVisibility,
  neighbourRowId,
  visibleColumns,
} from "../../lib/document-review/index.js";
import { MosaicEditableCell } from "../editable-cell/MosaicEditableCell.js";
import { MosaicPdfViewer } from "../pdf-viewer/MosaicPdfViewer.js";
import { MosaicResizableSplitPane } from "../resizable-split-pane/MosaicResizableSplitPane.js";
import {
  MosaicTabs,
  MosaicTabsList,
  MosaicTabsPanel,
  MosaicTabsTrigger,
} from "../tabs/MosaicTabs.js";

export interface MosaicDocumentCriteriaPanelLabels {
  tabCompare: string;
  tabDocument: string;
  tabRow: string;
  previous: string;
  next: string;
  documentLoading: string;
  documentError: string;
  collapse: string;
  resize: string;
  /** Accessible name of a field's editor, from its column label. */
  editField: (columnLabel: string) => string;
}

export interface MosaicDocumentCriteriaPanelProps<T> {
  row: T;
  rowId: string;
  /** The column model; the fields shown are its visible columns. */
  columns: ReviewColumn<T>[];
  /** Overrides the model's `defaultVisible` per column id. */
  columnVisibility?: ColumnVisibility;
  documentUrl: string;
  /** Row ids in display order. */
  orderedRowIds: readonly string[];
  onNavigate: (rowId: string) => void;
  /** Receives the correction request, with actor and provenance. */
  onCorrect: (request: FieldCorrectionRequest) => unknown;
  /** Who is correcting. */
  actor: string;
  /** Provenance tag recorded with every correction made from this panel. */
  correctionProvenance: string;
  /** Provenance label shown next to a field (source name, corrected by…), or null for none. */
  provenanceLabel: (row: T, column: ReviewColumn<T>) => string | null;
  labels: MosaicDocumentCriteriaPanelLabels;
  /** Defaults to Compare. */
  defaultTab?: ReviewPanelTab;
  className?: string;
}

export function MosaicDocumentCriteriaPanel<T>({
  row,
  rowId,
  columns,
  columnVisibility,
  documentUrl,
  orderedRowIds,
  onNavigate,
  onCorrect,
  actor,
  correctionProvenance,
  provenanceLabel,
  labels,
  defaultTab = INITIAL_REVIEW_PANEL_TAB,
  className,
}: MosaicDocumentCriteriaPanelProps<T>) {
  const [tab, setTab] = useState<ReviewPanelTab>(defaultTab);
  const [sideWidth, setSideWidth] = useState(45);
  const [isSideCollapsed, setIsSideCollapsed] = useState(false);

  const previousId = neighbourRowId(orderedRowIds, rowId, "prev");
  const nextId = neighbourRowId(orderedRowIds, rowId, "next");

  const tabLabel: Record<ReviewPanelTab, string> = {
    compare: labels.tabCompare,
    document: labels.tabDocument,
    row: labels.tabRow,
  };

  const document_ = (
    <MosaicPdfViewer
      fileUrl={documentUrl}
      loadingLabel={labels.documentLoading}
      errorLabel={labels.documentError}
    />
  );

  const fields = (
    <dl data-slot="document-criteria-fields" className="flex flex-col gap-3 p-3">
      {visibleColumns(columns, columnVisibility ?? initialColumnVisibility(columns)).map(
        (column) => {
          const value = column.accessor(row);
          const provenance = provenanceLabel(row, column);
          return (
            <div
              key={column.id}
              data-slot="document-criteria-field"
              className="flex flex-col gap-1"
            >
              <dt className="text-xs font-medium text-muted-foreground">{column.label}</dt>
              <dd className="m-0 flex flex-col gap-1">
                <MosaicEditableCell
                  value={value === null ? "" : String(value)}
                  disabled={column.editable === false}
                  editAriaLabel={labels.editField(column.label)}
                  onCommit={(input) => {
                    onCorrect({
                      rowId,
                      field: column.id,
                      input,
                      by: actor,
                      provenance: correctionProvenance,
                    });
                  }}
                />
                {provenance ? (
                  <span
                    data-slot="document-criteria-provenance"
                    className="text-xs text-muted-foreground"
                  >
                    {provenance}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        },
      )}
    </dl>
  );

  return (
    <section
      data-slot="document-criteria-panel"
      data-row-id={rowId}
      className={["flex flex-col gap-2 rounded-md border border-border p-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <MosaicTabs value={tab} onValueChange={(next) => setTab(next as ReviewPanelTab)}>
        <div className="flex items-center justify-between gap-2">
          <MosaicTabsList>
            {REVIEW_PANEL_TABS.map((value) => (
              <MosaicTabsTrigger key={value} value={value}>
                {tabLabel[value]}
              </MosaicTabsTrigger>
            ))}
          </MosaicTabsList>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={previousId === null}
              onClick={() => previousId !== null && onNavigate(previousId)}
              className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
            >
              {labels.previous}
            </button>
            <button
              type="button"
              disabled={nextId === null}
              onClick={() => nextId !== null && onNavigate(nextId)}
              className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
            >
              {labels.next}
            </button>
          </div>
        </div>
        <MosaicTabsPanel value="compare">
          <MosaicResizableSplitPane
            main={document_}
            side={fields}
            sideWidth={sideWidth}
            onSideWidthChange={setSideWidth}
            isSideCollapsed={isSideCollapsed}
            onToggleSideCollapsed={() => setIsSideCollapsed((c) => !c)}
            collapseButtonAriaLabel={labels.collapse}
            resizeHandleAriaLabel={labels.resize}
          />
        </MosaicTabsPanel>
        <MosaicTabsPanel value="document">{document_}</MosaicTabsPanel>
        <MosaicTabsPanel value="row">{fields}</MosaicTabsPanel>
      </MosaicTabs>
    </section>
  );
}

MosaicDocumentCriteriaPanel.displayName = "MosaicDocumentCriteriaPanel";
