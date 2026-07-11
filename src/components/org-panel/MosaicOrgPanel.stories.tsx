import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  MosaicMemberList,
  MosaicMultiOrgIndicator,
  MosaicOrgPanel,
  MosaicOrgRoleBadge,
} from "./MosaicOrgPanel.js";

const org = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme",
  description: "Building the future of AI collaboration.",
  stats: { totalMembers: 12, totalItems: 45 },
};

const members = [
  { id: "m1", name: "Alice Martin", email: "alice@acme.com", role: "owner" as const },
  { id: "m2", name: "Bob Chen", email: "bob@acme.com", role: "admin" as const },
  { id: "m3", name: "Carol Smith", email: "carol@acme.com", role: "member" as const },
];

const meta = {
  title: "Components/MosaicOrgPanel",
  component: MosaicOrgPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="h-[500px]">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicOrgPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    org,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        content: (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">{org.description}</p>
          </div>
        ),
      },
      {
        id: "members",
        label: "Members",
        content: (
          <MosaicDeviceProvider>
            <MosaicMemberList
              members={members}
              onRemoveMember={(id) => console.log("remove", id)}
              onChangeRole={(id, role) => console.log("role", id, role)}
              youLabel="You"
              memberActionsAriaLabel="Member actions"
              removeMemberLabel="Remove member"
              emptyMessage="No members found."
              inviteLabel="Invite"
            />
          </MosaicDeviceProvider>
        ),
      },
    ],
    defaultTab: "overview",
  },
};

export const RoleBadges: Story = {
  args: { org },
  render: () => (
    <div className="flex items-center gap-2">
      {/* biome-ignore lint/a11y/useValidAriaRole: "role" is a component prop, not an HTML ARIA role */}
      <MosaicOrgRoleBadge role="owner" />
      {/* biome-ignore lint/a11y/useValidAriaRole: "role" is a component prop, not an HTML ARIA role */}
      <MosaicOrgRoleBadge role="admin" />
      {/* biome-ignore lint/a11y/useValidAriaRole: "role" is a component prop, not an HTML ARIA role */}
      <MosaicOrgRoleBadge role="member" />
    </div>
  ),
};

export const MultiOrgIndicator: Story = {
  args: { org },
  render: () => (
    <div className="flex items-center gap-4">
      <MosaicMultiOrgIndicator
        orgCount={3}
        currentOrgName="Acme Corp"
        onSwitchOrg={() => console.log("switch")}
      />
      <MosaicMultiOrgIndicator orgCount={1} />
    </div>
  ),
};
