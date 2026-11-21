/**
 * MosaicDocumentTable + MosaicDocumentCriteriaPanel — tests.
 *
 * (a) the panel renders Compare ACTIVE on first render with no interaction,
 *     document on the left, fields on the right;
 * (b) editing a field calls the correction with provenance;
 * (c) the table opens the panel on row selection.
 * Plus: column visibility from the model, prev/next navigation, provenance label.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MosaicDocumentCriteriaPanel } from "./MosaicDocumentCriteriaPanel.js";
import type {
  MosaicDocumentCriteriaPanelLabels,
  MosaicDocumentCriteriaPanelProps,
} from "./MosaicDocumentCriteriaPanel.js";
import { MosaicDocumentTable } from "./MosaicDocumentTable.js";
import type { ReviewColumn, ReviewRow } from "./document-review-logic.js";

const columns: ReviewColumn<ReviewRow>[] = [
  { id: "alpha", label: "Alpha", defaultVisible: true, accessor: (r) => r.values.alpha ?? null },
  { id: "beta", label: "Beta", defaultVisible: false, accessor: (r) => r.values.beta ?? null },
  {
    id: "gamma",
    label: "Gamma",
    defaultVisible: true,
    accessor: (r) => r.values.gamma ?? null,
    editable: false,
  },
];

const rows: ReviewRow[] = [
  { id: "r1", values: { alpha: "a1", beta: "b1", gamma: "g1" } },
  { id: "r2", values: { alpha: "a2", beta: "b2", gamma: "g2" } },
  { id: "r3", values: { alpha: "a3", beta: "b3", gamma: "g3" } },
];

const labels: MosaicDocumentCriteriaPanelLabels = {
  tabCompare: "T-compare",
  tabDocument: "T-document",
  tabRow: "T-row",
  previous: "P-prev",
  next: "P-next",
  documentLoading: "loading-doc",
  documentError: "error-doc",
  collapse: "collapse-pane",
  resize: "resize-pane",
  editField: (column) => `edit ${column}`,
};

function renderPanel(overrides: Partial<MosaicDocumentCriteriaPanelProps<ReviewRow>> = {}) {
  const onCorrect = vi.fn();
  const onNavigate = vi.fn();
  const utils = render(
    <MosaicDocumentCriteriaPanel
      row={rows[1]}
      rowId="r2"
      columns={columns}
      documentUrl="/doc.pdf"
      orderedRowIds={["r1", "r2", "r3"]}
      onNavigate={onNavigate}
      onCorrect={onCorrect}
      actor="reviewer-1"
      correctionProvenance="manual-review"
      provenanceLabel={(_row, column) => `prov:${column.id}`}
      labels={labels}
      {...overrides}
    />,
  );
  return { ...utils, onCorrect, onNavigate };
}

describe("MosaicDocumentCriteriaPanel", () => {
  it("(a) renders Compare active on first render, no interaction, document left / fields right", () => {
    const { container } = renderPanel();
    const compare = screen.getByRole("tab", { name: "T-compare" });
    expect(compare.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "T-document" }).getAttribute("aria-selected")).toBe(
      "false",
    );
    expect(screen.getByRole("tab", { name: "T-row" }).getAttribute("aria-selected")).toBe("false");

    const pane = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
    expect(pane).toBeTruthy();
    const main = pane.querySelector("[data-slot='resizable-split-pane-main']") as HTMLElement;
    const side = pane.querySelector("[data-slot='resizable-split-pane-side']") as HTMLElement;
    expect(main.querySelector("[data-slot='pdf-viewer']")).toBeTruthy();
    expect(side.querySelector("[data-slot='editable-cell']")).toBeTruthy();
    expect(main.compareDocumentPosition(side) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the document tab shows the document alone, the row tab the fields alone", () => {
    const { container } = renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "T-document" }));
    expect(container.querySelector("[data-slot='pdf-viewer']")).toBeTruthy();
    expect(container.querySelector("[data-slot='editable-cell']")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "T-row" }));
    expect(container.querySelector("[data-slot='pdf-viewer']")).toBeNull();
    expect(container.querySelector("[data-slot='editable-cell']")).toBeTruthy();
  });

  it("shows a provenance label from props next to each visible field, and honours column visibility", () => {
    renderPanel();
    expect(screen.getByText("prov:alpha")).toBeTruthy();
    expect(screen.getByText("prov:gamma")).toBeTruthy();
    expect(screen.queryByText("prov:beta")).toBeNull();
    expect(screen.queryByText("Beta")).toBeNull();
  });

  it("(b) editing a field calls the correction with provenance", () => {
    const { onCorrect } = renderPanel();
    fireEvent.doubleClick(screen.getByRole("button", { name: "edit Alpha" }));
    const input = screen.getByRole("textbox", { name: "edit Alpha" });
    fireEvent.change(input, { target: { value: "fixed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(onCorrect).toHaveBeenCalledWith({
      rowId: "r2",
      field: "alpha",
      input: "fixed",
      by: "reviewer-1",
      provenance: "manual-review",
    });
  });

  it("a non-editable column cannot be edited", () => {
    renderPanel();
    const cell = screen.getByRole("button", { name: "edit Gamma" }) as HTMLButtonElement;
    expect(cell.disabled).toBe(true);
  });

  it("prev/next navigate between rows and are disabled at the ends", () => {
    const { onNavigate, rerender } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "P-next" }));
    expect(onNavigate).toHaveBeenLastCalledWith("r3");
    fireEvent.click(screen.getByRole("button", { name: "P-prev" }));
    expect(onNavigate).toHaveBeenLastCalledWith("r1");
    rerender(
      <MosaicDocumentCriteriaPanel
        row={rows[0]}
        rowId="r1"
        columns={columns}
        documentUrl="/doc.pdf"
        orderedRowIds={["r1", "r2", "r3"]}
        onNavigate={onNavigate}
        onCorrect={vi.fn()}
        actor="reviewer-1"
        correctionProvenance="manual-review"
        provenanceLabel={() => null}
        labels={labels}
      />,
    );
    expect((screen.getByRole("button", { name: "P-prev" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("MosaicDocumentTable", () => {
  // The table renders through GrilleRegistre (AG Grid), and jsdom reports every
  // element at 0x0: AG Grid needs a real size to render its rows. Restored after.
  const sized = ["clientWidth", "offsetWidth", "clientHeight", "offsetHeight"] as const;
  const saved = sized.map((prop) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop));
  beforeAll(() => {
    for (const prop of sized) {
      const value = prop.endsWith("Width") ? 1200 : 600;
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value });
    }
  });
  afterAll(() => {
    sized.forEach((prop, i) => {
      const descriptor = saved[i];
      if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
    });
  });

  // AG Grid renders its header and rows asynchronously after mount, and fires
  // `cellClicked` asynchronously too: every test waits for the grid to settle
  // before it reads the DOM, and for the selection after a click.
  async function settled(container: HTMLElement, rowCount: number) {
    await waitFor(() => {
      expect(container.querySelector(".ag-header-cell")).not.toBeNull();
      expect(container.querySelectorAll(".ag-row")).toHaveLength(rowCount);
    });
  }

  async function renderTable() {
    const utils = render(
      <MosaicDocumentTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
        renderPanel={(row, ctx) => (
          <MosaicDocumentCriteriaPanel
            row={row}
            rowId={ctx.rowId}
            columns={columns}
            documentUrl="/doc.pdf"
            orderedRowIds={ctx.orderedRowIds}
            onNavigate={ctx.selectRow}
            onCorrect={vi.fn()}
            actor="reviewer-1"
            correctionProvenance="manual-review"
            provenanceLabel={() => null}
            labels={labels}
          />
        )}
      />,
    );
    await settled(utils.container, rows.length);
    return utils;
  }

  const firstColumnTexts = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("[data-slot='document-table-open']")).map(
      (el) => el.textContent,
    );

  it("renders only the visible columns of the model", async () => {
    await renderTable();
    expect(screen.getByRole("columnheader", { name: "Alpha" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Gamma" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Beta" })).toBeNull();
  });

  it("honours a controlled columnVisibility override", async () => {
    const { container } = render(
      <MosaicDocumentTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
        columnVisibility={{ beta: true, alpha: false }}
      />,
    );
    await settled(container, rows.length);
    expect(screen.getByRole("columnheader", { name: "Beta" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Alpha" })).toBeNull();
  });

  it("(c) opens the panel on row selection, with Compare active, and navigates", async () => {
    const { container } = await renderTable();
    expect(container.querySelector("[data-slot='document-criteria-panel']")).toBeNull();
    fireEvent.click(screen.getByText("a2"));
    await waitFor(() =>
      expect(container.querySelector("[data-slot='document-criteria-panel']")).toBeTruthy(),
    );
    const panel = container.querySelector("[data-slot='document-criteria-panel']") as HTMLElement;
    expect(
      within(panel).getByRole("tab", { name: "T-compare" }).getAttribute("aria-selected"),
    ).toBe("true");
    const selected = container.querySelectorAll(
      "[data-slot='document-table-open'][data-selected='true']",
    );
    expect(selected).toHaveLength(1);
    fireEvent.click(within(panel).getByRole("button", { name: "P-next" }));
    expect(
      container.querySelector("[data-slot='document-table-open'][data-selected='true']")
        ?.textContent,
    ).toBe("a3");
  });

  it("selects a row from the keyboard: the first cell is a real button", async () => {
    const { container } = await renderTable();
    const button = screen.getByRole("button", { name: "a1" });
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button); // a button's Enter/Space activation is delivered as a click
    await waitFor(() =>
      expect(
        container
          .querySelector("[data-slot='document-criteria-panel']")
          ?.getAttribute("data-row-id"),
      ).toBe("r1"),
    );
  });

  it("each row's button is its keyboard stop: grid cells take no tab focus of their own", async () => {
    const { container } = await renderTable();
    const cells = Array.from(container.querySelectorAll(".ag-row .ag-cell"));
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) expect(cell.getAttribute("tabindex")).not.toBe("0");
    for (const id of ["a1", "a2", "a3"]) {
      expect(screen.getByRole("button", { name: id }).tabIndex).toBe(0);
    }
  });

  it("shows emptyMessage when there are no rows", async () => {
    render(
      <MosaicDocumentTable
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
      />,
    );
    expect(await screen.findByText("nothing")).toBeTruthy();
  });

  it("renders through GrilleRegistre (AG Grid), never through MosaicDataTable", async () => {
    const { container } = await renderTable();
    const table = container.querySelector("[data-slot='document-table']") as HTMLElement;
    expect(table.querySelector(".ag-root-wrapper")).not.toBeNull();
    expect(container.querySelector("[data-slot='data-table']")).toBeNull();
    // The first column's button lives inside an AG Grid cell.
    expect(screen.getByRole("button", { name: "a1" }).closest(".ag-cell")).not.toBeNull();
  });

  it("a click on any cell of a row reports that row id, once (same payload as before)", async () => {
    const onSelectedRowChange = vi.fn();
    const { container } = render(
      <MosaicDocumentTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
        onSelectedRowChange={onSelectedRowChange}
      />,
    );
    await settled(container, rows.length);
    fireEvent.click(screen.getByText("g2"));
    await waitFor(() => expect(onSelectedRowChange).toHaveBeenCalledTimes(1));
    expect(onSelectedRowChange).toHaveBeenLastCalledWith("r2");
    fireEvent.click(screen.getByRole("button", { name: "a3" }));
    await waitFor(() => expect(onSelectedRowChange).toHaveBeenCalledTimes(2));
    expect(onSelectedRowChange).toHaveBeenLastCalledWith("r3");
  });

  it("controlled selection: marks the host's row and leaves the move to the host", async () => {
    const onSelectedRowChange = vi.fn();
    const { container } = render(
      <MosaicDocumentTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
        selectedRowId="r2"
        onSelectedRowChange={onSelectedRowChange}
      />,
    );
    await settled(container, rows.length);
    const marked = () =>
      Array.from(
        container.querySelectorAll("[data-slot='document-table-open'][data-selected='true']"),
      ).map((el) => el.textContent);
    expect(marked()).toEqual(["a2"]);
    expect(screen.getByRole("button", { name: "a2" }).getAttribute("aria-current")).toBe("true");
    fireEvent.click(screen.getByText("a3"));
    await waitFor(() => expect(onSelectedRowChange).toHaveBeenLastCalledWith("r3"));
    expect(marked()).toEqual(["a2"]);
  });

  it("keeps the host's row order: the grid neither sorts nor filters", async () => {
    const { container } = await renderTable();
    expect(firstColumnTexts(container)).toEqual(["a1", "a2", "a3"]);
    expect(container.querySelector(".ag-floating-filter")).toBeNull();
    fireEvent.click(screen.getByRole("columnheader", { name: "Alpha" }));
    expect(firstColumnTexts(container)).toEqual(["a1", "a2", "a3"]);
  });

  it("shows emptyMessage inside the grid when there are no rows", async () => {
    const { container } = render(
      <MosaicDocumentTable
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        emptyMessage="nothing"
      />,
    );
    const message = await screen.findByText("nothing");
    expect(container.querySelector(".ag-root-wrapper")).not.toBeNull();
    expect(message.closest(".ag-root-wrapper")).not.toBeNull();
  });
});
