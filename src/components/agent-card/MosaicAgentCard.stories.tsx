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
    onToggleStatus: (id) => console.log("toggle", id),
    onEdit: (id) => console.log("edit", id),
    onDelete: (id) => console.log("delete", id),
  },
};

export const Inactive: Story = {
  args: {
    agent: { ...agent, isActive: false, accentColor: "bg-gray-400" },
    onToggleStatus: () => {},
  },
};

export const Loading: Story = {
  args: {
    agent,
    isLoading: true,
    onToggleStatus: () => {},
  },
};
