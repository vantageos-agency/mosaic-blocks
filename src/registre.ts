/**
 * @vantageos/mosaic-blocks/registre
 *
 * The registry-screen blocks, built on HeroUI and lucide icons, behind their own entry so the
 * root entry (`@vantageos/mosaic-blocks`) never loads `@heroui/react` or `lucide-react`. A host
 * that renders none of them installs neither (both are optional peers); a host that renders one
 * installs both (with HeroUI's styles) and imports it from this subpath:
 *
 *   import { RegistreEcran, PanneauRegistreShell } from "@vantageos/mosaic-blocks/registre";
 *
 * The grid these blocks frame, `GrilleRegistre`, is AG Grid and lives in the "./grid" entry.
 *
 * Membership rule: a component whose module graph imports `@heroui/react` or `lucide-react` is
 * exported from here, never from `src/index.ts`, together with what only those components use
 * (the column-declaration module `colonnes.ts`). The entry census
 * (`e2e/root-without-grid/census.mjs`) fails when the built root entry loads either package.
 */

export { PanneauRegistreShell } from "./components/registre/PanneauRegistreShell.js";
export type {
  PanneauRegistreShellLabels,
  PanneauRegistreShellProps,
} from "./components/registre/PanneauRegistreShell.js";
export { RegistreEcran } from "./components/registre/RegistreEcran.js";
export type {
  RegistreEcranLabels,
  RegistreEcranProps,
} from "./components/registre/RegistreEcran.js";
export { RegistreLigneDetail } from "./components/registre/RegistreLigneDetail.js";
export type {
  CorrectionChamp,
  RegistreLigneDetailLabels,
  RegistreLigneDetailProps,
} from "./components/registre/RegistreLigneDetail.js";
export { ChoixColonnes } from "./components/registre/ChoixColonnes.js";
export type {
  ChoixColonnesLabels,
  ChoixColonnesProps,
} from "./components/registre/ChoixColonnes.js";
export { estVisible } from "./components/registre/colonnes.js";
export type {
  ColonneChoisie,
  ColonneRegistre,
  EtatVisibilite,
  TypeColonneRegistre,
} from "./components/registre/colonnes.js";
