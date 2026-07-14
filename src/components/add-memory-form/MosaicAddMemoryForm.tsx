/**
 * MosaicAddMemoryForm — presentational "record a new memory" form
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicTextarea, MosaicSelect and MosaicTagInput. This component never
 * invents a new form field or tag chip — it assembles the ones the library
 * already ships.
 *
 * Fully controlled: `content`/`type`/`tags` are single-source-of-truth
 * values supplied by the host, every change is reported via a callback. The
 * component keeps no internal form state.
 *
 * Validation belongs to the host (SIN-01 + doctrine "the host decides"):
 * `canSubmit` is a host-computed boolean gating the submit button, and
 * `contentError` is a host-computed string — this component only *displays*
 * an error, it never decides whether one exists. When an error string is
 * supplied, the content field gets `aria-invalid="true"` and
 * `aria-describedby` pointing at the rendered error text; the field is
 * `aria-invalid="false"` otherwise, so the absence of an error is never
 * ambiguous.
 *
 * No hardcoded taxonomy: `types` is a required host-supplied list — the
 * set of memory categories/types is business knowledge, never baked into
 * the library. Suggested tags (`suggestedTags`) are likewise entirely
 * host-supplied.
 *
 * isSubmitting sets `aria-busy="true"` on the submit button and disables
 * both actions — a submission-in-progress is announced, never silent.
 *
 * data-slot="add-memory-form" on the form root.
 * Bilingual: every user-facing string (labels/placeholders/errors/button
 * labels) is a required host-supplied prop — zero hardcoded copy, zero
 * default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --destructive, --foreground.
 *
 * @example
 * <MosaicAddMemoryForm
 *   content={content}
 *   onContentChange={setContent}
 *   contentLabel="Content"
 *   contentPlaceholder="What do you want to remember?"
 *   contentError={contentError}
 *   types={types}
 *   type={type}
 *   onTypeChange={setType}
 *   typeLabel="Type"
 *   tags={tags}
 *   onAddTag={(t) => setTags((prev) => [...prev, t])}
 *   onRemoveTag={(t) => setTags((prev) => prev.filter((x) => x !== t))}
 *   tagsLabel="Tags"
 *   tagInputPlaceholder="Add a tag…"
 *   removeTagAriaLabel={(t) => `Remove ${t}`}
 *   isSubmitting={isSubmitting}
 *   canSubmit={canSubmit}
 *   onSubmit={handleSubmit}
 *   onCancel={() => setOpen(false)}
 *   submitButtonLabel="Save Memory"
 *   submittingLabel="Saving…"
 *   cancelButtonLabel="Cancel"
 * />
 */

import { useId } from "react";
import { MosaicSelect, type MosaicSelectItem } from "../select/MosaicSelect.js";
import { MosaicTagInput } from "../tag-input/MosaicTagInput.js";
import { MosaicTextarea } from "../textarea/MosaicTextarea.js";
import {
  addMemoryFormButtonVariants,
  addMemoryFormErrorVariants,
  addMemoryFormFieldVariants,
  addMemoryFormFooterVariants,
  addMemoryFormRootVariants,
} from "./add-memory-form-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAddMemoryFormProps {
  /** Current memory content value — controlled. */
  content: string;
  /** Called on every keystroke in the content field. */
  onContentChange: (value: string) => void;
  /** Label for the content field. Required, no default. */
  contentLabel: string;
  /** Placeholder for the content field. */
  contentPlaceholder?: string;
  /** Host-computed validation message for the content field, or absent when valid. */
  contentError?: string;

  /** Host-supplied type/category taxonomy — never hardcoded in the library. */
  types: MosaicSelectItem[];
  /** Currently selected type value — controlled. */
  type: string;
  /** Called when the host user picks a different type. */
  onTypeChange: (value: string) => void;
  /** Label for the type field. Required, no default. */
  typeLabel: string;

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
  /** Optional host-supplied suggested tags (e.g. derived from the chosen type). */
  suggestedTags?: string[];
  /** Optional maximum number of tags. */
  maxTags?: number;

  /** True while a submit request is in flight — announced via aria-busy, disables both actions. */
  isSubmitting: boolean;
  /**
   * Host-computed form validity gating the submit button. This component
   * never decides validation itself — it only reflects the host's verdict.
   */
  canSubmit: boolean;
  /** Called when the host user submits the form. */
  onSubmit: () => void;
  /** Called when the host user clicks Cancel. */
  onCancel: () => void;
  /** Label for the submit button while idle. Required, no default. */
  submitButtonLabel: string;
  /** Label for the submit button while isSubmitting=true. Required, no default. */
  submittingLabel: string;
  /** Label for the cancel button. Required, no default. */
  cancelButtonLabel: string;

  /** Additional Tailwind classes on the form root. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAddMemoryForm — production "record a new memory" form for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes MosaicTextarea +
 * MosaicSelect + MosaicTagInput. No network call, no built-in taxonomy, no
 * built-in validation, no built-in copy.
 */
export function MosaicAddMemoryForm({
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
  isSubmitting,
  canSubmit,
  onSubmit,
  onCancel,
  submitButtonLabel,
  submittingLabel,
  cancelButtonLabel,
  className,
}: MosaicAddMemoryFormProps) {
  const contentErrorId = useId();

  return (
    <div data-slot="add-memory-form" className={cn(addMemoryFormRootVariants(), className)}>
      <div className={addMemoryFormFieldVariants()}>
        <label htmlFor="mosaic-add-memory-content" className="text-sm font-medium text-foreground">
          {contentLabel}
        </label>
        <MosaicTextarea
          id="mosaic-add-memory-content"
          value={content}
          placeholder={contentPlaceholder}
          onChange={(e) => onContentChange(e.target.value)}
          rows={4}
          aria-invalid={contentError ? "true" : "false"}
          aria-describedby={contentError ? contentErrorId : undefined}
        />
        {contentError && (
          <p id={contentErrorId} className={addMemoryFormErrorVariants()}>
            {contentError}
          </p>
        )}
      </div>

      <div className={addMemoryFormFieldVariants()}>
        <span className="text-sm font-medium text-foreground">{typeLabel}</span>
        <MosaicSelect
          items={types}
          value={type}
          onValueChange={(value) => {
            if (value) onTypeChange(value);
          }}
        />
      </div>

      <div className={addMemoryFormFieldVariants()}>
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

      <div className={addMemoryFormFooterVariants()}>
        <button
          type="button"
          data-slot="add-memory-form-cancel-button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={addMemoryFormButtonVariants({ intent: "cancel" })}
        >
          {cancelButtonLabel}
        </button>
        <button
          type="button"
          data-slot="add-memory-form-submit-button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          aria-busy={isSubmitting ? "true" : "false"}
          className={addMemoryFormButtonVariants({ intent: "submit" })}
        >
          {isSubmitting ? submittingLabel : submitButtonLabel}
        </button>
      </div>
    </div>
  );
}

MosaicAddMemoryForm.displayName = "MosaicAddMemoryForm";
