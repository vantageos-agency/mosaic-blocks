"use client";

/**
 * MosaicAgentComposerMobile — single-col composer, mobile variant (PC-10)
 *
 * Ported (source: private upstream) components/agent-composer/AgentComposerMobile.tsx
 *
 * Single-column scrollable form with:
 * - Sticky header with back button (edit mode) + title
 * - 4 module slots (role, persona, framework, model)
 * - Custom instructions textarea
 * - Sticky bottom CTA bar (Create / Save + Cancel)
 * - isLoading prop for async feedback
 * - Full ARIA attributes (aria-required, aria-invalid, aria-describedby)
 *
 * Shares MosaicAgentComposerProps with Desktop variant (same contract, minor extensions).
 * No device detection — parent (MosaicAgentComposer) routes device → variant.
 *
 * Framer-motion: N/A.
 * Icons: inline SVG (no lucide dep).
 */

import * as React from "react";
import type {
  MosaicAgentComposerProps,
  MosaicComposerModel,
  MosaicComposerModule,
} from "./MosaicAgentComposerDesktop.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Extended props ────────────────────────────────────────────────────────────

export interface MosaicAgentComposerMobileProps extends MosaicAgentComposerProps {
  /** Show loading state on submit button */
  isLoading?: boolean;
  /**
   * "Required" marker shown on a mandatory module slot. Declared HERE, not on
   * the shared MosaicAgentComposerProps, because only the mobile composer
   * renders it — the desktop one never does. (Moved by the
   * no-lying-prop-contract guard: a prop is required exactly where it is read.)
   */
  requiredLabel: string;
  /**
   * Required host-owned strings (mobile-only extras) — no default,
   * no fallback. The host owns the language (e.g. next-intl `t()`).
   */
  goBackAriaLabel: string;
  savingLabel: string;
  creatingLabel: string;
  optionalInstructionsHelp: string;
}

// ── Re-export shared types for convenience ────────────────────────────────────
export type { MosaicComposerModule, MosaicComposerModel };

// ── Inline icons ──────────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
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
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PlusIcon() {
  return (
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

// ── Module slot (mobile variant — numbered) ───────────────────────────────────

interface MobileModuleSlotProps {
  step: number;
  label: string;
  module?: MosaicComposerModule;
  onSelect: () => void;
  onRemove: () => void;
  isLoading: boolean;
  requiredLabel: string;
}

function MobileModuleSlot({
  step,
  label,
  module,
  onSelect,
  onRemove,
  isLoading,
  requiredLabel,
}: MobileModuleSlotProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {step}. {label}
          </h3>
          <span className="text-xs text-muted-foreground">{requiredLabel}</span>
        </div>
      </div>
      <div className="p-3">
        {module ? (
          <div className="flex min-h-[64px] items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            {module.icon && (
              <span className="shrink-0 text-lg" aria-hidden="true">
                {module.icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{module.name}</p>
              {module.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {module.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onSelect}
                disabled={isLoading}
                aria-label={`Edit ${label}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={isLoading}
                aria-label={`Remove ${label}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <svg
                  width="12"
                  height="12"
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
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            disabled={isLoading}
            aria-label={`Select ${label}`}
            className="flex w-full min-h-[64px] items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <PlusIcon />
            Select {label}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAgentComposerMobile — single-column composer (mobile half of responsive pair).
 * Shares the same props contract as MosaicAgentComposerDesktop (plus isLoading).
 * Use MosaicAgentComposer orchestrator to select the right variant automatically.
 */
export function MosaicAgentComposerMobile({
  agentName,
  onAgentNameChange,
  customInstructions,
  onCustomInstructionsChange,
  selectedRole,
  selectedPersona,
  selectedFramework,
  selectedModel,
  onSelectRole,
  onSelectPersona,
  onSelectFramework,
  onSelectModel,
  onRemoveRole,
  onRemovePersona,
  onRemoveFramework,
  onSave,
  onCancel,
  canSave,
  isEditMode = false,
  isLoading = false,
  labels,
  agentNameLabel,
  agentNamePlaceholder,
  instructionsPlaceholder,
  recommendedBadgeLabel,
  requiredLabel,
  goBackAriaLabel,
  savingLabel,
  creatingLabel,
  optionalInstructionsHelp,
}: MosaicAgentComposerMobileProps) {
  // `labels` is fully required — every field is host-supplied, no default,
  // no fallback. Aliased to `L` only for call-site brevity below.
  const L = labels;

  const instructionsId = React.useId();

  return (
    <div data-slot="agent-composer-mobile" className="flex h-full flex-col">
      {/* Sticky header */}
      <div className="shrink-0 sticky top-0 z-10 border-b border-border bg-background px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {isEditMode && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              aria-label={goBackAriaLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <ArrowLeftIcon />
            </button>
          )}
          <SparklesIcon />
          <h1 className="text-lg font-semibold text-foreground">
            {isEditMode ? L.headingEdit : L.heading}
          </h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isEditMode ? L.subheadingEdit : L.subheading}
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Agent Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="mosaic-composer-mobile-name"
            className="block text-sm font-medium text-foreground"
          >
            {agentNameLabel}
          </label>
          <input
            id="mosaic-composer-mobile-name"
            type="text"
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
            placeholder={agentNamePlaceholder}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={canSave && !agentName ? "true" : "false"}
            className={cn(
              "flex min-h-[48px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-50 transition-colors",
            )}
          />
        </div>

        {/* Module slots (numbered) */}
        <MobileModuleSlot
          step={1}
          label={L.role}
          module={selectedRole}
          onSelect={onSelectRole}
          onRemove={onRemoveRole}
          isLoading={isLoading}
          requiredLabel={requiredLabel}
        />
        <MobileModuleSlot
          step={2}
          label={L.persona}
          module={selectedPersona}
          onSelect={onSelectPersona}
          onRemove={onRemovePersona}
          isLoading={isLoading}
          requiredLabel={requiredLabel}
        />
        <MobileModuleSlot
          step={3}
          label={L.framework}
          module={selectedFramework}
          onSelect={onSelectFramework}
          onRemove={onRemoveFramework}
          isLoading={isLoading}
          requiredLabel={requiredLabel}
        />

        {/* Model slot */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">4. {L.model}</h3>
              <span className="text-xs text-muted-foreground">{requiredLabel}</span>
            </div>
          </div>
          <div className="p-3">
            {selectedModel ? (
              <div className="space-y-2">
                <div className="flex min-h-[64px] items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{selectedModel.name}</p>
                      {selectedModel.recommended && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {recommendedBadgeLabel}
                        </span>
                      )}
                    </div>
                    {selectedModel.provider && (
                      <p className="text-xs capitalize text-muted-foreground">
                        {selectedModel.provider}
                      </p>
                    )}
                    {(selectedModel.contextWindow || selectedModel.pricingLabel) && (
                      <p className="text-xs text-muted-foreground">
                        {selectedModel.contextWindow &&
                          `${selectedModel.contextWindow.toLocaleString()} context`}
                        {selectedModel.contextWindow && selectedModel.pricingLabel && " • "}
                        {selectedModel.pricingLabel}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSelectModel}
                  disabled={isLoading}
                  className="flex w-full min-h-[44px] items-center justify-center rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  Change {L.model}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSelectModel}
                disabled={isLoading}
                aria-label={`Select ${L.model}`}
                className="flex w-full min-h-[64px] items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <PlusIcon />
                Select {L.model}
              </button>
            )}
          </div>
        </div>

        {/* Custom instructions */}
        <div className="space-y-1.5">
          <label htmlFor={instructionsId} className="block text-sm font-medium text-foreground">
            {L.customInstructions}
          </label>
          <textarea
            id={instructionsId}
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            placeholder={instructionsPlaceholder}
            disabled={isLoading}
            aria-describedby={`${instructionsId}-help`}
            rows={4}
            className={cn(
              "flex w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "min-h-[100px] disabled:opacity-50 transition-colors",
            )}
          />
          <p id={`${instructionsId}-help`} className="text-xs text-muted-foreground">
            {optionalInstructionsHelp}
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="shrink-0 sticky bottom-0 z-10 border-t border-border bg-background p-4">
        {isEditMode && onCancel ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex flex-1 min-h-[48px] items-center justify-center rounded-lg border border-border bg-transparent text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {L.cancelLabel}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave || isLoading}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SaveIcon />
              {isLoading ? savingLabel : L.saveLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isLoading}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon />
            {isLoading ? creatingLabel : L.saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}

MosaicAgentComposerMobile.displayName = "MosaicAgentComposerMobile";
