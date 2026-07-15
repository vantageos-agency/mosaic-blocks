/**
 * MosaicSessionCard — RED-first TDD
 *
 * Coverage: renders host-supplied session state (title, status via
 * `formatStatus`); the "default" variant requires `formatUpdatedAt` and
 * renders its output, the "compact" variant does NOT require it (the
 * no-lying-prop-contract guard: a prop is required exactly on the branch
 * that reads it, never on a branch that never calls it); selection is
 * opt-in — `onSelect` and `selectLabel` travel together, absent by default
 * (no role="button", no aria-label) and present together turn the root into
 * a keyboard-operable button-role element; zero network I/O; ref/className
 * forwarding.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicSessionCard } from "./MosaicSessionCard.js";
import type { MosaicSessionData } from "./MosaicSessionCard.js";

const session: MosaicSessionData = {
  id: "session-1",
  title: "Mandate A",
  status: "active",
  updatedAt: Date.now() - 3 * 60 * 1000,
};

const formatStatus = (status: MosaicSessionData["status"]) => status;
const formatUpdatedAt = () => "3m ago";

describe("MosaicSessionCard", () => {
  it("renders the session title", () => {
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
      />,
    );
    expect(screen.getByText("Mandate A")).toBeTruthy();
  });

  it("renders the status via formatStatus", () => {
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
      />,
    );
    expect(screen.getByText("active")).toBeTruthy();
  });

  it("defaults to the default variant and sets data-variant", () => {
    const { container } = render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
      />,
    );
    const root = container.querySelector("[data-slot='session-card']");
    expect(root?.getAttribute("data-variant")).toBe("default");
  });

  it("renders formatUpdatedAt output in the default variant", () => {
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
      />,
    );
    expect(screen.getByText("3m ago")).toBeTruthy();
  });

  it("renders the compact variant WITHOUT requiring formatUpdatedAt (no-lying-prop-contract)", () => {
    const { container } = render(
      <MosaicSessionCard session={session} variant="compact" formatStatus={formatStatus} />,
    );
    const root = container.querySelector("[data-slot='session-card']");
    expect(root?.getAttribute("data-variant")).toBe("compact");
    expect(container.querySelector("[data-slot='session-card-updated-at']")).toBeNull();
  });

  it("compact variant still renders title and status", () => {
    render(<MosaicSessionCard session={session} variant="compact" formatStatus={formatStatus} />);
    expect(screen.getByText("Mandate A")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
  });

  it("is not selectable by default — no role='button', no aria-label on root", () => {
    const { container } = render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
      />,
    );
    const root = container.querySelector("[data-slot='session-card']");
    expect(root?.getAttribute("role")).toBeNull();
    expect(root?.getAttribute("aria-label")).toBeNull();
  });

  it("becomes keyboard-operable and calls onSelect with the session id on click", () => {
    const onSelect = vi.fn();
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        onSelect={onSelect}
        selectLabel="Open Mandate A"
      />,
    );
    const root = screen.getByRole("button", { name: "Open Mandate A" });
    fireEvent.click(root);
    expect(onSelect).toHaveBeenCalledWith("session-1");
  });

  it("calls onSelect on Enter and Space keydown when selectable", () => {
    const onSelect = vi.fn();
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        onSelect={onSelect}
        selectLabel="Open Mandate A"
      />,
    );
    const root = screen.getByRole("button", { name: "Open Mandate A" });
    fireEvent.keyDown(root, { key: "Enter" });
    fireEvent.keyDown(root, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("does not perform any network I/O while rendering or interacting", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockImplementation(() => {
      throw new Error("MosaicSessionCard must not call fetch");
    });
    const onSelect = vi.fn();
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        onSelect={onSelect}
        selectLabel="Open Mandate A"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open Mandate A" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("accepts a custom className", () => {
    const { container } = render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        className="my-session-card"
      />,
    );
    expect(container.querySelector(".my-session-card")).toBeTruthy();
  });

  it("forwards a ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <MosaicSessionCard
        session={session}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        ref={ref}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
