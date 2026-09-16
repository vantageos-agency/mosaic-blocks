import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDrawer } from "./MosaicDrawer.js";

const meta = {
  title: "Blocks/MosaicDrawer",
  component: MosaicDrawer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MosaicDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Opened by default so the operator sees the styled panel, not a trigger.
export const DetailDuBail: Story = {
  name: "Détail du bail (ouvert)",
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Bail — 12 rue de la Paix, Paris 2e",
    closeAriaLabel: "Fermer le panneau",
    side: "right",
    children: (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p>Locataire : Camille Dubois</p>
        <p>Loyer mensuel : 1 850 €</p>
        <p>Dépôt de garantie : 1 850 €</p>
        <p>Date d'entrée : 1er mars 2025</p>
        <p>Statut : Actif</p>
      </div>
    ),
  },
};
