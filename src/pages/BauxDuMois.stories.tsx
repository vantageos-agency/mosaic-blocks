import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDataTable } from "../components/data-table/MosaicDataTable.js";
import { MosaicDrawer } from "../components/drawer/MosaicDrawer.js";
import { MosaicPdfViewer } from "../components/pdf-viewer/MosaicPdfViewer.js";
import { MosaicResizableSplitPane } from "../components/resizable-split-pane/MosaicResizableSplitPane.js";

/**
 * "Pages/Baux du mois" — composed page (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e
 * T2). Data table of leases signed this month + a document side panel
 * (resizable split pane holding the PDF preview) + a drawer showing the
 * selected lease's detail — assembled together, not shown in isolation.
 */

interface Bail {
  id: string;
  locataire: string;
  bien: string;
  loyer: string;
  dateSignature: string;
}

const bauxDuMois: Bail[] = [
  {
    id: "b-1",
    locataire: "Camille Dubois",
    bien: "12 rue de la Paix, Paris 2e",
    loyer: "1 850 €",
    dateSignature: "3 sept. 2026",
  },
  {
    id: "b-2",
    locataire: "Yanis Belkacem",
    bien: "4 avenue Foch, Lyon 6e",
    loyer: "1 240 €",
    dateSignature: "8 sept. 2026",
  },
  {
    id: "b-3",
    locataire: "Elise Marchand",
    bien: "3 place Bellecour, Lyon 2e",
    loyer: "1 650 €",
    dateSignature: "11 sept. 2026",
  },
];

function BauxDuMoisPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ margin: 0 }}>Baux signés — septembre 2026</h2>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MosaicResizableSplitPane
          main={
            <div style={{ padding: 16, height: "100%", overflow: "auto" }}>
              <MosaicDataTable<Bail>
                columns={[
                  { key: "locataire", header: "Locataire", sortable: true },
                  { key: "bien", header: "Bien", sortable: true },
                  { key: "loyer", header: "Loyer mensuel", sortable: true, align: "right" },
                  { key: "dateSignature", header: "Date de signature", sortable: true },
                ]}
                rows={bauxDuMois}
                getRowKey={(row) => row.id}
                emptyMessage="Aucun bail signé ce mois-ci."
              />
            </div>
          }
          side={
            <div style={{ height: "100%", padding: 16 }}>
              <h4 style={{ marginTop: 0 }}>Contrat — Camille Dubois</h4>
              <MosaicPdfViewer
                fileUrl="/documents/bail-dubois-12-rue-de-la-paix.pdf"
                currentPage={1}
                totalPages={12}
                zoom={1}
                loadingLabel="Chargement du document…"
                errorLabel="Impossible d'afficher ce document."
              />
            </div>
          }
          sideWidth={38}
          collapseButtonAriaLabel="Réduire le panneau document"
          resizeHandleAriaLabel="Redimensionner le panneau document"
        />
      </div>
      <MosaicDrawer
        open
        onOpenChange={() => {}}
        title="Bail — 12 rue de la Paix, Paris 2e"
        closeAriaLabel="Fermer le panneau"
        side="right"
      >
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p>Locataire : Camille Dubois</p>
          <p>Loyer mensuel : 1 850 €</p>
          <p>Dépôt de garantie : 1 850 €</p>
          <p>Date de signature : 3 septembre 2026</p>
        </div>
      </MosaicDrawer>
    </div>
  );
}

const meta = {
  title: "Pages/Baux du mois",
  component: BauxDuMoisPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BauxDuMoisPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
