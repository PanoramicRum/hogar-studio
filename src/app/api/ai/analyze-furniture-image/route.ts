import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import sharp from "sharp";

const ANALYZE_PROMPT = `You are a furniture dimension estimator. Analyze this furniture photo and estimate its physical dimensions and characteristics.

Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "Estimated furniture name",
  "type": "sofa|bed|table|chair|desk|shelf|lamp|cabinet|rug|wardrobe|piano|other",
  "widthCm": 180,
  "depthCm": 85,
  "heightCm": 75,
  "color": "#hex color estimate",
  "material": "estimated material (wood, fabric, metal, etc.)",
  "description": "Brief description of the furniture piece"
}

Estimate dimensions in centimeters based on the furniture type and proportions visible in the image. Use standard furniture dimensions as reference.`;

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize for efficiency
    const resized = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resized.toString("base64");

    // Use Gemini Vision
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: base64 } },
      { text: ANALYZE_PROMPT },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json({
      name: data.name || "Unknown Furniture",
      type: data.type || "other",
      widthM: (data.widthCm || 100) / 100,
      depthM: (data.depthCm || 50) / 100,
      heightM: (data.heightCm || 75) / 100,
      color: data.color || "#6b7280",
      material: data.material || "",
      description: data.description || "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze image" },
      { status: 500 }
    );
  }
}
