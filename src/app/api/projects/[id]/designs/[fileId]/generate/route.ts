import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDesignImage, type AIProvider } from "@/lib/ai-providers";
import { getUserKeys } from "@/lib/ai-keys";
import { getStyleById } from "@/lib/packages/registry";
import { uploadFile } from "@/lib/s3";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const { sourceImageUrl, customPrompt, provider } = await request.json();

  const designFile = await prisma.designFile.findFirst({
    where: { id: fileId, project: { id, userId: session.user.id } },
  });
  if (!designFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!sourceImageUrl) {
    return NextResponse.json({ error: "Source image URL required" }, { status: 400 });
  }

  // Set status to generating
  await prisma.designFile.update({
    where: { id: fileId },
    data: { status: "GENERATING" },
  });

  try {
    // Build prompt from style or custom
    const style = getStyleById(designFile.style);
    const prompt = customPrompt || style?.prompt || "modern interior design, professional photography";
    const negativePrompt = style?.negativePrompt || "blurry, distorted, low quality";

    const aiParams = (designFile.aiParams as Record<string, number> | null) || {};

    // Load user keys
    if (session?.user?.id) {
      const keys = await getUserKeys(session.user.id);
      if (keys.gemini) process.env.GEMINI_API_KEY = keys.gemini;
      if (keys.openai) process.env.OPENAI_API_KEY = keys.openai;
      if (keys.anthropic) process.env.ANTHROPIC_API_KEY = keys.anthropic;
      if (keys.replicate) process.env.REPLICATE_API_TOKEN = keys.replicate;
    }

    // Call AI provider (Replicate, OpenAI, or Local)
    const result = await generateDesignImage({
      imageUrl: sourceImageUrl,
      prompt,
      negativePrompt,
      strength: aiParams.strength || 0.65,
      guidanceScale: aiParams.guidanceScale || 12,
      provider: provider as AIProvider | undefined,
    });

    // Download the result and store in our S3
    const response = await fetch(result.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `projects/${id}/renders/${Date.now()}-${fileId}.jpg`;
    const storedUrl = await uploadFile(buffer, key, "image/jpeg");

    // Create render record
    const render = await prisma.designRender.create({
      data: {
        designFileId: fileId,
        imageUrl: storedUrl,
        prompt,
        modelUsed: `${result.provider}/${result.model}`,
        parameters: {
          strength: aiParams.strength || 0.65,
          guidanceScale: aiParams.guidanceScale || 12,
          provider: result.provider,
        },
      },
    });

    // Update status
    await prisma.designFile.update({
      where: { id: fileId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json(render, { status: 201 });
  } catch (error) {
    await prisma.designFile.update({
      where: { id: fileId },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
