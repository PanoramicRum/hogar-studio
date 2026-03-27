import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDesignImage, type AIProvider } from "@/lib/ai-providers";
import { getUserKeys } from "@/lib/ai-keys";
import { getStyleById } from "@/lib/packages/registry";
import { uploadFile } from "@/lib/s3";

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, designFileId, roomName, style, customPrompt, sourceImageUrl, provider } = await request.json();

  if (!sourceImageUrl) {
    return NextResponse.json({ error: "sourceImageUrl required" }, { status: 400 });
  }

  const styleData = getStyleById(style);
  const basePrompt = customPrompt || styleData?.prompt || "modern interior design";
  const roomDesc = roomName ? `${roomName}, ` : "";

  const fullPrompt = `equirectangular 360 degree panorama of ${roomDesc}${basePrompt}, seamless edges for spherical projection, photorealistic interior design visualization, ultra wide angle, complete room view`;

  try {
    if (session?.user?.id) {
      const keys = await getUserKeys(session.user.id);
      if (keys.gemini) process.env.GEMINI_API_KEY = keys.gemini;
      if (keys.openai) process.env.OPENAI_API_KEY = keys.openai;
      if (keys.replicate) process.env.REPLICATE_API_TOKEN = keys.replicate;
    }

    const result = await generateDesignImage({
      imageUrl: sourceImageUrl,
      prompt: fullPrompt,
      negativePrompt: "cropped, partial view, borders, text, watermark, blurry",
      provider: provider as AIProvider | undefined,
    });

    const response = await fetch(result.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `projects/${projectId}/panoramas/${Date.now()}-360.jpg`;
    const storedUrl = await uploadFile(buffer, key, "image/jpeg");

    let render = null;
    if (!isGuestMode && designFileId) {
      render = await prisma.designRender.create({
        data: {
          designFileId,
          imageUrl: storedUrl,
          prompt: fullPrompt,
          modelUsed: `${result.provider}/${result.model}`,
          roomName: roomName || null,
          perspective: "360-panorama",
        },
      });
    }

    return NextResponse.json({
      imageUrl: storedUrl,
      roomName,
      perspective: "360-panorama",
      id: render?.id || `guest-${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Panorama generation failed" },
      { status: 500 }
    );
  }
}
