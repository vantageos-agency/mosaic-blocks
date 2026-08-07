/**
 * MosaicArtifactChecklist — tests
 *
 * Coverage: renders title + progress badge, item text + completed strike-
 * through, priority badge, progressbar aria-valuenow, empty-items fallback,
 * data-slot anchors.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MosaicArtifactChecklistData } from "./MosaicArtifactChecklist.js";
import { MosaicArtifactChecklist } from "./MosaicArtifactChecklist.js";

const labels = {
  typeBadgeLabel: "Checklist",
  progressLabel: (completed: number, total: number) => `${completed}/${total}`,
  completedOfTotalLabel: (completed: number, total: number, percent: number) =>
    `${completed} of ${total} completed (${percent}%)`,
  emptyMessage: "No items yet.",
  priorityLabel: (priority: "low" | "medium" | "high") =>
    ({ low: "Low", medium: "Medium", high: "High" })[priority],
};

const data: MosaicArtifactChecklistData = {
  title: "Launch checklist",
  items: [
    { id: "i1", text: "Ship PR", completed: true, priority: "high" },
    { id: "i2", text: "Notify team", completed: false, priority: "medium" },
  ],
};

describe("MosaicArtifactChecklist", () => {
  it("renders title and completed/total badge", () => {
    render(<MosaicArtifactChecklist data={data} labels={labels} />);
    expect(screen.getByText("Launch checklist")).toBeTruthy();
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("sets data-slot='artifact-checklist' on root", () => {
    render(<MosaicArtifactChecklist data={data} labels={labels} />);
    expect(document.querySelector("[data-slot='artifact-checklist']")).toBeTruthy();
  });

  it("renders item text and a completed item struck through", () => {
    render(<MosaicArtifactChecklist data={data} labels={labels} />);
    const shipped = screen.getByText("Ship PR");
    expect(shipped.className).toContain("line-through");
    const pending = screen.getByText("Notify team");
    expect(pending.className).not.toContain("line-through");
  });

  it("renders priority badges via the required label function", () => {
    render(<MosaicArtifactChecklist data={data} labels={labels} />);
    expect(screen.getByText("High")).toBeTruthy();
    expect(screen.getByText("Medium")).toBeTruthy();
  });

  it("exposes an accessible progressbar at 50%", () => {
    render(<MosaicArtifactChecklist data={data} labels={labels} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });

  it("renders the empty message when there are no items", () => {
    render(<MosaicArtifactChecklist data={{ title: "Empty", items: [] }} labels={labels} />);
    expect(screen.getByText("No items yet.")).toBeTruthy();
  });
});
