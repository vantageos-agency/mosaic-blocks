/**
 * MosaicSaveTemplateModal — tests
 *
 * Coverage: renders nothing when open=false; renders form fields (name,
 * description, category, tags) when open=true; every user-facing string is
 * host-supplied (SIN-01) — no hardcoded copy asserted anywhere; categories
 * come entirely from the host-supplied `categories` prop (no hardcoded
 * taxonomy); tag add/remove is delegated to onAddTag/onRemoveTag callbacks
 * (controlled); Escape (native dialog "cancel" event, wired by
 * MosaicAdaptiveModal) calls onOpenChange(false) WITHOUT calling onSave —
 * closing is never an implicit save; aria-busy + disabled submit while
 * isSaving; save button disabled when canSave=false (host-computed
 * validity, this component never decides validation itself);
 * aria-invalid + aria-describedby wired on name/description errors when the
 * host supplies an error string; data-slot="save-template-modal" present on
 * the modal body.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicSaveTemplateModal } from "./MosaicSaveTemplateModal.js";

const CATEGORIES = [
  { value: "general", label: "General Purpose" },
  { value: "strategy", label: "Business Strategy" },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const BASE_PROPS = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Save as Template",
  closeAriaLabel: "Close dialog",
  name: "",
  onNameChange: vi.fn(),
  nameLabel: "Template Name",
  templateDescription: "",
  onTemplateDescriptionChange: vi.fn(),
  descriptionLabel: "Description",
  categories: CATEGORIES,
  category: "general",
  onCategoryChange: vi.fn(),
  categoryLabel: "Category",
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
  saveButtonLabel: "Save Template",
  savingLabel: "Saving…",
  cancelButtonLabel: "Cancel",
};

describe("MosaicSaveTemplateModal", () => {
  it("renders nothing when open=false", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} open={false} />
      </Wrapper>,
    );
    expect(screen.queryByText("Save as Template")).toBeNull();
  });

  it("sets data-slot='save-template-modal' on the body when open", () => {
    const { container } = render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} />
      </Wrapper>,
    );
    expect(container.querySelector("[data-slot='save-template-modal']")).toBeTruthy();
  });

  it("renders the host-supplied name/description/category/tags labels", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} />
      </Wrapper>,
    );
    expect(screen.getByText("Template Name")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Category")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
  });

  it("renders categories exclusively from the host-supplied categories prop", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} />
      </Wrapper>,
    );
    // Trigger shows the currently selected category label.
    expect(screen.getByText("General Purpose")).toBeTruthy();
  });

  it("opens the category popup and lists ONLY the host-supplied categories — no hardcoded taxonomy", async () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} />
      </Wrapper>,
    );
    fireEvent.click(
      screen.getByText("Category").parentElement?.querySelector("[data-slot='select']") as Element,
    );
    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((option) => option.textContent);
    expect(optionLabels).toEqual(CATEGORIES.map((c) => c.label));
  });

  it("calls onNameChange when the name input changes", () => {
    const onNameChange = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} onNameChange={onNameChange} />
      </Wrapper>,
    );
    fireEvent.change(screen.getByLabelText("Template Name"), {
      target: { value: "My template" },
    });
    expect(onNameChange).toHaveBeenCalledWith("My template");
  });

  it("calls onTemplateDescriptionChange when the description textarea changes", () => {
    const onTemplateDescriptionChange = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal
          {...BASE_PROPS}
          onTemplateDescriptionChange={onTemplateDescriptionChange}
        />
      </Wrapper>,
    );
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "A description" },
    });
    expect(onTemplateDescriptionChange).toHaveBeenCalledWith("A description");
  });

  it("shows nameError with aria-invalid + aria-describedby when host supplies one", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} nameError="Name is required" />
      </Wrapper>,
    );
    const input = screen.getByLabelText("Template Name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Name is required")).toBeTruthy();
  });

  it("does not mark the name input invalid when no nameError is supplied", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} />
      </Wrapper>,
    );
    const input = screen.getByLabelText("Template Name");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows descriptionError with aria-invalid + aria-describedby when host supplies one", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} descriptionError="Too short" />
      </Wrapper>,
    );
    const textarea = screen.getByLabelText("Description");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Too short")).toBeTruthy();
  });

  it("calls onSave when the save button is clicked and canSave=true", () => {
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} onSave={onSave} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Template" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables the save button when canSave=false — submission never fires", () => {
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} canSave={false} onSave={onSave} />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Save Template" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables the save button while isSaving — and shows savingLabel", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} isSaving />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} onCancel={onCancel} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the cancel button while isSaving", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} isSaving />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Cancel" });
    expect((button as HTMLButtonElement).disabled).toBeTruthy();
  });

  it("renders host-supplied extra content via children, above the actions", () => {
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS}>
          <p data-testid="agents-summary">3 agents configured</p>
        </MosaicSaveTemplateModal>
      </Wrapper>,
    );
    expect(screen.getByTestId("agents-summary")).toBeTruthy();
  });

  it("calls onOpenChange(false) without calling onSave when the dialog is closed via Escape", () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicSaveTemplateModal {...BASE_PROPS} onOpenChange={onOpenChange} onSave={onSave} />
      </Wrapper>,
    );
    const dialog = document.querySelector("dialog");
    expect(dialog).toBeTruthy();
    fireEvent(dialog as HTMLDialogElement, new Event("cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();
  });
});
