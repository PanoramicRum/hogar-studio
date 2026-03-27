import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeFloorPlan } from "@/lib/gemini";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await request.json();

  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  const image = await prisma.projectImage.findFirst({
    where: {
      id: imageId,
      project: { userId: session.user.id },
    },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    // Fetch image and convert to base64
    const response = await fetch(image.url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Analyze with Gemini
    const analysis = await analyzeFloorPlan(base64);

    // Store analysis in image metadata
    await prisma.projectImage.update({
      where: { id: imageId },
      data: {
        metadata: JSON.parse(JSON.stringify({
          ...(image.metadata as Record<string, unknown> || {}),
          analysis,
        })),
      },
    });

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
