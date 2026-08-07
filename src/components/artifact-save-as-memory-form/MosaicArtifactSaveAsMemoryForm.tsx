/**
 * MosaicArtifactSaveAsMemoryForm — presentational "capitalise this artifact
 * into memory" form: the artifact → memory bridge, sibling of
 * MosaicSaveChatAsMemoryForm (chat → memory) in the same product family.
 *
 * Reuse: composed from the closest any-debate-ai pattern —
 * components/artifacts/save-artifact-as-memory-form.tsx — stripped of its
 * AdaptiveModal wrapper (host owns the shell/overlay), shadcn/ui deps,
 * mock-AI-extracted-learnings array, and hardcoded userRole-gated scope
 * options, to keep this a pure, contract-agnostic form component: prop-
 * driven, no backend, no hardcoded business data, same doctrine as
 * MosaicSaveChatAsMemoryForm / MosaicAddMemoryForm.
 *
 * Presentational atom composed from existing mosaic-blocks primitives:
 * MosaicInput + MosaicTagInput. This component never invents a new form
 * field or tag chip — it assembles the ones the library already ships.
 *
 * Zero extraction, zero I/O: the component does NOT read the artifact, does
 * NOT summarize it and does NOT decide what is worth remembering — it
 * renders whatever the host already extracted as fully controlled
 * `learnings`/`title`/`tags`/`scope` values, and routes save/cancel through
 * host callbacks. No network call of any kind lives in this component.
 *
 * Fully controlled: `title`/`learnings`/`scope`/`tags` are single-source-
 * of-truth values supplied by the host, every change is reported via a
 * callback. The component keeps no internal form state.
 *
 * Validation belongs to the host (SIN-01 + doctrine "the host decides"):
 * `canSave` is a host-computed boolean gating the save button, and
 * `titleError` is a host-computed string — this component only *displays*
 * an error, it never decides whether one exists. When an error string is
 * supplied, the title field gets `aria-invalid="true"` and
 * `aria-describedby` pointing at the rendered error text; the field is
 * `aria-invalid="false"` otherwise, so the absence of an error is never
 * ambiguous.
 *
 * Memory scope is a host-supplied `scopeOptions` list (e.g. gated by the
 * host's own role/permission model) — this component never hardcodes
 * "admin"/"member" or any org-scoped business rule; it renders whatever
 * options the host passes.
 *
 * isSaving sets `aria-busy="true"` on the save button and disables both
 * actions — a save-in-progress is announced, never silent.
 *
 * data-slot="artifact-save-as-memory-form" on the form root.
 * Bilingual: every user-facing string (labels/placeholders/errors/button
 * labels/type labels) is a required host-supplied prop — zero hardcoded
 * copy, zero default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --destructive, --foreground, --muted-foreground,
 * --secondary, --secondary-foreground.
 *
 * @example
 * <MosaicArtifactSaveAsMemoryForm
 *   artifact={artifact}
 *   typeLabel={(type) => typeLabels[type]}
 *   title={title}
 *   onTitleChange={setTitle}
 *   titleLabel="Memory Title"
 *   titleError={titleError}
 *   learnings={learnings}
 *   onEditLearning={(i, value) => editLearning(i, value)}
 *   onRemoveLearning={(i) => removeLearning(i)}
 *   learningsLabel="AI-Extracted Learnings"
 *   editLearningAriaLabel={(i) => `Edit learning ${i + 1}`}
 *   removeLearningAriaLabel={(i) => `Remove learning ${i + 1}`}
 *   scope={scope}
 *   onScopeChange={setScope}
 *   scopeLabel="Memory Scope"
 *   scopeOptions={scopeOptions}
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
 *   saveLabel="Save to Memory"
 *   savingLabel="Saving…"
 *   cancelLabel="Cancel"
 * />
 */

import { useId } from "react";
import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicTagInput } from "../tag-input/MosaicTagInput.js";
import {
  artifactSaveAsMemoryFormButtonVariants,
  artifactSaveAsMemoryFormErrorVariants,
  artifactSaveAsMemoryFormFieldVariants,
  artifactSaveAsMemoryFormFooterVariants,
  artifactSaveAsMemoryFormLearningVariants,
  artifactSaveAsMemoryFormPreviewVariants,
  artifactSaveAsMemoryFormRootVariants,
} from "./artifact-save-as-memory-form-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicArtifactSaveAsMemoryArtifactType =
  | "document"
  | "data-table"
  | "checklist"
  | "chart";

export interface MosaicArtifactSaveAsMemoryArtifact {
  id: string;
  type: MosaicArtifactSaveAsMemoryArtifactType;
  title: string;
  content: string;
  preview?: string;
}

export interface MosaicArtifactSaveAsMemoryScopeOption {
  value: string;
  label: string;
}

export interface MosaicArtifactSaveAsMemoryFormProps {
  /** The artifact being capitalised into memory — host-supplied, read-only preview. */
  artifact: MosaicArtifactSaveAsMemoryArtifact;
  /** Localizes the artifact type badge. Required, no default. */
  typeLabel: (type: MosaicArtifactSaveAsMemoryArtifactType) => string;

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
   * Host-supplied, pre-extracted learnings — controlled. This component
   * never extracts or generates learnings; the host (or its own AI
   * extraction pipeline) is the sole source of this list.
   */
  learnings: string[];
  /** Called when the host user edits a learning at the given index. */
  onEditLearning: (index: number) => void;
  /** Called when the host user removes a learning at the given index. */
  onRemoveLearning: (index: number) => void;
  /** Label for the learnings section. Required, no default. */
  learningsLabel: string;
  /** Optional helper text under the learnings label. */
  learningsDescription?: string;
  /** Per-learning accessible name for the edit button. Required, no default. */
  editLearningAriaLabel: (index: number) => string;
  /** Per-learning accessible name for the remove button. Required, no default. */
  removeLearningAriaLabel: (index: number) => string;

  /** Current memory scope value — controlled. */
  scope: string;
  /** Called when the host user changes the memory scope. */
  onScopeChange: (value: string) => void;
  /** Label for the scope selector. Required, no default. */
  scopeLabel: string;
  /**
   * Host-supplied scope options (e.g. gated by the host's own role/
   * permission model). This component never hardcodes which scopes are
   * available — it renders exactly the options the host passes.
   */
  scopeOptions: MosaicArtifactSaveAsMemoryScopeOption[];

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
 * MosaicArtifactSaveAsMemoryForm — production "save this artifact as a
 * memory" form for @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: composes MosaicInput +
 * MosaicTagInput. No network call, no extraction logic, no built-in
 * validation, no built-in copy.
 */
export function MosaicArtifactSaveAsMemoryForm({
  artifact,
  typeLabel,
  title,
  onTitleChange,
  titleLabel,
  titlePlaceholder,
  titleError,
  learnings,
  onEditLearning,
  onRemoveLearning,
  learningsLabel,
  learningsDescription,
  editLearningAriaLabel,
  removeLearningAriaLabel,
  scope,
  onScopeChange,
  scopeLabel,
  scopeOptions,
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
}: MosaicArtifactSaveAsMemoryFormProps) {
  const titleErrorId = useId();
  const scopeId = useId();

  return (
    <div
      data-slot="artifact-save-as-memory-form"
      className={cn(artifactSaveAsMemoryFormRootVariants(), className)}
    >
      <div
        data-slot="artifact-save-as-memory-form-preview"
        className={artifactSaveAsMemoryFormPreviewVariants()}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{artifact.title}</p>
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
            {artifact.preview || artifact.content}
          </p>
          <span
            data-slot="artifact-save-as-memory-form-type"
            className="mt-2 inline-block shrink-0 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
          >
            {typeLabel(artifact.type)}
          </span>
        </div>
      </div>

      <div className={artifactSaveAsMemoryFormFieldVariants()}>
        <label
          htmlFor="mosaic-artifact-save-as-memory-title"
          className="text-sm font-medium text-foreground"
        >
          {titleLabel}
        </label>
        <MosaicInput
          id="mosaic-artifact-save-as-memory-title"
          value={title}
          placeholder={titlePlaceholder}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? titleErrorId : undefined}
        />
        {titleError && (
          <p id={titleErrorId} className={artifactSaveAsMemoryFormErrorVariants()}>
            {titleError}
          </p>
        )}
      </div>

      <div className={artifactSaveAsMemoryFormFieldVariants()}>
        <span className="text-sm font-medium text-foreground">{learningsLabel}</span>
        {learningsDescription && (
          <p className="text-muted-foreground text-xs">{learningsDescription}</p>
        )}
        <div className="flex flex-col gap-2">
          {learnings.map((learning, index) => (
            <div
              key={`${index}-${learning}`}
              data-slot="artifact-save-as-memory-form-learning"
              className={artifactSaveAsMemoryFormLearningVariants()}
            >
              <p className="flex-1 text-sm">{learning}</p>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  data-slot="artifact-save-as-memory-form-learning-edit"
                  onClick={() => onEditLearning(index)}
                  aria-label={editLearningAriaLabel(index)}
                  className={artifactSaveAsMemoryFormButtonVariants({ intent: "ghost" })}
                >
                  {editLearningAriaLabel(index)}
                </button>
                <button
                  type="button"
                  data-slot="artifact-save-as-memory-form-learning-remove"
                  onClick={() => onRemoveLearning(index)}
                  aria-label={removeLearningAriaLabel(index)}
                  className={artifactSaveAsMemoryFormButtonVariants({ intent: "ghost" })}
                >
                  {removeLearningAriaLabel(index)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={artifactSaveAsMemoryFormFieldVariants()}>
        <label htmlFor={scopeId} className="text-sm font-medium text-foreground">
          {scopeLabel}
        </label>
        <select
          id={scopeId}
          data-slot="artifact-save-as-memory-form-scope"
          value={scope}
          onChange={(e) => onScopeChange(e.target.value)}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 text-sm",
            "outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          )}
        >
          {scopeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={artifactSaveAsMemoryFormFieldVariants()}>
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

      <div className={artifactSaveAsMemoryFormFooterVariants()}>
        <button
          type="button"
          data-slot="artifact-save-as-memory-form-cancel-button"
          onClick={onCancel}
          disabled={isSaving}
          className={artifactSaveAsMemoryFormButtonVariants({ intent: "cancel" })}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          data-slot="artifact-save-as-memory-form-save-button"
          onClick={onSave}
          disabled={!canSave || isSaving}
          aria-busy={isSaving ? "true" : "false"}
          className={artifactSaveAsMemoryFormButtonVariants({ intent: "save" })}
        >
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}

MosaicArtifactSaveAsMemoryForm.displayName = "MosaicArtifactSaveAsMemoryForm";
