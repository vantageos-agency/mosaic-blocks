"use client";

/**
 * MosaicEditMemoryDialog — dialog to correct a stale knowledge entry (a
 * "memory"): edit its content, type and tags, then save or cancel.
 *
 * Built on `@base-ui/react/dialog` (not `alert-dialog`): correcting a memory
 * is not a destructive action needing an `alertdialog` role, so the plain
 * Dialog primitive is the correct fit — same focus trap, Escape-to-cancel
 * and background-inert behavior as `alert-dialog`. Shell idiom matches
 * MosaicAgentBuilderModal (header with title/description/close button, a
 * scrollable body, a footer with cancel/save actions).
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicTextarea (content), MosaicSelect (type) and MosaicTagInput (tags).
 * This component never invents a new form field — it assembles the ones the
 * library already ships (same doctrine as MosaicSaveTemplateModal).
 *
 * Fully controlled: `open`/`onOpenChange` own visibility, `content`/`type`/
 * `tags` are single-source-of-truth values supplied by the host, every
 * change is reported via a callback. The component keeps no internal form
 * state of its own — it never persists, never fetches, never diffs against
 * a stored memory. Save goes up as a plain callback (`onSave`); the host
 * decides what "correcting a memory" means for its own data model.
 *
 * No hardcoded taxonomy: `types` is a required host-supplied list of
 * `MosaicSelectItem` — the set of memory types is business/domain knowledge,
 * never baked into the library.
 *
 * Validation belongs to the host: `canSave` is a host-computed boolean
 * gating the save button, and `contentError` is a host-computed string —
 * this component only *displays* an error, it never decides whether one
 * exists. When `contentError` is supplied, the content field gets
 * `aria-invalid="true"` and `aria-describedby` pointing at the rendered
 * error text; it is `aria-invalid="false"` otherwise, so the absence of an
 * error is never ambiguous.
 *
 * The save button does NOT auto-close the dialog on click: correcting a
 * memory is commonly asynchronous (a network call), so the host decides
 * when to flip `open` to `false` — typically only after the save succeeds.
 * The cancel button, however, always closes immediately (`Dialog.Close`) in
 * addition to notifying the host via `onCancel`. Escape maps to the native
 * Dialog "cancel" intent and calls `onOpenChange(false)` only — `onSave` is
 * never called as a side effect of closing.
 *
 * SIN-01: every visible string (`title`, `description`, `closeAriaLabel`,
 * `contentLabel`, `typeLabel`, `tagsLabel`, `tagInputPlaceholder`,
 * `removeTagAriaLabel`, `saveLabel`, `savingLabel`, `cancelLabel`) is a
 * REQUIRED prop with no default — the library carries no copy, the host
 * owns i18n. `contentError`/`contentPlaceholder`/`suggestedTags`/`maxTags`
 * are optional because they are conditionally rendered, host-computed
 * values, never a hardcoded fallback string.
 *
 * data-slot="edit-memory-dialog" on the popup root.
 * No "use client" side effects beyond the dialog's own open state — it has
 * none; prepend-use-client.mjs adds the directive to dist regardless.
 * Design tokens: --background, --border, --foreground, --muted-foreground,
 * --destructive, --primary, --ring.
 *
 * @example
 * <MosaicEditMemoryDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={t('EditMemory.title')}
 *   description={t('EditMemory.description')}
 *   closeAriaLabel={t('EditMemory.aria.close')}
 *   content={content}
 *   onContentChange={setContent}
 *   contentLabel={t('EditMemory.content')}
 *   contentError={contentError}
 *   types={memoryTypes}
 *   type={type}
 *   onTypeChange={setType}
 *   typeLabel={t('EditMemory.type')}
 *   tags={tags}
 *   onAddTag={(tag) => setTags((prev) => [...prev, tag])}
 *   onRemoveTag={(tag) => setTags((prev) => prev.filter((t) => t !== tag))}
 *   tagsLabel={t('EditMemory.tags')}
 *   tagInputPlaceholder={t('EditMemory.tagsPlaceholder')}
 *   removeTagAriaLabel={(tag) => t('EditMemory.aria.removeTag', { tag })}
 *   canSave={isValid}
 *   isSaving={isSaving}
 *   onSave={handleSave}
 *   onCancel={() => setOpen(false)}
 *   saveLabel={t('EditMemory.save')}
 *   savingLabel={t('EditMemory.saving')}
 *   cancelLabel={t('EditMemory.cancel')}
 * />
 */

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";
import { MosaicSelect, type MosaicSelectItem } from "../select/MosaicSelect.js";
import { MosaicTagInput } from "../tag-input/MosaicTagInput.js";
import { MosaicTextarea } from "../textarea/MosaicTextarea.js";
import {
  editMemoryDialogBackdropVariants,
  editMemoryDialogErrorVariants,
  editMemoryDialogFieldVariants,
  editMemoryDialogPopupVariants,
} from "./edit-memory-dialog-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicEditMemoryDialogProps {
  /** Controlled open state — the host owns the truth. */
  open: boolean;
  /** Controlled state setter, called on every open/close intent (including Escape and Cancel). */
  onOpenChange: (open: boolean) => void;

  /** Dialog title, wired to `aria-labelledby`. Required — no default. */
  title: string;
  /** Dialog description, wired to `aria-describedby`. Required — no default. */
  description: string;
  /** aria-label for the close (X) button. Required — the host owns the language. */
  closeAriaLabel: string;

  /** Current memory content value — controlled. */
  content: string;
  /** Called on every keystroke in the content field. */
  onContentChange: (value: string) => void;
  /** Label for the content field. Required — no default. */
  contentLabel: string;
  /** Placeholder for the content field. */
  contentPlaceholder?: string;
  /** Host-computed validation message for the content field, or absent when valid. */
  contentError?: string;

  /** Host-supplied memory-type taxonomy — never hardcoded in the library. */
  types: MosaicSelectItem[];
  /** Currently selected type value — controlled. */
  type: string;
  /** Called when the host user picks a different type. */
  onTypeChange: (value: string) => void;
  /** Label for the type field. Required — no default. */
  typeLabel: string;

  /** Current tag list — controlled, single source of truth owned by the host. */
  tags: string[];
  /** Called when a tag should be added. */
  onAddTag: (tag: string) => void;
  /** Called when a tag should be removed. */
  onRemoveTag: (tag: string) => void;
  /** Label for the tags field. Required — no default. */
  tagsLabel: string;
  /** Placeholder for the tag input. Required — no default. */
  tagInputPlaceholder: string;
  /** Per-tag accessible name for the remove button. Required, no default. */
  removeTagAriaLabel: (tag: string) => string;
  /** Optional host-supplied suggested tags. */
  suggestedTags?: string[];
  /** Optional maximum number of tags. */
  maxTags?: number;

  /** True while a save request is in flight — disables both actions, swaps the save label. */
  isSaving: boolean;
  /**
   * Host-computed form validity gating the save button. This component
   * never decides validation itself — it only reflects the host's verdict.
   */
  canSave: boolean;
  /** Called when the save button is clicked and `canSave` is true. Does not close the dialog. */
  onSave: () => void;
  /** Called when the cancel button is clicked, before the dialog closes. */
  onCancel: () => void;
  /** Label for the save button while idle. Required — no default. */
  saveLabel: string;
  /** Label for the save button while `isSaving` is true. Required — no default. */
  savingLabel: string;
  /** Label for the cancel button. Required — no default. */
  cancelLabel: string;

  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicEditMemoryDialog — production "edit a stale memory" dialog for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes @base-ui/react/dialog
 * with MosaicTextarea + MosaicSelect + MosaicTagInput. No network call, no
 * built-in taxonomy, no built-in validation, no built-in copy.
 */
export function MosaicEditMemoryDialog({
  open,
  onOpenChange,
  title,
  description,
  closeAriaLabel,
  content,
  onContentChange,
  contentLabel,
  contentPlaceholder,
  contentError,
  types,
  type,
  onTypeChange,
  typeLabel,
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
  saveLabel,
  savingLabel,
  cancelLabel,
  className,
}: MosaicEditMemoryDialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const contentErrorId = React.useId();

  const saveDisabled = !canSave || isSaving;

  const handleSave = () => {
    if (saveDisabled) return;
    onSave();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          data-slot="edit-memory-dialog-backdrop"
          className={editMemoryDialogBackdropVariants()}
        />
        <Dialog.Popup
          data-slot="edit-memory-dialog"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-modal="true"
          className={cn(editMemoryDialogPopupVariants(), className)}
        >
          <div
            data-slot="edit-memory-dialog-header"
            className="flex items-start justify-between gap-4 border-b border-border p-4"
          >
            <div className="flex flex-col gap-1">
              <Dialog.Title id={titleId} className="text-base font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={closeAriaLabel}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </div>

          <div
            data-slot="edit-memory-dialog-body"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
          >
            <div className={editMemoryDialogFieldVariants()}>
              <label
                htmlFor="mosaic-edit-memory-content"
                className="text-sm font-medium text-foreground"
              >
                {contentLabel}
              </label>
              <MosaicTextarea
                id="mosaic-edit-memory-content"
                value={content}
                placeholder={contentPlaceholder}
                onChange={(event) => onContentChange(event.target.value)}
                rows={4}
                aria-invalid={contentError ? "true" : "false"}
                aria-describedby={contentError ? contentErrorId : undefined}
              />
              {contentError && (
                <p id={contentErrorId} className={editMemoryDialogErrorVariants()}>
                  {contentError}
                </p>
              )}
            </div>

            <div className={editMemoryDialogFieldVariants()}>
              <span className="text-sm font-medium text-foreground">{typeLabel}</span>
              <MosaicSelect
                items={types}
                value={type}
                onValueChange={(value) => {
                  if (value) onTypeChange(value);
                }}
              />
            </div>

            <div className={editMemoryDialogFieldVariants()}>
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
          </div>

          <div
            data-slot="edit-memory-dialog-footer"
            className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end"
          >
            <Dialog.Close
              onClick={onCancel}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4",
                "bg-background text-sm font-medium text-foreground shadow-xs",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4",
                "bg-primary text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {isSaving ? savingLabel : saveLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

MosaicEditMemoryDialog.displayName = "MosaicEditMemoryDialog";
