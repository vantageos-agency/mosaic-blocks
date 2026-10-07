/** Hand-authored declarations for build-registry-items.mjs (see registry-json-derive.d.mts). */
export interface RegistryItemSource {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  categories?: string[];
  files?: Array<{ path: string; type?: string }>;
}
export interface BuildContext {
  root?: string;
  pathToItem?: Map<string, string>;
}
export function deriveTarget(sourcePath: string): string;
export function findRelativeImports(source: string): string[];
export function buildPathIndex(items: RegistryItemSource[]): Map<string, string>;
export function buildItem(item: RegistryItemSource, ctx?: BuildContext): Record<string, unknown>;
export function serializeItem(built: Record<string, unknown>): string;
export function loadRegistry(): RegistryItemSource[];
export { globToRegExp, isShipped, NON_SHIPPED_MATCHERS } from "./non-shipped.mjs";
