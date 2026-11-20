/**
 * Registry-screen blocks — behaviour contract ported from the first host's tests
 * (grille, écran, ligne-détail) plus the shared panel shell. Every import comes
 * from the PACKAGE ENTRY (src/index.ts): these tests fail until the four blocks
 * are exported from it.
 *
 * The labels below are test fixtures supplied by the host, exactly as a real
 * host supplies them: the library ships no words of its own.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ColDef } from "ag-grid-community";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  type ColonneRegistre,
  type EtatVisibilite,
  GrilleRegistre,
  PanneauRegistreShell,
  type PanneauRegistreShellLabels,
  RegistreEcran,
  type RegistreEcranLabels,
  RegistreLigneDetail,
  type RegistreLigneDetailLabels,
} from "../../index.js";

afterEach(cleanup);

// ── GrilleRegistre (R-1, R-3, R-4) ───────────────────────────────────────────

describe("GrilleRegistre — shared registry grid", () => {
  // jsdom reports every element at 0x0, so AG Grid needs a real size.
  beforeAll(() => {
    for (const prop of ["clientWidth", "offsetWidth"] as const) {
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: 1200 });
    }
    for (const prop of ["clientHeight", "offsetHeight"] as const) {
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: 600 });
    }
  });

  interface Ligne {
    id: string;
    nom: string;
  }
  const COLS: ColDef<Ligne>[] = [{ field: "nom", headerName: "Nom" }];

  it("mounts AG Grid from the caller's columnDefs (R-1)", () => {
    const { container } = render(
      <GrilleRegistre<Ligne>
        lignes={[{ id: "a", nom: "Dupont" }]}
        columnDefs={COLS}
        getRowId={(l) => l.id}
      />,
    );
    expect(container.querySelector(".ag-root-wrapper")).not.toBeNull();
  });
});

// ── RegistreEcran (R-5, R-6, R-7) ────────────────────────────────────────────

const ECRAN_LABELS: RegistreEcranLabels = {
  searchPlaceholder: "Rechercher dans toutes les colonnes",
  searchAriaLabel: "Rechercher dans toutes les colonnes",
  columnsButton: (n) => (n > 0 ? `Colonnes (${n} masquée${n > 1 ? "s" : ""})` : "Colonnes"),
  columnsGroupAriaLabel: "Colonnes affichées",
  enterFullscreen: "Plein écran",
  exitFullscreen: "Réduire",
};

const COLONNES_CHOIX = [
  { champ: "nom", lettre: "A", libelle: "Nom" },
  { champ: "loyer", lettre: "B", libelle: "Loyer" },
];

const VISIBLE: EtatVisibilite = { nom: true, loyer: true };

function renderEcran(
  overrides: {
    onBasculerColonne?: (champ: string) => void;
    onFiltreGlobalChange?: (v: string) => void;
    visibilite?: EtatVisibilite;
  } = {},
) {
  return render(
    <RegistreEcran
      ariaLabel="Tableau de test"
      labels={ECRAN_LABELS}
      colonnes={COLONNES_CHOIX}
      visibilite={overrides.visibilite ?? VISIBLE}
      onBasculerColonne={overrides.onBasculerColonne ?? (() => {})}
      filtreGlobal=""
      onFiltreGlobalChange={overrides.onFiltreGlobalChange ?? (() => {})}
      avantRecherche={<button type="button">Choisir un mois</button>}
      actionsToolbar={<button type="button">Ajouter</button>}
    >
      <p>contenu-region</p>
    </RegistreEcran>,
  );
}

describe("RegistreEcran — shared registry-screen chrome", () => {
  it("offers the toolbar controls: search (R-5), Colonnes (R-6), Plein écran (R-7)", () => {
    renderEcran();
    expect(screen.getByRole("searchbox")).not.toBeNull();
    expect(screen.getByRole("button", { name: /colonnes/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /plein écran/i })).not.toBeNull();
  });

  it("renders the toolbar slots and the data region (children)", () => {
    renderEcran();
    expect(screen.getByRole("button", { name: /choisir un mois/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /ajouter/i })).not.toBeNull();
    expect(screen.getByText("contenu-region")).not.toBeNull();
  });

  it("names the hidden-column count through the host label (R-6)", () => {
    renderEcran({ visibilite: { nom: false, loyer: true } });
    expect(screen.getByRole("button", { name: "Colonnes (1 masquée)" })).not.toBeNull();
  });

  it("lists each declared column in the chooser (R-6, declaration-driven)", async () => {
    renderEcran();
    fireEvent.click(screen.getByRole("button", { name: /colonnes/i }));
    const chooser = await screen.findByRole("group", { name: /colonnes affichées/i });
    expect(within(chooser).getByText("Nom")).not.toBeNull();
    expect(within(chooser).getByText("Loyer")).not.toBeNull();
  });

  it("search is controlled: typing calls onFiltreGlobalChange (R-5)", () => {
    const onFiltreGlobalChange = vi.fn();
    renderEcran({ onFiltreGlobalChange });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "dup" } });
    expect(onFiltreGlobalChange).toHaveBeenCalledWith("dup");
  });

  it("toggling the chooser calls onBasculerColonne with the field (R-6)", async () => {
    const onBasculerColonne = vi.fn();
    renderEcran({ onBasculerColonne });
    fireEvent.click(screen.getByRole("button", { name: /colonnes/i }));
    const chooser = await screen.findByRole("group", { name: /colonnes affichées/i });
    fireEvent.click(within(chooser).getByRole("checkbox", { name: /nom/i }));
    expect(onBasculerColonne).toHaveBeenCalledWith("nom");
  });

  it("Plein écran puts the section into fullscreen and back (R-7)", () => {
    renderEcran();
    const section = screen.getByRole("region", { name: /tableau de test/i });
    expect(section.getAttribute("data-fullscreen")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /plein écran/i }));
    expect(section.getAttribute("data-fullscreen")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /réduire/i }));
    expect(section.getAttribute("data-fullscreen")).toBeNull();
  });

  it("Escape leaves fullscreen (R-7)", () => {
    renderEcran();
    const section = screen.getByRole("region", { name: /tableau de test/i });
    fireEvent.click(screen.getByRole("button", { name: /plein écran/i }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(section.getAttribute("data-fullscreen")).toBeNull();
  });
});

// ── RegistreLigneDetail (R-10, R-12) ─────────────────────────────────────────

const COLONNES: ColonneRegistre[] = [
  { champ: "nom", lettre: "A", libelle: "Nom", type: "texte", editable: true },
  { champ: "loyer", lettre: "B", libelle: "Loyer", type: "montant", editable: false },
];

const DETAIL_LABELS: RegistreLigneDetailLabels = {
  edit: (libelle) => `Modifier ${libelle}`,
  fieldInput: (col) => `${col.libelle} (colonne ${col.lettre})`,
  computed: "calculé",
  save: "Enregistrer",
  cancel: "Annuler",
  correction: (c) =>
    `Corrigé par ${c.par} le ${new Date(c.leMs).toLocaleDateString("fr-FR")} — valeur précédente : ${
      c.valeurAvant == null ? "(vide)" : String(c.valeurAvant)
    }`,
};

const FORMAT = {
  formatMontant: (n: number) => `${n} EUR`,
  formatNombre: (n: number) => String(n),
  decimalSeparator: ",",
};

describe("RegistreLigneDetail — R-10 / R-12", () => {
  it("shows a pencil on an editable field and « calculé » on a non-editable one", () => {
    render(
      <RegistreLigneDetail
        colonnes={COLONNES}
        ligne={{ nom: "Dupont", loyer: 1200 }}
        labels={DETAIL_LABELS}
        {...FORMAT}
        onSaveField={vi.fn(async () => true)}
      />,
    );
    expect(screen.getByRole("button", { name: /modifier nom/i })).not.toBeNull();
    expect(screen.getByText("calculé")).not.toBeNull();
  });

  it("formats an amount through the host formatter", () => {
    render(
      <RegistreLigneDetail
        colonnes={COLONNES}
        ligne={{ nom: "Dupont", loyer: 1200 }}
        labels={DETAIL_LABELS}
        {...FORMAT}
        onSaveField={vi.fn(async () => true)}
      />,
    );
    expect(screen.getByText("1200 EUR")).not.toBeNull();
  });

  it("edits through onSaveField — the one write path (R-10)", async () => {
    const onSaveField = vi.fn(async () => true);
    render(
      <RegistreLigneDetail
        colonnes={COLONNES}
        ligne={{ nom: "Dupont", loyer: 1200 }}
        labels={DETAIL_LABELS}
        {...FORMAT}
        onSaveField={onSaveField}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /modifier nom/i }));
    const input = screen.getByLabelText(/nom \(colonne a\)/i);
    fireEvent.change(input, { target: { value: "Durand" } });
    fireEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => expect(onSaveField).toHaveBeenCalledWith("nom", "Durand"));
  });

  it("edits a number with the host decimal separator", () => {
    render(
      <RegistreLigneDetail
        colonnes={[
          { champ: "surface", lettre: "C", libelle: "Surface", type: "nombre", editable: true },
        ]}
        ligne={{ surface: 12.5 }}
        labels={DETAIL_LABELS}
        {...FORMAT}
        onSaveField={vi.fn(async () => true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /modifier surface/i }));
    expect((screen.getByLabelText(/surface \(colonne c\)/i) as HTMLInputElement).value).toBe(
      "12,5",
    );
  });

  it("names who corrected a field, when, and the previous value (R-12)", () => {
    render(
      <RegistreLigneDetail
        colonnes={COLONNES}
        ligne={{ nom: "Durand", loyer: 1200 }}
        corrections={{ nom: { par: "corinne", leMs: 1_700_000_000_000, valeurAvant: "Dupont" } }}
        labels={DETAIL_LABELS}
        {...FORMAT}
        onSaveField={vi.fn(async () => true)}
      />,
    );
    expect(screen.getByText(/Corrigé par corinne/)).not.toBeNull();
    expect(screen.getByText(/valeur précédente : Dupont/)).not.toBeNull();
  });
});

// ── PanneauRegistreShell (R-19) ──────────────────────────────────────────────

const SHELL_LABELS: PanneauRegistreShellLabels = {
  resizeHandle: "Redimensionner le panneau",
  close: "Fermer",
  previousRow: "Ligne précédente",
  nextRow: "Ligne suivante",
};

function renderShell(
  over: { onPrev?: () => void; onNext?: () => void; prevDisabled?: boolean } = {},
) {
  return render(
    <PanneauRegistreShell
      open
      onOpenChange={() => {}}
      ariaLabel="Détail de la ligne"
      labels={SHELL_LABELS}
      contexte="Dupont · 3 rue X"
      onPrev={over.onPrev ?? (() => {})}
      onNext={over.onNext ?? (() => {})}
      prevDisabled={over.prevDisabled ?? false}
      nextDisabled={false}
    >
      <input aria-label="champ-test" />
    </PanneauRegistreShell>,
  );
}

describe("PanneauRegistreShell — the one registry drawer (R-19)", () => {
  it("renders the header context, the body and the prev/next footer", async () => {
    renderShell();
    expect(await screen.findByText("Dupont · 3 rue X")).not.toBeNull();
    expect(screen.getByLabelText("champ-test")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ligne précédente" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ligne suivante" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Redimensionner le panneau" })).not.toBeNull();
  });

  it("ArrowDown / ArrowUp move to the neighbour row; a disabled end does nothing", async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    renderShell({ onPrev, onNext, prevDisabled: true });
    await screen.findByText("Dupont · 3 rue X");
    fireEvent.keyDown(document.body, { key: "ArrowDown" });
    fireEvent.keyDown(document.body, { key: "ArrowUp" });
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("arrow keys inside an editable field never move the row", async () => {
    const onNext = vi.fn();
    renderShell({ onNext });
    fireEvent.keyDown(await screen.findByLabelText("champ-test"), { key: "ArrowDown" });
    expect(onNext).not.toHaveBeenCalled();
  });
});
