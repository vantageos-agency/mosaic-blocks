/**
 * RegistreEcran — the shared chrome of a registry screen: the fullscreen section
 * wrapper, the Escape / body-scroll-lock behaviour, and the toolbar scaffold — a
 * global search, the column chooser and the fullscreen toggle.
 *
 * It OWNS the fullscreen state (the one behaviour every registry screen wants
 * identically) and leaves the data region to `children`: a screen keeps its own
 * loading / empty / error states and its own grid (GrilleRegistre) beneath the
 * toolbar. Search and column visibility are CONTROLLED by the host, so a host
 * can keep them above a period selector and a period change resets neither.
 */
import { Button, SearchField, Toolbar } from "@heroui/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { ChoixColonnes, type ChoixColonnesLabels } from "./ChoixColonnes.js";
import type { ColonneChoisie, EtatVisibilite } from "./colonnes.js";

export interface RegistreEcranLabels extends ChoixColonnesLabels {
  searchPlaceholder: string;
  searchAriaLabel: string;
  enterFullscreen: string;
  exitFullscreen: string;
}

export interface RegistreEcranProps {
  /** Section landmark label. */
  ariaLabel: string;
  labels: RegistreEcranLabels;
  /** The columns the chooser offers. */
  colonnes: readonly ColonneChoisie[];
  visibilite: EtatVisibilite;
  onBasculerColonne: (champ: string) => void;
  /** Display transform of a column label in the chooser; identity when omitted. */
  formatLibelleColonne?: (libelle: string) => string;
  /** Global search text, owned by the host. */
  filtreGlobal: string;
  onFiltreGlobalChange: (valeur: string) => void;
  /** Rendered at the start of the toolbar (e.g. a period selector). */
  avantRecherche?: ReactNode;
  /** Rendered after the chooser, before the fullscreen toggle (e.g. « add »). */
  actionsToolbar?: ReactNode;
  /** The data region: the screen's loading / empty / error states and grid. */
  children: ReactNode;
}

// Not user-facing text. Kept as an object-literal constant with the marker BETWEEN
// properties: esbuild strips a statement-level `//` comment, never this one.
const CSS_SELECTORS = {
  // allow-hardcoded-word: a CSS attribute selector (HeroUI data-slot names), not user-facing text
  openOverlay: "[data-slot=select-popover], [data-slot=popover-dialog]",
};

export function RegistreEcran({
  ariaLabel,
  labels,
  colonnes,
  visibilite,
  onBasculerColonne,
  formatLibelleColonne,
  filtreGlobal,
  onFiltreGlobalChange,
  avantRecherche,
  actionsToolbar,
  children,
}: RegistreEcranProps) {
  const [fullScreen, setFullScreen] = useState(false);

  // Escape leaves fullscreen and the page behind must not scroll; an open HeroUI
  // overlay (a select list, a popover) takes Escape first.
  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector(CSS_SELECTORS.openOverlay)) return;
      if (e.key === "Escape") setFullScreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullScreen]);

  return (
    <section
      aria-label={ariaLabel}
      data-fullscreen={fullScreen ? "true" : undefined}
      // Same element in both modes so the grid keeps its sort, filters and scroll.
      className={
        fullScreen
          ? "fixed inset-0 z-40 flex flex-col gap-4 bg-background p-4"
          : // Phones let the page scroll so content above cannot squeeze the grid to nothing.
            "flex min-h-[70vh] flex-1 flex-col gap-4 sm:min-h-0"
      }
    >
      <div className="shrink-0">
        <Toolbar className="flex flex-wrap items-center gap-2">
          {avantRecherche}
          <SearchField
            value={filtreGlobal}
            onChange={onFiltreGlobalChange}
            aria-label={labels.searchAriaLabel}
            className="w-full sm:w-auto"
          >
            <SearchField.Group className="h-10 min-w-64">
              <SearchField.SearchIcon />
              {/* text-base on mobile avoids iOS Safari zoom-on-focus under 16px */}
              <SearchField.Input
                placeholder={labels.searchPlaceholder}
                className="text-base sm:text-sm"
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ChoixColonnes
            colonnes={colonnes}
            visibilite={visibilite}
            onBasculer={onBasculerColonne}
            labels={labels}
            formatLibelle={formatLibelleColonne}
          />
          {actionsToolbar}
          <Button
            variant="outline"
            size="sm"
            aria-pressed={fullScreen}
            onPress={() => setFullScreen((f) => !f)}
          >
            {fullScreen ? (
              <Minimize2 aria-hidden className="size-4" />
            ) : (
              <Maximize2 aria-hidden className="size-4" />
            )}
            {fullScreen ? labels.exitFullscreen : labels.enterFullscreen}
          </Button>
        </Toolbar>
      </div>

      {children}
    </section>
  );
}
