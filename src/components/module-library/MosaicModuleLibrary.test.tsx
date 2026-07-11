import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicModuleForm, MosaicModuleLibrary } from "./MosaicModuleLibrary.js";

const requiredModuleLibraryLabels = {
  nameFieldLabel: "Name *",
  descriptionFieldLabel: "Description",
  namePlaceholder: "Module name…",
  descriptionPlaceholder: "Describe this module…",
  cancelLabel: "Cancel",
  saveChangesLabel: "Save Changes",
  createItemLabel: "Create",
  itemActionsAriaLabel: "Item actions",
  editItemLabel: "Edit",
  deleteItemLabel: "Delete",
  closeEditorAriaLabel: "Close dialog",
  editModalTitle: (name: string) => `Edit ${name || "Module"}`,
};

const requiredModuleFormLabels = {
  nameFieldLabel: "Name *",
  descriptionFieldLabel: "Description",
  namePlaceholder: "Module name…",
  descriptionPlaceholder: "Describe this module…",
  cancelLabel: "Cancel",
  saveChangesLabel: "Save Changes",
  createItemLabel: "Create",
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const items = [
  {
    id: "fw-1",
    name: "Design Thinking",
    description: "Human-centered problem solving",
    icon: "💡",
    tags: ["innovation"],
    isCustom: false,
  },
  {
    id: "fw-2",
    name: "Lean Startup",
    description: "Build-Measure-Learn",
    icon: "🚀",
    tags: ["startup"],
    isCustom: true,
  },
];

const formFields = [
  { id: "name", label: "Name", type: "text" as const, required: true },
  { id: "description", label: "Description", type: "textarea" as const },
];

describe("MosaicModuleLibrary", () => {
  it("renders item names", () => {
    render(
      <Wrapper>
        <MosaicModuleLibrary
          items={items}
          formFields={formFields}
          onCreateItem={() => {}}
          onUpdateItem={() => {}}
          onDeleteItem={() => {}}
          {...requiredModuleLibraryLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Design Thinking")).toBeTruthy();
    expect(screen.getByText("Lean Startup")).toBeTruthy();
  });

  it("renders with empty items without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicModuleLibrary
            items={[]}
            formFields={formFields}
            onCreateItem={() => {}}
            onUpdateItem={() => {}}
            onDeleteItem={() => {}}
            {...requiredModuleLibraryLabels}
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders title when provided", () => {
    render(
      <Wrapper>
        <MosaicModuleLibrary
          items={items}
          formFields={formFields}
          onCreateItem={() => {}}
          onUpdateItem={() => {}}
          onDeleteItem={() => {}}
          title="Framework Library"
          {...requiredModuleLibraryLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Framework Library")).toBeTruthy();
  });
});

describe("MosaicModuleForm", () => {
  it("renders name input field", () => {
    const { container } = render(
      <MosaicModuleForm
        mode="create"
        formFields={formFields}
        onSave={() => {}}
        onCancel={() => {}}
        {...requiredModuleFormLabels}
      />,
    );
    // Name field has id="module-name"
    const nameInput = container.querySelector("#module-name");
    expect(nameInput).toBeTruthy();
  });

  it("renders submit and cancel buttons", () => {
    render(
      <MosaicModuleForm
        mode="create"
        formFields={formFields}
        onSave={() => {}}
        onCancel={() => {}}
        {...requiredModuleFormLabels}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
