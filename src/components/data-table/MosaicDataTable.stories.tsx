import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDataTable } from "./MosaicDataTable.js";

interface Bail {
  id: string;
  locataire: string;
  bien: string;
  loyer: string;
  statut: "Actif" | "Préavis" | "Impayé";
}

const baux: Bail[] = [
  {
    id: "b-1",
    locataire: "Camille Dubois",
    bien: "12 rue de la Paix, Paris 2e",
    loyer: "1 850 €",
    statut: "Actif",
  },
  {
    id: "b-2",
    locataire: "Yanis Belkacem",
    bien: "4 avenue Foch, Lyon 6e",
    loyer: "1 240 €",
    statut: "Actif",
  },
  {
    id: "b-3",
    locataire: "Sophie Lemoine",
    bien: "8 rue Victor Hugo, Bordeaux",
    loyer: "980 €",
    statut: "Préavis",
  },
  {
    id: "b-4",
    locataire: "Karim Haddad",
    bien: "22 quai des Chartrons, Bordeaux",
    loyer: "1 120 €",
    statut: "Actif",
  },
  {
    id: "b-5",
    locataire: "Elise Marchand",
    bien: "3 place Bellecour, Lyon 2e",
    loyer: "1 650 €",
    statut: "Impayé",
  },
];

const meta = {
  title: "Blocks/MosaicDataTable",
  component: MosaicDataTable<Bail>,
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicDataTable<Bail>>;

export default meta;
type Story = StoryObj<typeof meta>;

// Realistic French leases table — never zero rows.
export const BauxEnCours: Story = {
  name: "Baux en cours",
  args: {
    columns: [
      { key: "locataire", header: "Locataire", sortable: true },
      { key: "bien", header: "Bien", sortable: true },
      { key: "loyer", header: "Loyer mensuel", sortable: true, align: "right" },
      { key: "statut", header: "Statut" },
    ],
    rows: baux,
    getRowKey: (row) => row.id,
    emptyMessage: "Aucun bail en cours.",
  },
};
