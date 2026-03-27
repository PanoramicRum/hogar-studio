import { z } from "zod";

const styleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameI18n: z.record(z.string(), z.string()).optional(),
  prompt: z.string().min(1),
  negativePrompt: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  previewImage: z.string().optional(),
});

const furnitureSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  nameI18n: z.record(z.string(), z.string()).optional(),
  defaultWidth: z.number().positive(),
  defaultDepth: z.number().positive(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  height3d: z.number().positive(),
  modelPath: z.string().optional(),
  iconPath: z.string().optional(),
  category: z.string().optional(),
});

const authorSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
});

export const hogarPackageSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["style", "furniture", "bundle"]),
  version: z.string().min(1),
  description: z.string(),
  author: authorSchema,
  license: z.string(),
  previewImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  styles: z.array(styleSchema).optional(),
  furniture: z.array(furnitureSchema).optional(),
});
