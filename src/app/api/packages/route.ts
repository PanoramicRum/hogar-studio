import { NextResponse } from "next/server";
import { getInstalledPackages } from "@/lib/packages/registry";

export async function GET() {
  const packages = getInstalledPackages();

  // Return metadata only (strip prompts for listing)
  const summary = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    type: pkg.type,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    previewImage: pkg.previewImage,
    tags: pkg.tags,
    styleCount: pkg.styles?.length || 0,
    furnitureCount: pkg.furniture?.length || 0,
  }));

  return NextResponse.json(summary);
}
