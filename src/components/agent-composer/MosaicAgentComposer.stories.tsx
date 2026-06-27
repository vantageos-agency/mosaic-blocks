import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentComposer } from "./MosaicAgentComposer.js";

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
          />
        </div>
      </MosaicDeviceProvider>
    );
  },
};
