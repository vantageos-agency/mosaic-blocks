import type { Meta, StoryObj } from "@storybook/react";

import { MosaicAgentCard } from "./MosaicAgentCard.js";

const agent = {
  id: "agent-1",
  name: "Strategy Analyst",
  description: "Provides in-depth strategic analysis and recommendations.",
  type: "GPT-4",
  isActive: true,
  accentColor: "bg-blue-500",
  isEditable: true,
  createdAt: new Date("2024-01-15"),
};

const requiredLabels = {
  activeBadgeLabel: "Active",
  agentActionsAriaLabel: "Agent actions",
  deactivateLabel: "Deactivate",
  activateLabel: "Activate",
  editLabel: "Edit",
  deleteLabel: "Delete",
  pauseLabel: "Pause",
  startLabel: "Start",
  createdLabel: (date: string) => `Created ${date}`,
};

const meta = {
  title: "Components/MosaicAgentCard",
  component: MosaicAgentCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicAgentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    agent,
    ...requiredLabels,
    onToggleStatus: (id) => console.log("toggle", id),
    onEdit: (id) => console.log("edit", id),
    onDelete: (id) => console.log("delete", id),
  },
};

export const Inactive: Story = {
  args: {
    agent: { ...agent, isActive: false, accentColor: "bg-gray-400" },
    ...requiredLabels,
    onToggleStatus: () => {},
  },
};

export const Loading: Story = {
  args: {
    agent,
    ...requiredLabels,
    isLoading: true,
    onToggleStatus: () => {},
  },
};
