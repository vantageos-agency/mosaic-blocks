"use client";

/**
 * MosaicModelSelector — @base-ui/react Combobox primitive
 *
 * Ported from any-debate-ai components/agent-composer/ModelSelector.tsx.
 * (gh api repos/elpiarthera/any-debate-ai/contents/components/agent-composer/ModelSelector.tsx)
 *
 * The source component hard-coded AVAILABLE_MODELS + getRecommendedModels
 * from a local catalogue module. That catalogue is business knowledge that
 * changes independently of the library — it does NOT belong in
 * @vantageos/mosaic-blocks. This port strips it entirely: the host supplies
 * `models: MosaicModelOption[]`, the library only knows how to render and
 * navigate a list of options it is handed.
 *
 * Built on @base-ui/react/combobox (native in @base-ui/react@1.5.0).
 * Filtering via built-in useFilter with "contains" strategy (same recipe as
 * MosaicCombobox). Keyboard-accessible: ArrowDown/Up navigate, Enter selects,
 * Escape closes. Disabled options are visibly non-interactive
 * (aria-disabled) and never fire onValueChange.
 *
 * Controlled: `value` + `onValueChange` are owned by the host.
 * data-slot="model-selector" on the root wrapper.
 */

import { Combobox } from "@base-ui/react/combobox";
import * as React from "react";
import {
  modelSelectorItemVariants,
  modelSelectorTriggerVariants,
} from "./model-selector-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicModelOption {
  /** Unique identifier the host resolves back to its own model catalogue. */
  value: string;
  /** Display name (e.g. "GPT-5", "Claude Opus"). */
  label: string;
  /** Optional one-line description, supplied by the host. */
  description?: string;
  /** Optional meta line (e.g. context window / pricing), supplied by the host. */
  meta?: string;
  /** Optional badge text (e.g. "Recommended"), supplied by the host. */
  badge?: string;
  /** When true, the option is shown but cannot be selected. */
  disabled?: boolean;
}

export interface MosaicModelSelectorProps {
  /** The full list of selectable models. The library knows no model names — host-owned. */
  models: MosaicModelOption[];
  /** Controlled selected value. */
  value?: string;
  /** Callback fired when the host's selection should change. Never fires for disabled options. */
  onValueChange?: (value: string) => void;
  /**
   * Text shown in the trigger when no model is selected. Required — the
   * host owns the language (e.g. `t('ModelSelector.placeholder')`).
   */
  placeholder: string;
  /**
   * Message shown when no model matches the filter. Required — the host
   * owns the language. No default, no fallback.
   */
  emptyMessage: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicModelSelector — production model-picker atom for @vantageos/mosaic-blocks.
 *
 * The component owns zero model knowledge: `models` is supplied by the host,
 * filtered as the user types, and the selected id is surfaced through
 * `onValueChange`. All visible strings that are not per-model host data
 * (placeholder, emptyMessage) are required props with no default.
 *
 * @example
 * <MosaicModelSelector
 *   models={[{ value: "gpt-5", label: "GPT-5", description: "Flagship model" }]}
 *   value={selectedModel}
 *   onValueChange={setSelectedModel}
 *   placeholder={t('ModelSelector.placeholder')}
 *   emptyMessage={t('ModelSelector.empty')}
 * />
 */
export function MosaicModelSelector({
  models,
  value,
  onValueChange,
  placeholder,
  emptyMessage,
  disabled,
  name,
  className,
}: MosaicModelSelectorProps) {
  const [inputValue, setInputValue] = React.useState("");

  const filter = Combobox.useFilter({ sensitivity: "base" });

  const filteredModels = React.useMemo(() => {
    if (!inputValue) return models;
    return models.filter((model) => filter.contains(model.label, inputValue));
  }, [models, inputValue, filter]);

  const labelMap = React.useMemo(
    () => Object.fromEntries(models.map((model) => [model.value, model.label])),
    [models],
  );

  const handleValueChange = React.useCallback(
    (nextValue: unknown, eventDetails: unknown) => {
      if (typeof nextValue !== "string") return;
      const selected = models.find((model) => model.value === nextValue);
      if (!selected || selected.disabled) return;
      onValueChange?.(nextValue);
      void eventDetails;
    },
    [models, onValueChange],
  );

  return (
    <Combobox.Root
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
      onInputValueChange={setInputValue}
      autoHighlight
    >
      <div data-slot="model-selector" className={cn("relative w-full", className)}>
        <Combobox.Input
          placeholder={placeholder}
          className={modelSelectorTriggerVariants({ className })}
        />
        {value != null && value in labelMap && inputValue === "" && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground">
            {labelMap[value]}
          </span>
        )}

        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup
              className={cn(
                "z-50 min-w-[16rem] overflow-hidden rounded-md border border-border",
                "bg-popover p-1 text-popover-foreground shadow-md",
                "origin-[var(--transform-origin)]",
                "transition-[transform,scale,opacity]",
                "data-[open]:scale-100 data-[open]:opacity-100",
                "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              )}
            >
              <Combobox.List>
                {filteredModels.map((model) => (
                  <Combobox.Item
                    key={model.value}
                    value={model.value}
                    disabled={model.disabled}
                    className={modelSelectorItemVariants({ className: undefined })}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{model.label}</span>
                      {model.badge && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    )}
                    {model.meta && (
                      <span className="text-xs text-muted-foreground">{model.meta}</span>
                    )}
                  </Combobox.Item>
                ))}
                <Combobox.Empty className="py-2 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </Combobox.Empty>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}

MosaicModelSelector.displayName = "MosaicModelSelector";
