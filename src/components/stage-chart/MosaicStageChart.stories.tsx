import type { Meta, StoryObj } from "@storybook/react";

import { MosaicStageChart } from "./MosaicStageChart.js";

const meta = {
  title: "Blocks/MosaicStageChart",
  component: MosaicStageChart,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof MosaicStageChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PipelineCommercial: Story = {
  name: "Pipeline commercial FR",
  args: {
    tableCaption: "Répartition des dossiers par étape du pipeline commercial",
    stageColumnLabel: "Étape",
    valueColumnLabel: "Dossiers",
    valueLabel: (value: number) => `${value} dossiers`,
    stages: [
      { id: "prospect", label: "Prospect", value: 42 },
      { id: "qualifie", label: "Qualifié", value: 28 },
      { id: "proposition", label: "Proposition", value: 17 },
      { id: "negociation", label: "Négociation", value: 9 },
      { id: "gagne", label: "Gagné", value: 6, kind: "won" },
      { id: "perdu", label: "Perdu", value: 11, kind: "lost" },
    ],
  },
};
