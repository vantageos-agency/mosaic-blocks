import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicEditMemoryDialog } from "./MosaicEditMemoryDialog.js";

const TYPES = [
  { value: "fact", label: "Fact" },
  { value: "preference", label: "Preference" },
  { value: "episode", label: "Episode" },
];

function Harness({
  open,
  onOpenChange,
  onSave = vi.fn(),
  onCancel = vi.fn(),
  canSave = true,
  isSaving = false,
  content = "Stale content",
  contentError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  onCancel?: () => void;
  canSave?: boolean;
  isSaving?: boolean;
  content?: string;
  contentError?: string;
}) {
  const [type, setType] = React.useState("fact");
  const [tags, setTags] = React.useState<string[]>(["react"]);

  return (
    <div>
      <button type="button" data-testid="outside-trigger">
        Open edit dialog
      </button>
      <MosaicEditMemoryDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Edit memory"
        description="Correct a stale entry."
        closeAriaLabel="Close"
        content={content}
        onContentChange={() => {}}
        contentLabel="Content"
        contentError={contentError}
        types={TYPES}
        type={type}
        onTypeChange={setType}
        typeLabel="Type"
        tags={tags}
        onAddTag={(tag) => setTags((prev) => [...prev, tag])}
        onRemoveTag={(tag) => setTags((prev) => prev.filter((t) => t !== tag))}
        tagsLabel="Tags"
        tagInputPlaceholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
        canSave={canSave}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
        saveLabel="Save"
        savingLabel="Saving…"
        cancelLabel="Cancel"
      />
    </div>
  );
}

describe("MosaicEditMemoryDialog", () => {
  it("renders nothing when open=false", () => {
    render(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Edit memory")).toBeNull();
  });

  it("renders title, description and the content/type/tags fields when open=true", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(screen.getByText("Edit memory")).toBeTruthy();
    expect(screen.getByText("Correct a stale entry.")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
    expect(screen.getByDisplayValue("Stale content")).toBeTruthy();
  });

  it("renders with data-slot='edit-memory-dialog' on the popup root", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(document.querySelector('[data-slot="edit-memory-dialog"]')).toBeTruthy();
  });

  it("exposes role=dialog with aria-modal, aria-labelledby and aria-describedby wired", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)?.textContent).toBe("Edit memory");
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      "Correct a stale entry.",
    );
  });

  it("calls onContentChange when the content textarea is edited", () => {
    const onContentChange = vi.fn();
    render(
      <MosaicEditMemoryDialog
        open
        onOpenChange={() => {}}
        title="Edit memory"
        description="Correct a stale entry."
        closeAriaLabel="Close"
        content="Stale content"
        onContentChange={onContentChange}
        contentLabel="Content"
        types={TYPES}
        type="fact"
        onTypeChange={() => {}}
        typeLabel="Type"
        tags={[]}
        onAddTag={vi.fn()}
        onRemoveTag={vi.fn()}
        tagsLabel="Tags"
        tagInputPlaceholder="Add a tag…"
        removeTagAriaLabel={(tag) => `Remove ${tag}`}
        canSave
        isSaving={false}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        saveLabel="Save"
        savingLabel="Saving…"
        cancelLabel="Cancel"
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Stale content"), {
      target: { value: "Corrected content" },
    });
    expect(onContentChange).toHaveBeenCalledWith("Corrected content");
  });

  it("renders a contentError message with aria-invalid wired on the textarea", () => {
    render(<Harness open onOpenChange={() => {}} contentError="Content cannot be empty" />);
    expect(screen.getByText("Content cannot be empty")).toBeTruthy();
    const textarea = screen.getByDisplayValue("Stale content");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
  });

  it("does not render an error and marks aria-invalid=false when contentError is absent", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const textarea = screen.getByDisplayValue("Stale content");
    expect(textarea.getAttribute("aria-invalid")).toBe("false");
  });

  it("adds a tag via the tag input and removes it via its remove button", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const input = document.querySelector('[data-slot="tag-input-field"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "typescript" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("typescript")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove react" }));
    expect(screen.queryByText("react")).toBeNull();
  });

  it("calls onSave when the save button is clicked and canSave is true", () => {
    const onSave = vi.fn();
    render(<Harness open onOpenChange={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("does not call onSave when canSave is false, and disables the save button", () => {
    const onSave = vi.fn();
    render(<Harness open onOpenChange={() => {}} onSave={onSave} canSave={false} />);
    const saveBtn = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    fireEvent.click(saveBtn);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not auto-close the dialog on save — the host decides when to close", () => {
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows savingLabel and disables the save button while isSaving is true", () => {
    render(<Harness open onOpenChange={() => {}} isSaving />);
    const saveBtn = screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("calls onCancel and closes the dialog when the cancel button is clicked, without calling onSave", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape closes the dialog via onOpenChange(false) and never calls onSave", () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} onSave={onSave} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("marks background content aria-hidden (inert) while the dialog is open, and removes it on close", () => {
    const { rerender } = render(<Harness open onOpenChange={() => {}} />);
    let outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeTruthy();
    rerender(<Harness open={false} onOpenChange={() => {}} />);
    outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("returns focus to the trigger element when the dialog closes", () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button type="button" data-testid="real-trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <MosaicEditMemoryDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit memory"
            description="Correct a stale entry."
            closeAriaLabel="Close"
            content="Stale content"
            onContentChange={() => {}}
            contentLabel="Content"
            types={TYPES}
            type="fact"
            onTypeChange={() => {}}
            typeLabel="Type"
            tags={[]}
            onAddTag={vi.fn()}
            onRemoveTag={vi.fn()}
            tagsLabel="Tags"
            tagInputPlaceholder="Add a tag…"
            removeTagAriaLabel={(tag) => `Remove ${tag}`}
            canSave
            isSaving={false}
            onSave={() => {}}
            onCancel={() => setOpen(false)}
            saveLabel="Save"
            savingLabel="Saving…"
            cancelLabel="Cancel"
          />
        </div>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByTestId("real-trigger");
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(trigger);
  });

  // ── Accessibility guarantees NOT provable under jsdom ──────────────────────
  //
  // SKIPPED, deliberately, and the reason matters more than the test.
  //
  // jsdom does not implement native Tab-key focus traversal, so any assertion
  // of the shape "Tab from the last element cycles back into the popup"
  // measures an accident of jsdom's node ordering, not the real focus trap —
  // it can pass on a developer machine and fail in CI. The sibling dialogs in
  // this repo (alert-dialog, agent-builder-modal, drawer) independently hit
  // the identical wall and reached the identical verdict: skip it here, name
  // why, and rely on @base-ui/react's own audited test suite (a locked
  // production dependency) plus manual/Storybook keyboard QA for that
  // guarantee. The observable proxy for the trap IS covered above: the rest
  // of the document is marked aria-hidden while the dialog is open.
  it.skip("traps focus inside the popup: Tab from the last element cycles back into the dialog — NOT provable under jsdom", () => {
    // Intentionally left unimplemented — see comment above.
  });
});
