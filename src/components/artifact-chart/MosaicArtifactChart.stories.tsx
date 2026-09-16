import type { Meta, StoryObj } from "@storybook/react";
import * as Recharts from "recharts";

import { MosaicArtifactChart } from "./MosaicArtifactChart.js";

const meta = {
  title: "Blocks/MosaicArtifactChart",
  component: MosaicArtifactChart,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof MosaicArtifactChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  typeBadgeLabel: (type: "bar" | "line" | "pie") =>
    ({ bar: "Barres", line: "Courbe", pie: "Camembert" })[type],
  pointsLabel: (count: number) => `${count} points`,
  unsupportedTypeMessage: (type: string) => `Type de graphique non pris en charge : ${type}`,
  unavailableMessage: "Graphiques indisponibles",
};

// Monthly rent revenue collected across the property portfolio — realistic
// French property-management figures, never all-zero.
export const RevenusLocatifs: Story = {
  name: "Revenus locatifs (barres)",
  args: {
    data: {
      title: "Revenus locatifs 2026",
      type: "bar",
      data: [
        { mois: "Avr", loyers: 98200 },
        { mois: "Mai", loyers: 101450 },
        { mois: "Juin", loyers: 104300 },
        { mois: "Juil", loyers: 99800 },
        { mois: "Août", loyers: 107600 },
        { mois: "Sept", loyers: 112900 },
      ],
      config: { xAxis: "mois", legend: true, grid: true },
      metadata: { dataSource: "VantageCRM Cloud", description: "Loyers encaissés, en euros" },
    },
    labels,
    recharts: Recharts,
  },
  parameters: { chromatic: { disableSnapshot: false } },
  decorators: [
    (Story) => (
      <div style={{ height: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export const TauxOccupation: Story = {
  name: "Taux d'occupation (courbe)",
  args: {
    data: {
      title: "Taux d'occupation — 6 derniers mois",
      type: "line",
      data: [
        { mois: "Avr", taux: 94.2 },
        { mois: "Mai", taux: 95.8 },
        { mois: "Juin", taux: 96.1 },
        { mois: "Juil", taux: 97.4 },
        { mois: "Août", taux: 98.0 },
        { mois: "Sept", taux: 98.4 },
      ],
      config: { xAxis: "mois", legend: false, grid: true },
    },
    labels,
    recharts: Recharts,
  },
  decorators: [
    (Story) => (
      <div style={{ height: 360 }}>
        <Story />
      </div>
    ),
  ],
};
