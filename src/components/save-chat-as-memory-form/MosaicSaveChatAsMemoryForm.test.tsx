/**
 * MosaicSaveChatAsMemoryForm — tests
 *
 * Coverage: renders host-supplied pre-extracted content/title/tags fields
 * pre-filled with current values (no live extraction inside the component —
 * the host is the sole source of the extracted content, SIN-01 + zero I/O);
 * editing the title/content fields fires onTitleChange/onContentChange;
 * tag add/remove is delegated to onAddTag/onRemoveTag callbacks; save
 * disabled when canSave=false (host-computed validity — this component never
 * decides validation itself); aria-busy + disabled save while isSaving;
 * aria-invalid + aria-describedby wired on title/content errors when the
 * host supplies error strings; cancel calls onCancel and never onSave;
 * data-slot="save-chat-as-memory-form" present on the form root; forbids any
 * fetch/network call from inside the component (zero I/O).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicSaveChatAsMemoryForm } from "./MosaicSaveChatAsMemoryForm.js";

const BASE_PROPS = {
  title: "",
  onTitleChange: vi.fn(),
  titleLabel: "Title",
  content: "The team decided to migrate the queue to a durable store.",
  onContentChange: vi.fn(),
  contentLabel: "Content",
  tags: [] as string[],
  onAddTag: vi.fn(),
  onRemoveTag: vi.fn(),
  tagsLabel: "Tags",
  tagInputPlaceholder: "Add a tag…",
  removeTagAriaLabel: (tag: string) => `Remove ${tag}`,
  isSaving: false,
  canSave: true,
  onSave: vi.fn(),
  onCancel: vi.fn(),
  saveLabel: "Save Memory",
  savingLabel: "Saving…",
  cancelLabel: "Cancel",
};

describe("MosaicSaveChatAsMemoryForm", () => {
  it("sets data-slot='save-chat-as-memory-form' on the form root", () => {
    const { container } = render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='save-chat-as-memory-form']")).toBeTruthy();
  });

  it("renders the host-supplied title/content/tags labels", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
  });

  it("pre-fills the content field with the host-supplied extracted content — no live extraction", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    const textarea = screen.getByLabelText("Content") as HTMLTextAreaElement;
    expect(textarea.value).toBe("The team decided to migrate the queue to a durable store.");
  });

  it("pre-fills the title field with the host-supplied current value", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} title="Queue migration decision" />);
    const input = screen.getByLabelText("Title") as HTMLInputElement;
    expect(input.value).toBe("Queue migration decision");
  });

  it("calls onTitleChange when the title input changes", () => {
    const onTitleChange = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} onTitleChange={onTitleChange} />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New title" },
    });
    expect(onTitleChange).toHaveBeenCalledWith("New title");
  });

  it("calls onContentChange when the content textarea changes", () => {
    const onContentChange = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} onContentChange={onContentChange} />);
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "Edited extract" },
    });
    expect(onContentChange).toHaveBeenCalledWith("Edited extract");
  });

  it("delegates adding a tag to onAddTag via the tag input", () => {
    const onAddTag = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} onAddTag={onAddTag} />);
    const tagInput = screen.getByPlaceholderText("Add a tag…");
    fireEvent.change(tagInput, { target: { value: "infra" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });
    expect(onAddTag).toHaveBeenCalledWith("infra");
  });

  it("delegates removing a tag to onRemoveTag", () => {
    const onRemoveTag = vi.fn();
    render(
      <MosaicSaveChatAsMemoryForm {...BASE_PROPS} tags={["infra"]} onRemoveTag={onRemoveTag} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove infra" }));
    expect(onRemoveTag).toHaveBeenCalledWith("infra");
  });

  it("shows titleError with aria-invalid + aria-describedby when host supplies one", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} titleError="Title is required" />);
    const input = screen.getByLabelText("Title");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Title is required")).toBeTruthy();
  });

  it("does not mark the title input invalid when no titleError is supplied", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByLabelText("Title").getAttribute("aria-invalid")).toBe("false");
  });

  it("shows contentError with aria-invalid + aria-describedby when host supplies one", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} contentError="Content is required" />);
    const textarea = screen.getByLabelText("Content");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Content is required")).toBeTruthy();
  });

  it("does not mark the content textarea invalid when no contentError is supplied", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByLabelText("Content").getAttribute("aria-invalid")).toBe("false");
  });

  it("calls onSave when the save button is clicked and canSave=true", () => {
    const onSave = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Memory" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables the save button when canSave=false — save never fires", () => {
    const onSave = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} canSave={false} onSave={onSave} />);
    const button = screen.getByRole("button", { name: "Save Memory" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables the save button while isSaving — and shows savingLabel", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} isSaving />);
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("calls onCancel when the cancel button is clicked, never onSave", () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} onCancel={onCancel} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("disables the cancel button while isSaving", () => {
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} isSaving />);
    const button = screen.getByRole("button", { name: "Cancel" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("never calls global fetch — zero I/O, host owns persistence entirely", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockImplementation(() => {
      throw new Error("fetch must never be called by MosaicSaveChatAsMemoryForm");
    });
    render(<MosaicSaveChatAsMemoryForm {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Memory" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
