import type { RegistryItemSource } from "./build-registry-items.mjs";
export function checkDrift(opts?: {
  root?: string;
  items?: RegistryItemSource[];
  outDir?: string;
}): { checked: number; problems: string[] };
