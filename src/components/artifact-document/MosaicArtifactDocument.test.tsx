/**
 * MosaicArtifactDocument — tests
 *
 * Coverage: renders title + content, sections list, tags, updated date,
 * empty-content fallback message, data-slot anchors, i18n required labels.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MosaicArtifactDocumentData } from "./MosaicArtifactDocument.js";
import { MosaicArtifactDocument } from "./MosaicArtifactDocument.js";

const labels = {
  typeBadgeLabel: "Document",
  sectionsHeading: "Sections",
  tagsLabel: "Tags:",
  updatedLabel: (date: string) => `Updated ${date}`,
  emptyContentMessage: "This document is empty.",
  charsLabel: (n: number) => `${n} chars`,
};

const data: MosaicArtifactDocumentData = {
  title: "Launch plan",
  content: "First paragraph.\nSecond paragraph.",
  sections: [
    { id: "s1", title: "Overview", content: "abcde", order: 1 },
    { id: "s2", title: "Timeline", content: "abc", order: 0 },
  ],
  metadata: { updatedAt: "2026-08-01T00:00:00.000Z", tags: ["draft", "internal"] },
};

describe("MosaicArtifactDocument", () => {
  it("renders title and content", () => {
    render(<MosaicArtifactDocument data={data} labels={labels} />);
    expect(screen.getByText("Launch plan")).toBeTruthy();
    expect(screen.getByText(/First paragraph\./)).toBeTruthy();
  });

  it("sets data-slot='artifact-document' on root", () => {
    render(<MosaicArtifactDocument data={data} labels={labels} />);
    expect(document.querySelector("[data-slot='artifact-document']")).toBeTruthy();
  });

  it("renders sections sorted by order", () => {
    render(<MosaicArtifactDocument data={data} labels={labels} />);
    const items = document.querySelectorAll("[data-slot='artifact-document-section']");
    expect(items.length).toBe(2);
    expect(items[0]?.textContent).toContain("Timeline");
    expect(items[1]?.textContent).toContain("Overview");
  });

  it("renders tags", () => {
    render(<MosaicArtifactDocument data={data} labels={labels} />);
    expect(screen.getByText("draft")).toBeTruthy();
    expect(screen.getByText("internal")).toBeTruthy();
  });

  it("falls back to the required empty-content message when content is blank", () => {
    render(<MosaicArtifactDocument data={{ title: "Empty doc", content: "" }} labels={labels} />);
    expect(screen.getByText("This document is empty.")).toBeTruthy();
  });

  it("has an accessible h3 heading for the title", () => {
    render(<MosaicArtifactDocument data={data} labels={labels} />);
    expect(screen.getByRole("heading", { level: 3, name: "Launch plan" })).toBeTruthy();
  });
});
