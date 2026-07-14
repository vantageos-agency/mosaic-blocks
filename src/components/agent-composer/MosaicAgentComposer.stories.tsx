import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentComposer } from "./MosaicAgentComposer.js";

const requiredComposerLabels = {
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
  roleSublabel: "Professional expertise and domain knowledge",
  personaSublabel: "Communication style and personality traits",
  frameworkSublabel: "Thinking approach and decision-making process",
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
} as const;

function ComposerDemo() {
  const [agentName, setAgentName] = useState("Strategy Bot");
  const [instructions, setInstructions] = useState("");
  return (
    <MosaicDeviceProvider>
      <div className="h-screen">
        <MosaicAgentComposer
          agentName={agentName}
          onAgentNameChange={setAgentName}
          customInstructions={instructions}
          onCustomInstructionsChange={setInstructions}
          onSelectRole={() => console.log("select role")}
          onSelectPersona={() => console.log("select persona")}
          onSelectFramework={() => console.log("select framework")}
          onSelectModel={() => console.log("select model")}
          onRemoveRole={() => console.log("remove role")}
          onRemovePersona={() => console.log("remove persona")}
          onRemoveFramework={() => console.log("remove framework")}
          onSave={() => console.log("save")}
          onCancel={() => console.log("cancel")}
          canSave={agentName.trim().length > 0}
          {...requiredComposerLabels}
        />
      </div>
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Components/MosaicAgentComposer",
  component: MosaicAgentComposer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="h-screen">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicAgentComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseComposerArgs = {
  agentName: "",
  onAgentNameChange: () => {},
  customInstructions: "",
  onCustomInstructionsChange: () => {},
  onSelectRole: () => {},
  onSelectPersona: () => {},
  onSelectFramework: () => {},
  onSelectModel: () => {},
  onRemoveRole: () => {},
  onRemovePersona: () => {},
  onRemoveFramework: () => {},
  onSave: () => {},
  canSave: false,
  ...requiredComposerLabels,
} as const;

export const Default: Story = {
  args: baseComposerArgs,
  render: () => <ComposerDemo />,
};

export const WithRole: Story = {
  args: baseComposerArgs,
  render: () => {
    const [agentName, setAgentName] = useState("Expert Analyst");
    const [instructions, setInstructions] = useState("");
    return (
      <MosaicDeviceProvider>
        <div className="h-screen">
          <MosaicAgentComposer
            agentName={agentName}
            onAgentNameChange={setAgentName}
            customInstructions={instructions}
            onCustomInstructionsChange={setInstructions}
            selectedRole={{
              name: "Strategist",
              description: "High-level strategic direction.",
              icon: "🎯",
              tags: [],
            }}
            onSelectRole={() => {}}
            onSelectPersona={() => {}}
            onSelectFramework={() => {}}
            onSelectModel={() => {}}
            onRemoveRole={() => {}}
            onRemovePersona={() => {}}
            onRemoveFramework={() => {}}
            onSave={() => console.log("save")}
            canSave
            {...requiredComposerLabels}
          />
        </div>
      </MosaicDeviceProvider>
    );
  },
};
