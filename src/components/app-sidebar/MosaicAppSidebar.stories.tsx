import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAppSidebar } from "./MosaicAppSidebar.js";

const navItems = [
  { id: "nav-home", href: "/", label: "Home" },
  { id: "nav-agents", href: "/agents", label: "Agents", isActive: true },
  { id: "nav-templates", href: "/templates", label: "Templates" },
  { id: "nav-marketplace", href: "/marketplace", label: "Marketplace" },
];

const meta = {
  title: "Layout/MosaicAppSidebar",
  component: MosaicAppSidebar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="flex h-screen">
          <Story />
          <main className="flex-1 p-6">
            <p className="text-sm text-muted-foreground">Main content area</p>
          </main>
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicAppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredSidebarLabels = {
  sidebarAriaLabel: "Application sidebar",
  mainNavAriaLabel: "Main navigation",
  quickActionsHeading: "Quick Actions",
  recentHeading: "Recent",
  collapseSidebarAriaLabel: "Collapse sidebar",
  expandSidebarAriaLabel: "Expand sidebar",
};

export const Default: Story = {
  args: {
    isCollapsed: false,
    onToggleCollapse: () => console.log("collapse"),
    navItems,
    activePath: "/agents",
    onNavigate: (href) => console.log("navigate", href),
    ...requiredSidebarLabels,
  },
};

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    onToggleCollapse: () => console.log("expand"),
    navItems,
    activePath: "/agents",
    ...requiredSidebarLabels,
  },
};

const bottomNavItems = [{ id: "nav-settings", href: "/settings", label: "Settings" }];

export const WithBottomAnchoredSettingsAndChevron: Story = {
  name: "Bottom-anchored nav + bottom chevron",
  args: {
    isCollapsed: false,
    onToggleCollapse: () => console.log("collapse"),
    navItems,
    activePath: "/agents",
    onNavigate: (href) => console.log("navigate", href),
    bottomNavItems,
    bottomNavAriaLabel: "Secondary navigation",
    chevronPosition: "bottom",
    ...requiredSidebarLabels,
  },
};
