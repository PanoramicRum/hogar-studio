"use client";

import { useRef, useEffect } from "react";
import { Group, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/stores/editorStore";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import type { EditorElement } from "@/types/editor";

interface FurnitureItemProps {
  element: EditorElement;
}

export function FurnitureItem({ element }: FurnitureItemProps) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const { selectedElementId, selectElement, updateElement, tool, scale } = useEditorStore();
  const { getFurnitureColor } = usePackageRegistry();
  const isSelected = selectedElementId === element.id;
  const color = getFurnitureColor(element.type);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const widthMeters = element.width / scale.pixelsPerMeter;
  const heightMeters = element.height / scale.pixelsPerMeter;

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={tool === "select"}
        onClick={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onDragEnd={(e) => {
          updateElement(element.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(10, element.width * scaleX),
            height: Math.max(10, element.height * scaleY),
            rotation: node.rotation(),
          });
        }}
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={color + "40"}
          stroke={isSelected ? "#000" : color}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={3}
        />
        <Text
          text={element.name}
          width={element.width}
          height={element.height / 2}
          y={2}
          align="center"
          verticalAlign="middle"
          fontSize={11}
          fontStyle="bold"
          fill={color}
          listening={false}
        />
        <Text
          text={`${widthMeters.toFixed(2)} x ${heightMeters.toFixed(2)}m`}
          width={element.width}
          height={element.height / 2}
          y={element.height / 2}
          align="center"
          verticalAlign="middle"
          fontSize={9}
          fill="#666"
          listening={false}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            "top-left", "top-right", "bottom-left", "bottom-right",
            "middle-left", "middle-right", "top-center", "bottom-center",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
