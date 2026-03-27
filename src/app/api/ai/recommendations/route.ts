import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RECOMMEND_PROMPT = `You are an expert interior design consultant. Based on the room layout and furniture arrangement described below, provide 5 specific, actionable design recommendations.

Return ONLY valid JSON (no markdown, no code fences) as an array:
[
  {
    "title": "Short recommendation title",
    "description": "Detailed explanation of the recommendation",
    "category": "layout|color|furniture|lighting|decor",
    "priority": "high|medium|low"
  }
]

Be specific and practical. Reference actual furniture pieces mentioned. Consider flow, balance, lighting, and comfort.`;

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await request.json();

  // Load project data
  let projectContext = "";

  if (!isGuestMode && projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: {
        elements: true,
        designFiles: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    if (project) {
      const elements = project.elements.map((e) => `${e.name} (${e.type}, ${((e.width || 100) / 100).toFixed(1)}x${((e.height || 100) / 100).toFixed(1)}m)`);
      const style = project.designFiles[0]?.style || "modern";
      projectContext = `Project: ${project.name}\nStyle: ${style}\nFurniture: ${elements.join(", ") || "none placed yet"}`;
    }
  }

  if (!projectContext) {
    projectContext = "General apartment with no specific furniture placed yet. Style: modern.";
  }

  try {
    // Load user keys
    if (session?.user?.id) {
      const { getUserKeys } = await import("@/lib/ai-keys");
      const keys = await getUserKeys(session.user.id);
      if (keys.gemini) process.env.GEMINI_API_KEY = keys.gemini;
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { text: `${RECOMMEND_PROMPT}\n\n${projectContext}` },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const recommendations = JSON.parse(cleaned);

    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
