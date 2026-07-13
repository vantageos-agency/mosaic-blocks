import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicTagInput } from "./MosaicTagInput.js";

function getInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input");
  if (!input) throw new Error("input not found");
  return input;
}

describe("MosaicTagInput", () => {
  it("adds the typed tag on Enter, calls onAddTag once with the trimmed value, and clears the input", () => {
    const onAddTag = vi.fn();
    const { container } = render(
      <MosaicTagInput
        tags={["react"]}
        onAddTag={onAddTag}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );
    const input = getInput(container);

    fireEvent.change(input, { target: { value: "  typescript  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAddTag).toHaveBeenCalledTimes(1);
    expect(onAddTag).toHaveBeenCalledWith("typescript");
    expect(input.value).toBe("");
  });

  it("calls onRemoveTag with the clicked tag when its remove button is clicked", () => {
    const onRemoveTag = vi.fn();
    render(
      <MosaicTagInput
        tags={["react", "vue"]}
        onAddTag={vi.fn()}
        onRemoveTag={onRemoveTag}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove vue" }));

    expect(onRemoveTag).toHaveBeenCalledTimes(1);
    expect(onRemoveTag).toHaveBeenCalledWith("vue");
  });

  it("removes the last tag on Backspace when the input is empty", () => {
    const onRemoveTag = vi.fn();
    const { container } = render(
      <MosaicTagInput
        tags={["react", "vue"]}
        onAddTag={vi.fn()}
        onRemoveTag={onRemoveTag}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );
    const input = getInput(container);

    fireEvent.keyDown(input, { key: "Backspace" });

    expect(onRemoveTag).toHaveBeenCalledTimes(1);
    expect(onRemoveTag).toHaveBeenCalledWith("vue");
  });

  it("does NOT remove a tag on Backspace when the input is non-empty", () => {
    const onRemoveTag = vi.fn();
    const { container } = render(
      <MosaicTagInput
        tags={["react", "vue"]}
        onAddTag={vi.fn()}
        onRemoveTag={onRemoveTag}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );
    const input = getInput(container);

    fireEvent.change(input, { target: { value: "partial" } });
    fireEvent.keyDown(input, { key: "Backspace" });

    expect(onRemoveTag).not.toHaveBeenCalled();
  });

  it("applies a distinct removeTagAriaLabel per tag", () => {
    render(
      <MosaicTagInput
        tags={["react", "vue"]}
        onAddTag={vi.fn()}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove react" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove vue" })).toBeTruthy();
  });

  it("refuses a duplicate tag: onAddTag is not called", () => {
    const onAddTag = vi.fn();
    const { container } = render(
      <MosaicTagInput
        tags={["react"]}
        onAddTag={onAddTag}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
      />,
    );
    const input = getInput(container);

    fireEvent.change(input, { target: { value: "react" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAddTag).not.toHaveBeenCalled();
  });

  it("refuses loudly past maxTags: onAddTag not called AND the input exposes aria-disabled + data-max-reached", () => {
    const onAddTag = vi.fn();
    const { container } = render(
      <MosaicTagInput
        tags={["react", "vue"]}
        onAddTag={onAddTag}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
        maxTags={2}
      />,
    );
    const input = getInput(container);

    fireEvent.change(input, { target: { value: "svelte" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAddTag).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-disabled")).toBe("true");
    expect(input.getAttribute("data-max-reached")).toBe("true");
  });

  it("does not mark aria-disabled/data-max-reached below maxTags", () => {
    const { container } = render(
      <MosaicTagInput
        tags={["react"]}
        onAddTag={vi.fn()}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
        maxTags={2}
      />,
    );
    const input = getInput(container);

    expect(input.getAttribute("aria-disabled")).toBeNull();
    expect(input.getAttribute("data-max-reached")).toBeNull();
  });

  it("filters suggestions by typed text, excluding already-selected tags", () => {
    const { container } = render(
      <MosaicTagInput
        tags={["react"]}
        onAddTag={vi.fn()}
        onRemoveTag={vi.fn()}
        placeholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
        suggestions={["react", "redux", "relay", "vue"]}
      />,
    );
    const input = getInput(container);

    fireEvent.change(input, { target: { value: "re" } });

    const suggestionsList = container.querySelector("[data-slot='tag-input-suggestions']");
    if (!suggestionsList) throw new Error("suggestions list not found");
    const suggestionTexts = Array.from(
      suggestionsList.querySelectorAll("[data-slot='tag-input-suggestion']"),
    ).map((node) => node.textContent);

    expect(suggestionTexts).toEqual(["redux", "relay"]);
  });
});
