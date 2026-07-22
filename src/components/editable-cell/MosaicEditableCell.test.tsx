/**
 * MosaicEditableCell — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicEditableCell.tsx exists)
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicEditableCell } from "./MosaicEditableCell.js";

describe("MosaicEditableCell", () => {
  it("renders the value as read-only text initially", () => {
    render(<MosaicEditableCell value="Alpha" onCommit={() => {}} editAriaLabel="Edit value" />);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("enters edit mode on double-click, showing an input", () => {
    render(<MosaicEditableCell value="Alpha" onCommit={() => {}} editAriaLabel="Edit value" />);
    fireEvent.doubleClick(screen.getByText("Alpha"));
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("commits the new value on Enter", () => {
    const onCommit = vi.fn();
    render(<MosaicEditableCell value="Alpha" onCommit={onCommit} editAriaLabel="Edit value" />);
    fireEvent.doubleClick(screen.getByText("Alpha"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith("Beta");
  });

  it("NEGATIVE POLE: cancelling with Escape restores the original value and never commits", () => {
    const onCommit = vi.fn();
    render(<MosaicEditableCell value="Alpha" onCommit={onCommit} editAriaLabel="Edit value" />);
    fireEvent.doubleClick(screen.getByText("Alpha"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Zulu" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.queryByText("Zulu")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("NEGATIVE POLE: a failed validate() blocks the commit", () => {
    const onCommit = vi.fn();
    const validate = (next: string) => (next.length < 2 ? "Too short" : null);
    render(
      <MosaicEditableCell
        value="Alpha"
        onCommit={onCommit}
        validate={validate}
        editAriaLabel="Edit value"
      />,
    );
    fireEvent.doubleClick(screen.getByText("Alpha"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText("Too short")).toBeTruthy();
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(
      <MosaicEditableCell
        value="Alpha"
        onCommit={() => {}}
        onCancel={onCancel}
        editAriaLabel="Edit value"
      />,
    );
    fireEvent.doubleClick(screen.getByText("Alpha"));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not enter edit mode when disabled", () => {
    render(
      <MosaicEditableCell value="Alpha" onCommit={() => {}} editAriaLabel="Edit value" disabled />,
    );
    fireEvent.doubleClick(screen.getByText("Alpha"));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("STATE SYNC: reflects an external value change while not editing (no stale snapshot)", () => {
    const { rerender } = render(
      <MosaicEditableCell value="Alpha" onCommit={() => {}} editAriaLabel="Edit value" />,
    );
    rerender(<MosaicEditableCell value="Beta" onCommit={() => {}} editAriaLabel="Edit value" />);
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("STATE SYNC: cancelling after an external value change while editing restores the CURRENT prop, not the value seen at mount", () => {
    const { rerender } = render(
      <MosaicEditableCell value="Alpha" onCommit={() => {}} editAriaLabel="Edit value" />,
    );
    fireEvent.doubleClick(screen.getByText("Alpha"));
    // the prop changes externally WHILE the cell is being edited
    rerender(<MosaicEditableCell value="Gamma" onCommit={() => {}} editAriaLabel="Edit value" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "typed junk" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(screen.getByText("Gamma")).toBeTruthy();
    expect(screen.queryByText("Alpha")).toBeNull();
  });
});
