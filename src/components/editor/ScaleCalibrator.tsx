"use client";

import { Line, Circle, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editorStore";

export function ScaleCalibrator() {
  const { calibrationPoints } = useEditorStore();

  if (calibrationPoints.length === 0) return null;

  return (
    <Group>
      {/* First point */}
      <Circle x={calibrationPoints[0].x} y={calibrationPoints[0].y} radius={6} fill="#3b82f6" stroke="white" strokeWidth={2} />

      {calibrationPoints.length === 2 && (
        <>
          {/* Second point */}
          <Circle x={calibrationPoints[1].x} y={calibrationPoints[1].y} radius={6} fill="#3b82f6" stroke="white" strokeWidth={2} />

          {/* Connecting line */}
          <Line
            points={[
              calibrationPoints[0].x, calibrationPoints[0].y,
              calibrationPoints[1].x, calibrationPoints[1].y,
            ]}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[6, 3]}
          />

          {/* Pixel distance label */}
          <Text
            x={(calibrationPoints[0].x + calibrationPoints[1].x) / 2}
            y={(calibrationPoints[0].y + calibrationPoints[1].y) / 2 - 16}
            text={`${Math.round(
              Math.sqrt(
                Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
                Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
              )
            )}px`}
            fontSize={12}
            fill="#3b82f6"
            fontStyle="bold"
            offsetX={15}
          />
        </>
      )}
    </Group>
  );
}
