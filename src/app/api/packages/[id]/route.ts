import { NextResponse } from "next/server";
import { getInstalledPackages } from "@/lib/packages/registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pkg = getInstalledPackages().find((p) => p.id === id);

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  return NextResponse.json(pkg);
}
