"use client";

/**
 * MosaicAgentBuilderModal — modal shell for composing/configuring an agent,
 * confirmed or cancelled by the host.
 *
 * Ported (shape only) from any-debate-ai's agent-builder modal pattern — no
 * business logic carried over: no field list, no model presets, no default
 * prompts. This component owns the dialog shell (backdrop, popup, title,
 * description, footer actions) only. The agent configuration form itself
 * (fields, values, validation) is entirely host-supplied via `children` —
 * see MosaicAgentEditor for a form that composes naturally inside it.
 *
 * Built on `@base-ui/react/dialog` (not `alert-dialog`): confirming a
 * composed agent is not a destructive action needing an `alertdialog` role,
 * so the plain Dialog primitive is the correct fit — same focus trap,
 * Escape-to-cancel, and background-inert behavior as `alert-dialog`.
 *
 * Fully host-controlled: `open` + `onOpenChange` come from the caller, the
 * component keeps no state of its own (cf. MosaicDrawer / MosaicAdaptiveModal
 * convention in this package).
 *
 * The confirm button does NOT auto-close the modal on click: creating an
 * agent is commonly asynchronous (a network call), so the host decides when
 * to flip `open` to `false` — typically only after the save succeeds. The
 * cancel button, however, always closes immediately (`Dialog.Close`) in
 * addition to notifying the host via `onCancel`.
 *
 * SIN-01: every visible string (`title`, `description`, `closeAriaLabel`,
 * `confirmLabel`, `cancelLabel`, `confirmingLabel`) is a REQUIRED prop with
 * no default — the library carries no copy, the host owns i18n.
 */

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";
import {
  agentBuilderModalBackdropVariants,
  agentBuilderModalPopupVariants,
} from "./agent-builder-modal-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicAgentBuilderModalProps {
  /** Controlled open state — the host owns the truth. */
  open: boolean;
  /** Controlled state setter, called on every open/close intent (including Escape and Cancel). */
  onOpenChange: (open: boolean) => void;

  /** Modal title, wired to `aria-labelledby`. Required — no default, no fallback. */
  title: string;
  /** Modal description, wired to `aria-describedby`. Required — no default, no fallback. */
  description: string;
  /** aria-label for the close (X) button. Required — the host owns the language. */
  closeAriaLabel: string;

  /** Confirm button label, shown when not confirming. Required — no default. */
  confirmLabel: string;
  /** Confirm button label, shown while `isConfirming` is true. Required — no default. */
  confirmingLabel: string;
  /** Cancel button label. Required — no default. */
  cancelLabel: string;

  /** Called when the confirm button is clicked and `canConfirm` is true. Does not close the modal. */
  onConfirm: () => void;
  /** Called when the cancel button is clicked, before the modal closes. */
  onCancel: () => void;
  /** Host decides whether the confirm action is currently allowed (e.g. form validity). */
  canConfirm: boolean;
  /** Host-controlled submission-in-flight state — disables confirm and swaps its label. */
  isConfirming: boolean;

  /** The agent configuration form/content — entirely host-owned. */
  children: React.ReactNode;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAgentBuilderModal — production agent-builder modal shell for
 * @vantageos/mosaic-blocks.
 *
 * @example
 * // Host owns i18n (e.g. next-intl) and the agent schema/config.
 * <MosaicAgentBuilderModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={t('AgentBuilder.title')}
 *   description={t('AgentBuilder.description')}
 *   closeAriaLabel={t('AgentBuilder.aria.close')}
 *   confirmLabel={t('AgentBuilder.confirm')}
 *   confirmingLabel={t('AgentBuilder.confirming')}
 *   cancelLabel={t('AgentBuilder.cancel')}
 *   onConfirm={handleCreate}
 *   onCancel={() => setOpen(false)}
 *   canConfirm={isValid}
 *   isConfirming={isSaving}
 * >
 *   <MosaicAgentEditor {...editorProps} /> // allow-hardcode-i18n: JSDoc @example doc comment, not shipped code
 * </MosaicAgentBuilderModal>
 */
export function MosaicAgentBuilderModal({
  open,
  onOpenChange,
  title,
  description,
  closeAriaLabel,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  canConfirm,
  isConfirming,
  children,
  className,
}: MosaicAgentBuilderModalProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  const confirmDisabled = !canConfirm || isConfirming;

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          data-slot="agent-builder-modal-backdrop"
          className={agentBuilderModalBackdropVariants()}
        />
        <Dialog.Popup
          data-slot="agent-builder-modal"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-modal="true"
          className={cn(agentBuilderModalPopupVariants(), className)}
        >
          <div
            data-slot="agent-builder-modal-header"
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

          <div data-slot="agent-builder-modal-body" className="min-h-0 flex-1 overflow-y-auto p-4">
            {children}
          </div>

          <div
            data-slot="agent-builder-modal-footer"
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
              onClick={handleConfirm}
              disabled={confirmDisabled}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4",
                "bg-primary text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {isConfirming ? confirmingLabel : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

MosaicAgentBuilderModal.displayName = "MosaicAgentBuilderModal";
