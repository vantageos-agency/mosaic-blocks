import type { Meta, StoryObj } from "@storybook/react";

import { MosaicQuickActionCard } from "./MosaicQuickActionCard.js";

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const actions = [
  {
    id: "new",
    title: "New Session",
    description: "Start a new collaborative session",
    href: "#",
    accent: "blue" as const,
    icon: <PlusIcon />,
  },
  {
    id: "explore",
    title: "Explore",
    description: "Browse available templates",
    href: "#",
    accent: "green" as const,
    icon: <SearchIcon />,
  },
  {
    id: "invite",
    title: "Invite Team",
    description: "Add team members to collaborate",
    href: "#",
    accent: "purple" as const,
    icon: <PlusIcon />,
  },
];

const meta = {
  title: "Components/MosaicQuickActionCard",
  component: MosaicQuickActionCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicQuickActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actions,
    heading: "Quick Actions",
  },
};

export const NoHeading: Story = {
  args: {
    actions: actions.slice(0, 2),
  },
};
