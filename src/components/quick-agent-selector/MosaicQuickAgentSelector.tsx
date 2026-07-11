"use client";

/**
 * MosaicQuickAgentSelector — compact agent picker with pill tags + add dropdown/drawer
 *
 * Ported from components/agent-management/QuickAgentSelector.tsx
 *
 * Features:
 * - Scrollable list of selected agent pills with remove button
 * - Desktop: dropdown panel
 * - Mobile: bottom drawer via MosaicAdaptiveModal
 * - "Create custom" action slot
 *
 * framer-motion replaced with CSS transitions.
 * sonner toast removed — actions are callbacks.
 * Drawer replaced with MosaicAdaptiveModal (wave-1 component).
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicQuickAgent {
  id: string;
  /** Display name */
  name: string;
  /** Short type key (e.g. "GPT-4") */
  type: string;
  /** Description shown in the picker list */
  description?: string;
  /** Tailwind bg class for the accent dot */
  accentColor?: string;
  isActive?: boolean;
}

export interface MosaicQuickAgentSelectorProps {
  /** Currently selected agents */
  selectedAgents: MosaicQuickAgent[];
  /** Available agents to pick from (already-selected ones hidden) */
  availableAgents?: MosaicQuickAgent[];
  onAddAgent: (agentId: string) => void;
  onRemoveAgent: (agentId: string) => void;
  /** Called when user clicks "Create custom" / "Configure" CTA */
  onOpenBuilder?: () => void;
  /** Max number of agents allowed */
  maxAgents?: number;
  /** Label for the add button */
  addLabel?: string;
  /** Label for the create-custom CTA */
  createLabel?: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  quickAddHeading: string;
  configureBehaviorCaption: string;
  noAgentsAvailableMessage: string;
  addAgentModalTitle: string;
  closeAriaLabel: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 20l.5-1.5L7 18l-1.5-.5L5 16l-.5 1.5L3 18l1.5.5z" />
    </svg>
  );
}

// ── Picker content ────────────────────────────────────────────────────────────

function PickerContent({
  available,
  onAdd,
  onOpenBuilder,
  createLabel,
  quickAddHeading,
  configureBehaviorCaption,
  noAgentsAvailableMessage,
}: {
  available: MosaicQuickAgent[];
  onAdd: (id: string) => void;
  onOpenBuilder?: () => void;
  createLabel: string;
  quickAddHeading: string;
  configureBehaviorCaption: string;
  noAgentsAvailableMessage: string;
}) {
  return (
    <div className="p-4">
      <h4 className="mb-3 font-medium text-foreground">{quickAddHeading}</h4>
      <div className="space-y-1">
        {available.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onAdd(agent.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {agent.accentColor && (
              <span
                className={cn("h-3 w-3 shrink-0 rounded-full", agent.accentColor)}
                aria-hidden="true"
              />
            )}
            <div className="text-left">
              <p className="font-medium">{agent.name}</p>
              {agent.description && (
                <p className="text-xs text-muted-foreground">{agent.description}</p>
              )}
            </div>
          </button>
        ))}

        {onOpenBuilder && (
          <div className="mt-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={onOpenBuilder}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <SparklesIcon />
              <div className="text-left">
                <p className="font-medium text-primary">{createLabel}</p>
                <p className="text-xs text-muted-foreground">{configureBehaviorCaption}</p>
              </div>
            </button>
          </div>
        )}

        {available.length === 0 && !onOpenBuilder && (
          <p className="px-3 py-2 text-sm text-muted-foreground">{noAgentsAvailableMessage}</p>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicQuickAgentSelector({
  selectedAgents,
  availableAgents = [],
  onAddAgent,
  onRemoveAgent,
  onOpenBuilder,
  maxAgents = 4,
  addLabel = "Add Agent",
  createLabel = "Create Custom Agent",
  quickAddHeading,
  configureBehaviorCaption,
  noAgentsAvailableMessage,
  addAgentModalTitle,
  closeAriaLabel,
  className,
}: MosaicQuickAgentSelectorProps) {
  const { isMobile } = useDevice();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  React.useEffect(() => {
    if (!pickerOpen || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [pickerOpen, isMobile]);

  const handleAdd = (id: string) => {
    onAddAgent(id);
    setPickerOpen(false);
  };

  const canAdd = selectedAgents.length < maxAgents;

  return (
    <div data-slot="quick-agent-selector" className={cn("flex items-center gap-2", className)}>
      {/* Selected agent pills */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {selectedAgents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-md border border-border bg-card",
              isMobile ? "px-2 py-1" : "px-3 py-1.5",
            )}
          >
            {agent.accentColor && (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", agent.accentColor)}
                aria-hidden="true"
              />
            )}
            <span className={cn("whitespace-nowrap font-medium", isMobile ? "text-xs" : "text-sm")}>
              {isMobile ? agent.type.split("-")[0] : agent.name}
            </span>
            <button
              type="button"
              onClick={() => onRemoveAgent(agent.id)}
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded",
                "text-muted-foreground hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isMobile ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100",
              )}
              aria-label={`Remove ${agent.name}`}
            >
              <XIcon />
            </button>
          </div>
        ))}
      </div>

      {/* Add button + picker */}
      {canAdd && (
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background",
              "px-3 py-1.5 text-sm font-medium text-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <PlusIcon />
            {!isMobile && addLabel}
          </button>

          {/* Desktop dropdown */}
          {!isMobile && pickerOpen && (
            <div
              className={cn(
                "absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border",
                "bg-popover shadow-lg",
              )}
            >
              <PickerContent
                available={availableAgents}
                onAdd={handleAdd}
                onOpenBuilder={
                  onOpenBuilder
                    ? () => {
                        onOpenBuilder();
                        setPickerOpen(false);
                      }
                    : undefined
                }
                createLabel={createLabel}
                quickAddHeading={quickAddHeading}
                configureBehaviorCaption={configureBehaviorCaption}
                noAgentsAvailableMessage={noAgentsAvailableMessage}
              />
            </div>
          )}

          {/* Mobile drawer */}
          {isMobile && (
            <MosaicAdaptiveModal
              isOpen={pickerOpen}
              onClose={() => setPickerOpen(false)}
              title={addAgentModalTitle}
              closeAriaLabel={closeAriaLabel}
            >
              <PickerContent
                available={availableAgents}
                onAdd={handleAdd}
                onOpenBuilder={
                  onOpenBuilder
                    ? () => {
                        onOpenBuilder();
                        setPickerOpen(false);
                      }
                    : undefined
                }
                createLabel={createLabel}
                quickAddHeading={quickAddHeading}
                configureBehaviorCaption={configureBehaviorCaption}
                noAgentsAvailableMessage={noAgentsAvailableMessage}
              />
            </MosaicAdaptiveModal>
          )}
        </div>
      )}

      {/* Count badge */}
      <span
        className={cn(
          "shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        )}
      >
        {selectedAgents.length}/{maxAgents}
      </span>
    </div>
  );
}

MosaicQuickAgentSelector.displayName = "MosaicQuickAgentSelector";
