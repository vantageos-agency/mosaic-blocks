/**
 * The column/field declaration a registry screen supplies. It is DATA, never a
 * code branch: the grid, the column chooser and the per-field edit all read it,
 * so a new registry screen declares its columns without touching a component.
 */
export type TypeColonneRegistre = "texte" | "nombre" | "entier" | "montant";

export interface ColonneRegistre {
  /** The key of the field on the row (technical identity). */
  champ: string;
  /** The source column letter, shown in the chooser and the panel. */
  lettre: string;
  /** The displayed label. */
  libelle: string;
  /** Drives formatting: the panel renders a number per this type. */
  type: TypeColonneRegistre;
  /** true = pencil + edit; false = the host's « computed » label. */
  editable: boolean;
  /** Optional closed set of a choice field, rendered as a menu. */
  valeurs?: readonly string[];
  /** Optional minimum width hint for the grid column. */
  largeurMin?: number;
}

/** The columns a chooser offers: only identity and label are needed. */
export interface ColonneChoisie {
  champ: string;
  lettre: string;
  libelle: string;
}

/** Which columns the user wants to see. true = visible; an absent field reads as visible. */
export type EtatVisibilite = Readonly<Record<string, boolean>>;

export function estVisible(etat: EtatVisibilite, champ: string): boolean {
  return etat[champ] !== false;
}
