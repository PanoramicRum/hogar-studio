export interface Point2D {
  x: number;
  y: number;
}

export interface WallSegment {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // pixels
  height: number;    // meters (default 2.8)
}

export interface RoomPolygon {
  id: string;
  name: string;
  points: Point2D[];
  color: string;
}

export interface Opening {
  id: string;
  type: "door" | "window" | "balcony";
  wallId: string;
  position: number;   // 0-1 along wall
  width: number;       // meters
  height: number;      // meters
  sillHeight?: number; // meters (windows/balcony, distance from floor)
}

export interface FloorPlanModel {
  walls: WallSegment[];
  rooms: RoomPolygon[];
  openings: Opening[];
  wallHeight: number;  // default 2.8m
}
