/**
 * MosaicMemoryDashboard — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicMemoryDashboard.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MosaicMemoryDashboardStat } from "./MosaicMemoryDashboard.js";
import { MosaicMemoryDashboard } from "./MosaicMemoryDashboard.js";

const STATS: MosaicMemoryDashboardStat[] = [
  { label: "Total memories", value: "128" },
  { label: "Namespaces", value: "6" },
];

function baseProps() {
  return {
    title: "Knowledge base",
    addLabel: "Add memory",
    onAdd: vi.fn(),
    stats: STATS,
    viewMode: "tiles" as const,
    onViewModeChange: vi.fn(),
    tilesViewLabel: "Tiles",
    rowsViewLabel: "Rows",
  };
}

describe("MosaicMemoryDashboard", () => {
  it("sets data-slot='memory-dashboard' on the root element", () => {
    const { container } = render(<MosaicMemoryDashboard {...baseProps()} />);
    expect(container.querySelector("[data-slot='memory-dashboard']")).toBeTruthy();
  });

  it("renders the host-supplied title", () => {
    render(<MosaicMemoryDashboard {...baseProps()} />);
    expect(screen.getByText("Knowledge base")).toBeTruthy();
  });

  it("renders the host-supplied add-action label and calls onAdd when clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMemoryDashboard {...props} />);
    await user.click(screen.getByRole("button", { name: "Add memory" }));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("renders ONLY the host-supplied statistics — never an invented one", () => {
    const { container } = render(<MosaicMemoryDashboard {...baseProps()} />);
    expect(screen.getByText("Total memories")).toBeTruthy();
    expect(screen.getByText("128")).toBeTruthy();
    expect(screen.getByText("Namespaces")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    const statNodes = container.querySelectorAll("[data-slot='memory-dashboard-stat']");
    expect(statNodes).toHaveLength(STATS.length);
  });

  it("renders no statistic row when stats is empty", () => {
    const { container } = render(<MosaicMemoryDashboard {...baseProps()} stats={[]} />);
    expect(container.querySelectorAll("[data-slot='memory-dashboard-stat']")).toHaveLength(0);
  });

  it("renders the search slot content when provided", () => {
    render(
      <MosaicMemoryDashboard
        {...baseProps()}
        searchSlot={<input aria-label="Search memories" />}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Search memories" })).toBeTruthy();
  });

  it("renders no search region when searchSlot is not provided", () => {
    const { container } = render(<MosaicMemoryDashboard {...baseProps()} />);
    expect(container.querySelector("[data-slot='memory-dashboard-search']")).toBeFalsy();
  });

  it("renders both view-mode toggle buttons with host-supplied labels", () => {
    render(<MosaicMemoryDashboard {...baseProps()} />);
    expect(screen.getByRole("button", { name: "Tiles" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rows" })).toBeTruthy();
  });

  it("marks the current viewMode as pressed via aria-pressed, host-controlled", () => {
    render(<MosaicMemoryDashboard {...baseProps()} viewMode="rows" />);
    expect(screen.getByRole("button", { name: "Tiles" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("button", { name: "Rows" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onViewModeChange('rows') when the Rows toggle is clicked, without mutating viewMode itself", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMemoryDashboard {...props} />);
    await user.click(screen.getByRole("button", { name: "Rows" }));
    expect(props.onViewModeChange).toHaveBeenCalledWith("rows");
    // still "tiles" pressed because the component never holds its own state
    expect(screen.getByRole("button", { name: "Tiles" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("renders the host-supplied children in the results slot", () => {
    render(
      <MosaicMemoryDashboard {...baseProps()}>
        <p>Result item</p>
      </MosaicMemoryDashboard>,
    );
    expect(screen.getByText("Result item")).toBeTruthy();
  });

  it("sets data-slot='memory-dashboard-results' on the results region", () => {
    const { container } = render(
      <MosaicMemoryDashboard {...baseProps()}>
        <p>Result item</p>
      </MosaicMemoryDashboard>,
    );
    expect(container.querySelector("[data-slot='memory-dashboard-results']")).toBeTruthy();
  });

  it("accepts a className on the root element", () => {
    const { container } = render(
      <MosaicMemoryDashboard {...baseProps()} className="custom-class" />,
    );
    expect(container.querySelector("[data-slot='memory-dashboard']")?.className).toContain(
      "custom-class",
    );
  });
});
