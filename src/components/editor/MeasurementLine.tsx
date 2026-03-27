"use client";

import { Line, Text, Circle, Group } from "react-konva";
import type { Measurement } from "@/types/editor";

interface MeasurementLineProps {
  measurement: Measurement;
  pixelsPerMeter: number;
}

export function MeasurementLine({ measurement, pixelsPerMeter }: MeasurementLineProps) {
  const { start, end } = measurement;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  const meters = pixelDistance / pixelsPerMeter;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <Group>
      {/* Main line */}
      <Line
        points={[start.x, start.y, end.x, end.y]}
        stroke="#ef4444"
        strokeWidth={2}
        dash={[8, 4]}
      />

      {/* Endpoints */}
      <Circle x={start.x} y={start.y} radius={4} fill="#ef4444" />
      <Circle x={end.x} y={end.y} radius={4} fill="#ef4444" />

      {/* Perpendicular tick at start */}
      <Line
        points={[
          start.x - Math.sin((angle * Math.PI) / 180) * 8,
          start.y + Math.cos((angle * Math.PI) / 180) * 8,
          start.x + Math.sin((angle * Math.PI) / 180) * 8,
          start.y - Math.cos((angle * Math.PI) / 180) * 8,
        ]}
        stroke="#ef4444"
        strokeWidth={2}
      />

      {/* Perpendicular tick at end */}
      <Line
        points={[
          end.x - Math.sin((angle * Math.PI) / 180) * 8,
          end.y + Math.cos((angle * Math.PI) / 180) * 8,
          end.x + Math.sin((angle * Math.PI) / 180) * 8,
          end.y - Math.cos((angle * Math.PI) / 180) * 8,
        ]}
        stroke="#ef4444"
        strokeWidth={2}
      />

      {/* Distance label */}
      <Text
        x={midX}
        y={midY - 14}
        text={`${meters.toFixed(2)}m`}
        fontSize={13}
        fontStyle="bold"
        fill="#ef4444"
        align="center"
        offsetX={20}
        padding={2}
      />
    </Group>
  );
}
