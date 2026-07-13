/**
 * MosaicPdfViewer — tests
 *
 * Coverage: renders with fileUrl; loadingLabel shown while loading; errorLabel
 * shown once the iframe reports an error; controlled page navigation
 * (currentPage/onPageChange); controlled zoom (zoom/onZoomChange); no network
 * call is ever emitted by the component itself.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MosaicPdfViewer } from "./MosaicPdfViewer.js";

describe("MosaicPdfViewer", () => {
  it("sets data-slot='pdf-viewer' on the root", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    expect(container.querySelector("[data-slot='pdf-viewer']")).toBeTruthy();
  });

  it("renders an iframe pointed at fileUrl", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    const frame = container.querySelector("[data-slot='pdf-viewer-frame']");
    expect(frame?.getAttribute("src")).toContain("https://example.com/doc.pdf");
  });

  it("shows loadingLabel before the iframe reports load/error", () => {
    render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Chargement…"
        errorLabel="Échec du chargement"
      />,
    );
    expect(screen.getByText("Chargement…")).toBeTruthy();
  });

  it("hides loadingLabel and reveals the frame once the iframe fires load", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Chargement…"
        errorLabel="Échec du chargement"
      />,
    );
    const frame = container.querySelector("[data-slot='pdf-viewer-frame']") as HTMLIFrameElement;
    fireEvent.load(frame);
    expect(screen.queryByText("Chargement…")).toBeNull();
  });

  it("shows errorLabel once the iframe fires error, and hides loadingLabel", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Chargement…"
        errorLabel="Échec du chargement"
      />,
    );
    const frame = container.querySelector("[data-slot='pdf-viewer-frame']") as HTMLIFrameElement;
    fireEvent.error(frame);
    expect(screen.getByText("Échec du chargement")).toBeTruthy();
    expect(screen.queryByText("Chargement…")).toBeNull();
  });

  it("uses role='alert' for the error region", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    const frame = container.querySelector("[data-slot='pdf-viewer-frame']") as HTMLIFrameElement;
    fireEvent.error(frame);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("resets to loading when fileUrl changes after a prior load", () => {
    const { container, rerender } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc-a.pdf"
        loadingLabel="Chargement…"
        errorLabel="Échec du chargement"
      />,
    );
    const frame = () =>
      container.querySelector("[data-slot='pdf-viewer-frame']") as HTMLIFrameElement;
    fireEvent.load(frame());
    expect(screen.queryByText("Chargement…")).toBeNull();

    rerender(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc-b.pdf"
        loadingLabel="Chargement…"
        errorLabel="Échec du chargement"
      />,
    );
    expect(screen.getByText("Chargement…")).toBeTruthy();
  });

  it("does not render page-navigation controls when currentPage is omitted", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    expect(container.querySelector("[data-slot='pdf-viewer-page-controls']")).toBeNull();
  });

  it("renders currentPage / totalPages and calls onPageChange when navigating", () => {
    const onPageChange = vi.fn();
    render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    expect(screen.getByText("2 / 5")).toBeTruthy();
    fireEvent.click(screen.getByText("›"));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByText("‹"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables the prev-page button on page 1 and the next-page button on the last page", () => {
    const onPageChange = vi.fn();
    render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChange}
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    fireEvent.click(screen.getByText("‹"));
    fireEvent.click(screen.getByText("›"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not render zoom controls when zoom is omitted", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    expect(container.querySelector("[data-slot='pdf-viewer-zoom-controls']")).toBeNull();
  });

  it("renders zoom percentage and calls onZoomChange when adjusting zoom", () => {
    const onZoomChange = vi.fn();
    render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        zoom={1}
        onZoomChange={onZoomChange}
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    expect(screen.getByText("100%")).toBeTruthy();
    fireEvent.click(screen.getByText("+"));
    expect(onZoomChange).toHaveBeenCalledWith(1.1);
    fireEvent.click(screen.getByText("−"));
    expect(onZoomChange).toHaveBeenCalledWith(0.9);
  });

  it("includes page and zoom in the iframe src fragment", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        currentPage={3}
        zoom={1.5}
        loadingLabel="Loading…"
        errorLabel="Failed to load"
      />,
    );
    const frame = container.querySelector("[data-slot='pdf-viewer-frame']");
    const src = frame?.getAttribute("src") ?? "";
    expect(src).toContain("page=3");
    expect(src).toContain("zoom=150");
  });

  it("applies the custom className to the root", () => {
    const { container } = render(
      <MosaicPdfViewer
        fileUrl="https://example.com/doc.pdf"
        loadingLabel="Loading…"
        errorLabel="Failed to load"
        className="my-extra-class"
      />,
    );
    expect(container.querySelector(".my-extra-class")).toBeTruthy();
  });

  describe("no network call is emitted by the component itself", () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(() => {
      throw new Error("MosaicPdfViewer must never call fetch() itself — the host owns fetch.");
    });

    beforeEach(() => {
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
      fetchMock.mockClear();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("never calls fetch on render, load, or error", () => {
      const { container } = render(
        <MosaicPdfViewer
          fileUrl="https://example.com/doc.pdf"
          currentPage={1}
          totalPages={2}
          zoom={1}
          loadingLabel="Loading…"
          errorLabel="Failed to load"
        />,
      );
      const frame = container.querySelector("[data-slot='pdf-viewer-frame']") as HTMLIFrameElement;
      fireEvent.load(frame);
      fireEvent.error(frame);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
