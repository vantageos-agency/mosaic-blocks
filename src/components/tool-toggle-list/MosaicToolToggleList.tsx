/**
 * MosaicToolToggleList — presentational per-tool enable switch + approval
 * level selector, grouped into host-supplied sections.
 *
 * Differentiator (this is the whole point of the component): the tool
 * catalogue is DATA, not code. adam's `AgentForm.svelte` (builder-web)
 * hardcodes six tool checkboxes with zero approval concept
 * (`~/AgentForm.svelte:49-56,177-190`); this library has never heard of a
 * single tool name. `tools`, `approvalLevels` and `sections` are all
 * required props supplied by the host — a new tool, a renamed approval
 * level, or a reshuffled "Teamwork" section ships without touching this
 * package.
 *
 * One row per tool: name + description + enable/disable MosaicSwitch +
 * approval-level MosaicSelect-style combobox (built directly on
 * @base-ui/react/select here, same primitive as MosaicSelect, to keep the
 * per-row aria-label wiring local). Rows are grouped under host-supplied
 * section headings (`sections[].title`), each section listing the
 * `toolIds` it owns — the grouping shape itself (e.g. a "Teamwork" section
 * bundling the four VantagePeers tools) is a hosting decision, not a
 * library concept.
 *
 * Controlled component: no internal persisted state beyond the CHANGE
 * event flowing straight to `onToggleTool` / `onChangeApproval`. The host
 * owns `tools` and re-renders with the updated `enabled` /
 * `approvalLevelId` after handling the callback.
 *
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted, --muted-foreground, --border,
 * --card, --background, --popover, --popover-foreground, --accent,
 * --accent-foreground, --ring.
 * a11y: each switch's accessible name is a required per-tool callback
 * prop (`toggleAriaLabel`); each approval selector's accessible name is
 * likewise a required per-tool callback prop (`approvalSelectAriaLabel`).
 * Approval options render with role="option" (base-ui Select.Item), the
 * trigger with role="combobox" — both managed by @base-ui/react/select.
 * Bilingual: every user-facing string (section titles, tool names/
 * descriptions, approval-level labels, aria-labels) is host-supplied data
 * or a required prop — zero hardcoded copy, zero default.
 *
 * @example
 * <MosaicToolToggleList
 *   sections={[
 *     { id: "teamwork", title: "Travail d'équipe", toolIds: ["send_message", "check_messages"] },
 *   ]}
 *   tools={[
 *     { id: "send_message", name: "send_message", description: "Envoyer un message", enabled: true, approvalLevelId: "never" },
 *     { id: "check_messages", name: "check_messages", description: "Vérifier les messages", enabled: false, approvalLevelId: "always" },
 *   ]}
 *   approvalLevels={[
 *     { id: "never", label: "Ne jamais demander" },
 *     { id: "always", label: "Demander à chaque appel" },
 *     { id: "first", label: "Demander la première fois" },
 *   ]}
 *   onToggleTool={(toolId, enabled) => updateTool(toolId, { enabled })}
 *   onChangeApproval={(toolId, levelId) => updateTool(toolId, { approvalLevelId: levelId })}
 *   toggleAriaLabel={(toolName) => `Activer/désactiver ${toolName}`}
 *   approvalSelectAriaLabel={(toolName) => `Niveau d'approbation pour ${toolName}`}
 * />
 */

import { Select } from "@base-ui/react/select";
import { Switch } from "@base-ui/react/switch";
import type * as React from "react";
import {
  toolToggleListRowVariants,
  toolToggleListSectionVariants,
} from "./tool-toggle-list-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** One selectable approval level. Labels are host copy — no built-in set. */
export interface MosaicToolToggleListApprovalLevel {
  /** Stable identifier, matched against `tool.approvalLevelId`. */
  id: string;
  /** Host-supplied, host-localized display label. */
  label: string;
}

/** One tool row's data. The library knows nothing about any tool by name. */
export interface MosaicToolToggleListTool {
  /** Stable identifier, also referenced by `sections[].toolIds`. */
  id: string;
  /** Host-supplied display name (e.g. an MCP tool name). */
  name: string;
  /** Host-supplied short description of what the tool does. */
  description: string;
  /** Whether the tool is currently enabled. */
  enabled: boolean;
  /** Current approval level, matched against `approvalLevels[].id`. */
  approvalLevelId: string;
}

/**
 * A host-defined grouping of tools (e.g. "Teamwork" bundling the
 * VantagePeers tools). The section title and the grouping itself are
 * data — the library renders whatever grouping it is given.
 */
export interface MosaicToolToggleListSection {
  /** Stable identifier for the section. */
  id: string;
  /** Host-supplied, host-localized section heading. */
  title: string;
  /** Ordered ids of the tools that belong to this section. */
  toolIds: string[];
}

export interface MosaicToolToggleListProps {
  /** Host-defined groupings of tools, rendered in order. */
  sections: MosaicToolToggleListSection[];
  /** Full open catalogue of tools — a PROP, never a library constant. */
  tools: MosaicToolToggleListTool[];
  /** Open catalogue of approval levels — a PROP, never a library constant. */
  approvalLevels: MosaicToolToggleListApprovalLevel[];
  /** Called when a tool's enable switch is toggled. */
  onToggleTool: (toolId: string, enabled: boolean) => void;
  /** Called when a tool's approval level is changed. */
  onChangeApproval: (toolId: string, approvalLevelId: string) => void;
  /** Per-tool accessible name for the enable/disable switch. Required, no default. */
  toggleAriaLabel: (toolName: string) => string;
  /** Per-tool accessible name for the approval-level selector. Required, no default. */
  approvalSelectAriaLabel: (toolName: string) => string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicToolToggleList — production tool-permissions atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders one row per tool (switch + approval
 * selector), grouped under host-supplied section headings, and reports
 * every change via callbacks. No network call, no internal persisted
 * state, no hardcoded tool catalogue.
 */
export function MosaicToolToggleList({
  sections,
  tools,
  approvalLevels,
  onToggleTool,
  onChangeApproval,
  toggleAriaLabel,
  approvalSelectAriaLabel,
  className,
  ref,
}: MosaicToolToggleListProps) {
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
  const approvalLabelById = new Map(approvalLevels.map((level) => [level.id, level.label]));

  return (
    <div ref={ref} data-slot="tool-toggle-list" className={cn("flex flex-col gap-6", className)}>
      {sections.map((section) => (
        <div
          key={section.id}
          data-slot="tool-toggle-list-section"
          className={toolToggleListSectionVariants()}
        >
          <h3
            data-slot="tool-toggle-list-section-title"
            className="text-sm font-semibold text-foreground"
          >
            {section.title}
          </h3>
          {section.toolIds.map((toolId) => {
            const tool = toolsById.get(toolId);
            if (!tool) return null;
            return (
              <div
                key={tool.id}
                data-slot="tool-toggle-list-row"
                className={toolToggleListRowVariants({ enabled: tool.enabled })}
              >
                <div className="flex items-center gap-3">
                  <Switch.Root
                    checked={tool.enabled}
                    onCheckedChange={(checked) => onToggleTool(tool.id, checked)}
                    aria-label={toggleAriaLabel(tool.name)}
                    data-slot="tool-toggle-list-switch"
                    className={cn(
                      "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center",
                      "rounded-full border-2 border-transparent outline-none",
                      "bg-muted transition-colors",
                      "data-[checked]:bg-foreground",
                      "focus-visible:ring-ring focus-visible:ring-[3px]",
                    )}
                  >
                    <Switch.Thumb
                      data-slot="tool-toggle-list-switch-thumb"
                      className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full",
                        "bg-background shadow-sm",
                        "translate-x-0 transition-transform",
                        "data-[checked]:translate-x-5",
                      )}
                    />
                  </Switch.Root>
                  <div className="flex flex-col gap-0.5">
                    <span
                      data-slot="tool-toggle-list-name"
                      className="text-sm font-medium text-foreground"
                    >
                      {tool.name}
                    </span>
                    <span
                      data-slot="tool-toggle-list-description"
                      className="text-sm text-muted-foreground"
                    >
                      {tool.description}
                    </span>
                  </div>
                </div>

                <Select.Root
                  value={tool.approvalLevelId}
                  onValueChange={(value) => {
                    if (value !== null) onChangeApproval(tool.id, value);
                  }}
                >
                  <Select.Trigger
                    aria-label={approvalSelectAriaLabel(tool.name)}
                    data-slot="tool-toggle-list-approval-trigger"
                    className={cn(
                      "inline-flex h-9 min-w-[10rem] items-center justify-between gap-2",
                      "rounded-md border border-border bg-background px-3 py-2",
                      "text-sm text-foreground shadow-xs outline-none",
                      "hover:bg-muted",
                      "focus-visible:ring-ring focus-visible:ring-[3px]",
                      "data-[popup-open]:ring-ring data-[popup-open]:ring-[3px]",
                    )}
                  >
                    <Select.Value>
                      {(val: string | null) => (val != null ? approvalLabelById.get(val) : "")}
                    </Select.Value>
                    <Select.Icon className="size-4 shrink-0 text-muted-foreground">
                      <ChevronDownIcon />
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Positioner sideOffset={4}>
                      <Select.Popup
                        data-slot="tool-toggle-list-approval-popup"
                        className={cn(
                          "z-50 min-w-[10rem] overflow-hidden rounded-md border border-border",
                          "bg-popover p-1 text-popover-foreground shadow-md",
                          "origin-[var(--transform-origin)]",
                          "transition-[transform,scale,opacity]",
                          "data-[open]:scale-100 data-[open]:opacity-100",
                          "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                          "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                        )}
                      >
                        <Select.List>
                          {approvalLevels.map((level) => (
                            <Select.Item
                              key={level.id}
                              value={level.id}
                              className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5",
                                "text-sm text-popover-foreground outline-none",
                                "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                                "data-[selected]:font-medium",
                              )}
                            >
                              <Select.ItemText>{level.label}</Select.ItemText>
                              <Select.ItemIndicator className="ml-auto size-4">
                                <CheckIcon />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.List>
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

MosaicToolToggleList.displayName = "MosaicToolToggleList";

// ── Icons (inline SVG — zero dependency) ──────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
