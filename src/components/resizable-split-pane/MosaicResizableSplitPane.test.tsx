/**
 * MosaicResizableSplitPane — tests
 *
 * Coverage: renders main/side; dragging the handle calls onSideWidthChange;
 * toggling collapse calls onToggleSideCollapsed and hides side when
 * isSideCollapsed; aria-label wiring on both interactive elements; keyboard
 * resize via arrow keys on the separator; listener cleanup on unmount
 * (proven by mutation — see the dedicated describe block below).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicResizableSplitPane } from "./MosaicResizableSplitPane.js";

function stubRootRect(root: HTMLElement) {
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
    width: 1000,
    height: 600,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  });
}

describe("MosaicResizableSplitPane", () => {
  it("sets data-slot='resizable-split-pane' on the root", () => {
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    expect(container.querySelector("[data-slot='resizable-split-pane']")).toBeTruthy();
  });

  it("renders both main and side content", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main content</div>}
        side={<div>Side content</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    expect(screen.getByText("Main content")).toBeTruthy();
    expect(screen.getByText("Side content")).toBeTruthy();
  });

  it("wires collapseButtonAriaLabel and resizeHandleAriaLabel onto the correct elements", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Replier le panneau"
        resizeHandleAriaLabel="Redimensionner le panneau"
      />,
    );
    expect(screen.getByRole("button", { name: "Replier le panneau" })).toBeTruthy();
    expect(screen.getByRole("separator", { name: "Redimensionner le panneau" })).toBeTruthy();
  });

  it("calls onToggleSideCollapsed when the collapse button is activated", () => {
    const onToggleSideCollapsed = vi.fn();
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
        onToggleSideCollapsed={onToggleSideCollapsed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
    expect(onToggleSideCollapsed).toHaveBeenCalledTimes(1);
  });

  it("hides side content and the resize handle when isSideCollapsed is true", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side content</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
        isSideCollapsed
      />,
    );
    expect(screen.queryByText("Side content")).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
  });

  it("shows side content and the resize handle when isSideCollapsed is false", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side content</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
        isSideCollapsed={false}
      />,
    );
    expect(screen.getByText("Side content")).toBeTruthy();
    expect(screen.getByRole("separator")).toBeTruthy();
  });

  it("calls onSideWidthChange while dragging the handle (pointerdown + pointermove on window)", () => {
    const onSideWidthChange = vi.fn();
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={30}
        onSideWidthChange={onSideWidthChange}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const root = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
    stubRootRect(root);
    const handle = screen.getByRole("separator");

    fireEvent.pointerDown(handle);
    // Dragging the pointer to clientX=800 on a 1000px-wide root, right edge
    // at 1000 -> distanceFromRight=200 -> 20% side width.
    fireEvent.pointerMove(window, { clientX: 800 });
    expect(onSideWidthChange).toHaveBeenCalledWith(20);
  });

  it("does not call onSideWidthChange on pointermove before pointerdown on the handle", () => {
    const onSideWidthChange = vi.fn();
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={30}
        onSideWidthChange={onSideWidthChange}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const root = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
    stubRootRect(root);

    fireEvent.pointerMove(window, { clientX: 800 });
    expect(onSideWidthChange).not.toHaveBeenCalled();
  });

  it("stops reporting width changes after pointerup", () => {
    const onSideWidthChange = vi.fn();
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={30}
        onSideWidthChange={onSideWidthChange}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const root = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
    stubRootRect(root);
    const handle = screen.getByRole("separator");

    fireEvent.pointerDown(handle);
    fireEvent.pointerMove(window, { clientX: 800 });
    expect(onSideWidthChange).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(window);
    fireEvent.pointerMove(window, { clientX: 500 });
    expect(onSideWidthChange).toHaveBeenCalledTimes(1);
  });

  it("clamps dragged width between the min and max bounds", () => {
    const onSideWidthChange = vi.fn();
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={30}
        onSideWidthChange={onSideWidthChange}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const root = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
    stubRootRect(root);
    const handle = screen.getByRole("separator");

    fireEvent.pointerDown(handle);
    // clientX=50 on a 1000px root -> distanceFromRight=950 -> 95%, clamped to 70.
    fireEvent.pointerMove(window, { clientX: 50 });
    expect(onSideWidthChange).toHaveBeenCalledWith(70);

    onSideWidthChange.mockClear();
    // clientX=990 -> distanceFromRight=10 -> 1%, clamped to 15.
    fireEvent.pointerMove(window, { clientX: 990 });
    expect(onSideWidthChange).toHaveBeenCalledWith(15);
  });

  it("increases sideWidth on ArrowRight and decreases on ArrowLeft via keyboard", () => {
    const onSideWidthChange = vi.fn();
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={30}
        onSideWidthChange={onSideWidthChange}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onSideWidthChange).toHaveBeenCalledWith(35);
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onSideWidthChange).toHaveBeenCalledWith(25);
  });

  it("exposes aria-orientation and aria-valuenow on the separator for assistive tech", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        sideWidth={42}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const handle = screen.getByRole("separator");
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(handle.getAttribute("aria-valuenow")).toBe("42");
  });

  it("is reachable via keyboard (tabIndex=0) without any pointer interaction", () => {
    render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    const handle = screen.getByRole("separator");
    expect(handle.getAttribute("tabindex")).toBe("0");
  });

  it("applies the custom className to the root", () => {
    const { container } = render(
      <MosaicResizableSplitPane
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
        className="my-extra-class"
      />,
    );
    expect(container.querySelector(".my-extra-class")).toBeTruthy();
  });

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <MosaicResizableSplitPane
        ref={ref}
        main={<div>Main</div>}
        side={<div>Side</div>}
        collapseButtonAriaLabel="Collapse"
        resizeHandleAriaLabel="Resize"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.dataset.slot).toBe("resizable-split-pane");
  });

  describe("window listener cleanup on unmount", () => {
    it("removes exactly the pointermove/pointerup listeners it added, on unmount", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <MosaicResizableSplitPane
          main={<div>Main</div>}
          side={<div>Side</div>}
          collapseButtonAriaLabel="Collapse"
          resizeHandleAriaLabel="Resize"
        />,
      );

      const addedMoveHandler = addSpy.mock.calls.find((call) => call[0] === "pointermove")?.[1];
      const addedUpHandler = addSpy.mock.calls.find((call) => call[0] === "pointerup")?.[1];
      expect(addedMoveHandler).toBeDefined();
      expect(addedUpHandler).toBeDefined();

      unmount();

      const removedMoveHandler = removeSpy.mock.calls.find(
        (call) => call[0] === "pointermove",
      )?.[1];
      const removedUpHandler = removeSpy.mock.calls.find((call) => call[0] === "pointerup")?.[1];
      expect(removedMoveHandler).toBe(addedMoveHandler);
      expect(removedUpHandler).toBe(addedUpHandler);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("no longer calls onSideWidthChange on pointermove after unmount (behavioral proof, not just spy-call proof)", () => {
      const onSideWidthChange = vi.fn();
      const { container, unmount } = render(
        <MosaicResizableSplitPane
          main={<div>Main</div>}
          side={<div>Side</div>}
          sideWidth={30}
          onSideWidthChange={onSideWidthChange}
          collapseButtonAriaLabel="Collapse"
          resizeHandleAriaLabel="Resize"
        />,
      );
      const root = container.querySelector("[data-slot='resizable-split-pane']") as HTMLElement;
      stubRootRect(root);
      const handle = screen.getByRole("separator");
      fireEvent.pointerDown(handle);

      unmount();

      fireEvent.pointerMove(window, { clientX: 800 });
      expect(onSideWidthChange).not.toHaveBeenCalled();
    });
  });
});
