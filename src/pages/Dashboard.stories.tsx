import type { Meta, StoryObj } from "@storybook/react";
import * as Recharts from "recharts";

import { MosaicAppSidebar } from "../components/app-sidebar/MosaicAppSidebar.js";
import { MosaicArtifactChart } from "../components/artifact-chart/MosaicArtifactChart.js";
import { MosaicDataTable } from "../components/data-table/MosaicDataTable.js";
import { MosaicDeviceProvider } from "../components/device-provider/MosaicDeviceProvider.js";
import { MosaicStatsGrid } from "../components/stats-grid/MosaicStatsGrid.js";

/**
 * "Pages/Dashboard" — composed page (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e
 * T2). Sidebar + stats grid + chart + data table assembled together so the
 * operator judges a SCREEN, not a swatch of isolated blocks.
 */

interface Locataire {
  id: string;
  nom: string;
  bien: string;
  loyer: string;
  statut: "Actif" | "Préavis" | "Impayé";
}

const locataires: Locataire[] = [
  {
    id: "l-1",
    nom: "Camille Dubois",
    bien: "12 rue de la Paix, Paris 2e",
    loyer: "1 850 €",
    statut: "Actif",
  },
  {
    id: "l-2",
    nom: "Yanis Belkacem",
    bien: "4 avenue Foch, Lyon 6e",
    loyer: "1 240 €",
    statut: "Actif",
  },
  {
    id: "l-3",
    nom: "Sophie Lemoine",
    bien: "8 rue Victor Hugo, Bordeaux",
    loyer: "980 €",
    statut: "Préavis",
  },
  {
    id: "l-4",
    nom: "Karim Haddad",
    bien: "22 quai des Chartrons, Bordeaux",
    loyer: "1 120 €",
    statut: "Actif",
  },
];

const navItems = [
  { id: "nav-dashboard", href: "/dashboard", label: "Tableau de bord", isActive: true },
  { id: "nav-baux", href: "/baux", label: "Baux" },
  { id: "nav-locataires", href: "/locataires", label: "Locataires" },
  { id: "nav-documents", href: "/documents", label: "Documents" },
];

const sidebarLabels = {
  sidebarAriaLabel: "Navigation principale",
  mainNavAriaLabel: "Navigation",
  quickActionsHeading: "Actions rapides",
  recentHeading: "Récents",
  collapseSidebarAriaLabel: "Réduire la barre latérale",
  expandSidebarAriaLabel: "Ouvrir la barre latérale",
};

const chartLabels = {
  typeBadgeLabel: (type: "bar" | "line" | "pie") =>
    ({ bar: "Barres", line: "Courbe", pie: "Camembert" })[type],
  pointsLabel: (count: number) => `${count} points`,
  unsupportedTypeMessage: (type: string) => `Type de graphique non pris en charge : ${type}`,
  unavailableMessage: "Graphiques indisponibles",
};

function DashboardPage() {
  return (
    <MosaicDeviceProvider>
      <div style={{ display: "flex", height: "100vh" }}>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          activePath="/dashboard"
          onNavigate={() => {}}
          {...sidebarLabels}
        />
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <MosaicStatsGrid
            heading="Portefeuille immobilier — vue d'ensemble"
            subtext="Chiffres consolidés au 1er septembre 2026"
            stats={[
              { value: "127", label: "Biens gérés" },
              { value: "98,4 %", label: "Taux d'occupation" },
              { value: "42", label: "Baux signés ce mois" },
              { value: "1,24 M€", label: "Loyers encaissés (YTD)" },
            ]}
          />
          <div style={{ height: 320, marginBottom: 32 }}>
            <MosaicArtifactChart
              data={{
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
              }}
              labels={chartLabels}
              recharts={Recharts}
            />
          </div>
          <MosaicDataTable<Locataire>
            columns={[
              { key: "nom", header: "Locataire", sortable: true },
              { key: "bien", header: "Bien", sortable: true },
              { key: "loyer", header: "Loyer mensuel", sortable: true, align: "right" },
              { key: "statut", header: "Statut" },
            ]}
            rows={locataires}
            getRowKey={(row) => row.id}
            emptyMessage="Aucun locataire."
          />
        </main>
      </div>
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
