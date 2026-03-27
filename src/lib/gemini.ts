import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface FloorPlanAnalysis {
  rooms: {
    name: string;
    area: number;
    position: { x: number; y: number };
  }[];
  dimensions: { label: string; value: number; unit: string }[];
  totalArea: number;
  furnitureDetected: string[];
}

export async function analyzeFloorPlan(
  imageBase64: string
): Promise<FloorPlanAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    },
    {
      text: `Analyze this architectural floor plan. Return ONLY valid JSON (no markdown) with this structure:
{
  "rooms": [{ "name": "string", "area": number_in_m2, "position": { "x": 0-100, "y": 0-100 } }],
  "dimensions": [{ "label": "string", "value": number_in_meters, "unit": "m" }],
  "totalArea": number_in_m2,
  "furnitureDetected": ["string"]
}
The dimensions are in meters. Extract all visible measurements.`,
    },
  ]);

  const text = result.response.text();
  return JSON.parse(text) as FloorPlanAnalysis;
}

/** Raw AI output before scaling to pixel coordinates */
export interface RawDigitizedFloorPlan {
  walls: { start: { x: number; y: number }; end: { x: number; y: number } }[];
  rooms: { name: string; points: { x: number; y: number }[] }[];
  openings: { type: "door" | "window" | "balcony"; wallIndex: number; position: number; width: number }[];
  wallHeight: number;
}

/**
 * Digitize a floor plan image into structured wall/room geometry.
 * Coordinates are returned normalized 0-1 (relative to image dimensions).
 */
export async function digitizeFloorPlan(imageBase64: string): Promise<RawDigitizedFloorPlan> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: { mimeType: "image/jpeg", data: imageBase64 },
    },
    {
      text: `You are an architectural floor plan analysis AI. Analyze this floor plan image and extract the geometric structure.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "walls": [
    { "start": { "x": 0.0, "y": 0.0 }, "end": { "x": 1.0, "y": 0.0 } }
  ],
  "rooms": [
    { "name": "Living Room", "points": [{ "x": 0.0, "y": 0.0 }, { "x": 0.5, "y": 0.0 }, { "x": 0.5, "y": 0.4 }, { "x": 0.0, "y": 0.4 }] }
  ],
  "openings": [
    { "type": "door", "wallIndex": 0, "position": 0.5, "width": 0.9 },
    { "type": "window", "wallIndex": 1, "position": 0.3, "width": 1.2 },
    { "type": "balcony", "wallIndex": 2, "position": 0.5, "width": 2.0 }
  ],
  "wallHeight": 2.8
}

RULES:
- All x,y coordinates are NORMALIZED from 0.0 to 1.0 relative to the image dimensions (0,0 = top-left, 1,1 = bottom-right)
- "walls" are line segments representing wall centerlines. Include ALL walls visible in the floor plan.
- "rooms" are closed polygons (list of vertices going clockwise). Include ALL rooms/spaces including balconies, terraces, hallways, closets, bathrooms, kitchen, etc.
- "openings" reference walls by index in the walls array. "position" is 0-1 along that wall. "width" is in meters.
- "openings.type" can be "door", "window", or "balcony" (for balcony/terrace access).
- "wallHeight" is the estimated ceiling height in meters (default 2.8 if not visible).
- Trace walls carefully along the architectural lines in the image.
- Include interior walls (room dividers) and exterior walls.
- Mark ALL doors, windows, and balcony openings where visible.`,
    },
  ]);

  const text = result.response.text();
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as RawDigitizedFloorPlan;
}
