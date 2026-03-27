import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateInteriorDesign(params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
  guidanceScale?: number;
}) {
  const output = await replicate.run(
    "rocketdigitalai/interior-design-sdxl" as `${string}/${string}`,
    {
      input: {
        image: params.imageUrl,
        prompt: params.prompt,
        negative_prompt:
          params.negativePrompt || "blurry, distorted, low quality",
        strength: params.strength || 0.65,
        guidance_scale: params.guidanceScale || 12,
        num_inference_steps: 30,
      },
    }
  );
  return output;
}
