"use client";

/**
 * MosaicStageChart — pipeline-stage bar chart (Wave-1 T5, BLOCK 3)
 *
 * Pure SVG/CSS bars — deliberately dependency-free (no recharts) per task
 * scope: a per-stage bar chart with won/lost semantic coloring does not need
 * a charting library, and mosaic-blocks already treats recharts as a
 * genuinely optional peer (see MosaicArtifactChart) — this component never
 * requires it.
 *
 * Won/lost stages are colored via the shared success/danger token classes
 * (bg-success-500 / bg-danger-500) — never an inline literal — and carry a
 * `data-kind` attribute so a consumer or test can target them without
 * depending on the class string. The grow-in entry animation references the
 * shared T1 motion tokens (`--mosaic-motion-duration-entry` /
 * `-easing-entry`, `src/theme/depth.css`) — zeroed under
 * `prefers-reduced-motion: reduce` by depth.css itself, never a
 * component-local hardcoded duration.
 *
 * Accessibility: the bars are decorative (aria-hidden); the SAME numbers are
 * always exposed via a visually-hidden (`sr-only`) `<table>` with a required
 * caller-supplied caption — screen-reader users get the full dataset, not a
 * "see chart" dead end.
 *
 * data-slot="stage-chart" on the root, per docs/ARCHITECTURE.md § data-slot.
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframes (grow-in, transform-only — animates cleanly regardless of the
//    bar's final height, and never triggers layout thrash) ──────────────────

const ANIM_ID = "mosaic-stage-chart-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-stage-chart-grow {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }
    .mosaic-stage-chart-bar-grow {
      transform-origin: bottom;
      animation: mosaic-stage-chart-grow var(--mosaic-motion-duration-entry)
        var(--mosaic-motion-easing-entry);
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-stage-chart-bar-grow {
        animation: none;
        transform: none;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicStageChartStage {
  id: string;
  label: string;
  value: number;
  /** Semantic coloring — "won"/"lost" map to success/danger tokens. */
  kind?: "won" | "lost";
}

export interface MosaicStageChartProps {
  stages: MosaicStageChartStage[];
  /** Caption for the visually-hidden accessible fallback table. Required. */
  tableCaption: string;
  /** Formats a stage's raw value into caller-owned, localized display text. */
  valueLabel: (value: number) => string;
  /** Column header for the accessible fallback table's stage-name column. */
  stageColumnLabel: string;
  /** Column header for the accessible fallback table's value column. */
  valueColumnLabel: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const KIND_CLASS: Record<"won" | "lost" | "default", string> = {
  won: "bg-success-500",
  lost: "bg-danger-500",
  default: "bg-accent",
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicStageChart — one bar per pipeline stage, won/lost tokens, grow-in
 * entry animation, and an sr-only accessible table fallback.
 *
 * @example
 * <MosaicStageChart
 *   tableCaption="Pipeline commercial"
 *   valueLabel={(n) => `${n} dossiers`}
 *   stageColumnLabel="Étape"
 *   valueColumnLabel="Dossiers"
 *   stages={[
 *     { id: "prospect", label: "Prospect", value: 42 },
 *     { id: "gagne", label: "Gagné", value: 6, kind: "won" },
 *     { id: "perdu", label: "Perdu", value: 11, kind: "lost" },
 *   ]}
 * />
 */
export function MosaicStageChart({
  stages,
  tableCaption,
  valueLabel,
  stageColumnLabel,
  valueColumnLabel,
  className,
  ref,
}: MosaicStageChartProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div ref={ref} data-slot="stage-chart" className={cn("flex flex-col gap-4", className)}>
      <div aria-hidden="true" className="flex h-48 items-end gap-3 px-1">
        {stages.map((stage) => {
          const kind = stage.kind ?? "default";
          const heightPercent = (stage.value / max) * 100;
          return (
            <div
              key={stage.id}
              className="flex flex-1 flex-col items-center gap-2"
              style={{ height: "100%", justifyContent: "flex-end" }}
            >
              <div
                data-slot="stage-chart-bar"
                data-kind={kind}
                className={cn("mosaic-stage-chart-bar-grow w-full rounded-t-md", KIND_CLASS[kind])}
                style={{ height: `${heightPercent}%` }}
              />
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{stageColumnLabel}</th>
            <th scope="col">{valueColumnLabel}</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr key={stage.id}>
              <th scope="row">{stage.label}</th>
              <td>{valueLabel(stage.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

MosaicStageChart.displayName = "MosaicStageChart";
