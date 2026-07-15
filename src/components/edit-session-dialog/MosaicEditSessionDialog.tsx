/**
 * MosaicEditSessionDialog — presentational "rename / reclassify a
 * work-in-progress session" form modal
 *
 * Built so the owner of a session can find it again weeks later: edit its
 * name and classification, then save or cancel.
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicAdaptiveModal (dialog/sheet shell), MosaicInput (name) and
 * MosaicSelect (classification). This component never invents a new modal
 * or form field — it assembles the ones the library already ships (same
 * doctrine as MosaicSaveTemplateModal).
 *
 * Fully controlled: `open`/`onOpenChange` own visibility, `name`/
 * `classification` are single-source-of-truth values supplied by the host,
 * every change is reported via a callback. The component keeps no internal
 * form state of its own — it never persists, never fetches, never diffs
 * against a stored session.
 *
 * Validation belongs to the host (SIN-01 + doctrine "the host decides"):
 * `canSave` is a host-computed boolean gating the save button, and
 * `nameError` is a host-computed string — this component only *displays*
 * an error, it never decides whether one exists. When `nameError` is
 * supplied, the name field gets `aria-invalid="true"` and
 * `aria-describedby` pointing at the rendered error text; it is
 * `aria-invalid="false"` otherwise, so the absence of an error is never
 * ambiguous.
 *
 * No hardcoded taxonomy: `classifications` is a required host-supplied
 * list of `MosaicSelectItem` — the set of classifications a session can
 * take is business/domain knowledge, never baked into the library.
 *
 * Escape closes the modal WITHOUT saving — MosaicAdaptiveModal maps the
 * native `<dialog>` "cancel" event (fired on Escape) straight to
 * `onOpenChange(false)`; `onSave` is never called as a side effect of
 * closing. isSaving sets `aria-busy="true"` on the save button and
 * disables both actions — a save-in-progress is announced, never silent.
 *
 * data-slot="edit-session-dialog" on the form body.
 * Every user-facing string (title/description/labels/placeholders/
 * error/button labels/aria-labels) is a required host-supplied prop —
 * zero hardcoded copy, zero default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --destructive, --foreground, --muted-foreground.
 *
 * @example
 * <MosaicEditSessionDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={t('EditSession.title')}
 *   closeAriaLabel={t('EditSession.aria.close')}
 *   name={name}
 *   onNameChange={setName}
 *   nameLabel={t('EditSession.name')}
 *   nameError={nameError}
 *   classifications={classifications}
 *   classification={classification}
 *   onClassificationChange={setClassification}
 *   classificationLabel={t('EditSession.classification')}
 *   isSaving={isSaving}
 *   canSave={isValid}
 *   onSave={handleSave}
 *   onCancel={() => setOpen(false)}
 *   saveButtonLabel={t('EditSession.save')}
 *   savingLabel={t('EditSession.saving')}
 *   cancelButtonLabel={t('EditSession.cancel')}
 * />
 */

import { useId } from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicSelect, type MosaicSelectItem } from "../select/MosaicSelect.js";
import {
  editSessionDialogBodyVariants,
  editSessionDialogButtonVariants,
  editSessionDialogErrorVariants,
  editSessionDialogFieldVariants,
  editSessionDialogFooterVariants,
} from "./edit-session-dialog-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicEditSessionDialogProps {
  /** Controlled open state — the host owns the source of truth. */
  open: boolean;
  /** Called whenever the modal wants to change its open state (save, cancel, Escape, backdrop click). */
  onOpenChange: (open: boolean) => void;
  /** Modal heading. Required, no default. */
  title: string;
  /** Optional modal subheading. */
  description?: string;
  /** Accessible name for the desktop close button, forwarded to MosaicAdaptiveModal. */
  closeAriaLabel: string;

  /** Current session name value — controlled, pre-filled from the host's current session. */
  name: string;
  /** Called on every keystroke in the name field. */
  onNameChange: (value: string) => void;
  /** Label for the name field. Required, no default. */
  nameLabel: string;
  /** Placeholder for the name field. */
  namePlaceholder?: string;
  /** Host-computed validation message for the name field, or absent when valid. */
  nameError?: string;

  /** Host-supplied classification taxonomy — never hardcoded in the library. */
  classifications: MosaicSelectItem[];
  /** Currently selected classification value — controlled, pre-filled from the host's current session. */
  classification: string;
  /** Called when the host user picks a different classification. */
  onClassificationChange: (value: string) => void;
  /** Label for the classification field. Required, no default. */
  classificationLabel: string;

  /** True while a save request is in flight — announced via aria-busy, disables both actions. */
  isSaving: boolean;
  /**
   * Host-computed form validity gating the save button. This component
   * never decides validation itself — it only reflects the host's verdict.
   */
  canSave: boolean;
  /** Called when the host user submits the form. Never called on Escape/backdrop close. */
  onSave: () => void;
  /** Called when the host user clicks Cancel. Does not mutate anything by itself. */
  onCancel: () => void;
  /** Label for the save button while idle. Required, no default. */
  saveButtonLabel: string;
  /** Label for the save button while isSaving=true. Required, no default. */
  savingLabel: string;
  /** Label for the cancel button. Required, no default. */
  cancelButtonLabel: string;

  /** Additional Tailwind classes on the modal body. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicEditSessionDialog — production "rename / reclassify a session"
 * form modal for @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes MosaicAdaptiveModal +
 * MosaicInput + MosaicSelect. No network call, no built-in taxonomy, no
 * built-in validation, no built-in copy.
 */
export function MosaicEditSessionDialog({
  open,
  onOpenChange,
  title,
  description,
  closeAriaLabel,
  name,
  onNameChange,
  nameLabel,
  namePlaceholder,
  nameError,
  classifications,
  classification,
  onClassificationChange,
  classificationLabel,
  isSaving,
  canSave,
  onSave,
  onCancel,
  saveButtonLabel,
  savingLabel,
  cancelButtonLabel,
  className,
}: MosaicEditSessionDialogProps) {
  const nameErrorId = useId();

  if (!open) return null;

  return (
    <MosaicAdaptiveModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
      closeAriaLabel={closeAriaLabel}
    >
      <div
        data-slot="edit-session-dialog"
        className={cn(editSessionDialogBodyVariants(), className)}
      >
        <div className={editSessionDialogFieldVariants()}>
          <label htmlFor="mosaic-edit-session-name" className="text-sm font-medium text-foreground">
            {nameLabel}
          </label>
          <MosaicInput
            id="mosaic-edit-session-name"
            value={name}
            placeholder={namePlaceholder}
            onChange={(e) => onNameChange(e.target.value)}
            aria-invalid={nameError ? "true" : "false"}
            aria-describedby={nameError ? nameErrorId : undefined}
          />
          {nameError && (
            <p id={nameErrorId} className={editSessionDialogErrorVariants()}>
              {nameError}
            </p>
          )}
        </div>

        <div className={editSessionDialogFieldVariants()}>
          <span className="text-sm font-medium text-foreground">{classificationLabel}</span>
          <MosaicSelect
            items={classifications}
            value={classification}
            onValueChange={(value) => {
              if (value) onClassificationChange(value);
            }}
          />
        </div>

        <div className={editSessionDialogFooterVariants()}>
          <button
            type="button"
            data-slot="edit-session-dialog-cancel-button"
            onClick={onCancel}
            disabled={isSaving}
            className={editSessionDialogButtonVariants({ intent: "cancel" })}
          >
            {cancelButtonLabel}
          </button>
          <button
            type="button"
            data-slot="edit-session-dialog-save-button"
            onClick={onSave}
            disabled={!canSave || isSaving}
            aria-busy={isSaving ? "true" : "false"}
            className={editSessionDialogButtonVariants({ intent: "save" })}
          >
            {isSaving ? savingLabel : saveButtonLabel}
          </button>
        </div>
      </div>
    </MosaicAdaptiveModal>
  );
}

MosaicEditSessionDialog.displayName = "MosaicEditSessionDialog";
