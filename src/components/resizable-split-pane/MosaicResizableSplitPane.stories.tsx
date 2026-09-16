import type { Meta, StoryObj } from "@storybook/react";

import { MosaicResizableSplitPane } from "./MosaicResizableSplitPane.js";

const meta = {
  title: "Blocks/MosaicResizableSplitPane",
  component: MosaicResizableSplitPane,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MosaicResizableSplitPane>;

export default meta;
type Story = StoryObj<typeof meta>;

// Lease list (main) + document preview (side) — the "Baux du mois" layout.
export const ListeEtApercu: Story = {
  name: "Liste des baux + aperçu document",
  args: {
    main: (
      <div style={{ padding: 16 }}>
        <h3>Baux du mois</h3>
        <ul>
          <li>Camille Dubois — 12 rue de la Paix, Paris 2e — 1 850 €</li>
          <li>Yanis Belkacem — 4 avenue Foch, Lyon 6e — 1 240 €</li>
          <li>Sophie Lemoine — 8 rue Victor Hugo, Bordeaux — 980 €</li>
        </ul>
      </div>
    ),
    side: (
      <div style={{ padding: 16 }}>
        <h4>Bail — Camille Dubois</h4>
        <p>Document : bail-dubois-12-rue-de-la-paix.pdf</p>
      </div>
    ),
    sideWidth: 34,
    isSideCollapsed: false,
    collapseButtonAriaLabel: "Réduire le panneau document",
    resizeHandleAriaLabel: "Redimensionner le panneau document",
  },
  decorators: [
    (Story) => (
      <div style={{ height: 420 }}>
        <Story />
      </div>
    ),
  ],
};
