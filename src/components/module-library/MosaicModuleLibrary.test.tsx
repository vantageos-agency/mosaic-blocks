import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicModuleForm, MosaicModuleLibrary } from "./MosaicModuleLibrary.js";

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
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
