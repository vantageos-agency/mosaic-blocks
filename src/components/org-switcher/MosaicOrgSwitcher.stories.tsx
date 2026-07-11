import type { Meta, StoryObj } from "@storybook/react";

import { MosaicOrgSwitcher } from "./MosaicOrgSwitcher.js";

const orgs = [
  { id: "org-1", name: "Acme Corp", slug: "acme" },
  { id: "org-2", name: "Beta Ventures", slug: "beta" },
  { id: "org-3", name: "Gamma Labs", slug: "gamma" },
];

const meta = {
  title: "Components/MosaicOrgSwitcher",
  component: MosaicOrgSwitcher,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicOrgSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    organizations: orgs,
    currentOrgId: "org-1",
    onSelectOrg: (id) => console.log("selected", id),
    onCreateOrg: () => console.log("create org"),
    createOrgLabel: "Create organization",
    triggerAriaLabel: "Select organization",
    noOrgSelectedLabel: "Select organization",
  },
};

export const NoCreateAction: Story = {
  args: {
    organizations: orgs,
    currentOrgId: "org-2",
    onSelectOrg: () => {},
    triggerAriaLabel: "Select organization",
    createOrgLabel: "Create organization",
    noOrgSelectedLabel: "Select organization",
  },
};
