import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDesignImage, type AIProvider } from "@/lib/ai-providers";
import { getUserKeys } from "@/lib/ai-keys";
import { getStyleById } from "@/lib/packages/registry";
import { uploadFile } from "@/lib/s3";

const PERSPECTIVE_PROMPTS: Record<string, string> = {
  "eye-level": "eye-level view at 1.6 meters height, standing perspective, realistic interior photograph",
  "overhead": "overhead bird's eye view looking down, top-down architectural visualization",
  "corner": "wide-angle view from the room corner, showing two walls and the full room layout",
  "window": "view from the window looking into the room, natural light streaming in",
  "doorway": "view entering through the doorway, showing the room ahead, welcoming perspective",
  "detail": "close-up detail shot of the furniture arrangement, shallow depth of field, interior design photography",
};

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { designFileId, projectId, roomName, perspective, style, customPrompt, sourceImageUrl, provider } = await request.json();

  if (!designFileId || !sourceImageUrl) {
    return NextResponse.json({ error: "designFileId and sourceImageUrl required" }, { status: 400 });
  }

  // Build the prompt
  const styleData = getStyleById(style);
  const basePrompt = customPrompt || styleData?.prompt || "modern interior design, professional photography";
  const perspectiveDesc = PERSPECTIVE_PROMPTS[perspective] || PERSPECTIVE_PROMPTS["eye-level"];
  const roomDesc = roomName ? `${roomName} room, ` : "";

  const fullPrompt = `${roomDesc}${basePrompt}, ${perspectiveDesc}`;
  const negativePrompt = styleData?.negativePrompt || "blurry, distorted, low quality";

  // Update design file status
  if (!isGuestMode) {
    await prisma.designFile.update({
      where: { id: designFileId },
      data: { status: "GENERATING" },
    });
  }

  try {
    // Load user keys
    if (session?.user?.id) {
      const keys = await getUserKeys(session.user.id);
      if (keys.gemini) process.env.GEMINI_API_KEY = keys.gemini;
      if (keys.openai) process.env.OPENAI_API_KEY = keys.openai;
      if (keys.anthropic) process.env.ANTHROPIC_API_KEY = keys.anthropic;
      if (keys.replicate) process.env.REPLICATE_API_TOKEN = keys.replicate;
    }

    const result = await generateDesignImage({
      imageUrl: sourceImageUrl,
      prompt: fullPrompt,
      negativePrompt,
      provider: provider as AIProvider | undefined,
    });

    // Store result
    const response = await fetch(result.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `projects/${projectId}/renders/${Date.now()}-${perspective || "default"}.jpg`;
    const storedUrl = await uploadFile(buffer, key, "image/jpeg");

    let render = null;
    if (!isGuestMode) {
      render = await prisma.designRender.create({
        data: {
          designFileId,
          imageUrl: storedUrl,
          prompt: fullPrompt,
          modelUsed: `${result.provider}/${result.model}`,
          roomName: roomName || null,
          perspective: perspective || null,
          parameters: { provider: result.provider },
        },
      });

      await prisma.designFile.update({
        where: { id: designFileId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({
      imageUrl: storedUrl,
      roomName,
      perspective,
      prompt: fullPrompt,
      modelUsed: `${result.provider}/${result.model}`,
      id: render?.id || `guest-${Date.now()}`,
    });
  } catch (error) {
    if (!isGuestMode) {
      await prisma.designFile.update({
        where: { id: designFileId },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
