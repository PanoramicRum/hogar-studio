"use client";

import { Line, Circle, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editorStore";
import { wallLength } from "@/lib/geometry";
import type { WallSegment } from "@/types/floorplan";

interface WallSegment2DProps {
  wall: WallSegment;
  pixelsPerMeter: number;
}

export function WallSegment2D({ wall, pixelsPerMeter }: WallSegment2DProps) {
  const { selectedWallId, selectWall, updateWall, tool } = useEditorStore();
  const isSelected = selectedWallId === wall.id;
  const lengthM = wallLength(wall) / pixelsPerMeter;
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;

  return (
    <Group>
      {/* Wall line */}
      <Line
        points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
        stroke={isSelected ? "#6f5100" : "#374151"}
        strokeWidth={wall.thickness}
        lineCap="round"
        onClick={(e) => {
          // Only capture click for wall selection in select mode
          // Let door/window/room tools propagate to the stage handler
          if (tool === "select") {
            e.cancelBubble = true;
            selectWall(wall.id);
          }
        }}
        hitStrokeWidth={20}
      />

      {/* Dimension label */}
      <Text
        x={midX}
        y={midY - 14}
        text={`${lengthM.toFixed(2)}m`}
        fontSize={11}
        fill={isSelected ? "#6f5100" : "#6b7280"}
        fontStyle="bold"
        offsetX={20}
        listening={false}
      />

      {/* Endpoint handles (only when selected and in select mode) */}
      {isSelected && tool === "select" && (
        <>
          <Circle
            x={wall.start.x}
            y={wall.start.y}
            radius={6}
            fill="#6f5100"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragEnd={(e) => {
              updateWall(wall.id, {
                start: { x: e.target.x(), y: e.target.y() },
              });
            }}
          />
          <Circle
            x={wall.end.x}
            y={wall.end.y}
            radius={6}
            fill="#6f5100"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragEnd={(e) => {
              updateWall(wall.id, {
                end: { x: e.target.x(), y: e.target.y() },
              });
            }}
          />
        </>
      )}
    </Group>
  );
}
