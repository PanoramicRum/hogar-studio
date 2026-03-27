"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { FloorPlanModel } from "@/types/floorplan";
import { distance } from "@/lib/geometry";

interface RoomWallsProps {
  width?: number;
  depth?: number;
  height?: number;
  floorPlanModel?: FloorPlanModel | null;
  pixelsPerMeter?: number;
}

/** Fallback: simple 3-wall box (original behavior) */
function StaticWalls({ width, depth, height }: { width: number; depth: number; height: number }) {
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f5f0eb", side: THREE.DoubleSide, roughness: 0.9 }),
    []
  );

  return (
    <group>
      <mesh position={[width / 2, height / 2, 0]} material={wallMaterial} receiveShadow>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow>
        <planeGeometry args={[depth, height]} />
      </mesh>
      <mesh position={[width, height / 2, depth / 2]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial} receiveShadow>
        <planeGeometry args={[depth, height]} />
      </mesh>
    </group>
  );
}

/** Dynamic walls from FloorPlanModel */
function DynamicWalls({ model, pixelsPerMeter }: { model: FloorPlanModel; pixelsPerMeter: number }) {
  const wallMeshes = useMemo(() => {
    return model.walls.map((wall) => {
      const startX = wall.start.x / pixelsPerMeter;
      const startZ = wall.start.y / pixelsPerMeter;
      const endX = wall.end.x / pixelsPerMeter;
      const endZ = wall.end.y / pixelsPerMeter;

      const wallLen = distance(wall.start, wall.end) / pixelsPerMeter;
      const wallH = wall.height || model.wallHeight || 2.8;
      const thickness = (wall.thickness || 8) / pixelsPerMeter;

      const midX = (startX + endX) / 2;
      const midZ = (startZ + endZ) / 2;
      const angle = Math.atan2(endZ - startZ, endX - startX);

      return {
        id: wall.id,
        position: [midX, wallH / 2, midZ] as [number, number, number],
        rotation: [0, -angle, 0] as [number, number, number],
        size: [wallLen, wallH, thickness] as [number, number, number],
      };
    });
  }, [model, pixelsPerMeter]);

  return (
    <group>
      {wallMeshes.map((w) => (
        <mesh key={w.id} position={w.position} rotation={w.rotation} castShadow receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#f5f0eb" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function RoomWalls({ width = 8, depth = 6, height = 2.8, floorPlanModel, pixelsPerMeter = 100 }: RoomWallsProps) {
  if (floorPlanModel && floorPlanModel.walls.length > 0) {
    return <DynamicWalls model={floorPlanModel} pixelsPerMeter={pixelsPerMeter} />;
  }
  return <StaticWalls width={width} depth={depth} height={height} />;
}
