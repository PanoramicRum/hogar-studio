"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import { RoomContent, type RoomContentProps } from "./RoomScene";

const xrStore = createXRStore();

interface VRSceneProps extends RoomContentProps {}

export function VRScene(props: VRSceneProps) {
  const { roomWidth = 8, roomDepth = 6, wallHeight = 2.8 } = props;

  return (
    <div className="relative w-full h-full">
      <Canvas shadows>
        <XR store={xrStore}>
          <PerspectiveCamera makeDefault position={[roomWidth / 2, 1.6, roomDepth / 2]} fov={75} />
          <RoomContent {...props} />
        </XR>
      </Canvas>

      <button
        onClick={() => xrStore.enterVR()}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-full shadow-ambient-lg"
        style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>vrpano</span>
        Enter VR
      </button>
    </div>
  );
}

export { xrStore };
