import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/ai-providers";

export async function GET(request: Request) {
  // Allow guest access (no auth required for listing providers)
  return NextResponse.json(getAvailableProviders());
}
