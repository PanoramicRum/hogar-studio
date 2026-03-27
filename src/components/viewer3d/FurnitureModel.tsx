"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { EditorElement } from "@/types/editor";

interface FurnitureModelProps {
  element: EditorElement;
  pixelsPerMeter: number;
  roomDepth: number;
  furnitureColor?: string;
  furnitureHeight?: number;
}

export function FurnitureModel({
  element,
  pixelsPerMeter,
  furnitureColor = "#6b7280",
  furnitureHeight = 0.6,
}: FurnitureModelProps) {
  const color = furnitureColor;
  const modelHeight = furnitureHeight;

  const widthM = element.width / pixelsPerMeter;
  const depthM = element.height / pixelsPerMeter;
  const xM = element.x / pixelsPerMeter;
  const zM = element.y / pixelsPerMeter;
  const rotationRad = (element.rotation * Math.PI) / 180;

  const position: [number, number, number] = useMemo(
    () => [xM + widthM / 2, modelHeight / 2, zM + depthM / 2],
    [xM, widthM, modelHeight, zM, depthM]
  );

  if (element.type === "rug") {
    return (
      <group position={position} rotation={[0, -rotationRad, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[widthM, 0.02, depthM]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={[0, -rotationRad, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[widthM, modelHeight, depthM]} />
        <meshStandardMaterial color={color} opacity={0.85} transparent roughness={0.6} />
      </mesh>
      <mesh>
        <boxGeometry args={[widthM, modelHeight, depthM]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
      <Text
        position={[0, modelHeight / 2 + 0.15, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {element.name}
      </Text>
      <Text
        position={[0, modelHeight / 2 + 0.02, 0]}
        fontSize={0.08}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        {`${widthM.toFixed(1)}x${depthM.toFixed(1)}m`}
      </Text>
    </group>
  );
}
