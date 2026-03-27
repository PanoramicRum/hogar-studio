"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

function PanoramaSphere({ imageUrl }: { imageUrl: string }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imageUrl]);

  return (
    <mesh>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

interface PanoramaViewerProps {
  imageUrl: string;
}

export function PanoramaViewer({ imageUrl }: PanoramaViewerProps) {
  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <PanoramaSphere imageUrl={imageUrl} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={-0.3}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>touch_app</span>
        Drag to look around
      </div>
    </div>
  );
}
