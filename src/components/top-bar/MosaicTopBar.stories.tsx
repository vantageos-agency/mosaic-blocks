import type { Meta, StoryObj } from "@storybook/react";

import { MosaicAppSidebar } from "../app-sidebar/MosaicAppSidebar.js";
import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicThemeToggle } from "../theme-toggle/MosaicThemeToggle.js";
import { MosaicTopBar } from "./MosaicTopBar.js";

const meta = {
  title: "Blocks/MosaicTopBar",
  component: MosaicTopBar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof MosaicTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    titleSlot: <h1 style={{ fontSize: 18, fontWeight: 600 }}>Tableau de bord</h1>,
    searchSlot: (
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
    ),
    themeControlSlot: (
      <MosaicThemeToggle
        switchToLightLabel="Passer au thème clair"
        switchToDarkLabel="Passer au thème sombre"
      />
    ),
    languageControlSlot: (
      <button type="button" style={{ padding: "6px 10px" }}>
        FR
      </button>
    ),
  },
};

const navItems = [
  { id: "nav-dashboard", href: "/dashboard", label: "Tableau de bord", isActive: true },
  { id: "nav-baux", href: "/baux", label: "Baux" },
  { id: "nav-locataires", href: "/locataires", label: "Locataires" },
];

const sidebarLabels = {
  sidebarAriaLabel: "Navigation principale",
  mainNavAriaLabel: "Navigation",
  quickActionsHeading: "Actions rapides",
  recentHeading: "Récents",
  collapseSidebarAriaLabel: "Réduire la barre latérale",
  expandSidebarAriaLabel: "Ouvrir la barre latérale",
};

function AppShell() {
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
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: 16 }}
          data-theme-scope="app-shell-ground"
        >
          <MosaicTopBar
            titleSlot={<h1 style={{ fontSize: 18, fontWeight: 600 }}>Tableau de bord</h1>}
            searchSlot={
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
          <main style={{ flex: 1 }} />
        </div>
      </div>
    </MosaicDeviceProvider>
  );
}

export const AppShellSidebarPlusTopBar: StoryObj<typeof AppShell> = {
  name: "App shell (sidebar + top bar)",
  render: () => <AppShell />,
};
