export type EditorTool = "select" | "measure" | "furniture" | "wall" | "door" | "window" | "room";

export type ViewMode = "image" | "model" | "both";

export interface EditorElement {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  furnitureUrl?: string;
  furnitureData?: Record<string, unknown>;
  color?: string;
  opacity?: number;
}

export interface MeasurementPoint {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  start: MeasurementPoint;
  end: MeasurementPoint;
}

export interface ScaleConfig {
  pixelsPerMeter: number;
  calibrated: boolean;
}
