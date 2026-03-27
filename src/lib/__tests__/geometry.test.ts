import { describe, it, expect } from "vitest";
import {
  calculatePolygonArea,
  distance,
  wallLength,
  wallAngle,
  snapToGrid,
  polygonCentroid,
  pointOnLine,
  makeId,
  detectRoomsFromWalls,
} from "../geometry";

describe("distance", () => {
  it("calculates distance between two points", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it("returns 0 for same point", () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
});

describe("calculatePolygonArea", () => {
  it("calculates area of a unit square", () => {
    const square = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    expect(calculatePolygonArea(square)).toBe(1);
  });
  it("calculates area of a 3x4 rectangle", () => {
    const rect = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }, { x: 0, y: 4 }];
    expect(calculatePolygonArea(rect)).toBe(12);
  });
  it("calculates area of a triangle", () => {
    const tri = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];
    expect(calculatePolygonArea(tri)).toBe(6);
  });
});

describe("wallLength", () => {
  it("calculates wall length", () => {
    const wall = { id: "w1", start: { x: 0, y: 0 }, end: { x: 3, y: 4 }, thickness: 8, height: 2.8 };
    expect(wallLength(wall)).toBe(5);
  });
});

describe("wallAngle", () => {
  it("returns 0 for horizontal wall", () => {
    const wall = { id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 8, height: 2.8 };
    expect(wallAngle(wall)).toBe(0);
  });
  it("returns PI/2 for vertical wall", () => {
    const wall = { id: "w1", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, thickness: 8, height: 2.8 };
    expect(wallAngle(wall)).toBeCloseTo(Math.PI / 2);
  });
});

describe("snapToGrid", () => {
  it("snaps to nearest grid position", () => {
    expect(snapToGrid(12, 10)).toBe(10);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(15, 10)).toBe(20);
  });
});

describe("polygonCentroid", () => {
  it("finds centroid of a square", () => {
    const square = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
    const c = polygonCentroid(square);
    expect(c.x).toBe(2);
    expect(c.y).toBe(2);
  });
});

describe("pointOnLine", () => {
  it("returns start at t=0", () => {
    const p = pointOnLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 0);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
  it("returns end at t=1", () => {
    const p = pointOnLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 1);
    expect(p.x).toBe(10);
    expect(p.y).toBe(0);
  });
  it("returns midpoint at t=0.5", () => {
    const p = pointOnLine({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5);
    expect(p.x).toBe(5);
    expect(p.y).toBe(5);
  });
});

describe("makeId", () => {
  it("generates unique IDs with prefix", () => {
    const id1 = makeId("wall");
    const id2 = makeId("wall");
    expect(id1).toMatch(/^wall-/);
    expect(id2).toMatch(/^wall-/);
    expect(id1).not.toBe(id2);
  });
});

describe("detectRoomsFromWalls", () => {
  it("returns empty for fewer than 3 walls", () => {
    const walls = [
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 8, height: 2.8 },
      { id: "w2", start: { x: 100, y: 0 }, end: { x: 100, y: 100 }, thickness: 8, height: 2.8 },
    ];
    expect(detectRoomsFromWalls(walls)).toEqual([]);
  });

  it("detects a rectangular room from 4 walls", () => {
    const walls = [
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 8, height: 2.8 },
      { id: "w2", start: { x: 100, y: 0 }, end: { x: 100, y: 100 }, thickness: 8, height: 2.8 },
      { id: "w3", start: { x: 100, y: 100 }, end: { x: 0, y: 100 }, thickness: 8, height: 2.8 },
      { id: "w4", start: { x: 0, y: 100 }, end: { x: 0, y: 0 }, thickness: 8, height: 2.8 },
    ];
    const rooms = detectRoomsFromWalls(walls);
    expect(rooms.length).toBeGreaterThanOrEqual(1);
    expect(rooms[0].length).toBe(4);
  });
});
