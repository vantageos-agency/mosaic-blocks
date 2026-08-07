/**
 * MosaicArtifactChart — dumb, contract-agnostic chart artifact renderer
 *
 * Renders a normalized chart artifact payload with Recharts (already the
 * charting library mosaic-blocks standardizes on). Owns no knowledge of its
 * runtime source (@ai-sdk-tools/artifacts vs the MCP Apps ui:// bridge); it
 * consumes the same `data` shape either source normalizes to.
 *
 * Read-only presentation. Ported from any-debate-ai's ChartArtifact,
 * stripped of the type-switcher/refresh/download toolbar to keep this a
 * pure render component, per the C1 adapter contract.
 *
 * `recharts` is an OPTIONAL peer dependency (see package.json
 * peerDependenciesMeta) — only hosts rendering chart artifacts need it
 * installed.
 *
 * data-slot="artifact-chart" on the root.
 *
 * i18n: zero hardcoded user-facing strings — every label is a required
 * prop (mosaic-blocks doctrine, see src/__tests__/i18n-no-hardcoded-literals.test.ts).
 */

import type * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const CHART_COLORS = [
  "var(--color-chart-1, #8884d8)",
  "var(--color-chart-2, #82ca9d)",
  "var(--color-chart-3, #ffc658)",
  "var(--color-chart-4, #ff7300)",
  "var(--color-chart-5, #00c2ff)",
];

// ── Data shape ────────────────────────────────────────────────────────────────

export type MosaicArtifactChartType = "bar" | "line" | "pie";

export interface MosaicArtifactChartConfig {
  xAxis?: string;
  colors?: string[];
  legend?: boolean;
  grid?: boolean;
}

export interface MosaicArtifactChartData {
  title: string;
  type: MosaicArtifactChartType;
  data: Record<string, unknown>[];
  config?: MosaicArtifactChartConfig;
  metadata?: {
    dataSource?: string;
    description?: string;
  };
}

export interface MosaicArtifactChartLabels {
  /** Formats the chart-type badge, e.g. (type) => `${type} Chart`. */
  typeBadgeLabel: (type: MosaicArtifactChartType) => string;
  /** Formats the point-count badge, e.g. (n) => `${n} points`. */
  pointsLabel: (count: number) => string;
  /** Shown when `data.type` is not one of bar/line/pie. */
  unsupportedTypeMessage: (type: string) => string;
}

export interface MosaicArtifactChartProps {
  data: MosaicArtifactChartData;
  labels: MosaicArtifactChartLabels;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Render helpers ────────────────────────────────────────────────────────────

function seriesKeys(rows: Record<string, unknown>[], xAxisKey: string): string[] {
  return Object.keys(rows[0] ?? {}).filter((key) => key !== xAxisKey);
}

function renderChart(
  data: MosaicArtifactChartData,
  labels: MosaicArtifactChartLabels,
): React.ReactNode {
  const xAxisKey = data.config?.xAxis ?? Object.keys(data.data[0] ?? {})[0] ?? "";
  const colors = data.config?.colors ?? CHART_COLORS;

  if (data.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {data.config?.grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {data.config?.legend && <Legend />}
          {seriesKeys(data.data, xAxisKey).map((key, index) => (
            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (data.type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {data.config?.grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {data.config?.legend && <Legend />}
          {seriesKeys(data.data, xAxisKey).map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (data.type === "pie") {
    const nameKey = Object.keys(data.data[0] ?? {})[0] ?? "name";
    const valueKey = Object.keys(data.data[0] ?? {})[1] ?? "value";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data.data} cx="50%" cy="50%" outerRadius={80} dataKey={valueKey}>
            {data.data.map((entry, index) => (
              <Cell key={String(entry[nameKey] ?? index)} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          {data.config?.legend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
      {labels.unsupportedTypeMessage(data.type)}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicArtifactChart — read-only chart artifact renderer (bar/line/pie).
 *
 * @example
 * <MosaicArtifactChart
 *   data={{ title: "Q3 revenue", type: "bar", data: [{ month: "Jul", value: 100 }] }}
 *   labels={{
 *     typeBadgeLabel: (t) => `${t} Chart`,
 *     pointsLabel: (n) => `${n} points`,
 *     unsupportedTypeMessage: (t) => `Unsupported chart type: ${t}`,
 *   }}
 * />
 */
export function MosaicArtifactChart({ data, labels, className, ref }: MosaicArtifactChartProps) {
  return (
    <div
      ref={ref}
      data-slot="artifact-chart"
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <h3 className="font-medium text-base">{data.title}</h3>
        <span
          data-slot="artifact-chart-type-badge"
          className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
        >
          {labels.typeBadgeLabel(data.type)}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
          {labels.pointsLabel(data.data.length)}
        </span>
      </div>

      <div className="min-h-64 flex-1 p-6">{renderChart(data, labels)}</div>

      {(data.metadata?.dataSource || data.metadata?.description) && (
        <div className="border-border border-t px-4 py-3">
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            {data.metadata?.dataSource && <span>{data.metadata.dataSource}</span>}
            {data.metadata?.description && <span>{data.metadata.description}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

MosaicArtifactChart.displayName = "MosaicArtifactChart";
