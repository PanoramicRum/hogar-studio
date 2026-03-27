import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { digitizeFloorPlanWithProvider, type AIProvider } from "@/lib/ai-providers";
import { getUserKeys } from "@/lib/ai-keys";
import type { FloorPlanModel } from "@/types/floorplan";
import { makeId } from "@/lib/geometry";
import sharp from "sharp";

const ROOM_COLORS = [
  "#dbeafe", "#fef3c7", "#d1fae5", "#fce7f3", "#e0e7ff",
  "#fde68a", "#bbf7d0", "#fbcfe8", "#c7d2fe", "#fed7aa",
];

export async function POST(request: Request) {
  // Rate limit: 5 per minute
  const { rateLimit, getClientIP, rateLimitResponse } = await import("@/lib/rate-limit");
  const { allowed } = rateLimit(getClientIP(request), 5, 60000, "digitize");
  if (!allowed) return rateLimitResponse();

  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl, provider } = await request.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  try {
    // Convert public URL to internal Docker URL for fetching
    const internalUrl = imageUrl.replace(
      process.env.S3_PUBLIC_ENDPOINT || "http://localhost:9000",
      process.env.S3_ENDPOINT || "http://storage:9000"
    );

    // Fetch image
    const imageResponse = await fetch(internalUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 1000;
    const imgHeight = metadata.height || 1000;

    // Convert to base64
    const base64 = imageBuffer.toString("base64");

    // Load user keys and apply them as env vars for this request
    if (session?.user?.id) {
      const keys = await getUserKeys(session.user.id);
      if (keys.gemini) process.env.GEMINI_API_KEY = keys.gemini;
      if (keys.openai) process.env.OPENAI_API_KEY = keys.openai;
      if (keys.anthropic) process.env.ANTHROPIC_API_KEY = keys.anthropic;
    }

    // Call AI provider to digitize
    const raw = await digitizeFloorPlanWithProvider(base64, provider as AIProvider | undefined);

    // Scale normalized coordinates (0-1) to image pixel dimensions
    const model: FloorPlanModel = {
      wallHeight: raw.wallHeight || 2.8,
      walls: raw.walls.map((w, i) => ({
        id: makeId("wall"),
        start: { x: w.start.x * imgWidth, y: w.start.y * imgHeight },
        end: { x: w.end.x * imgWidth, y: w.end.y * imgHeight },
        thickness: 8,
        height: raw.wallHeight || 2.8,
      })),
      rooms: raw.rooms.map((r, i) => ({
        id: makeId("room"),
        name: r.name,
        points: r.points.map((p) => ({ x: p.x * imgWidth, y: p.y * imgHeight })),
        color: ROOM_COLORS[i % ROOM_COLORS.length],
      })),
      openings: raw.openings.map((o) => ({
        id: makeId("opening"),
        type: o.type,
        wallId: "", // will be set below
        position: o.position,
        width: o.width || 0.9,
        height: o.type === "door" ? 2.1 : o.type === "balcony" ? 2.2 : 1.2,
        sillHeight: o.type === "window" ? 0.9 : o.type === "balcony" ? 0 : undefined,
      })),
    };

    // Link openings to wall IDs
    for (let i = 0; i < model.openings.length; i++) {
      const wallIndex = raw.openings[i]?.wallIndex ?? 0;
      if (wallIndex < model.walls.length) {
        model.openings[i].wallId = model.walls[wallIndex].id;
      }
    }

    return NextResponse.json(model);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Digitization failed" },
      { status: 500 }
    );
  }
}
