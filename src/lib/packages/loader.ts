import fs from "fs";
import path from "path";
import { hogarPackageSchema } from "./validation";
import type { LoadedPackage } from "./types";

const PACKAGES_DIR = path.resolve(process.cwd(), "packages");

export function loadAllPackages(): LoadedPackage[] {
  const packages: LoadedPackage[] = [];

  if (!fs.existsSync(PACKAGES_DIR)) return packages;

  const dirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const manifestPath = path.join(PACKAGES_DIR, dir.name, "hogar-package.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const parsed = hogarPackageSchema.parse(raw);
      packages.push({ ...parsed, _dirName: dir.name } as LoadedPackage);
    } catch (err) {
      console.warn(`[hogar-packages] Invalid package in ${dir.name}:`, err instanceof Error ? err.message : err);
    }
  }

  // Sort: _built-in first, then alphabetical
  packages.sort((a, b) => {
    if (a.id === "_built-in") return -1;
    if (b.id === "_built-in") return 1;
    return a.name.localeCompare(b.name);
  });

  return packages;
}

export function getPackageAssetPath(packageDirName: string, assetPath: string): string | null {
  const fullPath = path.join(PACKAGES_DIR, packageDirName, assetPath);
  // Prevent directory traversal
  if (!fullPath.startsWith(PACKAGES_DIR)) return null;
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}
