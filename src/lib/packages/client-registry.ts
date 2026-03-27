import type { PackageRegistry } from "./types";

export type { PackageRegistry, LoadedStyle, LoadedFurniture } from "./types";

let cached: PackageRegistry | null = null;

export async function fetchPackageRegistry(): Promise<PackageRegistry> {
  if (cached) return cached;
  const res = await fetch("/api/packages/registry");
  cached = await res.json();
  return cached!;
}

export function clearRegistryCache() {
  cached = null;
}
