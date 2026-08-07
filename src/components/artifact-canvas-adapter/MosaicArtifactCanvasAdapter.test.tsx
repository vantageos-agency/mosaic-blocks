import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MosaicArtifactCanvasAdapter } from "./MosaicArtifactCanvasAdapter.js";
import type { ArtifactType } from "./types.js";

const typeLabel = (t: ArtifactType) =>
  ({ document: "Document", "data-table": "Table", checklist: "Checklist", chart: "Chart" })[t];

const labels = {
  toggleLabel: "Open canvas",
  closeLabel: "Close",
  toolbarHeading: "Collaborative canvas",
  emptyTitle: "No artifact selected",
  emptyBody: "Create or select an artifact",
  notFoundTitle: "Artifact not found",
  notFoundBody: "The requested artifact could not be loaded",
  typeLabel,
};

describe("MosaicArtifactCanvasAdapter", () => {
  it("renders the toggle button with the required aria-label", () => {
    render(
      <MosaicArtifactCanvasAdapter
        source={null}
        isOpen={false}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );
    expect(screen.getByRole("button", { name: "Open canvas" })).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("calls onToggle when the toggle button is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <MosaicArtifactCanvasAdapter
        source={null}
        isOpen={false}
        onToggle={onToggle}
        onClose={() => {}}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open canvas" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows the empty state when open with no source", () => {
    render(
      <MosaicArtifactCanvasAdapter
        source={null}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );
    expect(screen.getByText("No artifact selected")).toBeTruthy();
  });

  it("shows the not-found state when the source normalizes to null", () => {
    render(
      <MosaicArtifactCanvasAdapter
        source={{ kind: "ai-sdk-artifacts", artifacts: [], activeId: "missing" }}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );
    expect(screen.getByText("Artifact not found")).toBeTruthy();
  });

  it("closes via onClose from the toolbar close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MosaicArtifactCanvasAdapter
        source={null}
        isOpen={true}
        onToggle={() => {}}
        onClose={onClose}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("sets data-slot='artifact-canvas-adapter' on the root", () => {
    render(
      <MosaicArtifactCanvasAdapter
        source={null}
        isOpen={false}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );
    expect(document.querySelector("[data-slot='artifact-canvas-adapter']")).toBeTruthy();
  });
});
