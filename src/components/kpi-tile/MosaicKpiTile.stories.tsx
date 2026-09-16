import type { Meta, StoryObj } from "@storybook/react";

import { MosaicKpiTile } from "./MosaicKpiTile.js";

function BuildingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M6 21V7l6-4 6 4v14" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M14 9h1" />
      <path d="M14 13h1" />
    </svg>
  );
}

const meta = {
  title: "Blocks/MosaicKpiTile",
  component: MosaicKpiTile,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof MosaicKpiTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    label: "Baux actifs",
    value: "127",
    icon: <BuildingIcon />,
    trend: { direction: "up", label: "+12%" },
    sparklineData: [98, 101, 104, 99, 107, 112, 118],
  },
};

export const TrendUp: Story = {
  args: {
    label: "Loyers encaissés (YTD)",
    value: "1,24 M€",
    icon: <BuildingIcon />,
    trend: { direction: "up", label: "+8,4%" },
    sparklineData: [900, 950, 980, 1020, 1080, 1150, 1240],
  },
};

export const TrendDown: Story = {
  args: {
    label: "Taux d'impayés",
    value: "3,1%",
    icon: <BuildingIcon />,
    trend: { direction: "down", label: "-1,2%" },
    sparklineData: [5.1, 4.8, 4.2, 4.0, 3.6, 3.4, 3.1],
  },
};

export const Loading: Story = {
  args: {
    label: "Baux actifs",
    value: "127",
    isLoading: true,
  },
};

export const NotConnectedFr: Story = {
  name: "Not connected (FR)",
  args: {
    label: "Loyers encaissés",
    value: "0",
    isConnected: false,
    notConnectedLabel: "Non raccordé",
  },
};

export const NotConnectedEn: Story = {
  name: "Not connected (EN)",
  args: {
    label: "Rent collected",
    value: "0",
    isConnected: false,
    notConnectedLabel: "Not connected",
  },
};
