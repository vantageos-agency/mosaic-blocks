import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicQuickAgentSelector } from "./MosaicQuickAgentSelector.js";

const availableAgents = [
  {
    id: "a1",
    name: "Strategy Analyst",
    type: "strategist",
    accentColor: "bg-blue-500",
    isActive: true,
  },
  {
    id: "a2",
    name: "Market Researcher",
    type: "researcher",
    accentColor: "bg-green-500",
    isActive: true,
  },
  {
    id: "a3",
    name: "Innovation Catalyst",
    type: "innovator",
    accentColor: "bg-purple-500",
    isActive: true,
  },
];

function SelectorDemo() {
  const [selected, setSelected] = useState([availableAgents[0]]);
  const remaining = availableAgents.filter((a) => !selected.find((s) => s.id === a.id));
  return (
    <MosaicDeviceProvider>
      <MosaicQuickAgentSelector
        selectedAgents={selected}
        availableAgents={remaining}
        onAddAgent={(id) => {
          const agent = availableAgents.find((a) => a.id === id);
          if (agent) setSelected((prev) => [...prev, agent]);
        }}
        onRemoveAgent={(id) => setSelected((prev) => prev.filter((a) => a.id !== id))}
        onOpenBuilder={() => console.log("open builder")}
        {...requiredQuickAgentLabels}
      />
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Components/MosaicQuickAgentSelector",
  component: MosaicQuickAgentSelector,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicQuickAgentSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredQuickAgentLabels = {
  quickAddHeading: "Quick Add",
  configureBehaviorCaption: "Configure roles and behavior",
  noAgentsAvailableMessage: "No agents available to add.",
  addAgentModalTitle: "Add Agent",
  closeAriaLabel: "Close dialog",
  addLabel: "Add Agent",
  createLabel: "Create Custom Agent",
};

export const Default: Story = {
  args: {
    selectedAgents: [],
    onAddAgent: () => {},
    onRemoveAgent: () => {},
    ...requiredQuickAgentLabels,
  },
  render: () => <SelectorDemo />,
};

export const Empty: Story = {
  args: {
    selectedAgents: [],
    availableAgents,
    onAddAgent: (id) => console.log("add", id),
    onRemoveAgent: () => {},
    ...requiredQuickAgentLabels,
  },
};
