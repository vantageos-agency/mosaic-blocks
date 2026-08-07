import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicArtifactVersionHistory } from "./MosaicArtifactVersionHistory.js";
import type { MosaicArtifactVersionHistoryVersion } from "./MosaicArtifactVersionHistory.js";

const versions: MosaicArtifactVersionHistoryVersion[] = [
  {
    id: "v-1",
    versionLabel: "v1",
    authorLabel: "Alice",
    timestampLabel: "3 days ago",
    changeTypeLabel: "Created",
    descriptionLabel: "Initial draft",
    isCurrent: false,
  },
  {
    id: "v-2",
    versionLabel: "v2",
    authorLabel: "Bob",
    timestampLabel: "1 day ago",
    changeTypeLabel: "Edited",
    descriptionLabel: "Fixed numbers",
    isCurrent: false,
  },
  {
    id: "v-3",
    versionLabel: "v3",
    authorLabel: "Alice",
    timestampLabel: "Just now",
    changeTypeLabel: "Edited",
    descriptionLabel: "Final pass",
    isCurrent: true,
  },
];

function renderWithRestore(
  overrides: Partial<React.ComponentProps<typeof MosaicArtifactVersionHistory>> = {},
) {
  const onSelectVersion = vi.fn();
  const onRestoreVersion = vi.fn();
  const utils = render(
    <MosaicArtifactVersionHistory
      versions={versions}
      selectedId={null}
      onSelectVersion={onSelectVersion}
      onRestoreVersion={onRestoreVersion}
      title="Version History"
      emptyMessage="No versions found."
      currentLabel="Latest"
      restoreLabel="Restore"
      restoreAriaLabel={(v) => `Restore ${v.versionLabel}`}
      selectAriaLabel={(v) => `Open ${v.versionLabel}`}
      {...overrides}
    />,
  );
  return { ...utils, onSelectVersion, onRestoreVersion };
}

function renderReadOnly() {
  const onSelectVersion = vi.fn();
  const utils = render(
    <MosaicArtifactVersionHistory
      versions={versions}
      selectedId={null}
      onSelectVersion={onSelectVersion}
      title="Version History"
      emptyMessage="No versions found."
      currentLabel="Latest"
      selectAriaLabel={(v) => `Open ${v.versionLabel}`}
    />,
  );
  return { ...utils, onSelectVersion };
}

describe("MosaicArtifactVersionHistory", () => {
  it("renders every version's label, author, timestamp and change type", () => {
    renderWithRestore();
    expect(screen.getByText("v1")).toBeTruthy();
    expect(screen.getAllByText("Alice").length).toBe(2);
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("3 days ago")).toBeTruthy();
    expect(screen.getAllByText("Edited").length).toBeGreaterThan(0);
  });

  it("renders the title and empty message when there are no versions", () => {
    renderWithRestore({ versions: [] });
    expect(screen.getByText("Version History")).toBeTruthy();
    expect(screen.getByText("No versions found.")).toBeTruthy();
  });

  it("calls onSelectVersion with the version id when a version is selected", () => {
    const { onSelectVersion } = renderWithRestore();
    fireEvent.click(screen.getByRole("button", { name: "Open v1" }));
    expect(onSelectVersion).toHaveBeenCalledWith("v-1");
  });

  it("marks the selected version with aria-current", () => {
    renderWithRestore({ selectedId: "v-2" });
    const button = screen.getByRole("button", { name: "Open v2" });
    expect(button.getAttribute("aria-current")).toBe("true");
  });

  it("shows the current-version badge only on the item flagged isCurrent", () => {
    renderWithRestore();
    expect(screen.getByText("Latest")).toBeTruthy();
    expect(screen.getAllByText("Latest").length).toBe(1);
  });

  it("calls onRestoreVersion with the version id when restore is clicked, but never for the current version", () => {
    const { onRestoreVersion } = renderWithRestore();
    expect(screen.queryByRole("button", { name: "Restore v3" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Restore v1" }));
    expect(onRestoreVersion).toHaveBeenCalledWith("v-1");
  });

  it("does not render restore buttons when onRestoreVersion is not provided (read-only variant)", () => {
    renderReadOnly();
    expect(screen.queryByRole("button", { name: "Restore v1" })).toBeNull();
  });

  it("uses a semantic list for the version timeline", () => {
    renderWithRestore();
    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("gives every version's restore control a DISTINCTIVE accessible name — never a shared static label", () => {
    renderWithRestore();
    // Two non-current versions render restore controls; each must expose a
    // name that distinguishes which version it restores. A single shared
    // "Restore" name would make getByRole ambiguous/fail here.
    const restoreV1 = screen.getByRole("button", { name: "Restore v1" });
    const restoreV2 = screen.getByRole("button", { name: "Restore v2" });
    expect(restoreV1).not.toBe(restoreV2);
    expect(restoreV1.getAttribute("aria-label")).toBe("Restore v1");
    expect(restoreV2.getAttribute("aria-label")).toBe("Restore v2");
    // The restore control's visible text is host-owned via restoreLabel and
    // may be identical across versions ("Restore") — it is the ACCESSIBLE
    // NAME (aria-label) that must be distinctive, not the visible text.
    expect(restoreV1.textContent).toBe("Restore");
    expect(restoreV2.textContent).toBe("Restore");
  });
});
