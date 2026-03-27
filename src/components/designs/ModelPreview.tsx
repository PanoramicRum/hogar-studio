"use client";

import type { FloorPlanModel } from "@/types/floorplan";

interface ModelPreviewProps {
  model: FloorPlanModel;
  width?: number;
  height?: number;
}

export function ModelPreview({ model, width = 400, height = 300 }: ModelPreviewProps) {
  if (!model.walls.length && !model.rooms.length) return null;

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const wall of model.walls) {
    for (const pt of [wall.start, wall.end]) {
      minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
    }
  }
  for (const room of model.rooms) {
    for (const pt of room.points) {
      minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
    }
  }

  if (!isFinite(minX)) return null;

  const padding = 20;
  const modelW = maxX - minX || 1;
  const modelH = maxY - minY || 1;
  const scale = Math.min((width - padding * 2) / modelW, (height - padding * 2) / modelH);

  function tx(x: number) { return (x - minX) * scale + padding; }
  function ty(y: number) { return (y - minY) * scale + padding; }

  return (
    <svg width={width} height={height} className="rounded-lg" style={{ background: "#faf8ff" }}>
      {/* Rooms */}
      {model.rooms.map((room) => (
        <g key={room.id}>
          <polygon
            points={room.points.map((p) => `${tx(p.x)},${ty(p.y)}`).join(" ")}
            fill={room.color}
            fillOpacity={0.3}
            stroke={room.color}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
          <text
            x={room.points.reduce((s, p) => s + tx(p.x), 0) / room.points.length}
            y={room.points.reduce((s, p) => s + ty(p.y), 0) / room.points.length}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#374151"
            fontWeight="bold"
          >
            {room.name}
          </text>
        </g>
      ))}

      {/* Walls */}
      {model.walls.map((wall) => (
        <line
          key={wall.id}
          x1={tx(wall.start.x)} y1={ty(wall.start.y)}
          x2={tx(wall.end.x)} y2={ty(wall.end.y)}
          stroke="#374151"
          strokeWidth={Math.max(2, wall.thickness * scale * 0.3)}
          strokeLinecap="round"
        />
      ))}

      {/* Openings */}
      {model.openings.map((opening) => {
        const wall = model.walls.find((w) => w.id === opening.wallId);
        if (!wall) return null;
        const px = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
        const py = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
        const isDoor = opening.type === "door" || opening.type === "balcony";
        return (
          <circle
            key={opening.id}
            cx={tx(px)} cy={ty(py)} r={3}
            fill={isDoor ? "#b45309" : "#3b82f6"}
          />
        );
      })}
    </svg>
  );
}
