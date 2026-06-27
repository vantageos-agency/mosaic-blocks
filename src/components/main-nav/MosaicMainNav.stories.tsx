import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMainNav } from "./MosaicMainNav.js";

const items = [
  { href: "/", label: "Home" },
  { href: "/agents", label: "Agents", isActive: true },
  { href: "/templates", label: "Templates" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

const meta = {
  title: "Components/MosaicMainNav",
  component: MosaicMainNav,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicMainNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items,
    isAdmin: false,
    drawerTitle: "VantageOS",
    drawerSubtitle: "AI Platform",
  },
};

export const AdminVisible: Story = {
  args: {
    items,
    isAdmin: true,
    drawerTitle: "VantageOS",
  },
};
