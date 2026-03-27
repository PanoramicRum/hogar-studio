export interface StyleDefinition {
  id: string;
  name: string;
  nameI18n?: Record<string, string>;
  prompt: string;
  negativePrompt: string;
  color: string;
  previewImage?: string;
}

export interface FurnitureTypeDefinition {
  type: string;
  name: string;
  nameI18n?: Record<string, string>;
  defaultWidth: number;
  defaultDepth: number;
  color: string;
  height3d: number;
  modelPath?: string;
  iconPath?: string;
  category?: string;
}

export interface HogarPackageManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  type: "style" | "furniture" | "bundle";
  version: string;
  description: string;
  author: { name: string; url?: string };
  license: string;
  previewImage?: string;
  tags?: string[];
  translations?: Record<string, Record<string, string>>;
  styles?: StyleDefinition[];
  furniture?: FurnitureTypeDefinition[];
}

// Extended types with package context (used after loading)
export interface LoadedStyle extends StyleDefinition {
  packageId: string;
}

export interface LoadedFurniture extends FurnitureTypeDefinition {
  packageId: string;
}

export interface LoadedPackage extends HogarPackageManifest {
  _dirName: string;
}

// Client-safe registry shape
export interface PackageRegistry {
  styles: LoadedStyle[];
  furniture: LoadedFurniture[];
}
