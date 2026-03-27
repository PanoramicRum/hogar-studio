import { loadAllPackages } from "./loader";
import type { LoadedPackage, LoadedStyle, LoadedFurniture, PackageRegistry } from "./types";

// Loaded once at module init
let _packages: LoadedPackage[] | null = null;
let _styles: LoadedStyle[] | null = null;
let _furniture: LoadedFurniture[] | null = null;

function ensureLoaded() {
  if (_packages) return;

  _packages = loadAllPackages();
  _styles = [];
  _furniture = [];

  for (const pkg of _packages) {
    if (pkg.styles) {
      for (const s of pkg.styles) {
        _styles.push({ ...s, packageId: pkg.id });
      }
    }
    if (pkg.furniture) {
      for (const f of pkg.furniture) {
        _furniture.push({ ...f, packageId: pkg.id });
      }
    }
  }
}

export function getInstalledPackages(): LoadedPackage[] {
  ensureLoaded();
  return _packages!;
}

export function getAllStyles(): LoadedStyle[] {
  ensureLoaded();
  return _styles!;
}

export function getStyleById(id: string): LoadedStyle | undefined {
  ensureLoaded();
  return _styles!.find((s) => s.id === id);
}

export function getAllFurnitureTypes(): LoadedFurniture[] {
  ensureLoaded();
  return _furniture!;
}

export function getFurnitureType(type: string): LoadedFurniture | undefined {
  ensureLoaded();
  return _furniture!.find((f) => f.type === type);
}

export function getFurnitureColor(type: string): string {
  return getFurnitureType(type)?.color ?? "#6b7280";
}

export function getFurnitureHeight(type: string): number {
  return getFurnitureType(type)?.height3d ?? 0.6;
}

export function getPackageRegistry(): PackageRegistry {
  ensureLoaded();
  return { styles: _styles!, furniture: _furniture! };
}
