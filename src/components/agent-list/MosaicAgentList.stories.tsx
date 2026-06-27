import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentList } from "./MosaicAgentList.js";

const agents = [
  {
    id: "a1",
    name: "Strategy Analyst",
    description: "Provides strategic analysis and recommendations.",
    type: "GPT-4",
    isActive: true,
    accentColor: "bg-blue-500",
    isEditable: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "a2",
    name: "Market Researcher",
    description: "Deep dives into market trends and competitive landscape.",
    type: "Claude",
    isActive: false,
    accentColor: "bg-gray-400",
    isEditable: true,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "a3",
    name: "Innovation Catalyst",
    description: "Generates creative ideas and novel approaches.",
    type: "GPT-4",
    isActive: true,
    accentColor: "bg-purple-500",
    isEditable: false,
    createdAt: new Date("2024-03-10"),
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

const meta = {
  title: "Components/MosaicAgentList",
  component: MosaicAgentList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicAgentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    agents,
    title: "My Agents",
    filters,
    selectedFilter: "all",
    onFilterChange: (id) => console.log("filter", id),
    categories: [],
    selectedCategory: "",
    onCategoryChange: () => {},
    onCreateAgent: () => console.log("create"),
    onToggleStatus: (id) => console.log("toggle", id),
    onEditAgent: (id) => console.log("edit", id),
    onDeleteAgent: (id) => console.log("delete", id),
  },
};

export const Empty: Story = {
  args: {
    agents: [],
    title: "My Agents",
    filters,
    selectedFilter: "all",
    onFilterChange: () => {},
    categories: [],
    selectedCategory: "",
    onCategoryChange: () => {},
    onCreateAgent: () => console.log("create"),
  },
};
