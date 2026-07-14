"use client";

/**
 * MosaicAgentComposerDesktop — 2-col agent builder, desktop variant (PC-09)
 *
 * Ported (source: private upstream) components/agent-composer/AgentComposerDesktop.tsx
 *
 * Two-column layout:
 * - Left: scrollable form (name, role/persona/framework/model slots, instructions)
 * - Right: live preview panel
 *
 * Generalized: ProfessionalRole / Persona / Framework / Model domain types replaced
 * with generic MosaicComposerModule + MosaicComposerModel interfaces.
 * All 4 module slots accept any MosaicComposerModule — callers use their own types.
 *
 * Framer-motion: N/A (no animation in source component).
 * Icons: inline SVG (no lucide dep).
 * No device context — caller selects Desktop vs Mobile via MosaicAgentComposer orchestrator.
 */

// React import not needed — JSX transform handles it

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Generic types ─────────────────────────────────────────────────────────────

export interface MosaicComposerModule {
  name: string;
  description?: string;
  /** Short supplementary text (traits, expertise, step count, etc.) */
  detail?: string;
  icon?: string;
  tags?: string[];
}

export interface MosaicComposerModel {
  name: string;
  provider?: string;
  contextWindow?: number;
  recommended?: boolean;
  pricingLabel?: string;
}

// ── Shared props interface ─────────────────────────────────────────────────────

export interface MosaicAgentComposerProps {
  agentName: string;
  onAgentNameChange: (name: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  selectedRole?: MosaicComposerModule;
  selectedPersona?: MosaicComposerModule;
  selectedFramework?: MosaicComposerModule;
  selectedModel?: MosaicComposerModel;
  onSelectRole: () => void;
  onSelectPersona: () => void;
  onSelectFramework: () => void;
  onSelectModel: () => void;
  onRemoveRole: () => void;
  onRemovePersona: () => void;
  onRemoveFramework: () => void;
  onSave: () => void;
  onCancel?: () => void;
  canSave: boolean;
  isEditMode?: boolean;
  /**
   * Slot labels — required, host-owned, no default. The host owns the
   * language (e.g. next-intl `t()`). Every field is mandatory: a missing
   * label is a compile-time error, never a silent English fallback.
   */
  labels: {
    role: string;
    persona: string;
    framework: string;
    model: string;
    customInstructions: string;
    saveLabel: string;
    cancelLabel: string;
    heading: string;
    subheading: string;
    headingEdit: string;
    subheadingEdit: string;
  };
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  agentNameLabel: string;
  agentNamePlaceholder: string;
  instructionsPlaceholder: string;
  modelDescriptionLabel: string;
  recommendedBadgeLabel: string;
  livePreviewHeading: string;
  livePreviewSubheading: string;
  previewConfigLabel: string;
  customInstructionsPreviewLabel: string;
  selectAllModulesLabel: string;
  // NOTE: `requiredLabel` used to be declared here, on the SHARED props type,
  // but the desktop composer never renders it — only MosaicAgentComposerMobile
  // does (its module slots show a "required" marker). Requiring it here forced
  // every desktop host to supply a string this component never displays. It now
  // lives on MosaicAgentComposerMobileProps, i.e. exactly where it is read.
  // Found by the no-lying-prop-contract guard.
  /** Fallback name shown in the preview when `agentName` is empty. Required, no default. */
  unnamedAgentLabel: string;
}

// NOTE: same class of gap that produced the `requiredLabel` split above.
// The three module-slot sublabels below are rendered unconditionally by the
// Desktop variant on every render, but MosaicAgentComposerMobile never reads
// them — its own module-slot component takes no sublabel prop at all. Adding
// them to the shared `MosaicAgentComposerProps` would force every Mobile-only
// host to supply strings that component never displays, i.e. the exact
// lying-prop-contract this codebase hunts. They live here instead, on a
// Desktop-only extension of the shared type.
export interface MosaicAgentComposerDesktopProps extends MosaicAgentComposerProps {
  /**
   * Required host-owned strings — no default, no fallback. Read
   * unconditionally by the three module slots on every render.
   */
  roleSublabel: string;
  personaSublabel: string;
  frameworkSublabel: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function SparklesIcon() {
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
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z" />
    </svg>
  );
}

function PlusIcon() {
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

// ── Sub-components ────────────────────────────────────────────────────────────

interface ModuleSlotProps {
  label: string;
  sublabel?: string;
  module?: MosaicComposerModule;
  onSelect: () => void;
  onRemove: () => void;
}

function ModuleSlot({ label, sublabel, module, onSelect, onRemove }: ModuleSlotProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="p-4">
        {module ? (
          <div className="flex min-h-[72px] items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
            {module.icon && (
              <span className="mt-0.5 shrink-0 text-xl" aria-hidden="true">
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
              {module.detail && (
                <p className="mt-1 text-xs text-muted-foreground/70 truncate">{module.detail}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onSelect}
                aria-label={`Edit ${label}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                aria-label={`Remove ${label}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            aria-label={`Select ${label}`}
            className="flex w-full min-h-[72px] items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
 * MosaicAgentComposerDesktop — two-column composer (desktop half of responsive pair).
 * Share the same props contract with MosaicAgentComposerMobile.
 * Use MosaicAgentComposer orchestrator to select the right variant automatically.
 */
export function MosaicAgentComposerDesktop({
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
  labels,
  agentNameLabel,
  agentNamePlaceholder,
  instructionsPlaceholder,
  modelDescriptionLabel,
  recommendedBadgeLabel,
  livePreviewHeading,
  livePreviewSubheading,
  previewConfigLabel,
  customInstructionsPreviewLabel,
  selectAllModulesLabel,
  unnamedAgentLabel,
  roleSublabel,
  personaSublabel,
  frameworkSublabel,
}: MosaicAgentComposerDesktopProps) {
  // `labels` is fully required — every field is host-supplied, no default,
  // no fallback. Aliased to `L` only for call-site brevity below.
  const L = labels;

  const allModulesSelected =
    !!selectedRole && !!selectedPersona && !!selectedFramework && !!selectedModel;

  return (
    <div data-slot="agent-composer-desktop" className="grid h-full grid-cols-2 gap-6">
      {/* Left — form */}
      <div className="space-y-5 overflow-y-auto pr-3">
        {/* Heading */}
        <div className="flex items-center gap-2">
          <SparklesIcon />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {isEditMode ? L.headingEdit : L.heading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? L.subheadingEdit : L.subheading}
            </p>
          </div>
        </div>

        <hr className="border-border" />

        {/* Agent Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="mosaic-composer-name"
            className="block text-sm font-medium text-foreground"
          >
            {agentNameLabel}
          </label>
          <input
            id="mosaic-composer-name"
            type="text"
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
            placeholder={agentNamePlaceholder}
            className={cn(
              "flex min-h-[48px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors",
            )}
          />
        </div>

        {/* Module slots */}
        <ModuleSlot
          label={L.role}
          sublabel={roleSublabel}
          module={selectedRole}
          onSelect={onSelectRole}
          onRemove={onRemoveRole}
        />
        <ModuleSlot
          label={L.persona}
          sublabel={personaSublabel}
          module={selectedPersona}
          onSelect={onSelectPersona}
          onRemove={onRemovePersona}
        />
        <ModuleSlot
          label={L.framework}
          sublabel={frameworkSublabel}
          module={selectedFramework}
          onSelect={onSelectFramework}
          onRemove={onRemoveFramework}
        />

        {/* Model slot */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 pt-4 pb-3">
            <h3 className="text-sm font-semibold text-foreground">{L.model}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{modelDescriptionLabel}</p>
          </div>
          <div className="p-4">
            {selectedModel ? (
              <div className="space-y-3">
                <div className="flex min-h-[72px] items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{selectedModel.name}</p>
                      {selectedModel.recommended && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
                  className="flex w-full min-h-[44px] items-center justify-center rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Change {L.model}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSelectModel}
                aria-label={`Select ${L.model}`}
                className="flex w-full min-h-[72px] items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlusIcon />
                Select {L.model}
              </button>
            )}
          </div>
        </div>

        {/* Custom instructions */}
        <div className="space-y-1.5">
          <label
            htmlFor="mosaic-composer-instructions"
            className="block text-sm font-medium text-foreground"
          >
            {L.customInstructions}
          </label>
          <textarea
            id="mosaic-composer-instructions"
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            placeholder={instructionsPlaceholder}
            rows={5}
            className={cn(
              "flex w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "min-h-[120px] transition-colors",
            )}
          />
        </div>
      </div>

      {/* Right — live preview */}
      <div className="flex flex-col gap-5 border-l border-border pl-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{livePreviewHeading}</h2>
          <p className="text-sm text-muted-foreground">{livePreviewSubheading}</p>
        </div>

        <hr className="border-border" />

        {allModulesSelected ? (
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <h3 className="font-semibold text-foreground">{agentName || unnamedAgentLabel}</h3>
            <p className="text-xs text-muted-foreground">{previewConfigLabel}</p>
            <hr className="border-border" />
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {L.role}: {selectedRole?.name}
                </p>
                {selectedRole?.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedRole?.description}
                  </p>
                )}
              </div>
              <hr className="border-border" />
              <div>
                <p className="font-medium text-foreground">
                  {L.persona}: {selectedPersona?.name}
                </p>
                {selectedPersona?.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPersona?.description}
                  </p>
                )}
              </div>
              <hr className="border-border" />
              <div>
                <p className="font-medium text-foreground">
                  {L.framework}: {selectedFramework?.name}
                </p>
                {selectedFramework?.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedFramework?.description}
                  </p>
                )}
              </div>
              <hr className="border-border" />
              <div>
                <p className="font-medium text-foreground">
                  {L.model}: {selectedModel?.name}
                </p>
                {selectedModel?.provider && (
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {selectedModel?.provider}
                  </p>
                )}
              </div>
              {customInstructions && (
                <>
                  <hr className="border-border" />
                  <div>
                    <p className="font-medium text-foreground">{customInstructionsPreviewLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{customInstructions}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="space-y-2">
              <SparklesIcon />
              <p className="text-sm text-muted-foreground">{selectAllModulesLabel}</p>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className={cn("flex gap-2", isEditMode && onCancel ? "flex-row" : "flex-col")}>
          {isEditMode && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex flex-1 min-h-[48px] items-center justify-center rounded-lg border border-border bg-transparent text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {L.cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className={cn(
              "flex min-h-[48px] items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isEditMode && onCancel ? "flex-1" : "w-full",
            )}
          >
            {isEditMode ? (
              <>
                <SaveIcon />
                {L.saveLabel}
              </>
            ) : (
              <>
                <SparklesIcon />
                {L.saveLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

MosaicAgentComposerDesktop.displayName = "MosaicAgentComposerDesktop";
