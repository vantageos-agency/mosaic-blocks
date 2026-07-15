/**
 * MosaicSaveChatAsMemoryForm — presentational "turn this thread into agency
 * knowledge" form: the chat → memory bridge.
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicInput, MosaicTextarea and MosaicTagInput. This component never
 * invents a new form field or tag chip — it assembles the ones the library
 * already ships (same doctrine as MosaicAddMemoryForm / MosaicEditMemoryDialog).
 *
 * Zero extraction, zero I/O: the component does NOT read the chat, does NOT
 * summarize it and does NOT decide what is worth remembering — it renders
 * whatever the host already extracted as a fully controlled `content` value,
 * lets the host user title/tag it, and routes save/cancel through host
 * callbacks. No network call of any kind lives in this component.
 *
 * Fully controlled: `title`/`content`/`tags` are single-source-of-truth
 * values supplied by the host, every change is reported via a callback. The
 * component keeps no internal form state.
 *
 * Validation belongs to the host (SIN-01 + doctrine "the host decides"):
 * `canSave` is a host-computed boolean gating the save button, and
 * `titleError`/`contentError` are host-computed strings — this component
 * only *displays* an error, it never decides whether one exists. When an
 * error string is supplied, the matching field gets `aria-invalid="true"`
 * and `aria-describedby` pointing at the rendered error text; the field is
 * `aria-invalid="false"` otherwise, so the absence of an error is never
 * ambiguous.
 *
 * isSaving sets `aria-busy="true"` on the save button and disables both
 * actions — a save-in-progress is announced, never silent.
 *
 * data-slot="save-chat-as-memory-form" on the form root.
 * Bilingual: every user-facing string (labels/placeholders/errors/button
 * labels) is a required host-supplied prop — zero hardcoded copy, zero
 * default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --destructive, --foreground.
 *
 * @example
 * <MosaicSaveChatAsMemoryForm
 *   title={title}
 *   onTitleChange={setTitle}
 *   titleLabel="Title"
 *   titleError={titleError}
 *   content={extractedContent}
 *   onContentChange={setContent}
 *   contentLabel="Content"
 *   contentError={contentError}
 *   tags={tags}
 *   onAddTag={(t) => setTags((prev) => [...prev, t])}
 *   onRemoveTag={(t) => setTags((prev) => prev.filter((x) => x !== t))}
 *   tagsLabel="Tags"
 *   tagInputPlaceholder="Add a tag…"
 *   removeTagAriaLabel={(t) => `Remove ${t}`}
 *   isSaving={isSaving}
 *   canSave={canSave}
 *   onSave={handleSave}
 *   onCancel={() => setOpen(false)}
 *   saveLabel="Save Memory"
 *   savingLabel="Saving…"
 *   cancelLabel="Cancel"
 * />
 */

import { useId } from "react";
import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicTagInput } from "../tag-input/MosaicTagInput.js";
import { MosaicTextarea } from "../textarea/MosaicTextarea.js";
import {
  saveChatAsMemoryFormButtonVariants,
  saveChatAsMemoryFormErrorVariants,
  saveChatAsMemoryFormFieldVariants,
  saveChatAsMemoryFormFooterVariants,
  saveChatAsMemoryFormRootVariants,
} from "./save-chat-as-memory-form-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSaveChatAsMemoryFormProps {
  /** Current memory title value — controlled. */
  title: string;
  /** Called on every keystroke in the title field. */
  onTitleChange: (value: string) => void;
  /** Label for the title field. Required, no default. */
  titleLabel: string;
  /** Placeholder for the title field. */
  titlePlaceholder?: string;
  /** Host-computed validation message for the title field, or absent when valid. */
  titleError?: string;

  /**
   * Host-supplied, pre-extracted content value — controlled. This component
   * never reads or summarizes the source thread; the host is the sole
   * source of the extracted text.
   */
  content: string;
  /** Called on every keystroke in the content field. */
  onContentChange: (value: string) => void;
  /** Label for the content field. Required, no default. */
  contentLabel: string;
  /** Placeholder for the content field. */
  contentPlaceholder?: string;
  /** Host-computed validation message for the content field, or absent when valid. */
  contentError?: string;

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
  /** Optional host-supplied suggested tags. */
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
  /** Called when the host user saves the form. */
  onSave: () => void;
  /** Called when the host user clicks Cancel. */
  onCancel: () => void;
  /** Label for the save button while idle. Required, no default. */
  saveLabel: string;
  /** Label for the save button while isSaving=true. Required, no default. */
  savingLabel: string;
  /** Label for the cancel button. Required, no default. */
  cancelLabel: string;

  /** Additional Tailwind classes on the form root. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSaveChatAsMemoryForm — production "save this thread as a memory"
 * form for @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes MosaicInput +
 * MosaicTextarea + MosaicTagInput. No network call, no extraction logic, no
 * built-in validation, no built-in copy.
 */
export function MosaicSaveChatAsMemoryForm({
  title,
  onTitleChange,
  titleLabel,
  titlePlaceholder,
  titleError,
  content,
  onContentChange,
  contentLabel,
  contentPlaceholder,
  contentError,
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
}: MosaicSaveChatAsMemoryFormProps) {
  const titleErrorId = useId();
  const contentErrorId = useId();

  return (
    <div
      data-slot="save-chat-as-memory-form"
      className={cn(saveChatAsMemoryFormRootVariants(), className)}
    >
      <div className={saveChatAsMemoryFormFieldVariants()}>
        <label
          htmlFor="mosaic-save-chat-as-memory-title"
          className="text-sm font-medium text-foreground"
        >
          {titleLabel}
        </label>
        <MosaicInput
          id="mosaic-save-chat-as-memory-title"
          value={title}
          placeholder={titlePlaceholder}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? titleErrorId : undefined}
        />
        {titleError && (
          <p id={titleErrorId} className={saveChatAsMemoryFormErrorVariants()}>
            {titleError}
          </p>
        )}
      </div>

      <div className={saveChatAsMemoryFormFieldVariants()}>
        <label
          htmlFor="mosaic-save-chat-as-memory-content"
          className="text-sm font-medium text-foreground"
        >
          {contentLabel}
        </label>
        <MosaicTextarea
          id="mosaic-save-chat-as-memory-content"
          value={content}
          placeholder={contentPlaceholder}
          onChange={(e) => onContentChange(e.target.value)}
          rows={4}
          aria-invalid={contentError ? "true" : "false"}
          aria-describedby={contentError ? contentErrorId : undefined}
        />
        {contentError && (
          <p id={contentErrorId} className={saveChatAsMemoryFormErrorVariants()}>
            {contentError}
          </p>
        )}
      </div>

      <div className={saveChatAsMemoryFormFieldVariants()}>
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

      <div className={saveChatAsMemoryFormFooterVariants()}>
        <button
          type="button"
          data-slot="save-chat-as-memory-form-cancel-button"
          onClick={onCancel}
          disabled={isSaving}
          className={saveChatAsMemoryFormButtonVariants({ intent: "cancel" })}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          data-slot="save-chat-as-memory-form-save-button"
          onClick={onSave}
          disabled={!canSave || isSaving}
          aria-busy={isSaving ? "true" : "false"}
          className={saveChatAsMemoryFormButtonVariants({ intent: "save" })}
        >
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}

MosaicSaveChatAsMemoryForm.displayName = "MosaicSaveChatAsMemoryForm";
