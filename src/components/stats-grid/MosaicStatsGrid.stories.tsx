import type { Meta, StoryObj } from "@storybook/react";

import { MosaicStatsGrid } from "./MosaicStatsGrid.js";

const meta = {
  title: "Blocks/MosaicStatsGrid",
  component: MosaicStatsGrid,
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicStatsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Realistic French property-management KPIs — mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2.
export const Default: Story = {
  args: {
    heading: "Portefeuille immobilier — vue d'ensemble",
    subtext: "Chiffres consolidés au 1er septembre 2026",
    stats: [
      { value: "127", label: "Biens gérés" },
      { value: "98,4 %", label: "Taux d'occupation" },
      { value: "42", label: "Baux signés ce mois" },
      { value: "1,24 M€", label: "Loyers encaissés (YTD)" },
    ],
  },
};
