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
import { describe, expect, it } from "vitest";
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
});
