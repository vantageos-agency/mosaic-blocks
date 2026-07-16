import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentComposer } from "./MosaicAgentComposer.js";
import { MosaicAgentComposerDesktop } from "./MosaicAgentComposerDesktop.js";
import { MosaicAgentComposerMobile } from "./MosaicAgentComposerMobile.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const baseProps = {
  agentName: "My Agent",
  onAgentNameChange: vi.fn(),
  customInstructions: "",
  onCustomInstructionsChange: vi.fn(),
  onSelectRole: vi.fn(),
  onSelectPersona: vi.fn(),
  onSelectFramework: vi.fn(),
  onSelectModel: vi.fn(),
  onRemoveRole: vi.fn(),
  onRemovePersona: vi.fn(),
  onRemoveFramework: vi.fn(),
  onSave: vi.fn(),
  canSave: true,
  agentNameLabel: "Agent Name",
  agentNamePlaceholder: "Enter agent name…",
  instructionsPlaceholder: "Add any specific instructions or behaviors…",
  modelDescriptionLabel: "AI model that powers your agent",
  recommendedBadgeLabel: "RECOMMENDED",
  livePreviewHeading: "Live Preview",
  livePreviewSubheading: "See how your agent will behave",
  previewConfigLabel: "Your custom AI agent configuration",
  customInstructionsPreviewLabel: "Custom Instructions",
  selectAllModulesLabel: "Select all modules to see preview",
  requiredLabel: "Required",
  goBackAriaLabel: "Go back",
  savingLabel: "Saving…",
  creatingLabel: "Creating…",
  optionalInstructionsHelp: "Optional: Add specific behaviors or constraints for your agent",
  unnamedAgentLabel: "Unnamed Agent",
  roleSublabel: "XYZ-ROLE-SUBLABEL",
  personaSublabel: "XYZ-PERSONA-SUBLABEL",
  frameworkSublabel: "XYZ-FRAMEWORK-SUBLABEL",
  editModuleAriaLabel: (label: string) => `XYZ-EDIT-${label}`,
  removeModuleAriaLabel: (label: string) => `XYZ-REMOVE-${label}`,
  selectModuleAriaLabel: (label: string) => `XYZ-SELECT-${label}`,
  changeModuleLabel: (label: string) => `XYZ-CHANGE-${label}`,
  labels: {
    role: "Role",
    persona: "Persona",
    framework: "Framework",
    model: "Model",
    customInstructions: "Custom Instructions (Optional)",
    saveLabel: "Create Agent",
    cancelLabel: "Cancel",
    heading: "Compose Agent",
    subheading: "Select modules to build your custom agent",
    headingEdit: "Edit Agent",
    subheadingEdit: "Update your agent configuration",
  },
};

describe("MosaicAgentComposer", () => {
  it("renders without crashing in device provider", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAgentComposer {...baseProps} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("displays agent name field", () => {
    render(
      <Wrapper>
        <MosaicAgentComposer {...baseProps} />
      </Wrapper>,
    );
    // The agent name input should be present
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders save button when canSave=true", () => {
    render(
      <Wrapper>
        <MosaicAgentComposer {...baseProps} canSave={true} />
      </Wrapper>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders with canSave=false without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAgentComposer {...baseProps} canSave={false} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("has displayName set", () => {
    expect(MosaicAgentComposer.displayName).toBe("MosaicAgentComposer");
  });

  it("renders the host-supplied module-slot sublabels, fabricating no word of its own", () => {
    // Rendered directly against MosaicAgentComposerDesktop (not through the
    // orchestrator) — jsdom has no viewport, so MosaicDeviceProvider's
    // useIsMobile() defaults to mobile and the orchestrator would render
    // MosaicAgentComposerMobile instead, which never reads these props.
    render(<MosaicAgentComposerDesktop {...baseProps} />);
    expect(screen.getByText("XYZ-ROLE-SUBLABEL")).toBeTruthy();
    expect(screen.getByText("XYZ-PERSONA-SUBLABEL")).toBeTruthy();
    expect(screen.getByText("XYZ-FRAMEWORK-SUBLABEL")).toBeTruthy();
    expect(screen.queryByText(/professional expertise/i)).toBeNull();
    expect(screen.queryByText(/communication style/i)).toBeNull();
    expect(screen.queryByText(/thinking approach/i)).toBeNull();
  });

  it("Desktop: empty module slot uses host-supplied selectModuleAriaLabel, fabricating no 'Select' word", () => {
    render(<MosaicAgentComposerDesktop {...baseProps} />);
    // Role slot is empty in baseProps -> renders the "select" button
    const button = screen.getByLabelText("XYZ-SELECT-Role");
    expect(button).toBeTruthy();
    expect(button.textContent).not.toMatch(/select role/i);
    expect(screen.queryByLabelText(/^select role$/i)).toBeNull();
  });

  it("Desktop: filled module slot uses host-supplied edit/remove aria-labels, fabricating no English word", () => {
    render(
      <MosaicAgentComposerDesktop
        {...baseProps}
        selectedRole={{ name: "Test Role" }}
        selectedPersona={{ name: "Test Persona" }}
        selectedFramework={{ name: "Test Framework" }}
      />,
    );
    expect(screen.getByLabelText("XYZ-EDIT-Role")).toBeTruthy();
    expect(screen.getByLabelText("XYZ-REMOVE-Role")).toBeTruthy();
    expect(screen.queryByLabelText(/^edit /i)).toBeNull();
    expect(screen.queryByLabelText(/^remove /i)).toBeNull();
  });

  it("Desktop: model slot uses host-supplied selectModuleAriaLabel + changeModuleLabel, fabricating no English word", () => {
    const { rerender } = render(<MosaicAgentComposerDesktop {...baseProps} />);
    expect(screen.getByLabelText("XYZ-SELECT-Model")).toBeTruthy();
    rerender(<MosaicAgentComposerDesktop {...baseProps} selectedModel={{ name: "Test Model" }} />);
    expect(screen.getByText("XYZ-CHANGE-Model")).toBeTruthy();
    expect(screen.queryByText(/^change /i)).toBeNull();
  });

  it("Desktop: previewRequires defaults to all four modules (unchanged behavior)", () => {
    render(
      <MosaicAgentComposerDesktop
        {...baseProps}
        selectedRole={{ name: "Test Role" }}
        selectedPersona={{ name: "Test Persona" }}
        selectedFramework={{ name: "Test Framework" }}
        // selectedModel intentionally omitted
      />,
    );
    expect(screen.getByText(baseProps.selectAllModulesLabel)).toBeTruthy();
    expect(screen.queryByText(baseProps.previewConfigLabel)).toBeNull();
  });

  it("Desktop: previewRequires narrows the gate when host opts in", () => {
    render(
      <MosaicAgentComposerDesktop
        {...baseProps}
        previewRequires={["role"]}
        selectedRole={{ name: "Test Role" }}
        // persona/framework/model intentionally omitted
      />,
    );
    expect(screen.getByText(baseProps.previewConfigLabel)).toBeTruthy();
    expect(screen.queryByText(baseProps.selectAllModulesLabel)).toBeNull();
  });

  it("Mobile: empty module slot uses host-supplied selectModuleAriaLabel, fabricating no 'Select' word", () => {
    render(
      <Wrapper>
        <MosaicAgentComposerMobile {...baseProps} />
      </Wrapper>,
    );
    const button = screen.getByLabelText("XYZ-SELECT-Role");
    expect(button).toBeTruthy();
    expect(button.textContent).not.toMatch(/select role/i);
    expect(screen.queryByLabelText(/^select role$/i)).toBeNull();
  });

  it("Mobile: filled module slot uses host-supplied edit/remove aria-labels, fabricating no English word", () => {
    render(
      <Wrapper>
        <MosaicAgentComposerMobile {...baseProps} selectedRole={{ name: "Test Role" }} />
      </Wrapper>,
    );
    expect(screen.getByLabelText("XYZ-EDIT-Role")).toBeTruthy();
    expect(screen.getByLabelText("XYZ-REMOVE-Role")).toBeTruthy();
    expect(screen.queryByLabelText(/^edit /i)).toBeNull();
    expect(screen.queryByLabelText(/^remove /i)).toBeNull();
  });

  it("Mobile: model slot uses host-supplied selectModuleAriaLabel + changeModuleLabel, fabricating no English word", () => {
    const { rerender } = render(
      <Wrapper>
        <MosaicAgentComposerMobile {...baseProps} />
      </Wrapper>,
    );
    expect(screen.getByLabelText("XYZ-SELECT-Model")).toBeTruthy();
    rerender(
      <Wrapper>
        <MosaicAgentComposerMobile {...baseProps} selectedModel={{ name: "Test Model" }} />
      </Wrapper>,
    );
    expect(screen.getByText("XYZ-CHANGE-Model")).toBeTruthy();
    expect(screen.queryByText(/^change /i)).toBeNull();
  });
});
