/**
 * MosaicDataTable — tests
 *
 * Coverage: renders headers + rows, custom render fn, sortable header (asc/desc),
 * emptyState slot, data-slot attributes, getRowKey, aria-sort.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { MosaicDataTableColumn } from "./MosaicDataTable.js";
import { MosaicDataTable } from "./MosaicDataTable.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  score: number;
  status: string;
}

const agents: Agent[] = [
  { id: "a1", name: "Sigma", score: 90, status: "active" },
  { id: "a2", name: "Alpha", score: 70, status: "idle" },
  { id: "a3", name: "Gamma", score: 80, status: "active" },
];

const columns: MosaicDataTableColumn<Agent>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "score", header: "Score", sortable: true, align: "right" },
  { key: "status", header: "Status" },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MosaicDataTable", () => {
  it("renders column headers", () => {
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Score")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
  });

  it("renders all row data", () => {
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Sigma")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  it("uses custom render fn for cell display", () => {
    const customColumns: MosaicDataTableColumn<Agent>[] = [
      ...columns,
      {
        key: "status",
        header: "Status Label",
        render: (row) => `[${row.status.toUpperCase()}]`,
      },
    ];
    render(<MosaicDataTable columns={customColumns} rows={agents} getRowKey={(r) => r.id} />);
    expect(screen.getAllByText("[ACTIVE]").length).toBeGreaterThan(0);
    expect(screen.getByText("[IDLE]")).toBeTruthy();
  });

  it("renders both columns when two columns share the same key (duplicate-key scenario)", () => {
    // Two columns share key="status": one default render, one custom render.
    // With key={col.key}, React would emit a duplicate-key warning and potentially
    // drop one of the two columns. With key={colIndex}, both must render.
    const dupKeyColumns: MosaicDataTableColumn<Agent>[] = [
      { key: "name", header: "Name" },
      { key: "status", header: "Status (raw)" },
      { key: "status", header: "Status (label)", render: (row) => `[${row.status.toUpperCase()}]` },
    ];
    render(<MosaicDataTable columns={dupKeyColumns} rows={agents} getRowKey={(r) => r.id} />);

    // Both header cells must be present
    expect(screen.getByText("Status (raw)")).toBeTruthy();
    expect(screen.getByText("Status (label)")).toBeTruthy();

    // Both body renders must be present: raw value "active" and custom "[ACTIVE]"
    // agents has 2 active + 1 idle
    const rawActives = screen.getAllByText("active");
    expect(rawActives.length).toBeGreaterThanOrEqual(2);
    const labelledActives = screen.getAllByText("[ACTIVE]");
    expect(labelledActives.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("[IDLE]")).toBeTruthy();
  });

  it("shows emptyState when rows is empty", () => {
    render(<MosaicDataTable columns={columns} rows={[]} emptyState={<span>Aucune donnée</span>} />);
    expect(screen.getByText("Aucune donnée")).toBeTruthy();
  });

  it("shows default No data text when rows is empty and no emptyState", () => {
    render(<MosaicDataTable columns={columns} rows={[]} />);
    expect(screen.getByText("No data")).toBeTruthy();
  });

  it("sets data-slot='data-table' on the root element", () => {
    const { container } = render(
      <MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />,
    );
    const table = container.querySelector("[data-slot='data-table']");
    expect(table).toBeTruthy();
    expect(table?.tagName.toLowerCase()).toBe("table");
  });

  it("sets data-slot on thead, tbody, th, td", () => {
    const { container } = render(
      <MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />,
    );
    expect(container.querySelector("[data-slot='data-table-header']")).toBeTruthy();
    expect(container.querySelector("[data-slot='data-table-body']")).toBeTruthy();
    expect(container.querySelector("[data-slot='data-table-th']")).toBeTruthy();
    expect(container.querySelector("[data-slot='data-table-td']")).toBeTruthy();
  });

  it("sets scope='col' on all th elements", () => {
    const { container } = render(
      <MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />,
    );
    const headers = container.querySelectorAll("th");
    for (const th of headers) {
      expect(th.getAttribute("scope")).toBe("col");
    }
  });

  it("clicking a sortable header sorts rows ascending then descending", async () => {
    const user = userEvent.setup();
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);

    // Initial order: Sigma, Alpha, Gamma
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    // After first click: asc by name → Alpha, Gamma, Sigma
    const rows = screen.getAllByRole("row");
    // rows[0] is header, rows[1..3] are data rows
    expect(rows[1].textContent).toContain("Alpha");
    expect(rows[2].textContent).toContain("Gamma");
    expect(rows[3].textContent).toContain("Sigma");
  });

  it("clicking a sorted header again reverses to descending", async () => {
    const user = userEvent.setup();
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);

    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader); // asc
    await user.click(nameHeader); // desc

    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("Sigma");
    expect(rows[2].textContent).toContain("Gamma");
    expect(rows[3].textContent).toContain("Alpha");
  });

  it("sorts numeric columns correctly (ascending)", async () => {
    const user = userEvent.setup();
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);

    const scoreHeader = screen.getByText("Score");
    await user.click(scoreHeader);

    const rows = screen.getAllByRole("row");
    // score asc: 70 (Alpha), 80 (Gamma), 90 (Sigma)
    expect(rows[1].textContent).toContain("70");
    expect(rows[2].textContent).toContain("80");
    expect(rows[3].textContent).toContain("90");
  });

  it("sets aria-sort on the sorted column header", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />,
    );

    const nameHeader = screen.getByText("Name").closest("th");
    expect(nameHeader?.getAttribute("aria-sort")).toBe("none");

    await user.click(screen.getByText("Name"));
    expect(nameHeader?.getAttribute("aria-sort")).toBe("ascending");

    await user.click(screen.getByText("Name"));
    expect(nameHeader?.getAttribute("aria-sort")).toBe("descending");

    // Unsorted column remains "none"
    const statusTh = container.querySelectorAll("th")[2];
    expect(statusTh?.getAttribute("aria-sort")).toBe("none");
  });

  it("non-sortable column header does not sort when clicked", async () => {
    const user = userEvent.setup();
    render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />);

    const statusHeader = screen.getByText("Status");
    await user.click(statusHeader);

    // Order should remain as-is (original): Sigma, Alpha, Gamma
    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("Sigma");
  });

  it("getRowKey is used for stable keys (no error thrown)", () => {
    expect(() =>
      render(<MosaicDataTable columns={columns} rows={agents} getRowKey={(r) => r.id} />),
    ).not.toThrow();
  });
});
