/**
 * MosaicArtifactDataTable — tests
 *
 * Coverage: renders title + row/col count badge, columns as headers, rows as
 * cells, boolean/number typed cell rendering, empty-rows fallback, data-slot
 * anchors.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MosaicArtifactDataTableData } from "./MosaicArtifactDataTable.js";
import { MosaicArtifactDataTable } from "./MosaicArtifactDataTable.js";

const labels = {
  typeBadgeLabel: "Data Table",
  rowsColsLabel: (rows: number, cols: number) => `${rows} rows × ${cols} cols`,
  emptyMessage: "No rows.",
  yesLabel: "Yes",
  noLabel: "No",
};

const data: MosaicArtifactDataTableData = {
  title: "Q3 pipeline",
  columns: [
    { id: "name", name: "Name", type: "string" },
    { id: "score", name: "Score", type: "number" },
    { id: "active", name: "Active", type: "boolean" },
  ],
  rows: [
    { name: "Sigma", score: 90, active: true },
    { name: "Alpha", score: 70, active: false },
  ],
};

describe("MosaicArtifactDataTable", () => {
  it("renders title and row/col count badge", () => {
    render(<MosaicArtifactDataTable data={data} labels={labels} />);
    expect(screen.getByText("Q3 pipeline")).toBeTruthy();
    expect(screen.getByText("2 rows × 3 cols")).toBeTruthy();
  });

  it("sets data-slot='artifact-data-table' on root", () => {
    render(<MosaicArtifactDataTable data={data} labels={labels} />);
    expect(document.querySelector("[data-slot='artifact-data-table']")).toBeTruthy();
  });

  it("renders column headers and row cells", () => {
    render(<MosaicArtifactDataTable data={data} labels={labels} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Sigma")).toBeTruthy();
    expect(screen.getByText("90")).toBeTruthy();
  });

  it("renders boolean cells via the required Yes/No labels", () => {
    render(<MosaicArtifactDataTable data={data} labels={labels} />);
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("renders the empty message when there are no rows", () => {
    render(
      <MosaicArtifactDataTable
        data={{ title: "Empty", columns: data.columns, rows: [] }}
        labels={labels}
      />,
    );
    expect(screen.getByText("No rows.")).toBeTruthy();
  });
});
