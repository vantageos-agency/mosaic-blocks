import type { Meta, StoryObj } from "@storybook/react";

import { MosaicButton } from "../button/Button.js";
import { MosaicEmptyState } from "./MosaicEmptyState.js";

const meta = {
  title: "Blocks/MosaicEmptyState",
  component: MosaicEmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AucunBailEnAttente: Story = {
  name: "Aucun bail en attente",
  args: {
    title: "Aucun bail en attente de signature",
    description: "Tous les baux du portefeuille sont signés et actifs.",
    action: <MosaicButton>Créer un nouveau bail</MosaicButton>,
  },
};
