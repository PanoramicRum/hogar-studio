import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const EXTRACT_PROMPT = `You are a furniture product data extractor. Analyze this product page content and extract structured furniture information.

Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "Product name",
  "type": "sofa|bed|table|chair|desk|shelf|lamp|cabinet|rug|wardrobe|other",
  "widthCm": 180,
  "depthCm": 85,
  "heightCm": 75,
  "color": "#hex color or descriptive name",
  "material": "wood, metal, fabric, etc.",
  "price": "199.99",
  "currency": "USD",
  "imageUrl": "URL of main product image if found",
  "description": "Brief description"
}

Extract dimensions in centimeters. If dimensions aren't explicitly listed, estimate from the product description and images. Always provide your best estimate.`;

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Fetch the product page
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HogarStudio/1.0; +https://hogarstudio.com)",
        "Accept": "text/html",
      },
    });

    if (!pageRes.ok) {
      return NextResponse.json({ error: "Could not fetch the product page" }, { status: 400 });
    }

    const html = await pageRes.text();

    // Extract text content (strip HTML tags, keep meaningful text)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit to avoid token overflow

    // Extract image URLs from the page
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    const imageUrls = imgMatches
      .map((m) => m.match(/src=["']([^"']+)["']/)?.[1])
      .filter((u): u is string => !!u && (u.startsWith("http") || u.startsWith("//")))
      .slice(0, 5);

    // Use Gemini for extraction (cheapest/free)
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        text: `${EXTRACT_PROMPT}\n\nProduct page URL: ${url}\n\nProduct page content:\n${textContent}\n\nImage URLs found: ${imageUrls.join(", ")}`,
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const data = JSON.parse(cleaned);

    // Convert cm to meters for our system
    return NextResponse.json({
      name: data.name || "Unknown Furniture",
      type: data.type || "other",
      widthM: (data.widthCm || 100) / 100,
      depthM: (data.depthCm || 50) / 100,
      heightM: (data.heightCm || 75) / 100,
      color: data.color || "#6b7280",
      material: data.material || "",
      price: data.price || "",
      currency: data.currency || "",
      imageUrl: data.imageUrl || imageUrls[0] || "",
      description: data.description || "",
      sourceUrl: url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze product" },
      { status: 500 }
    );
  }
}
