import type { Meta, StoryObj } from "@storybook/react";

import { MosaicAppSidebar } from "../components/app-sidebar/MosaicAppSidebar.js";
import { MosaicDataTable } from "../components/data-table/MosaicDataTable.js";
import {
  MosaicDeviceProvider,
  useDevice,
} from "../components/device-provider/MosaicDeviceProvider.js";
import { MosaicKpiTile } from "../components/kpi-tile/MosaicKpiTile.js";
import { MosaicStageChart } from "../components/stage-chart/MosaicStageChart.js";
import { MosaicThemeToggle } from "../components/theme-toggle/MosaicThemeToggle.js";
import { MosaicTopBar } from "../components/top-bar/MosaicTopBar.js";

/**
 * "Pages/Dashboard" — composed page (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e
 * T2, evolved Wave-1 T5). App shell (sidebar + top bar) + a row of 4 KPI
 * tiles + a pipeline stage chart + the existing tenant table, assembled
 * together so the operator judges a SCREEN, not a swatch of isolated
 * blocks — the same discipline that produced this story originally,
 * extended with the finished BLOCK 1/2/3 that fix the "flat, a mockup, no
 * relief, no animation" verdict.
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
  {
    id: "nav-dashboard",
    href: "/dashboard",
    label: "Tableau de bord",
    isActive: true,
    icon: <HomeIcon />,
  },
  { id: "nav-baux", href: "/baux", label: "Baux", icon: <FileTextIcon /> },
  { id: "nav-locataires", href: "/locataires", label: "Locataires", icon: <UsersIcon /> },
  { id: "nav-documents", href: "/documents", label: "Documents", icon: <FileTextIcon /> },
];

const sidebarLabels = {
  sidebarAriaLabel: "Navigation principale",
  mainNavAriaLabel: "Navigation",
  quickActionsHeading: "Actions rapides",
  recentHeading: "Récents",
  collapseSidebarAriaLabel: "Réduire la barre latérale",
  expandSidebarAriaLabel: "Ouvrir la barre latérale",
};

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
    </svg>
  );
}

function EuroIcon() {
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
      <path d="M4 10h12M4 14h9" />
      <path d="M19 6a7.6 7.6 0 1 0 0 12" />
    </svg>
  );
}

function UsersIcon() {
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AlertIcon() {
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
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function FileTextIcon() {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * The app shell is deliberately mobile-aware: MosaicAppSidebar renders at
 * `width: 100%` on mobile (its own off-canvas-drawer contract — see
 * MosaicAppSidebar.tsx `sidebarWidth`), which is correct for a toggled
 * drawer but breaks a permanently-mounted flex-row shell (the sidebar
 * would eat the full viewport width and push every other block off-screen).
 * At `<768px` this story simply does not mount the sidebar inline — a real
 * consumer wires MosaicAppSidebar into an off-canvas drawer at that
 * breakpoint (MosaicDeviceProvider + a hamburger trigger own that wiring;
 * out of scope for this composed-page story).
 */
function DashboardShell() {
  const { isMobile } = useDevice();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {!isMobile && (
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          activePath="/dashboard"
          onNavigate={() => {}}
          {...sidebarLabels}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: isMobile ? 12 : 20,
          background: "var(--mosaic-surface-ground)",
        }}
      >
        <MosaicTopBar
          titleSlot={<h1 style={{ fontSize: 18, fontWeight: 600 }}>Tableau de bord</h1>}
          searchSlot={
            isMobile ? (
              // Wave-1 T5 reopen defect 4: a full-width text input truncates
              // its own placeholder ("Reche…") at 390px next to the title +
              // theme + language controls. Below the app-shell's mobile
              // breakpoint, collapse to an icon-only trigger instead of
              // shrinking a text field past legibility.
              <button
                type="button"
                aria-label="Rechercher"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--foreground)",
                }}
              >
                <SearchIcon />
              </button>
            ) : (
              <input
                aria-label="Rechercher"
                placeholder="Rechercher…"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              />
            )
          }
          themeControlSlot={
            <MosaicThemeToggle
              switchToLightLabel="Passer au thème clair"
              switchToDarkLabel="Passer au thème sombre"
            />
          }
          languageControlSlot={
            <button type="button" style={{ padding: "6px 10px" }}>
              FR
            </button>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <MosaicKpiTile
            label="Biens gérés"
            value="127"
            icon={<BuildingIcon />}
            trend={{ direction: "up", label: "+3" }}
            sparklineData={[110, 114, 118, 120, 123, 125, 127]}
          />
          <MosaicKpiTile
            label="Taux d'occupation"
            value="98,4 %"
            icon={<UsersIcon />}
            trend={{ direction: "up", label: "+1,1 pt" }}
            sparklineData={[95.2, 96.1, 96.8, 97.3, 97.9, 98.1, 98.4]}
          />
          <MosaicKpiTile
            label="Loyers encaissés (YTD)"
            value="1,24 M€"
            icon={<EuroIcon />}
            trend={{ direction: "up", label: "+8,4%" }}
            sparklineData={[900, 950, 980, 1020, 1080, 1150, 1240]}
          />
          <MosaicKpiTile
            label="Taux d'impayés"
            value="3,1%"
            icon={<AlertIcon />}
            trend={{ direction: "down", label: "-1,2%" }}
            sparklineData={[5.1, 4.8, 4.2, 4.0, 3.6, 3.4, 3.1]}
          />
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--mosaic-surface-card)",
            boxShadow: "var(--mosaic-elevation-1-highlight), var(--mosaic-elevation-1-shadow)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Pipeline commercial</h2>
          <MosaicStageChart
            tableCaption="Répartition des dossiers par étape du pipeline commercial"
            stageColumnLabel="Étape"
            valueColumnLabel="Dossiers"
            valueLabel={(value) => `${value} dossiers`}
            stages={[
              { id: "prospect", label: "Prospect", value: 42 },
              { id: "qualifie", label: "Qualifié", value: 28 },
              { id: "proposition", label: "Proposition", value: 17 },
              { id: "negociation", label: "Négociation", value: 9 },
              { id: "gagne", label: "Gagné", value: 6, kind: "won" },
              { id: "perdu", label: "Perdu", value: 11, kind: "lost" },
            ]}
          />
        </div>

        <div
          className="rounded-xl p-1"
          style={{
            background: "var(--mosaic-surface-card)",
            boxShadow: "var(--mosaic-elevation-1-highlight), var(--mosaic-elevation-1-shadow)",
          }}
        >
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
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <MosaicDeviceProvider>
      <DashboardShell />
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
