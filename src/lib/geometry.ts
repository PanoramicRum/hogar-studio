import type { Point2D, WallSegment } from "@/types/floorplan";

/** Shoelace formula for polygon area (in square pixels) */
export function calculatePolygonArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/** Get a point at position t (0-1) along a line segment */
export function pointOnLine(start: Point2D, end: Point2D, t: number): Point2D {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

/** Distance between two points */
export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/** Wall length in pixels */
export function wallLength(wall: WallSegment): number {
  return distance(wall.start, wall.end);
}

/** Wall angle in radians */
export function wallAngle(wall: WallSegment): number {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}

/** Snap value to nearest grid position */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Centroid of a polygon */
export function polygonCentroid(points: Point2D[]): Point2D {
  const n = points.length;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  };
}

/** Generate a unique ID */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Check if two points are close enough to be considered the same */
function pointsClose(a: Point2D, b: Point2D, threshold = 10): boolean {
  return distance(a, b) < threshold;
}

/**
 * Detect enclosed rooms from wall segments.
 * Builds a graph of wall endpoints and finds closed loops (cycles).
 * Returns arrays of points representing room polygons.
 */
export function detectRoomsFromWalls(walls: WallSegment[]): Point2D[][] {
  if (walls.length < 3) return [];

  // Build adjacency graph: merge nearby endpoints
  const nodes: Point2D[] = [];
  const edges: [number, number][] = [];

  function findOrAddNode(pt: Point2D): number {
    for (let i = 0; i < nodes.length; i++) {
      if (pointsClose(nodes[i], pt)) return i;
    }
    nodes.push({ x: pt.x, y: pt.y });
    return nodes.length - 1;
  }

  for (const wall of walls) {
    const a = findOrAddNode(wall.start);
    const b = findOrAddNode(wall.end);
    if (a !== b) edges.push([a, b]);
  }

  // Build adjacency list
  const adj: Map<number, Set<number>> = new Map();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  // Find minimal cycles using angle-based traversal
  const rooms: Point2D[][] = [];
  const usedEdges = new Set<string>();

  function edgeKey(a: number, b: number) { return `${a}-${b}`; }

  for (const [startA, startB] of edges) {
    for (const [initFrom, initTo] of [[startA, startB], [startB, startA]]) {
      const key = edgeKey(initFrom, initTo);
      if (usedEdges.has(key)) continue;

      // Walk the cycle turning right at each junction
      const path: number[] = [initFrom, initTo];
      let prev = initFrom;
      let curr = initTo;
      let found = false;

      for (let step = 0; step < 20; step++) {
        const neighbors = adj.get(curr);
        if (!neighbors || neighbors.size < 2) break;

        // Find the next node by picking the rightmost turn
        const inAngle = Math.atan2(nodes[prev].y - nodes[curr].y, nodes[prev].x - nodes[curr].x);
        let bestAngle = Infinity;
        let bestNext = -1;

        for (const next of neighbors) {
          if (next === prev) continue;
          const outAngle = Math.atan2(nodes[next].y - nodes[curr].y, nodes[next].x - nodes[curr].x);
          let diff = outAngle - inAngle;
          if (diff <= 0) diff += 2 * Math.PI;
          if (diff < bestAngle) { bestAngle = diff; bestNext = next; }
        }

        if (bestNext === -1) break;

        if (bestNext === initFrom && path.length >= 3) {
          // Found a closed loop
          const polygon = path.map((i) => nodes[i]);
          const area = calculatePolygonArea(polygon);
          // Only keep rooms with reasonable area (not tiny slivers or huge outer boundary)
          if (area > 500 && area < 10000000) {
            rooms.push(polygon);
            for (let i = 0; i < path.length; i++) {
              usedEdges.add(edgeKey(path[i], path[(i + 1) % path.length]));
            }
          }
          found = true;
          break;
        }

        if (path.includes(bestNext)) break; // avoid inner loops
        path.push(bestNext);
        prev = curr;
        curr = bestNext;
      }
    }
  }

  return rooms;
}
