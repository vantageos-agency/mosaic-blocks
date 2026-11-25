/** Hand-authored declarations for registry-json-derive.mjs (see docs-counts-shared.d.mts). */
export function parseBarrelExports(
  src?: string,
  label?: string,
): Array<{ name: string; dir: string; file: string; isType: boolean }>;
export function parseSurfaceExports(
  root?: string,
): Array<{ name: string; dir: string; file: string; isType: boolean }>;
export function eligibleDependencies(pkgJson: {
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}): Set<string>;
export function dependenciesOfFiles(absPaths: string[], eligible: Set<string>): string[];
