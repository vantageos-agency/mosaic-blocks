/**
 * MosaicChatThread — tests
 *
 * Coverage: renders host-supplied children inside a `role="log"` scrollable
 * region; auto-scrolls to bottom (sets `scrollTop = scrollHeight`) when new
 * children arrive while the user was already at the bottom; does NOT
 * auto-scroll (and instead surfaces the "scroll to bottom" button) once the
 * user has scrolled up; the scroll button only appears once the user is away
 * from the bottom, carries the required `scrollToBottomLabel` accessible
 * name, and clicking it scrolls back to bottom and hides itself again;
 * custom className is applied to the root.
 *
 * The component never renders messages itself (no dependency on
 * MosaicChatMessage) — it only accepts `children`, exercised here via plain
 * `<div>` placeholders standing in for the host's message list.
 *
 * jsdom does not compute real layout, so `scrollHeight` / `clientHeight` /
 * `scrollTop` are stubbed per-test via `Object.defineProperty` on the
 * container element to simulate "at bottom" vs. "scrolled up" states.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicChatThread } from "./MosaicChatThread.js";

const SCROLL_LABEL = "Revenir au dernier message";

function stubScrollMetrics(
  element: HTMLElement,
  {
    scrollHeight,
    clientHeight,
    scrollTop,
  }: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(element, "clientHeight", { value: clientHeight, configurable: true });
  Object.defineProperty(element, "scrollTop", {
    value: scrollTop,
    configurable: true,
    writable: true,
  });
}

describe("MosaicChatThread", () => {
  it("sets data-slot='chat-thread' and role='log' on the root", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']");
    expect(root).toBeTruthy();
    expect(root?.getAttribute("role")).toBe("log");
  });

  it("renders the host-supplied children inside the content region", () => {
    render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>Bonjour le monde</div>
      </MosaicChatThread>,
    );
    expect(screen.getByText("Bonjour le monde")).toBeTruthy();
  });

  it("does not render the scroll-to-bottom button while already at the bottom", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  it("shows the scroll-to-bottom button, with the required label, once the user scrolls up", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']");
    if (!root) throw new Error("root not found");
    stubScrollMetrics(root as HTMLElement, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    fireEvent.scroll(root);

    const button = screen.getByRole("button", { name: SCROLL_LABEL });
    expect(button).toBeTruthy();
  });

  it("scrolls back to the bottom and hides the button when the scroll-to-bottom button is clicked", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });
    fireEvent.scroll(root);

    const button = screen.getByRole("button", { name: SCROLL_LABEL });
    fireEvent.click(button);

    expect(root.scrollTop).toBe(1000);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  it("auto-scrolls to bottom when new children arrive while already at the bottom", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 100 });

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 100 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(600);
  });

  it("does not auto-scroll when new children arrive after the user has scrolled up", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });
    fireEvent.scroll(root);

    stubScrollMetrics(root, { scrollHeight: 1200, clientHeight: 300, scrollTop: 100 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(100);
    expect(screen.getByRole("button", { name: SCROLL_LABEL })).toBeTruthy();
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL} className="my-custom-class">
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']");
    expect(root?.className).toContain("my-custom-class");
  });

  function fireSelectionChange(
    withRange: { node: Node; startOffset: number; endOffset: number } | null,
  ) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    if (withRange) {
      const range = document.createRange();
      range.setStart(withRange.node, withRange.startOffset);
      range.setEnd(withRange.node, withRange.endOffset);
      selection?.addRange(range);
    }
    document.dispatchEvent(new Event("selectionchange"));
  }

  it("disengages the bottom anchor when the user selects text inside the thread", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    const textNode = screen.getByText("message 1").firstChild as Text;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    fireSelectionChange({ node: textNode, startOffset: 0, endOffset: 7 });

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    // Selecting text disengaged the anchor: a new child must NOT force scroll.
    expect(root.scrollTop).toBe(0);
    expect(screen.getByRole("button", { name: SCROLL_LABEL })).toBeTruthy();
  });

  it("does NOT disengage on an empty selection (a plain click producing selectionchange)", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    // Empty selection: no range added, just the event firing (simple click).
    fireSelectionChange(null);

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    // Anchor remains engaged: still stuck to bottom, no scroll button.
    expect(root.scrollTop).toBe(600);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  /**
   * `selectionchange` fires on `document` — it is GLOBAL. Every selection
   * anywhere on the page reaches this thread's handler, including one made in
   * a completely unrelated pane.
   *
   * That is not hypothetical here: this library ships a split-pane whose whole
   * purpose is putting a document viewer BESIDE the editing surface. Selecting
   * a line in the document must not silently kill the thread's stick-to-bottom.
   *
   * The `container.contains(anchorNode)` guard is what prevents it — and a
   * guard nobody pins is a guard that will be refactored away.
   */
  it("does NOT disengage when the selection lands OUTSIDE the thread (a sibling pane)", () => {
    const outside = document.createElement("div");
    outside.textContent = "text in another pane";
    document.body.appendChild(outside);

    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    // A REAL, non-empty selection — but anchored outside this thread.
    fireSelectionChange({ node: outside.firstChild as Text, startOffset: 0, endOffset: 4 });

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(600);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();

    outside.remove();
  });

  /**
   * A COLLAPSED selection carrying a range (caret placed inside the text, no
   * drag) is the click case that `rangeCount === 0` does NOT catch: the range
   * exists, it is simply empty. Only `isCollapsed` rejects it.
   *
   * Without this test, neutering `isCollapsed` leaves the suite green — the
   * empty-selection test above passes for the wrong reason (it is protected by
   * `rangeCount`, not by `isCollapsed`). Two guards, two tests.
   */
  it("does NOT disengage on a COLLAPSED selection inside the thread (caret, not a drag)", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    const textNode = screen.getByText("message 1").firstChild as Text;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    // rangeCount === 1, but start === end: a caret, not a selection.
    fireSelectionChange({ node: textNode, startOffset: 3, endOffset: 3 });

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(600);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  it.each(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"])(
    "disengages the bottom anchor on %s keyboard navigation",
    (key) => {
      const { container, rerender } = render(
        <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
          <div>message 1</div>
        </MosaicChatThread>,
      );
      const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
      stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

      fireEvent.keyDown(root, { key });

      stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
      rerender(
        <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
          <div>message 1</div>
          <div>message 2</div>
        </MosaicChatThread>,
      );

      expect(root.scrollTop).toBe(0);
      expect(screen.getByRole("button", { name: SCROLL_LABEL })).toBeTruthy();
    },
  );

  it("does not disengage on a non-navigation key", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    fireEvent.keyDown(root, { key: "a" });

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(600);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  it("still allows manual scroll to disengage, and returning near the bottom to re-engage (non-regression)", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;

    stubScrollMetrics(root, { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });
    fireEvent.scroll(root);
    expect(screen.getByRole("button", { name: SCROLL_LABEL })).toBeTruthy();

    stubScrollMetrics(root, { scrollHeight: 1000, clientHeight: 300, scrollTop: 690 });
    fireEvent.scroll(root);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeNull();
  });

  it("removes the document-level selectionchange listener on unmount (no leak)", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount, container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    const textNode = screen.getByText("message 1").firstChild as Text;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    unmount();

    expect(removeSpy.mock.calls.some((call) => call[0] === "selectionchange")).toBe(true);

    // Firing selectionchange after unmount must not throw / must not act on
    // stale refs — if the listener leaked, this would still run its handler.
    expect(() => {
      fireSelectionChange({ node: textNode, startOffset: 0, endOffset: 7 });
    }).not.toThrow();

    removeSpy.mockRestore();
  });
});
