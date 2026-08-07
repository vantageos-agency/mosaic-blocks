import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicArtifactLibrary } from "./MosaicArtifactLibrary.js";
import type { MosaicArtifactLibraryItem } from "./MosaicArtifactLibrary.js";

const items: MosaicArtifactLibraryItem[] = [
  { id: "art-1", type: "document", title: "Q3 Report", updatedAtLabel: "2 days ago" },
  { id: "art-2", type: "chart", title: "Revenue Chart", updatedAtLabel: "5 days ago" },
  { id: "art-3", type: "checklist", title: "Launch Checklist", updatedAtLabel: "Today" },
];

const labels = {
  title: "Artifact Library",
  searchPlaceholder: "Search artifacts…",
  searchAriaLabel: "Search artifacts",
  emptyMessage: "No artifacts found.",
  typeLabel: (type: MosaicArtifactLibraryItem["type"]) =>
    ({ document: "Document", "data-table": "Table", checklist: "Checklist", chart: "Chart" })[type],
  countLabel: (n: number) => `${n} artifacts`,
  adapterLabels: {
    toggleLabel: "Open canvas",
    closeLabel: "Close",
    toolbarHeading: "Artifact",
    emptyTitle: "No artifact selected",
    emptyBody: "Pick an artifact from the library.",
    notFoundTitle: "Artifact not found",
    notFoundBody: "This artifact could not be rendered.",
    typeLabel: (type: MosaicArtifactLibraryItem["type"]) =>
      ({ document: "Document", "data-table": "Table", checklist: "Checklist", chart: "Chart" })[
        type
      ],
  },
};

function renderLibrary(
  overrides: Partial<React.ComponentProps<typeof MosaicArtifactLibrary>> = {},
) {
  const onSelect = vi.fn();
  const onToggleCanvas = vi.fn();
  const onCloseCanvas = vi.fn();
  const utils = render(
    <MosaicArtifactLibrary
      items={items}
      selectedId={null}
      onSelect={onSelect}
      source={null}
      isCanvasOpen={false}
      onToggleCanvas={onToggleCanvas}
      onCloseCanvas={onCloseCanvas}
      {...labels}
      {...overrides}
    />,
  );
  return { ...utils, onSelect, onToggleCanvas, onCloseCanvas };
}

describe("MosaicArtifactLibrary", () => {
  it("renders every item title", () => {
    renderLibrary();
    expect(screen.getByText("Q3 Report")).toBeTruthy();
    expect(screen.getByText("Revenue Chart")).toBeTruthy();
    expect(screen.getByText("Launch Checklist")).toBeTruthy();
  });

  it("filters items by search query", () => {
    renderLibrary();
    const input = screen.getByPlaceholderText("Search artifacts…");
    fireEvent.change(input, { target: { value: "revenue" } });
    expect(screen.queryByText("Q3 Report")).toBeNull();
    expect(screen.getByText("Revenue Chart")).toBeTruthy();
  });

  it("shows the empty message when the search matches nothing", () => {
    renderLibrary();
    const input = screen.getByPlaceholderText("Search artifacts…");
    fireEvent.change(input, { target: { value: "no-match-xyz" } });
    expect(screen.getByText("No artifacts found.")).toBeTruthy();
  });

  it("calls onSelect with the item id when an item is clicked", () => {
    const { onSelect } = renderLibrary();
    fireEvent.click(screen.getByText("Q3 Report"));
    expect(onSelect).toHaveBeenCalledWith("art-1");
  });

  it("marks the selected item with aria-current", () => {
    renderLibrary({ selectedId: "art-2" });
    const button = screen.getByRole("button", { name: /Revenue Chart/ });
    expect(button.getAttribute("aria-current")).toBe("true");
  });

  it("opens the artifact canvas adapter and forwards the source", () => {
    renderLibrary({
      selectedId: "art-1",
      isCanvasOpen: true,
      source: {
        kind: "ai-sdk-artifacts",
        artifacts: [
          { id: "art-1", type: "document", data: { title: "Q3 Report", content: "Body" } },
        ],
        activeId: "art-1",
      },
    });
    expect(screen.getByText("Q3 Report", { selector: "h3" })).toBeTruthy();
  });

  it("exposes the search input's accessible name via the required searchAriaLabel prop", () => {
    renderLibrary();
    const input = screen.getByRole("searchbox", { name: "Search artifacts" });
    expect(input.getAttribute("aria-label")).toBe("Search artifacts");
  });

  it("renders the type label for each item", () => {
    renderLibrary();
    expect(screen.getAllByText("Document").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chart").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Checklist").length).toBeGreaterThan(0);
  });
});
