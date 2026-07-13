/**
 * MosaicAgentEditor — agent config form (name / role / instructions)
 *
 * Ported (shape only) from any-debate-ai:
 * - components/agent-composer/AgentEditor.tsx
 * - components/agent-config/AgentBuilderModal.tsx
 *
 * No business logic is carried over: no roles/personas/frameworks lists, no
 * model presets, no default prompts. Every visible string is a REQUIRED prop
 * with no default. The form is fully controlled: values, onChange handlers,
 * validation errors and the busy state all come from the host.
 *
 * data-slot="agent-editor" on the root.
 * Deps: @base-ui/react (via MosaicButton) + class-variance-authority only.
 */

import type * as React from "react";
import { MosaicButton } from "../button/Button.js";
import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicTextarea } from "../textarea/MosaicTextarea.js";
import { agentEditorVariants } from "./agent-editor-variants.js";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicAgentEditorProps {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;

  /** Name field */
  nameLabel: string;
  nameValue: string;
  onNameChange: (value: string) => void;
  /** Host-decided validation error for the name field, or null when valid */
  nameError: string | null;

  /** Role field */
  roleLabel: string;
  roleValue: string;
  onRoleChange: (value: string) => void;
  /** Host-decided validation error for the role field, or null when valid */
  roleError: string | null;

  /** Instructions field */
  instructionsLabel: string;
  instructionsValue: string;
  onInstructionsChange: (value: string) => void;
  /** Host-decided validation error for the instructions field, or null when valid */
  instructionsError: string | null;

  /** Actions */
  saveLabel: string;
  cancelLabel: string;
  onSave: () => void;
  onCancel: () => void;
  /** Host decides whether the form is currently valid/submittable */
  canSave: boolean;
  /** Host-controlled submission-in-flight state */
  isSaving: boolean;
  /** Label shown on the save button while isSaving is true */
  savingLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAgentEditor — production agent-editor form for @vantageos/mosaic-blocks.
 *
 * Fully controlled: name/role/instructions values, onChange handlers,
 * validation errors and busy state are all supplied by the host. The
 * component carries no business knowledge (no role list, no model, no
 * default instructions) — it only renders the form shape.
 *
 * @example
 * <MosaicAgentEditor
 *   nameLabel="Name" nameValue={name} onNameChange={setName} nameError={nameError}
 *   roleLabel="Role" roleValue={role} onRoleChange={setRole} roleError={null}
 *   instructionsLabel="Instructions" instructionsValue={instructions}
 *   onInstructionsChange={setInstructions} instructionsError={null}
 *   saveLabel="Save" cancelLabel="Cancel" onSave={handleSave} onCancel={handleCancel}
 *   canSave={isValid} isSaving={isSaving} savingLabel="Saving…"
 * />
 */
export function MosaicAgentEditor({
  className,
  ref,
  nameLabel,
  nameValue,
  onNameChange,
  nameError,
  roleLabel,
  roleValue,
  onRoleChange,
  roleError,
  instructionsLabel,
  instructionsValue,
  onInstructionsChange,
  instructionsError,
  saveLabel,
  cancelLabel,
  onSave,
  onCancel,
  canSave,
  isSaving,
  savingLabel,
}: MosaicAgentEditorProps) {
  const nameErrorId = nameError ? "mosaic-agent-editor-name-error" : undefined;
  const roleErrorId = roleError ? "mosaic-agent-editor-role-error" : undefined;
  const instructionsErrorId = instructionsError
    ? "mosaic-agent-editor-instructions-error"
    : undefined;

  const saveDisabled = !canSave || isSaving;

  const handleSave = () => {
    if (saveDisabled) return;
    onSave();
  };

  return (
    <div
      ref={ref}
      data-slot="agent-editor"
      aria-busy={isSaving ? "true" : undefined}
      className={agentEditorVariants({ className })}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mosaic-agent-editor-name" className="text-sm font-medium text-foreground">
          {nameLabel}
        </label>
        <MosaicInput
          id="mosaic-agent-editor-name"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          aria-invalid={nameError ? "true" : undefined}
          aria-describedby={nameErrorId}
        />
        {nameError ? (
          <p id={nameErrorId} className="text-xs font-medium text-destructive">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="mosaic-agent-editor-role" className="text-sm font-medium text-foreground">
          {roleLabel}
        </label>
        <MosaicInput
          id="mosaic-agent-editor-role"
          value={roleValue}
          onChange={(event) => onRoleChange(event.target.value)}
          aria-invalid={roleError ? "true" : undefined}
          aria-describedby={roleErrorId}
        />
        {roleError ? (
          <p id={roleErrorId} className="text-xs font-medium text-destructive">
            {roleError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="mosaic-agent-editor-instructions"
          className="text-sm font-medium text-foreground"
        >
          {instructionsLabel}
        </label>
        <MosaicTextarea
          id="mosaic-agent-editor-instructions"
          value={instructionsValue}
          onChange={(event) => onInstructionsChange(event.target.value)}
          aria-invalid={instructionsError ? "true" : undefined}
          aria-describedby={instructionsErrorId}
        />
        {instructionsError ? (
          <p id={instructionsErrorId} className="text-xs font-medium text-destructive">
            {instructionsError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <MosaicButton type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </MosaicButton>
        <MosaicButton type="button" onClick={handleSave} disabled={saveDisabled}>
          {isSaving ? savingLabel : saveLabel}
        </MosaicButton>
      </div>
    </div>
  );
}

MosaicAgentEditor.displayName = "MosaicAgentEditor";
