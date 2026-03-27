/**
 * Backward-compatible wrapper around the package registry.
 * Server-side only — delegates to the package registry.
 */
import { getAllStyles, getStyleById as registryGetStyleById } from "./packages/registry";
import type { LoadedStyle } from "./packages/types";

export type DesignStyle = LoadedStyle;

export function getDesignStyles(): LoadedStyle[] {
  return getAllStyles();
}

export function getStyleById(id: string): LoadedStyle | undefined {
  return registryGetStyleById(id);
}

// Keep DESIGN_STYLES as a getter for backward compat
export const DESIGN_STYLES = getAllStyles();
