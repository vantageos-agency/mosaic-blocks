/**
 * ChoixColonnes — the « visible columns » chooser of a registry screen: a HeroUI
 * Popover of Checkboxes. AG Grid Community exposes the hiding API
 * (`setColumnsVisible`) but its ready-made chooser belongs to the enterprise
 * edition, so this is the one piece of grid UI the blocks write.
 *
 * The list height is bounded by the viewport (`max-h-[60vh]`), never a pixel
 * constant: a fixed height overflows a short window and makes the first and last
 * columns unreachable.
 */
import { Button, Checkbox, Popover } from "@heroui/react";
import { useState } from "react";
import { type ColonneChoisie, type EtatVisibilite, estVisible } from "./colonnes.js";

export interface ChoixColonnesLabels {
  /** The trigger's text, given the number of hidden columns (derived each render). */
  columnsButton: (hiddenCount: number) => string;
  /** Accessible name of the checkbox group. */
  columnsGroupAriaLabel: string;
}

export interface ChoixColonnesProps {
  colonnes: readonly ColonneChoisie[];
  visibilite: EtatVisibilite;
  onBasculer: (champ: string) => void;
  labels: ChoixColonnesLabels;
  /** Display transform of a column label (casing); identity when omitted. */
  formatLibelle?: (libelle: string) => string;
  /** For layout tests only: render the chooser already open. */
  ouvertParDefaut?: boolean;
}

// allow-undeclared-theme-token: `default` is a HeroUI theme token; these blocks require @heroui/react and its styles.
const OPTION_CLASS =
  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-default";

export function ChoixColonnes({
  colonnes,
  visibilite,
  onBasculer,
  labels,
  formatLibelle = (libelle) => libelle,
  ouvertParDefaut = false,
}: ChoixColonnesProps) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  // Derived from the state every render, never kept apart: a separately
  // maintained counter ends up lying.
  const nbMasquees = colonnes.filter((c) => !estVisible(visibilite, c.champ)).length;

  return (
    <Popover isOpen={ouvert} onOpenChange={setOuvert}>
      <Button variant="outline" size="sm">
        {labels.columnsButton(nbMasquees)}
      </Button>
      <Popover.Content placement="bottom">
        <Popover.Dialog>
          <fieldset
            aria-label={labels.columnsGroupAriaLabel}
            className="z-50 max-h-[60vh] w-72 overflow-y-auto border-0 p-1"
          >
            {colonnes.map((c) => (
              <Checkbox
                key={c.champ}
                isSelected={estVisible(visibilite, c.champ)}
                onChange={() => onBasculer(c.champ)}
              >
                <Checkbox.Content className={OPTION_CLASS}>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="w-4 tabular-nums text-muted-foreground">{c.lettre}</span>
                  <span>{formatLibelle(c.libelle)}</span>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </fieldset>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
