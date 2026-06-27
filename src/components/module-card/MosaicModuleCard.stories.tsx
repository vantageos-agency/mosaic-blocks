import type { Meta, StoryObj } from "@storybook/react";

import { MosaicModuleCard } from "./MosaicModuleCard.js";

const sampleModule = {
  name: "Design Thinking",
  description:
    "Human-centered problem-solving in 5 stages: Empathize, Define, Ideate, Prototype, Test.",
  details: "5 steps",
  icon: "💡",
  tags: ["innovation", "ux", "problem-solving"],
};

const meta = {
  title: "Components/MosaicModuleCard",
  component: MosaicModuleCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicModuleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Framework: Story = {
  args: {
    type: "framework",
    module: sampleModule,
    isSelected: true,
    onEdit: () => console.log("edit"),
    onRemove: () => console.log("remove"),
  },
};

export const Role: Story = {
  args: {
    type: "role",
    module: {
      name: "Strategist",
      description: "Provides high-level strategic direction and vision.",
      icon: "🎯",
      tags: ["leadership", "strategy"],
    },
    onEdit: () => {},
    onRemove: () => {},
  },
};

export const NoActions: Story = {
  args: {
    type: "persona",
    module: {
      name: "Devil's Advocate",
      description: "Challenges assumptions and explores alternative viewpoints.",
      icon: "😈",
    },
  },
};
