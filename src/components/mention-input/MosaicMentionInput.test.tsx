/**
 * MosaicMentionInput — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicMentionInput.tsx exists)
 *
 * Built on MosaicPopover (anchoring/dismissal) — this component owns only
 * trigger detection, query-fragment reporting, and keyboard navigation over
 * host-supplied entries.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicMentionInput } from "./MosaicMentionInput.js";

interface Person {
  id: string;
  name: string;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Carol" },
];

function Harness({
  entries = PEOPLE,
  onQueryChange = () => {},
  onSelectEntry = () => {},
  emptyMessage = "No matches",
}: {
  entries?: Person[];
  onQueryChange?: (query: string | null) => void;
  onSelectEntry?: (entry: Person) => void;
  emptyMessage?: string;
}) {
  const [value, setValue] = React.useState("");
  return (
    <MosaicMentionInput<Person>
      value={value}
      onValueChange={setValue}
      triggerCharacter="@"
      entries={entries}
      getEntryText={(entry) => entry.name}
      renderEntry={(entry, _index, active) => (
        <span data-testid={`entry-${entry.id}`} data-active={active}>
          {entry.name}
        </span>
      )}
      onQueryChange={onQueryChange}
      onSelectEntry={onSelectEntry}
      inputAriaLabel="Message"
      listAriaLabel="Mentionable people"
      emptyMessage={emptyMessage}
    />
  );
}

function getInput(): HTMLInputElement {
  return screen.getByLabelText("Message") as HTMLInputElement;
}

describe("MosaicMentionInput", () => {
  it("does not render the list before the trigger character is typed", () => {
    render(<Harness />);
    expect(screen.queryByTestId("entry-1")).toBeNull();
  });

  it("opens the list when the trigger character is typed", () => {
    render(<Harness />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@" } });
    expect(screen.getByTestId("entry-1")).toBeTruthy();
  });

  it("emits the query fragment typed after the trigger", () => {
    const onQueryChange = vi.fn();
    render(<Harness onQueryChange={onQueryChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@al" } });
    expect(onQueryChange).toHaveBeenCalledWith("al");
  });

  it("emits null when the trigger context is exited (whitespace typed)", () => {
    const onQueryChange = vi.fn();
    render(<Harness onQueryChange={onQueryChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@al" } });
    fireEvent.change(input, { target: { value: "@al " } });
    expect(onQueryChange).toHaveBeenLastCalledWith(null);
  });

  it("renders ONLY host-supplied entries — nothing invented", () => {
    render(<Harness entries={[{ id: "9", name: "Zed" }]} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@" } });
    expect(screen.getByTestId("entry-9")).toBeTruthy();
    expect(screen.queryByTestId("entry-1")).toBeNull();
    expect(screen.queryByTestId("entry-2")).toBeNull();
    expect(screen.queryByTestId("entry-3")).toBeNull();
    const list = document.querySelector('[data-slot="mention-input-list"]');
    expect(list?.children.length).toBe(1);
  });

  it("shows the host-supplied empty message when entries is empty", () => {
    render(<Harness entries={[]} emptyMessage="Nobody here" />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@zz" } });
    expect(screen.getByText("Nobody here")).toBeTruthy();
  });

  it("selecting an entry inserts its text and closes the list", () => {
    const onSelectEntry = vi.fn();
    render(<Harness onSelectEntry={onSelectEntry} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@al" } });
    fireEvent.click(screen.getByTestId("entry-1"));
    expect(onSelectEntry).toHaveBeenCalledWith(PEOPLE[0]);
    expect(input.value).toBe("Alice ");
    expect(screen.queryByTestId("entry-1")).toBeNull();
  });

  it("Escape closes the list without inserting", () => {
    const onSelectEntry = vi.fn();
    render(<Harness onSelectEntry={onSelectEntry} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@al" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("entry-1")).toBeNull();
    expect(input.value).toBe("@al");
    expect(onSelectEntry).not.toHaveBeenCalled();
  });

  it("ArrowDown then Enter selects the second entry", () => {
    const onSelectEntry = vi.fn();
    render(<Harness onSelectEntry={onSelectEntry} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelectEntry).toHaveBeenCalledWith(PEOPLE[1]);
  });

  it("ArrowDown moves the active entry marker forward", () => {
    render(<Harness />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@" } });
    expect(screen.getByTestId("entry-1").dataset.active).toBe("true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByTestId("entry-2").dataset.active).toBe("true");
    expect(screen.getByTestId("entry-1").dataset.active).toBe("false");
  });

  it("ArrowUp moves the active entry marker backward, clamped at the first entry", () => {
    render(<Harness />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "@" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByTestId("entry-1").dataset.active).toBe("true");
  });
});
