"use client";

import { Text, Line, Group } from "react-konva";
import { polygonCentroid, calculatePolygonArea } from "@/lib/geometry";
import { useEditorStore } from "@/stores/editorStore";
import type { RoomPolygon } from "@/types/floorplan";

interface RoomLabelProps {
  room: RoomPolygon;
  pixelsPerMeter: number;
}

export function RoomLabel({ room, pixelsPerMeter }: RoomLabelProps) {
  const { selectedWallId, selectWall } = useEditorStore();
  const centroid = polygonCentroid(room.points);
  const areaPx = calculatePolygonArea(room.points);
  const areaM2 = areaPx / (pixelsPerMeter * pixelsPerMeter);
  const isSelected = selectedWallId === room.id;

  const flatPoints = room.points.flatMap((p) => [p.x, p.y]);

  return (
    <Group>
      {/* Room fill — clickable */}
      <Line
        points={flatPoints}
        closed
        fill={room.color}
        opacity={isSelected ? 0.4 : 0.2}
        onClick={(e) => {
          e.cancelBubble = true;
          selectWall(room.id); // reuse selectWall for rooms too (ID prefix distinguishes)
        }}
        hitStrokeWidth={0}
      />

      {/* Room outline */}
      <Line
        points={flatPoints}
        closed
        stroke={isSelected ? "#6f5100" : room.color}
        strokeWidth={isSelected ? 2 : 1}
        opacity={isSelected ? 1 : 0.5}
        dash={isSelected ? undefined : [4, 4]}
        listening={false}
      />

      {/* Room name */}
      <Text
        x={centroid.x}
        y={centroid.y - 10}
        text={room.name}
        fontSize={12}
        fontStyle="bold"
        fill={isSelected ? "#6f5100" : "#374151"}
        align="center"
        offsetX={30}
        listening={false}
      />

      {/* Room area */}
      <Text
        x={centroid.x}
        y={centroid.y + 4}
        text={`${areaM2.toFixed(1)} m²`}
        fontSize={10}
        fill="#6b7280"
        align="center"
        offsetX={20}
        listening={false}
      />
    </Group>
  );
}
