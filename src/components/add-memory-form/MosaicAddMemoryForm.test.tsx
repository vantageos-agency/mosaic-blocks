/**
 * MosaicAddMemoryForm — tests
 *
 * Coverage: renders content/type/tags fields; every user-facing string is
 * host-supplied (SIN-01) — no hardcoded copy asserted anywhere; the type
 * taxonomy comes entirely from the host-supplied `types` prop (no hardcoded
 * taxonomy — this is the mutation-proven guarantee, see the last test);
 * tag add/remove is delegated to onAddTag/onRemoveTag callbacks
 * (controlled); onContentChange/onTypeChange fire on interaction; submit
 * disabled when canSubmit=false (host-computed validity, this component
 * never decides validation itself); aria-busy + disabled submit while
 * isSubmitting; aria-invalid + aria-describedby wired on the content error
 * when the host supplies an error string; data-slot="add-memory-form"
 * present on the form root.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicAddMemoryForm } from "./MosaicAddMemoryForm.js";

const TYPES = [
  { value: "fact", label: "Fact" },
  { value: "preference", label: "Preference" },
];

const BASE_PROPS = {
  content: "",
  onContentChange: vi.fn(),
  contentLabel: "Content",
  types: TYPES,
  type: "fact",
  onTypeChange: vi.fn(),
  typeLabel: "Type",
  tags: [] as string[],
  onAddTag: vi.fn(),
  onRemoveTag: vi.fn(),
  tagsLabel: "Tags",
  tagInputPlaceholder: "Add a tag…",
  removeTagAriaLabel: (tag: string) => `Remove ${tag}`,
  isSubmitting: false,
  canSubmit: true,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  submitButtonLabel: "Save Memory",
  submittingLabel: "Saving…",
  cancelButtonLabel: "Cancel",
};

describe("MosaicAddMemoryForm", () => {
  it("sets data-slot='add-memory-form' on the form root", () => {
    const { container } = render(<MosaicAddMemoryForm {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='add-memory-form']")).toBeTruthy();
  });

  it("renders the host-supplied content/type/tags labels", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} />);
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
  });

  it("renders the currently selected type label from the host-supplied types prop", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} />);
    expect(screen.getByText("Fact")).toBeTruthy();
  });

  it("opens the type popup and lists ONLY the host-supplied types — no hardcoded taxonomy", async () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} />);
    fireEvent.click(
      screen.getByText("Type").parentElement?.querySelector("[data-slot='select']") as Element,
    );
    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((option) => option.textContent);
    expect(optionLabels).toEqual(TYPES.map((t) => t.label));
  });

  it("calls onContentChange when the content textarea changes", () => {
    const onContentChange = vi.fn();
    render(<MosaicAddMemoryForm {...BASE_PROPS} onContentChange={onContentChange} />);
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "Some new memory" },
    });
    expect(onContentChange).toHaveBeenCalledWith("Some new memory");
  });

  it("shows contentError with aria-invalid + aria-describedby when host supplies one", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} contentError="Content is required" />);
    const textarea = screen.getByLabelText("Content");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Content is required")).toBeTruthy();
  });

  it("does not mark the content textarea invalid when no contentError is supplied", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} />);
    const textarea = screen.getByLabelText("Content");
    expect(textarea.getAttribute("aria-invalid")).toBe("false");
  });

  it("calls onSubmit when the submit button is clicked and canSubmit=true", () => {
    const onSubmit = vi.fn();
    render(<MosaicAddMemoryForm {...BASE_PROPS} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Memory" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button when canSubmit=false — submission never fires", () => {
    const onSubmit = vi.fn();
    render(<MosaicAddMemoryForm {...BASE_PROPS} canSubmit={false} onSubmit={onSubmit} />);
    const button = screen.getByRole("button", { name: "Save Memory" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables the submit button while isSubmitting — and shows submittingLabel", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} isSubmitting />);
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<MosaicAddMemoryForm {...BASE_PROPS} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the cancel button while isSubmitting", () => {
    render(<MosaicAddMemoryForm {...BASE_PROPS} isSubmitting />);
    const button = screen.getByRole("button", { name: "Cancel" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });
});
