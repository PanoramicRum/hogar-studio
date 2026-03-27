"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import { useState } from "react";
import { FurnitureModel } from "./FurnitureModel";
import { RoomWalls } from "./RoomWalls";
import type { EditorElement, ScaleConfig } from "@/types/editor";
import type { FloorPlanModel } from "@/types/floorplan";

export interface RoomContentProps {
  elements: EditorElement[];
  scale: ScaleConfig;
  furnitureColors: Record<string, string>;
  furnitureHeights: Record<string, number>;
  floorPlanModel?: FloorPlanModel | null;
  roomWidth?: number;
  roomDepth?: number;
  wallHeight?: number;
}

/** Reusable room content — shared between RoomScene and VRScene */
export function RoomContent({
  elements, scale, furnitureColors, furnitureHeights,
  floorPlanModel, roomWidth = 8, roomDepth = 6, wallHeight = 2.8,
}: RoomContentProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[roomWidth, wallHeight * 2, roomDepth]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[roomWidth / 2, wallHeight - 0.3, roomDepth / 2]} intensity={0.4} />
      <Environment preset="apartment" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomWidth / 2, 0, roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshStandardMaterial color="#c4a882" roughness={0.8} />
      </mesh>

      <Grid
        position={[roomWidth / 2, 0.001, roomDepth / 2]}
        args={[roomWidth, roomDepth]}
        cellSize={0.5} cellThickness={0.5} cellColor="#8b7355"
        sectionSize={1} sectionThickness={1} sectionColor="#6b5335"
        fadeDistance={20} infiniteGrid={false}
      />

      <RoomWalls width={roomWidth} depth={roomDepth} height={wallHeight} floorPlanModel={floorPlanModel} pixelsPerMeter={scale.pixelsPerMeter} />

      {elements.map((el) => (
        <FurnitureModel
          key={el.id} element={el} pixelsPerMeter={scale.pixelsPerMeter}
          roomDepth={roomDepth}
          furnitureColor={furnitureColors[el.type] || "#6b7280"}
          furnitureHeight={furnitureHeights[el.type] || 0.6}
        />
      ))}
    </>
  );
}

interface RoomSceneProps extends RoomContentProps {}

export function RoomScene(props: RoomSceneProps) {
  const { roomWidth = 8, roomDepth = 6, wallHeight = 2.8 } = props;
  const [cameraMode, setCameraMode] = useState<"orbit" | "walkthrough">("orbit");

  return (
    <div className="relative w-full h-full">
      <Canvas shadows>
        {cameraMode === "orbit" ? (
          <PerspectiveCamera makeDefault position={[roomWidth / 2, wallHeight * 2, roomDepth * 1.5]} fov={50} />
        ) : (
          <PerspectiveCamera makeDefault position={[roomWidth / 2, 1.6, roomDepth / 2]} fov={75} />
        )}

        <RoomContent {...props} />

        <OrbitControls
          target={[roomWidth / 2, wallHeight / 3, roomDepth / 2]}
          maxPolarAngle={Math.PI / 2}
          minDistance={1} maxDistance={20}
          enablePan={cameraMode === "orbit"}
        />
      </Canvas>

      <div className="absolute top-4 right-4 flex gap-1 bg-background/80 backdrop-blur border rounded-lg p-1">
        <button
          className={`px-3 py-1.5 text-xs rounded ${cameraMode === "orbit" ? "text-white" : "hover:bg-muted"}`}
          style={cameraMode === "orbit" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
          onClick={() => setCameraMode("orbit")}
        >
          Orbit
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded ${cameraMode === "walkthrough" ? "text-white" : "hover:bg-muted"}`}
          style={cameraMode === "walkthrough" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
          onClick={() => setCameraMode("walkthrough")}
        >
          Walk-through
        </button>
      </div>
    </div>
  );
}
