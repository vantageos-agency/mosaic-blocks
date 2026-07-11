/**
 * MosaicStepPipeline — ordered stage progress pipeline
 *
 * Presentational atom. Renders an ordered sequence of stages with status each
 * (done / current / upcoming) and connector lines between them.
 * Supports horizontal (default) and vertical orientations.
 *
 * Pattern: Button.tsx (data-slot, inline cn, React 19 ref prop, displayName, JSDoc).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted, --muted-foreground, --border, --ring, --background.
 * No icon library — uses ✓ char for done steps, index+1 number for others.
 * a11y: ol/li semantics, aria-current="step" on current step.
 * Bilingual: all labels/descriptions are caller-provided (no hardcoded English).
 *
 * Closes issue #22 — mosaic-step-pipeline.
 *
 * @example
 * // Derive status from currentIndex
 * <MosaicStepPipeline
 *   steps={[
 *     { label: "Setup" },
 *     { label: "Configure" },
 *     { label: "Deploy" },
 *   ]}
 *   currentIndex={1}
 * />
 *
 * @example
 * // Explicit per-step status
 * <MosaicStepPipeline
 *   steps={[
 *     { label: "Étape 1", status: "done" },
 *     { label: "Étape 2", status: "current", description: "En cours…" },
 *     { label: "Étape 3", status: "upcoming" },
 *   ]}
 *   orientation="vertical"
 * />
 */

import type * as React from "react";
import {
  stepConnectorVariants,
  stepDescriptionVariants,
  stepIndicatorVariants,
  stepLabelVariants,
  stepPipelineVariants,
  stepSegmentBarVariants,
  stepSegmentVariants,
} from "./step-pipeline-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicStepStatus = "done" | "current" | "upcoming";

export interface MosaicStep {
  /** Optional stable id for React key. When absent, array index is used. */
  id?: string;
  /** Step label — ReactNode for i18n / rich content. Caller-provided. */
  label: React.ReactNode;
  /** Optional supporting description. Caller-provided. */
  description?: React.ReactNode;
  /**
   * Explicit step status. When absent on all steps, `currentIndex` derivation
   * is used: index < currentIndex → done, === current, > upcoming.
   */
  status?: MosaicStepStatus;
}

interface MosaicStepPipelineBaseProps {
  /** Ordered array of pipeline stages. */
  steps: MosaicStep[];
  /**
   * Active step index (0-based). Used to derive status when a step has no
   * explicit `status`. Ignored when all steps carry explicit status.
   * @default 0
   */
  currentIndex?: number;
  /** Additional Tailwind classes on the root element. */
  className?: string;
}

export interface MosaicStepPipelineDotsProps extends MosaicStepPipelineBaseProps {
  /**
   * Full dot-layout rendering (indicator + label + description per step).
   * @default "dots"
   */
  variant?: "dots";
  /**
   * Layout orientation. Only meaningful for `variant="dots"`.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /** React 19 ref prop — forwarded to the root <ol> element. */
  ref?: React.Ref<HTMLOListElement>;
}

export interface MosaicStepPipelineSegmentsProps extends MosaicStepPipelineBaseProps {
  /**
   * Compact horizontal progress-segment bar — colored segment fills only,
   * no dots and no step labels. Intended for space-constrained UIs (e.g.
   * mission cards) where a thin progress indicator is enough.
   */
  variant: "segments";
  /**
   * Accessible name for the segment bar (`aria-label`). Required — the
   * library ships zero user-facing strings; the host owns the copy and its
   * language.
   */
  progressAriaLabel: string;
  /**
   * Optional function producing the live `aria-valuetext` announced by
   * screen readers, e.g. `(current, total) => \`Étape ${current} sur ${total}\``.
   * When omitted, `progressAriaLabel` alone is used as the accessible name
   * and no `aria-valuetext` is set.
   */
  progressLabel?: (current: number, total: number) => string;
  /** React 19 ref prop — forwarded to the root segment-bar element. */
  ref?: React.Ref<HTMLDivElement>;
}

export type MosaicStepPipelineProps = MosaicStepPipelineDotsProps | MosaicStepPipelineSegmentsProps;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveStatus(step: MosaicStep, index: number, currentIndex: number): MosaicStepStatus {
  if (step.status !== undefined) return step.status;
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicStepPipeline — production step-pipeline atom for @vantageos/mosaic-blocks.
 *
 * Two rendering modes selected via `variant`:
 * - `"dots"` (default): full ordered stage progress with done/current/upcoming
 *   status, connector lines, horizontal and vertical orientations. Accessible
 *   via ol/li + aria-current.
 * - `"segments"`: compact horizontal progress-segment bar — colored fills
 *   only, no dots and no labels. Accessible via role="progressbar".
 */
export function MosaicStepPipeline(props: MosaicStepPipelineProps) {
  if (props.variant === "segments") {
    return <MosaicStepPipelineSegments {...props} />;
  }
  return <MosaicStepPipelineDots {...props} />;
}

MosaicStepPipeline.displayName = "MosaicStepPipeline";

/**
 * MosaicStepPipelineSegments — compact segment-bar rendering.
 *
 * Renders one filled/unfilled segment per step, no dots, no labels.
 * Accessible name via required `progressAriaLabel`; optional `progressLabel`
 * function drives the live `aria-valuetext`.
 */
function MosaicStepPipelineSegments({
  steps,
  currentIndex = 0,
  className,
  progressAriaLabel,
  progressLabel,
  ref,
}: MosaicStepPipelineSegmentsProps) {
  const total = steps.length;
  const current = steps.reduce((count, step, index) => {
    const status = resolveStatus(step, index, currentIndex);
    return status === "upcoming" ? count : count + 1;
  }, 0);

  return (
    <div
      ref={ref}
      data-slot="step-segment-bar"
      role="progressbar"
      // Non-interactive status indicator: not a tab stop, but still
      // programmatically focusable to satisfy a11y/useFocusableInteractive.
      tabIndex={-1}
      aria-label={progressAriaLabel}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={progressLabel ? progressLabel(current, total) : undefined}
      className={cn(stepSegmentBarVariants(), className)}
    >
      {steps.map((step, index) => {
        const status = resolveStatus(step, index, currentIndex);
        const filled = status !== "upcoming";
        const key = step.id !== undefined ? step.id : index;

        return (
          <div
            key={key}
            data-slot="step-segment"
            data-status={status}
            data-filled={filled}
            aria-hidden="true"
            className={cn(stepSegmentVariants({ filled }))}
          />
        );
      })}
    </div>
  );
}

MosaicStepPipelineSegments.displayName = "MosaicStepPipelineSegments";

/**
 * MosaicStepPipelineDots — full dot-layout rendering (default variant).
 *
 * Ordered stage progress with done/current/upcoming status, connector lines,
 * horizontal and vertical orientations. Accessible via ol/li + aria-current.
 */
function MosaicStepPipelineDots({
  steps,
  currentIndex = 0,
  orientation = "horizontal",
  className,
  ref,
}: MosaicStepPipelineDotsProps) {
  return (
    <ol
      ref={ref}
      data-slot="step-pipeline"
      className={cn(stepPipelineVariants({ orientation }), className)}
    >
      {steps.map((step, index) => {
        const status = resolveStatus(step, index, currentIndex);
        const isCurrent = status === "current";
        const isLast = index === steps.length - 1;
        // Key: use step.id when provided; fall back to index (safe — index is stable
        // for this ordered list, and step labels may repeat across pipelines)
        const key = step.id !== undefined ? step.id : index;

        return (
          <li
            key={key}
            data-slot="step"
            data-status={status}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex shrink-0",
              orientation === "horizontal"
                ? "flex-col items-center gap-2"
                : "flex-row items-start gap-3",
              orientation === "horizontal" && !isLast && "flex-1",
            )}
          >
            {/* Step row: indicator + connector (horizontal) or indicator + content (vertical) */}
            {orientation === "horizontal" ? (
              <>
                {/* Horizontal: indicator row with connectors flanking it */}
                <div className="flex w-full items-center">
                  {/* Left connector (not for first step) */}
                  {index > 0 && (
                    <div
                      data-slot="step-connector"
                      className={cn(stepConnectorVariants({ status, orientation }))}
                    />
                  )}
                  {/* Step indicator */}
                  <div
                    data-slot="step-indicator"
                    className={cn(stepIndicatorVariants({ status, orientation }))}
                    aria-hidden="true"
                  >
                    {status === "done" ? "✓" : <span>{index + 1}</span>}
                  </div>
                  {/* Right connector (not for last step) */}
                  {!isLast && (
                    <div
                      data-slot="step-connector"
                      className={cn(
                        stepConnectorVariants({
                          // connector after current step is still upcoming
                          status: status === "done" ? "done" : "upcoming",
                          orientation,
                        }),
                      )}
                    />
                  )}
                </div>
                {/* Label + description below indicator */}
                <div className="flex flex-col items-center gap-0.5 text-center px-1">
                  <span data-slot="step-label" className={cn(stepLabelVariants({ status }))}>
                    {step.label}
                  </span>
                  {step.description !== undefined && (
                    <span
                      data-slot="step-description"
                      className={cn(stepDescriptionVariants({ status }))}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Vertical: indicator column with connector below it */}
                <div className="flex flex-col items-center">
                  <div
                    data-slot="step-indicator"
                    className={cn(stepIndicatorVariants({ status, orientation }))}
                    aria-hidden="true"
                  >
                    {status === "done" ? "✓" : <span>{index + 1}</span>}
                  </div>
                  {!isLast && (
                    <div
                      data-slot="step-connector"
                      className={cn(
                        stepConnectorVariants({
                          status: status === "done" ? "done" : "upcoming",
                          orientation,
                        }),
                      )}
                    />
                  )}
                </div>
                {/* Label + description to the right */}
                <div className="flex flex-col gap-0.5 pt-1 pb-4">
                  <span data-slot="step-label" className={cn(stepLabelVariants({ status }))}>
                    {step.label}
                  </span>
                  {step.description !== undefined && (
                    <span
                      data-slot="step-description"
                      className={cn(stepDescriptionVariants({ status }))}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

MosaicStepPipelineDots.displayName = "MosaicStepPipelineDots";
