/**
 * MosaicMessageSearch — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicMessageSearch.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MosaicMessageSearch } from "./MosaicMessageSearch.js";

function baseProps() {
  return {
    query: "",
    onQueryChange: vi.fn(),
    searchLabel: "Search this conversation",
    searchPlaceholder: "Search messages…",
    clearButtonLabel: "Clear search",
  };
}

describe("MosaicMessageSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets data-slot='message-search' on the root element", () => {
    const { container } = render(<MosaicMessageSearch {...baseProps()} />);
    expect(container.querySelector("[data-slot='message-search']")).toBeTruthy();
  });

  it("renders the host-supplied query in the search input", () => {
    render(<MosaicMessageSearch {...baseProps()} query="deploy instructions" />);
    expect(screen.getByRole("searchbox", { name: "Search this conversation" })).toHaveProperty(
      "value",
      "deploy instructions",
    );
  });

  it("calls onQueryChange with the new value as the user types", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMessageSearch {...props} />);
    const input = screen.getByRole("searchbox", { name: "Search this conversation" });
    await user.type(input, "a");
    expect(props.onQueryChange).toHaveBeenCalledWith("a");
  });

  it("renders the host-supplied placeholder on the input", () => {
    render(<MosaicMessageSearch {...baseProps()} />);
    expect(screen.getByPlaceholderText("Search messages…")).toBeTruthy();
  });

  it("does not render the clear button when query is empty", () => {
    render(<MosaicMessageSearch {...baseProps()} query="" />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeFalsy();
  });

  it("renders the clear button when query is non-empty and calls onQueryChange('') on click", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMessageSearch {...props} query="deploy" />);
    const clearButton = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearButton);
    expect(props.onQueryChange).toHaveBeenCalledWith("");
  });

  it("renders the host-supplied resultsSlot when provided", () => {
    render(
      <MosaicMessageSearch
        {...baseProps()}
        query="deploy"
        resultsSlot={<div>3 matching messages</div>}
      />,
    );
    expect(screen.getByText("3 matching messages")).toBeTruthy();
  });

  it("renders the host-worded emptyResultsLabel when resultsSlot is absent", () => {
    render(
      <MosaicMessageSearch
        {...baseProps()}
        query="nonexistent"
        emptyResultsLabel="No messages match your search"
      />,
    );
    expect(screen.getByText("No messages match your search")).toBeTruthy();
  });

  it("prefers resultsSlot over emptyResultsLabel when both are supplied", () => {
    render(
      <MosaicMessageSearch
        {...baseProps()}
        query="deploy"
        resultsSlot={<div>1 matching message</div>}
        emptyResultsLabel="No messages match your search"
      />,
    );
    expect(screen.getByText("1 matching message")).toBeTruthy();
    expect(screen.queryByText("No messages match your search")).toBeFalsy();
  });

  it("renders neither results area content when both resultsSlot and emptyResultsLabel are absent", () => {
    const { container } = render(<MosaicMessageSearch {...baseProps()} />);
    expect(container.querySelector("[data-slot='message-search-results']")).toBeFalsy();
  });

  it("accepts a className on the root element", () => {
    const { container } = render(<MosaicMessageSearch {...baseProps()} className="custom-class" />);
    expect(container.querySelector("[data-slot='message-search']")?.className).toContain(
      "custom-class",
    );
  });

  it("never calls fetch — the component performs zero network I/O, the host owns the search", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();
    render(
      <MosaicMessageSearch
        {...baseProps()}
        resultsSlot={<div>results</div>}
        emptyResultsLabel="empty"
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Search this conversation" });
    await user.type(input, "instructions");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
