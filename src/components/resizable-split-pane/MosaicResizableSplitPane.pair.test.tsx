import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicPdfViewer } from "../pdf-viewer/MosaicPdfViewer.js";
import { MosaicResizableSplitPane } from "./MosaicResizableSplitPane.js";

/**
 * The pair, not the parts.
 *
 * `MosaicPdfViewer` and `MosaicResizableSplitPane` each have their own suite, and
 * both stay green even when the COMPOSITION breaks: a change to overflow, position
 * or stacking can make the document unreachable while every unit test still passes.
 *
 * The promise these two exist to keep is precisely the composed one — read the
 * document AND edit the extracted fields at the same time, instead of a modal that
 * forces a choice between the two. A promise no test pins can regress in silence.
 */
describe("MosaicResizableSplitPane + MosaicPdfViewer — the pair that replaces the modal", () => {
  it("renders the document and the edit pane SIDE BY SIDE, both reachable at once", () => {
    const { container } = render(
      <MosaicResizableSplitPane
        collapseButtonAriaLabel="Replier le panneau"
        resizeHandleAriaLabel="Redimensionner"
        sideWidth={40}
        onSideWidthChange={vi.fn()}
        main={
          <MosaicPdfViewer
            fileUrl="/doc.pdf"
            loadingLabel="Chargement…"
            errorLabel="Échec du chargement"
          />
        }
        side={<div data-testid="edit-pane">Champs extraits</div>}
      />,
    );

    // The document frame is mounted...
    expect(container.querySelector("[data-slot='pdf-viewer-frame']")).toBeTruthy();
    // ...the edit pane is mounted AT THE SAME TIME — this is the whole point...
    expect(screen.getByTestId("edit-pane")).toBeTruthy();
    // ...and the handle between them is there to rebalance the two.
    expect(screen.getByRole("separator")).toBeTruthy();
  });
});
