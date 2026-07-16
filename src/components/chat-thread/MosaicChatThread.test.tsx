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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  /**
   * The `Selection` interface defines exactly TWO node endpoints — `anchorNode`
   * and `focusNode` (lib.dom.d.ts:30373 and :30391). A guard that reads one of
   * them knows half the domain, and the half it does not know fails OPEN: it
   * waves the case through while staying green.
   *
   * Here that half is a selection that ENTERS the thread — dragged from the pane
   * next door (the split-pane's document viewer) into the messages. `anchorNode`
   * lands outside, `focusNode` inside, and thread text is visibly selected while
   * the anchor happily keeps yanking the view back down.
   *
   * The mirror case (anchor inside, focus outside) already worked, which is
   * exactly what kept this invisible: the hole only showed in ONE direction.
   *
   * One test per endpoint. One mutation per endpoint.
   */
  /**
   * `content-visibility: auto` lets the browser skip render work for messages
   * far out of view. `contain-intrinsic-size` is what keeps that from being a
   * regression: without a placeholder height, skipped children collapse to zero
   * and the scrollbar jumps as they re-expand — which would fight the very
   * stick-to-bottom this component exists to hold.
   *
   * The two belong together, so the test pins them together. jsdom computes no
   * layout, so this asserts the contract is DECLARED on the content wrapper; the
   * behavioural guarantee it protects (stick-to-bottom) is covered by the tests
   * above, which keep passing with it applied.
   */
  it("declares content-visibility AND an intrinsic size on the thread's children", () => {
    const { container } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const content = container.querySelector("[data-slot='chat-thread-content']") as HTMLElement;

    expect(content.className).toContain("[&>*]:[content-visibility:auto]");
    // The placeholder height is not optional garnish — it is the half that
    // prevents the scroll jump. Pinned separately so it cannot be dropped alone.
    expect(content.className).toContain("[&>*]:[contain-intrinsic-size:auto_4rem]");
  });

  it("DOES disengage when the selection ENTERS the thread (anchor outside, focus inside)", () => {
    const outside = document.createElement("div");
    outside.textContent = "text in the pane next door";
    document.body.appendChild(outside);

    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );
    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    const insideText = screen.getByText("message 1").firstChild as Text;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    // A selection dragged from OUTSIDE into the thread: anchor out, focus in.
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.setStart(outside.firstChild as Text, 0);
    range.setEnd(insideText, 5);
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    // Thread text IS selected — the view must stop chasing the bottom.
    expect(root.scrollTop).toBe(0);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeTruthy();

    outside.remove();
  });

  /**
   * The MIRROR case: dragged from inside the thread OUT into the pane next door.
   * Anchor in, focus out.
   *
   * Every other selection test puts both endpoints in the same text node, so
   * both land inside — which means deleting the `anchorNode` half of the guard
   * left the whole suite GREEN. The mutation proved it: one endpoint of the
   * domain was carrying no test at all, and would have been refactored away
   * without a sound.
   *
   * Two endpoints in the API, two mutations, two tests. That is the whole rule.
   */
  it("DOES disengage when the selection LEAVES the thread (anchor inside, focus outside)", () => {
    const { container, rerender } = render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
      </MosaicChatThread>,
    );

    // Appended AFTER the thread: a Range must run forwards in document order, or
    // the DOM collapses it — and a collapsed selection is (correctly) ignored by
    // the guard, which would make this test pass for a reason that has nothing
    // to do with what it claims to check.
    const outside = document.createElement("div");
    outside.textContent = "text in the pane next door";
    document.body.appendChild(outside);

    const root = container.querySelector("[data-slot='chat-thread']") as HTMLElement;
    const insideText = screen.getByText("message 1").firstChild as Text;
    stubScrollMetrics(root, { scrollHeight: 400, clientHeight: 300, scrollTop: 0 });

    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.setStart(insideText, 0);
    range.setEnd(outside.firstChild as Text, 4);
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));

    stubScrollMetrics(root, { scrollHeight: 600, clientHeight: 300, scrollTop: 0 });
    rerender(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div>message 1</div>
        <div>message 2</div>
      </MosaicChatThread>,
    );

    expect(root.scrollTop).toBe(0);
    expect(container.querySelector("[data-slot='chat-thread-scroll-button']")).toBeTruthy();

    outside.remove();
  });

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

  // ── onVisibleRangeChange ─────────────────────────────────────────────────
  //
  // jsdom does not implement IntersectionObserver at all — there is no real
  // browser layout engine underneath it, so there is nothing to polyfill
  // faithfully. The `MockIntersectionObserver` below is a hand-written stand-in
  // that records which elements were `observe()`-d and lets the test invoke
  // its callback with synthetic `IntersectionObserverEntry`-shaped objects.
  //
  // What this mock PROVES: the component (a) constructs an IntersectionObserver
  // exactly when `onVisibleRangeChange` is supplied, (b) calls `observe()` on
  // the content wrapper's direct children, (c) reduces whatever entries the
  // observer callback is handed into `{ visibleMessageIds, currentAnchorId }`
  // using only each element's `id` attribute (never its text/content), and
  // (d) calls `disconnect()` on unmount.
  //
  // What this mock does NOT prove: that a real browser's IntersectionObserver
  // fires with the same entries, at the same time, for the same scroll
  // geometry. Real intersection timing, thresholds, and root-margin behaviour
  // are NOT exercised here — that is out of reach for jsdom and would need a
  // real-browser (Playwright) test to verify. This suite only proves the
  // component's reducer logic given whatever entries the browser eventually
  // hands it.
  class MockIntersectionObserver implements IntersectionObserver {
    static instances: MockIntersectionObserver[] = [];
    readonly root: Element | Document | null = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    callback: IntersectionObserverCallback;
    observedElements: Element[] = [];
    disconnect = vi.fn();
    observe = vi.fn((element: Element) => {
      this.observedElements.push(element);
    });
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      MockIntersectionObserver.instances.push(this);
    }
  }

  function makeEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
    return {
      target,
      isIntersecting,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: 0,
    } as IntersectionObserverEntry;
  }

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls onVisibleRangeChange with the visible message ids when intersection changes", () => {
    const onVisibleRangeChange = vi.fn();
    render(
      <MosaicChatThread
        scrollToBottomLabel={SCROLL_LABEL}
        onVisibleRangeChange={onVisibleRangeChange}
      >
        <div id="msg-1">first</div>
        <div id="msg-2">second</div>
      </MosaicChatThread>,
    );

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeTruthy();
    const [el1, el2] = observer.observedElements;

    observer.callback([makeEntry(el1, true), makeEntry(el2, false)], observer);

    expect(onVisibleRangeChange).toHaveBeenCalledWith({
      visibleMessageIds: ["msg-1"],
      currentAnchorId: "msg-1",
    });
  });

  it("mounts no IntersectionObserver when onVisibleRangeChange is not supplied", () => {
    render(
      <MosaicChatThread scrollToBottomLabel={SCROLL_LABEL}>
        <div id="msg-1">first</div>
      </MosaicChatThread>,
    );

    expect(MockIntersectionObserver.instances.length).toBe(0);
  });

  it("keeps children opaque — reduces visibility from element ids only, never from text content", () => {
    const onVisibleRangeChange = vi.fn();
    render(
      <MosaicChatThread
        scrollToBottomLabel={SCROLL_LABEL}
        onVisibleRangeChange={onVisibleRangeChange}
      >
        <div id="msg-1">super secret message body</div>
      </MosaicChatThread>,
    );

    const observer = MockIntersectionObserver.instances[0];
    const [el1] = observer.observedElements;
    observer.callback([makeEntry(el1, true)], observer);

    const [payload] = onVisibleRangeChange.mock.calls[0];
    expect(payload.visibleMessageIds).toEqual(["msg-1"]);
    expect(JSON.stringify(payload)).not.toContain("secret message body");
  });

  it("disconnects the observer on unmount — mutation-guarded", () => {
    const onVisibleRangeChange = vi.fn();
    const { unmount } = render(
      <MosaicChatThread
        scrollToBottomLabel={SCROLL_LABEL}
        onVisibleRangeChange={onVisibleRangeChange}
      >
        <div id="msg-1">first</div>
      </MosaicChatThread>,
    );

    const observer = MockIntersectionObserver.instances[0];
    unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
