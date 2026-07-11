import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardLayout } from "./MosaicDashboardLayout.js";

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Agents", href: "/agents" },
  { label: "Strategy Bot" },
];

const meta = {
  title: "Layout/MosaicDashboardLayout",
  component: MosaicDashboardLayout,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="h-screen overflow-auto">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicDashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredLayoutLabels = {
  headerAriaLabel: "Dashboard header",
  openNavigationAriaLabel: "Open navigation",
  breadcrumbAriaLabel: "Breadcrumb",
  mobileSidebarCloseAriaLabel: "Close dialog",
  mobileSidebarTitle: "Navigation",
  sidebarProps: {
    sidebarAriaLabel: "Application sidebar",
    mainNavAriaLabel: "Main navigation",
    quickActionsHeading: "Quick Actions",
    recentHeading: "Recent",
    collapseSidebarAriaLabel: "Collapse sidebar",
    expandSidebarAriaLabel: "Expand sidebar",
  },
};

export const Default: Story = {
  args: {
    title: "Agent Details",
    subtitle: "Configure and monitor your AI agent",
    breadcrumbs,
    children: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Dashboard content goes here.</p>
      </div>
    ),
    ...requiredLayoutLabels,
  },
};

export const WithActions: Story = {
  args: {
    title: "Reports",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Reports" }],
    actions: (
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        Export
      </button>
    ),
    children: <p className="text-sm text-muted-foreground">Report content goes here.</p>,
    ...requiredLayoutLabels,
  },
};
