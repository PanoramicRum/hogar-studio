import { NextResponse } from "next/server";
import { getPackageRegistry } from "@/lib/packages/registry";

export async function GET() {
  return NextResponse.json(getPackageRegistry());
}
