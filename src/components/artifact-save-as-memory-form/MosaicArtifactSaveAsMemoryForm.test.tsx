/**
 * MosaicArtifactSaveAsMemoryForm — tests
 *
 * Coverage: renders the host-supplied artifact preview (title/type/preview,
 * localized via typeLabel — no hardcoded copy); pre-fills the title field
 * with the host-supplied current value; editing the title fires
 * onTitleChange; renders host-supplied extracted learnings and delegates
 * edit/remove to host callbacks (no mock/AI extraction inside the
 * component — zero I/O, host owns extraction); scope selection delegates to
 * onScopeChange via host-supplied options (no hardcoded role/org data);
 * tag add/remove delegated to onAddTag/onRemoveTag; save disabled when
 * canSave=false (host-computed validity); aria-busy + disabled save while
 * isSaving; aria-invalid + aria-describedby wired on titleError; cancel
 * calls onCancel and never onSave; data-slot="artifact-save-as-memory-form"
 * present on the form root; forbids any fetch/network call (zero I/O).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicArtifactSaveAsMemoryForm } from "./MosaicArtifactSaveAsMemoryForm.js";

const ARTIFACT = {
  id: "artifact-1",
  type: "document" as const,
  title: "Q3 Report",
  content: "Full report body text.",
  preview: "Full report body text.",
};

const BASE_PROPS = {
  artifact: ARTIFACT,
  typeLabel: (type: string) =>
    ({ document: "Document", "data-table": "Table", checklist: "Checklist", chart: "Chart" })[
      type as "document" | "data-table" | "checklist" | "chart"
    ] ?? type,
  title: "",
  onTitleChange: vi.fn(),
  titleLabel: "Memory Title",
  titleError: undefined as string | undefined,
  learnings: ["Key insight one", "Key insight two"],
  onEditLearning: vi.fn(),
  onRemoveLearning: vi.fn(),
  learningsLabel: "Learnings",
  editLearningAriaLabel: (index: number) => `Edit learning ${index + 1}`,
  removeLearningAriaLabel: (index: number) => `Remove learning ${index + 1}`,
  scope: "user",
  onScopeChange: vi.fn(),
  scopeLabel: "Memory Scope",
  scopeOptions: [
    { value: "user", label: "Personal" },
    { value: "workspace", label: "Workspace" },
  ],
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
  saveLabel: "Save to Memory",
  savingLabel: "Saving…",
  cancelLabel: "Cancel",
};

describe("MosaicArtifactSaveAsMemoryForm", () => {
  it("sets data-slot='artifact-save-as-memory-form' on the form root", () => {
    const { container } = render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='artifact-save-as-memory-form']")).toBeTruthy();
  });

  it("renders the host-supplied artifact preview title and localized type label", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByText("Q3 Report")).toBeTruthy();
    expect(screen.getByText("Document")).toBeTruthy();
    expect(screen.getByText("Full report body text.")).toBeTruthy();
  });

  it("pre-fills the title field with the host-supplied current value", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} title="Q3 Report Memory" />);
    const input = screen.getByLabelText("Memory Title") as HTMLInputElement;
    expect(input.value).toBe("Q3 Report Memory");
  });

  it("calls onTitleChange when the title input changes", () => {
    const onTitleChange = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onTitleChange={onTitleChange} />);
    fireEvent.change(screen.getByLabelText("Memory Title"), {
      target: { value: "New title" },
    });
    expect(onTitleChange).toHaveBeenCalledWith("New title");
  });

  it("shows titleError with aria-invalid + aria-describedby when host supplies one — validation error path", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} titleError="Title is required" />);
    const input = screen.getByLabelText("Memory Title");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Title is required")).toBeTruthy();
  });

  it("does not mark the title input invalid when no titleError is supplied", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByLabelText("Memory Title").getAttribute("aria-invalid")).toBe("false");
  });

  it("renders every host-supplied learning and never invents its own extraction", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    expect(screen.getByText("Key insight one")).toBeTruthy();
    expect(screen.getByText("Key insight two")).toBeTruthy();
  });

  it("delegates removing a learning to onRemoveLearning with its index", () => {
    const onRemoveLearning = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onRemoveLearning={onRemoveLearning} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove learning 1" }));
    expect(onRemoveLearning).toHaveBeenCalledWith(0);
  });

  it("delegates editing a learning to onEditLearning with its index", () => {
    const onEditLearning = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onEditLearning={onEditLearning} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit learning 2" }));
    expect(onEditLearning).toHaveBeenCalledWith(1);
  });

  it("renders host-supplied scope options and delegates selection to onScopeChange", () => {
    const onScopeChange = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onScopeChange={onScopeChange} />);
    const select = screen.getByLabelText("Memory Scope") as HTMLSelectElement;
    expect(select.value).toBe("user");
    fireEvent.change(select, { target: { value: "workspace" } });
    expect(onScopeChange).toHaveBeenCalledWith("workspace");
  });

  it("never hardcodes scope options beyond what the host supplies", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    const select = screen.getByLabelText("Memory Scope") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
  });

  it("delegates adding a tag to onAddTag via the tag input", () => {
    const onAddTag = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onAddTag={onAddTag} />);
    const tagInput = screen.getByPlaceholderText("Add a tag…");
    fireEvent.change(tagInput, { target: { value: "infra" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });
    expect(onAddTag).toHaveBeenCalledWith("infra");
  });

  it("delegates removing a tag to onRemoveTag", () => {
    const onRemoveTag = vi.fn();
    render(
      <MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} tags={["infra"]} onRemoveTag={onRemoveTag} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove infra" }));
    expect(onRemoveTag).toHaveBeenCalledWith("infra");
  });

  it("calls onSave when the save button is clicked and canSave=true", () => {
    const onSave = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save to Memory" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables the save button when canSave=false — save never fires", () => {
    const onSave = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} canSave={false} onSave={onSave} />);
    const button = screen.getByRole("button", { name: "Save to Memory" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables the save button while isSaving — and shows savingLabel", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} isSaving />);
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("calls onCancel when the cancel button is clicked, never onSave", () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} onCancel={onCancel} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("disables the cancel button while isSaving", () => {
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} isSaving />);
    const button = screen.getByRole("button", { name: "Cancel" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("never calls global fetch — zero I/O, host owns persistence entirely", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockImplementation(() => {
      throw new Error("fetch must never be called by MosaicArtifactSaveAsMemoryForm");
    });
    render(<MosaicArtifactSaveAsMemoryForm {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Save to Memory" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
