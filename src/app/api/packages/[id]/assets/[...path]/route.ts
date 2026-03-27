import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getInstalledPackages } from "@/lib/packages/registry";
import { getPackageAssetPath } from "@/lib/packages/loader";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path: pathSegments } = await params;

  const pkg = getInstalledPackages().find((p) => p.id === id);
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const assetRelPath = pathSegments.join("/");
  const fullPath = getPackageAssetPath(pkg._dirName, assetRelPath);

  if (!fullPath) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(fullPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
