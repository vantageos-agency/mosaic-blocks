import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardContent } from "./MosaicDashboardContent.js";

const views = [
  {
    id: "overview",
    label: "Overview",
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">Dashboard overview content goes here.</p>
      </div>
    ),
  },
  {
    id: "agents",
    label: "Agents",
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Agents</h2>
        <p className="text-sm text-muted-foreground">Agent management panel.</p>
      </div>
    ),
  },
  {
    id: "templates",
    label: "Templates",
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Templates</h2>
        <p className="text-sm text-muted-foreground">Browse and manage templates.</p>
      </div>
    ),
  },
];

const meta = {
  title: "Components/MosaicDashboardContent",
  component: MosaicDashboardContent,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="h-64">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicDashboardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    views,
    currentView: "overview",
    viewNotFoundLabel: "View not found: ",
  },
};

export const AgentsView: Story = {
  args: {
    views,
    currentView: "agents",
    viewNotFoundLabel: "View not found: ",
  },
};
