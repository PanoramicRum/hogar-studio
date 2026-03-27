/**
 * Multi-provider AI abstraction for image generation, analysis, and floor plan digitization.
 * Supports: Replicate, OpenAI, Anthropic, Gemini, and local models.
 */

import type { RawDigitizedFloorPlan } from "./gemini";

export type AIProvider = "replicate" | "openai" | "anthropic" | "gemini" | "local";

export interface GenerateImageParams {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
  guidanceScale?: number;
  provider?: AIProvider;
}

export interface GenerateImageResult {
  imageUrl: string;
  provider: AIProvider;
  model: string;
}

export interface DigitizeParams {
  imageBase64: string;
  provider?: AIProvider;
}

// ─── Shared digitization prompt ─────────────────────────────

const DIGITIZE_PROMPT = `You are an architectural floor plan analysis AI. Analyze this floor plan image and extract the geometric structure.

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
- "openings.type" can be "door", "window", or "balcony".
- "wallHeight" is the estimated ceiling height in meters (default 2.8 if not visible).
- Trace walls carefully along the architectural lines in the image.
- Include interior walls (room dividers) and exterior walls.
- Mark ALL doors, windows, and balcony openings where visible.`;

function parseDigitizeResponse(text: string): RawDigitizedFloorPlan {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as RawDigitizedFloorPlan;
}

// ─── Provider: Replicate ────────────────────────────────────

async function generateWithReplicate(params: GenerateImageParams): Promise<GenerateImageResult> {
  const Replicate = (await import("replicate")).default;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const output = await replicate.run(
    "rocketdigitalai/interior-design-sdxl" as `${string}/${string}`,
    {
      input: {
        image: params.imageUrl,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "blurry, distorted, low quality",
        strength: params.strength || 0.65,
        guidance_scale: params.guidanceScale || 12,
        num_inference_steps: 30,
      },
    }
  );

  const resultUrl = Array.isArray(output) ? output[0] : output;
  if (!resultUrl || typeof resultUrl !== "string") {
    throw new Error("No image returned from Replicate");
  }

  return { imageUrl: resultUrl, provider: "replicate", model: "rocketdigitalai/interior-design-sdxl" };
}

// ─── Provider: OpenAI ───────────────────────────────────────

async function generateWithOpenAI(params: GenerateImageParams): Promise<GenerateImageResult> {
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Interior design render based on this room layout: ${params.prompt}`,
    n: 1,
    size: "1024x1024",
    quality: "hd",
  });

  const resultUrl = response.data?.[0]?.url;
  if (!resultUrl) throw new Error("No image returned from OpenAI");

  return { imageUrl: resultUrl, provider: "openai", model: "dall-e-3" };
}

async function digitizeWithOpenAI(imageBase64: string): Promise<RawDigitizedFloorPlan> {
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: "text", text: DIGITIZE_PROMPT },
        ],
      },
    ],
    max_tokens: 4000,
  });

  const text = response.choices[0]?.message?.content || "";
  return parseDigitizeResponse(text);
}

// ─── Provider: Anthropic (Claude) ───────────────────────────

async function generateWithAnthropic(params: GenerateImageParams): Promise<GenerateImageResult> {
  // Claude doesn't generate images directly — use it for analysis-driven prompts
  // For actual image generation, redirect to another provider
  throw new Error("Anthropic Claude cannot generate images directly. Use Replicate or OpenAI for design generation.");
}

async function digitizeWithAnthropic(imageBase64: string): Promise<RawDigitizedFloorPlan> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: DIGITIZE_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Anthropic");

  return parseDigitizeResponse(textBlock.text);
}

// ─── Provider: Gemini ───────────────────────────────────────

async function digitizeWithGemini(imageBase64: string): Promise<RawDigitizedFloorPlan> {
  const { digitizeFloorPlan } = await import("./gemini");
  return digitizeFloorPlan(imageBase64);
}

// ─── Provider: Local ────────────────────────────────────────

async function generateWithLocal(params: GenerateImageParams): Promise<GenerateImageResult> {
  const endpoint = process.env.LOCAL_AI_ENDPOINT || "http://localhost:7860";
  const model = process.env.LOCAL_AI_MODEL || "stable-diffusion";

  const response = await fetch(`${endpoint}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LOCAL_AI_API_KEY && { Authorization: `Bearer ${process.env.LOCAL_AI_API_KEY}` }),
    },
    body: JSON.stringify({
      model, prompt: params.prompt, negative_prompt: params.negativePrompt,
      n: 1, size: "1024x1024",
      ...(params.strength && { strength: params.strength }),
      ...(params.guidanceScale && { guidance_scale: params.guidanceScale }),
      ...(params.imageUrl && { init_image: params.imageUrl }),
    }),
  });

  if (!response.ok) throw new Error(`Local AI error: ${await response.text()}`);
  const data = await response.json();
  const resultUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
  if (!resultUrl) throw new Error("No image returned from local model");

  return { imageUrl: resultUrl, provider: "local", model };
}

// ─── Unified interfaces ─────────────────────────────────────

function getDefaultProvider(): AIProvider {
  const configured = process.env.AI_PROVIDER as AIProvider | undefined;
  if (configured && ["replicate", "openai", "anthropic", "gemini", "local"].includes(configured)) {
    return configured;
  }
  if (process.env.REPLICATE_API_TOKEN) return "replicate";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LOCAL_AI_ENDPOINT) return "local";
  return "replicate";
}

function getDefaultDigitizeProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "gemini";
}

export async function generateDesignImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const provider = params.provider || getDefaultProvider();
  switch (provider) {
    case "replicate": return generateWithReplicate(params);
    case "openai": return generateWithOpenAI(params);
    case "anthropic": return generateWithAnthropic(params);
    case "local": return generateWithLocal(params);
    default: throw new Error(`Provider ${provider} does not support image generation`);
  }
}

export async function digitizeFloorPlanWithProvider(
  imageBase64: string,
  provider?: AIProvider
): Promise<RawDigitizedFloorPlan> {
  const p = provider || getDefaultDigitizeProvider();
  switch (p) {
    case "gemini": return digitizeWithGemini(imageBase64);
    case "openai": return digitizeWithOpenAI(imageBase64);
    case "anthropic": return digitizeWithAnthropic(imageBase64);
    default: throw new Error(`Provider ${p} does not support floor plan digitization. Use Gemini, OpenAI, or Anthropic.`);
  }
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  configured: boolean;
  capabilities: string[];
  model: string;
  pricing: string;
  recommended?: boolean;
}

export function getAvailableProviders(): ProviderInfo[] {
  return [
    { id: "gemini", name: "Google Gemini", configured: !!process.env.GEMINI_API_KEY, capabilities: ["digitization", "analysis"], model: "gemini-2.5-flash", pricing: "Free (no credit card)", recommended: true },
    { id: "openai", name: "OpenAI", configured: !!process.env.OPENAI_API_KEY, capabilities: ["generation", "digitization", "analysis"], model: "gpt-4o-mini + dall-e-3", pricing: "$0.005/analysis, $0.04/image" },
    { id: "anthropic", name: "Anthropic Claude", configured: !!process.env.ANTHROPIC_API_KEY, capabilities: ["digitization", "analysis"], model: "claude-haiku-4.5", pricing: "$0.002/analysis" },
    { id: "replicate", name: "Replicate", configured: !!process.env.REPLICATE_API_TOKEN, capabilities: ["generation"], model: "sdxl-interior-design", pricing: "$0.05-0.15/image" },
    { id: "local", name: "Local Model", configured: !!process.env.LOCAL_AI_ENDPOINT, capabilities: ["generation"], model: "custom", pricing: "Free (your hardware)" },
  ];
}
