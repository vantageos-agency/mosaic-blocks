/**
 * MosaicSaveTemplateModal — presentational "save as template" form modal
 *
 * Ported (source: private upstream) components/templates/SaveTemplateModal.tsx
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicAdaptiveModal (dialog/sheet shell), MosaicInput, MosaicTextarea,
 * MosaicSelect and MosaicTagInput (tags). This component never invents a
 * new modal, form field, or tag chip — it assembles the ones the library
 * already ships.
 *
 * Fully controlled: `open`/`onOpenChange` own visibility, `name`/
 * `templateDescription`/`category`/`tags` are single-source-of-truth values
 * supplied by the host, every change is reported via a callback. The
 * component keeps no internal form state.
 *
 * Validation belongs to the host (SIN-01 + doctrine "the host decides"):
 * `canSave` is a host-computed boolean gating the save button, and
 * `nameError`/`descriptionError` are host-computed strings — this
 * component only *displays* an error, it never decides whether one exists.
 * When an error string is supplied, the matching field gets
 * `aria-invalid="true"` and `aria-describedby` pointing at the rendered
 * error text; the field is `aria-invalid="false"` otherwise, so the
 * absence of an error is never ambiguous.
 *
 * No hardcoded taxonomy: `categories` is a required host-supplied list
 * (business taxonomy is client knowledge, never baked into the library).
 * Suggested tags (`suggestedTags`) are likewise entirely host-supplied.
 *
 * Escape closes the modal WITHOUT saving — MosaicAdaptiveModal maps the
 * native `<dialog>` "cancel" event (fired on Escape) straight to
 * `onOpenChange(false)`; `onSave` is never called as a side effect of
 * closing. isSaving sets `aria-busy="true"` on the save button and
 * disables both actions — a save-in-progress is announced, never silent.
 *
 * `children` is an optional host-rendered slot rendered above the footer
 * actions (e.g. an app-specific "agents in this template" summary) — the
 * library never bakes in a preview of anything domain-specific.
 *
 * data-slot="save-template-modal" on the form body.
 * Bilingual: every user-facing string (title/description/labels/
 * placeholders/errors/button labels) is a required host-supplied prop —
 * zero hardcoded copy, zero default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --destructive, --foreground, --muted-foreground.
 *
 * @example
 * <MosaicSaveTemplateModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Enregistrer comme modèle"
 *   closeAriaLabel="Fermer"
 *   name={name}
 *   onNameChange={setName}
 *   nameLabel="Nom du modèle"
 *   nameError={nameError}
 *   templateDescription={description}
 *   onTemplateDescriptionChange={setDescription}
 *   descriptionLabel="Description"
 *   categories={categories}
 *   category={category}
 *   onCategoryChange={setCategory}
 *   categoryLabel="Catégorie"
 *   tags={tags}
 *   onAddTag={(t) => setTags((prev) => [...prev, t])}
 *   onRemoveTag={(t) => setTags((prev) => prev.filter((x) => x !== t))}
 *   tagsLabel="Étiquettes"
 *   tagInputPlaceholder="Ajouter une étiquette…"
 *   removeTagAriaLabel={(t) => `Retirer ${t}`}
 *   isSaving={isSaving}
 *   canSave={canSave}
 *   onSave={handleSave}
 *   onCancel={() => setOpen(false)}
 *   saveButtonLabel="Enregistrer"
 *   savingLabel="Enregistrement…"
 *   cancelButtonLabel="Annuler"
 * />
 */

import type * as React from "react";
import { useId } from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicSelect, type MosaicSelectItem } from "../select/MosaicSelect.js";
import { MosaicTagInput } from "../tag-input/MosaicTagInput.js";
import { MosaicTextarea } from "../textarea/MosaicTextarea.js";
import {
  saveTemplateModalBodyVariants,
  saveTemplateModalButtonVariants,
  saveTemplateModalErrorVariants,
  saveTemplateModalFieldVariants,
  saveTemplateModalFooterVariants,
} from "./save-template-modal-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSaveTemplateModalProps {
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

  /** Current template name value — controlled. */
  name: string;
  /** Called on every keystroke in the name field. */
  onNameChange: (value: string) => void;
  /** Label for the name field. Required, no default. */
  nameLabel: string;
  /** Placeholder for the name field. */
  namePlaceholder?: string;
  /** Host-computed validation message for the name field, or absent when valid. */
  nameError?: string;

  /** Current template description value — controlled. */
  templateDescription: string;
  /** Called on every keystroke in the description field. */
  onTemplateDescriptionChange: (value: string) => void;
  /** Label for the description field. Required, no default. */
  descriptionLabel: string;
  /** Placeholder for the description field. */
  descriptionPlaceholder?: string;
  /** Host-computed validation message for the description field, or absent when valid. */
  descriptionError?: string;

  /** Host-supplied category taxonomy — never hardcoded in the library. */
  categories: MosaicSelectItem[];
  /** Currently selected category value — controlled. */
  category: string;
  /** Called when the host user picks a different category. */
  onCategoryChange: (value: string) => void;
  /** Label for the category field. Required, no default. */
  categoryLabel: string;

  /** Current tag list — controlled, single source of truth owned by the host. */
  tags: string[];
  /** Called when a tag should be added. */
  onAddTag: (tag: string) => void;
  /** Called when a tag should be removed. */
  onRemoveTag: (tag: string) => void;
  /** Label for the tags field. Required, no default. */
  tagsLabel: string;
  /** Placeholder for the tag input. Required, no default. */
  tagInputPlaceholder: string;
  /** Per-tag accessible name for the remove button. Required, no default. */
  removeTagAriaLabel: (tag: string) => string;
  /** Optional host-supplied suggested tags (e.g. derived from the chosen category). */
  suggestedTags?: string[];
  /** Optional maximum number of tags. */
  maxTags?: number;

  /** True while a save request is in flight — announced via aria-busy, disables both actions. */
  isSaving: boolean;
  /**
   * Host-computed form validity gating the save button. This component
   * never decides validation itself — it only reflects the host's verdict.
   */
  canSave: boolean;
  /** Called when the host user submits the form. Never called on Escape/backdrop close. */
  onSave: () => void;
  /** Called when the host user clicks Cancel. */
  onCancel: () => void;
  /** Label for the save button while idle. Required, no default. */
  saveButtonLabel: string;
  /** Label for the save button while isSaving=true. Required, no default. */
  savingLabel: string;
  /** Label for the cancel button. Required, no default. */
  cancelButtonLabel: string;

  /** Optional host-rendered extra content, shown above the footer actions. */
  children?: React.ReactNode;
  /** Additional Tailwind classes on the modal body. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSaveTemplateModal — production "save as template" form modal for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes MosaicAdaptiveModal +
 * MosaicInput + MosaicTextarea + MosaicSelect + MosaicTagInput. No network
 * call, no built-in taxonomy, no built-in validation, no built-in copy.
 */
export function MosaicSaveTemplateModal({
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
  templateDescription,
  onTemplateDescriptionChange,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionError,
  categories,
  category,
  onCategoryChange,
  categoryLabel,
  tags,
  onAddTag,
  onRemoveTag,
  tagsLabel,
  tagInputPlaceholder,
  removeTagAriaLabel,
  suggestedTags,
  maxTags,
  isSaving,
  canSave,
  onSave,
  onCancel,
  saveButtonLabel,
  savingLabel,
  cancelButtonLabel,
  children,
  className,
}: MosaicSaveTemplateModalProps) {
  const nameErrorId = useId();
  const descriptionErrorId = useId();

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
        data-slot="save-template-modal"
        className={cn(saveTemplateModalBodyVariants(), className)}
      >
        <div className={saveTemplateModalFieldVariants()}>
          <label
            htmlFor="mosaic-save-template-name"
            className="text-sm font-medium text-foreground"
          >
            {nameLabel}
          </label>
          <MosaicInput
            id="mosaic-save-template-name"
            value={name}
            placeholder={namePlaceholder}
            onChange={(e) => onNameChange(e.target.value)}
            aria-invalid={nameError ? "true" : "false"}
            aria-describedby={nameError ? nameErrorId : undefined}
          />
          {nameError && (
            <p id={nameErrorId} className={saveTemplateModalErrorVariants()}>
              {nameError}
            </p>
          )}
        </div>

        <div className={saveTemplateModalFieldVariants()}>
          <label
            htmlFor="mosaic-save-template-description"
            className="text-sm font-medium text-foreground"
          >
            {descriptionLabel}
          </label>
          <MosaicTextarea
            id="mosaic-save-template-description"
            value={templateDescription}
            placeholder={descriptionPlaceholder}
            onChange={(e) => onTemplateDescriptionChange(e.target.value)}
            rows={3}
            aria-invalid={descriptionError ? "true" : "false"}
            aria-describedby={descriptionError ? descriptionErrorId : undefined}
          />
          {descriptionError && (
            <p id={descriptionErrorId} className={saveTemplateModalErrorVariants()}>
              {descriptionError}
            </p>
          )}
        </div>

        <div className={saveTemplateModalFieldVariants()}>
          <span className="text-sm font-medium text-foreground">{categoryLabel}</span>
          <MosaicSelect
            items={categories}
            value={category}
            onValueChange={(value) => {
              if (value) onCategoryChange(value);
            }}
          />
        </div>

        <div className={saveTemplateModalFieldVariants()}>
          <span className="text-sm font-medium text-foreground">{tagsLabel}</span>
          <MosaicTagInput
            tags={tags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            placeholder={tagInputPlaceholder}
            removeTagAriaLabel={removeTagAriaLabel}
            suggestions={suggestedTags}
            maxTags={maxTags}
          />
        </div>

        {children}

        <div className={saveTemplateModalFooterVariants()}>
          <button
            type="button"
            data-slot="save-template-modal-cancel-button"
            onClick={onCancel}
            disabled={isSaving}
            className={saveTemplateModalButtonVariants({ intent: "cancel" })}
          >
            {cancelButtonLabel}
          </button>
          <button
            type="button"
            data-slot="save-template-modal-save-button"
            onClick={onSave}
            disabled={!canSave || isSaving}
            aria-busy={isSaving ? "true" : "false"}
            className={saveTemplateModalButtonVariants({ intent: "save" })}
          >
            {isSaving ? savingLabel : saveButtonLabel}
          </button>
        </div>
      </div>
    </MosaicAdaptiveModal>
  );
}

MosaicSaveTemplateModal.displayName = "MosaicSaveTemplateModal";
