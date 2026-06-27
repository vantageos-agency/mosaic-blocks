import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardHeader } from "./MosaicDashboardHeader.js";

const meta = {
  title: "Components/MosaicDashboardHeader",
  component: MosaicDashboardHeader,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicDashboardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Welcome back",
    notificationCount: 3,
    onNotificationsClick: () => console.log("notifications"),
    onSearchChange: (q) => console.log("search", q),
  },
};

export const NoNotifications: Story = {
  args: {
    title: "Agent Library",
    subtitle: "Manage your AI agents",
    notificationCount: 0,
  },
};

export const WithActions: Story = {
  args: {
    title: "Dashboard",
    actions: (
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        New Session
      </button>
    ),
    notificationCount: 12,
    onNotificationsClick: () => {},
  },
};
