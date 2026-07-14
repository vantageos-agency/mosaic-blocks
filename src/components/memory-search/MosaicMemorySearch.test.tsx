/**
 * MosaicMemorySearch — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicMemorySearch.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MosaicMemorySearchFilter } from "./MosaicMemorySearch.js";
import { MosaicMemorySearch } from "./MosaicMemorySearch.js";

const FILTERS: MosaicMemorySearchFilter[] = [
  { id: "type-note", label: "Note" },
  { id: "type-decision", label: "Decision" },
  { id: "tag-urgent", label: "Urgent" },
];

function baseProps() {
  return {
    query: "",
    onQueryChange: vi.fn(),
    searchLabel: "Search knowledge base",
    searchPlaceholder: "Search…",
    clearButtonLabel: "Clear search",
    resultCount: 0,
    formatResultCount: (count: number) => `${count} results`,
  };
}

describe("MosaicMemorySearch", () => {
  it("sets data-slot='memory-search' on the root element", () => {
    const { container } = render(<MosaicMemorySearch {...baseProps()} />);
    expect(container.querySelector("[data-slot='memory-search']")).toBeTruthy();
  });

  it("renders the host-supplied query in the search input", () => {
    render(<MosaicMemorySearch {...baseProps()} query="hello" />);
    expect(screen.getByRole("searchbox", { name: "Search knowledge base" })).toHaveProperty(
      "value",
      "hello",
    );
  });

  it("calls onQueryChange with the new value as the user types", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMemorySearch {...props} />);
    const input = screen.getByRole("searchbox", { name: "Search knowledge base" });
    await user.type(input, "a");
    expect(props.onQueryChange).toHaveBeenCalledWith("a");
  });

  it("renders the host-supplied placeholder on the input", () => {
    render(<MosaicMemorySearch {...baseProps()} />);
    expect(screen.getByPlaceholderText("Search…")).toBeTruthy();
  });

  it("renders the host-supplied result count via formatResultCount", () => {
    render(<MosaicMemorySearch {...baseProps()} resultCount={7} />);
    expect(screen.getByText("7 results")).toBeTruthy();
  });

  it("re-derives the result count text from resultCount, never assembling it itself", () => {
    const formatResultCount = vi.fn((count: number) => `count=${count}`);
    render(
      <MosaicMemorySearch
        {...baseProps()}
        resultCount={42}
        formatResultCount={formatResultCount}
      />,
    );
    expect(formatResultCount).toHaveBeenCalledWith(42);
    expect(screen.getByText("count=42")).toBeTruthy();
  });

  it("does not render the clear button when query is empty", () => {
    render(<MosaicMemorySearch {...baseProps()} query="" />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeFalsy();
  });

  it("renders the clear button when query is non-empty and calls onQueryChange('') on click", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicMemorySearch {...props} query="hello" />);
    const clearButton = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearButton);
    expect(props.onQueryChange).toHaveBeenCalledWith("");
  });

  it("renders no filter chips when filters is not supplied", () => {
    render(<MosaicMemorySearch {...baseProps()} />);
    expect(screen.queryByText("Note")).toBeFalsy();
  });

  it("renders one chip per host-supplied filter, by label", () => {
    render(
      <MosaicMemorySearch
        {...baseProps()}
        filters={FILTERS}
        selectedFilterIds={[]}
        onFilterToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Note")).toBeTruthy();
    expect(screen.getByText("Decision")).toBeTruthy();
    expect(screen.getByText("Urgent")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(FILTERS.length);
  });

  it("marks a selected filter chip with aria-pressed='true'", () => {
    render(
      <MosaicMemorySearch
        {...baseProps()}
        filters={FILTERS}
        selectedFilterIds={["type-note"]}
        onFilterToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Note" })).toHaveProperty("ariaPressed", "true");
    expect(screen.getByRole("button", { name: "Decision" })).toHaveProperty("ariaPressed", "false");
  });

  it("calls onFilterToggle(id) when a filter chip is activated", async () => {
    const user = userEvent.setup();
    const onFilterToggle = vi.fn();
    render(
      <MosaicMemorySearch
        {...baseProps()}
        filters={FILTERS}
        selectedFilterIds={[]}
        onFilterToggle={onFilterToggle}
      />,
    );
    await user.click(screen.getByText("Urgent"));
    expect(onFilterToggle).toHaveBeenCalledWith("tag-urgent");
  });

  it("never invents a filter catalogue — the taxonomy is 100% host-supplied data", () => {
    const { rerender } = render(<MosaicMemorySearch {...baseProps()} />);
    expect(screen.queryByRole("button", { name: /note|decision|urgent/i })).toBeFalsy();
    rerender(
      <MosaicMemorySearch
        {...baseProps()}
        filters={[{ id: "custom-1", label: "Legal" }]}
        selectedFilterIds={[]}
        onFilterToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Legal")).toBeTruthy();
  });

  it("accepts a className on the root element", () => {
    const { container } = render(<MosaicMemorySearch {...baseProps()} className="custom-class" />);
    expect(container.querySelector("[data-slot='memory-search']")?.className).toContain(
      "custom-class",
    );
  });
});
