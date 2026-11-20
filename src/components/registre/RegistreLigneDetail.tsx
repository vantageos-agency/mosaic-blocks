/**
 * RegistreLigneDetail — the per-field detail of one registry row, driven by the
 * column declaration (ColonneRegistre).
 *
 * A field declared `editable` carries a pencil; a non-editable field reads the
 * host's « computed » label; a corrected field shows the host's correction line
 * (who, when, previous value). The edit is one path — `onSaveField(champ, saisie)`
 * — the same the grid cell uses. A number is edited with the host's decimal
 * separator, the format the host's validator parses.
 */
import { Pencil } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import type { ColonneRegistre } from "./colonnes.js";

/** The correction trace a row carries per field. */
export interface CorrectionChamp {
  par: string;
  leMs: number;
  valeurAvant: string | number | null;
}

export interface RegistreLigneDetailLabels {
  /** Accessible name of a field's pencil button. */
  edit: (libelle: string) => string;
  /** Accessible name of a field's editor input. */
  fieldInput: (colonne: ColonneRegistre) => string;
  /** Shown on a non-editable field. */
  computed: string;
  save: string;
  cancel: string;
  /** The correction line of a corrected field (the host formats the date and an empty value). */
  correction: (correction: CorrectionChamp) => string;
}

export interface RegistreLigneDetailProps {
  colonnes: readonly ColonneRegistre[];
  /** The row, read generically by field key. */
  ligne: Readonly<Record<string, string | number | null>>;
  /** Per-field correction trace, keyed by `champ`. */
  corrections?: Readonly<Record<string, CorrectionChamp | undefined>>;
  labels: RegistreLigneDetailLabels;
  /** Renders a `montant` field. */
  formatMontant: (value: number) => string;
  /** Renders a `nombre` or `entier` field. */
  formatNombre: (value: number) => string;
  /** The decimal separator a number is edited with. */
  decimalSeparator: string;
  onSaveField: (champ: string, saisie: string) => Promise<boolean>;
}

function editValue(value: string | number | null, decimalSeparator: string): string {
  if (value == null) return "";
  return typeof value === "number" ? String(value).replace(".", decimalSeparator) : value;
}

function FieldEditor({
  col,
  initial,
  labels,
  onSave,
  onCancel,
}: {
  col: ColonneRegistre;
  initial: string;
  labels: RegistreLigneDetailLabels;
  onSave: (saisie: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const inputId = `registre-field-${col.champ}`;
  const label = labels.fieldInput(col);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    }
  }

  const inputClass =
    "h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-base sm:text-sm";

  return (
    <form onSubmit={submit} onKeyDown={onKeyDown} className="flex flex-wrap items-center gap-2">
      {col.valeurs ? (
        <select
          id={inputId}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {col.valeurs.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // biome-ignore lint/a11y/noAutofocus: the field was opened on purpose by the pencil
          autoFocus
          className={inputClass}
        />
      )}
      <button
        type="submit"
        disabled={saving}
        className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {labels.save}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-8 rounded-md border border-border px-3 text-sm"
      >
        {labels.cancel}
      </button>
    </form>
  );
}

// allow-undeclared-theme-token: `default` is a HeroUI theme token; these blocks require @heroui/react and its styles.
const PENCIL_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-default hover:text-foreground";

export function RegistreLigneDetail({
  colonnes,
  ligne,
  corrections,
  labels,
  formatMontant,
  formatNombre,
  decimalSeparator,
  onSaveField,
}: RegistreLigneDetailProps) {
  const [editing, setEditing] = useState<string | null>(null);

  function displayValue(col: ColonneRegistre, value: string | number | null): string {
    if (value == null || value === "") return "";
    if (col.type === "montant") return formatMontant(Number(value));
    if (col.type === "nombre" || col.type === "entier") return formatNombre(Number(value));
    return String(value);
  }

  return (
    <dl className="divide-y divide-border rounded-md border border-border">
      {colonnes.map((col) => {
        const value = ligne[col.champ] ?? null;
        const correction = corrections?.[col.champ];
        return (
          <div
            key={col.champ}
            data-field={col.champ}
            className={`grid gap-1 px-3 py-2 sm:grid-cols-[11rem_1fr] sm:gap-3 ${correction ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}
          >
            <dt className="text-muted-foreground">
              {col.libelle} <span className="text-xs">· {col.lettre}</span>
            </dt>
            <dd className="flex min-w-0 flex-col gap-1">
              {editing === col.champ ? (
                <FieldEditor
                  col={col}
                  initial={editValue(value, decimalSeparator)}
                  labels={labels}
                  onCancel={() => setEditing(null)}
                  onSave={async (saisie) => {
                    if (await onSaveField(col.champ, saisie)) setEditing(null);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words tabular-nums">
                    {displayValue(col, value)}
                  </span>
                  {col.editable ? (
                    <button
                      type="button"
                      aria-label={labels.edit(col.libelle)}
                      onClick={() => setEditing(col.champ)}
                      className={PENCIL_CLASS}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {labels.computed}
                    </span>
                  )}
                </div>
              )}
              {correction && (
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {labels.correction(correction)}
                </p>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
