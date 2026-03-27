"use client";

import { useRef, useCallback, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Group, Text, Arc } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { useEditorStore } from "@/stores/editorStore";
import { makeId, distance, pointOnLine, wallLength, wallAngle } from "@/lib/geometry";
import type { WallSegment, Opening } from "@/types/floorplan";
import { FurnitureItem } from "./FurnitureItem";
import { MeasurementLine } from "./MeasurementLine";
import { ScaleCalibrator } from "./ScaleCalibrator";
import { WallSegment2D } from "./WallSegment2D";
import { RoomLabel } from "./RoomLabel";

interface FloorPlanCanvasProps {
  width: number;
  height: number;
}

function GridLayer({ width, height, spacing }: { width: number; height: number; spacing: number }) {
  const lines = [];
  for (let i = 0; i < width / spacing; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * spacing, 0, i * spacing, height]} stroke="#e5e7eb" strokeWidth={0.5} />);
  }
  for (let i = 0; i < height / spacing; i++) {
    lines.push(<Line key={`h-${i}`} points={[0, i * spacing, width, i * spacing]} stroke="#e5e7eb" strokeWidth={0.5} />);
  }
  return <>{lines}</>;
}

function FloorPlanImage({ url }: { url: string }) {
  const [image] = useImage(url, "anonymous");
  if (!image) return null;
  return <KonvaImage image={image} />;
}

/** Render a door or window symbol on a wall */
function Opening2D({ opening, wall, pixelsPerMeter }: { opening: Opening; wall: WallSegment; pixelsPerMeter: number }) {
  const { selectedOpeningId, selectOpening } = useEditorStore();
  const isSelected = selectedOpeningId === opening.id;
  const isDoor = opening.type === "door" || opening.type === "balcony";

  const pos = pointOnLine(wall.start, wall.end, opening.position);
  const angle = wallAngle(wall);
  const widthPx = opening.width * pixelsPerMeter;
  const halfW = widthPx / 2;

  const color = isDoor ? "#b45309" : "#3b82f6"; // amber for doors, blue for windows
  const selectedColor = "#6f5100";

  return (
    <Group
      x={pos.x}
      y={pos.y}
      rotation={(angle * 180) / Math.PI}
      onClick={(e) => { e.cancelBubble = true; selectOpening(opening.id); }}
    >
      {/* Gap in wall (white rectangle to "cut" the wall) */}
      <Rect x={-halfW} y={-6} width={widthPx} height={12} fill="#faf8ff" listening={false} />

      {isDoor ? (
        /* Door: arc swing */
        <>
          <Line points={[-halfW, 0, halfW, 0]} stroke={isSelected ? selectedColor : color} strokeWidth={3} />
          <Arc x={-halfW} y={0} innerRadius={0} outerRadius={widthPx * 0.8} angle={90} rotation={-90}
            stroke={isSelected ? selectedColor : color} strokeWidth={1} dash={[3, 3]} listening={false} />
        </>
      ) : (
        /* Window: double line */
        <>
          <Line points={[-halfW, -3, halfW, -3]} stroke={isSelected ? selectedColor : color} strokeWidth={2} />
          <Line points={[-halfW, 3, halfW, 3]} stroke={isSelected ? selectedColor : color} strokeWidth={2} />
          <Line points={[-halfW, -3, -halfW, 3]} stroke={isSelected ? selectedColor : color} strokeWidth={2} />
          <Line points={[halfW, -3, halfW, 3]} stroke={isSelected ? selectedColor : color} strokeWidth={2} />
        </>
      )}

      {/* Label */}
      <Text
        x={-halfW}
        y={-18}
        text={`${opening.type} ${opening.width}m`}
        fontSize={9}
        fill={isSelected ? selectedColor : "#6b7280"}
        listening={false}
      />
    </Group>
  );
}

export function FloorPlanCanvas({ width, height }: FloorPlanCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const {
    zoom, panX, panY, tool, floorPlanUrl, elements, measurements,
    measurePoints, scale, viewMode, floorPlanModel, wallDrawStart,
    setZoom, setPan, selectElement, addMeasurePoint,
    addWall, addOpening, setWallDrawStart, selectWall, selectedWallId, updateWall,
    roomDrawPoints, addRoomDrawPoint, finishRoomDraw,
  } = useEditorStore();

  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number } | null>(null);

  // Snap to nearest wall endpoint (or room draw point when in room tool)
  const SNAP_THRESHOLD = 15;
  const ROOM_CLOSE_THRESHOLD = 25;
  function snapToEndpoint(x: number, y: number, includeRoomPoints = false): { x: number; y: number; snapped: boolean } {
    if (!floorPlanModel) return { x, y, snapped: false };
    let closest = { x, y };
    let minDist = SNAP_THRESHOLD;
    let snapped = false;
    // Snap to wall endpoints
    for (const wall of floorPlanModel.walls) {
      for (const pt of [wall.start, wall.end]) {
        const d = distance(pt, { x, y });
        if (d < minDist) { minDist = d; closest = { x: pt.x, y: pt.y }; snapped = true; }
      }
    }
    // Also snap to in-progress room draw points
    if (includeRoomPoints) {
      for (const pt of roomDrawPoints) {
        const d = distance(pt, { x, y });
        if (d < minDist) { minDist = d; closest = { x: pt.x, y: pt.y }; snapped = true; }
      }
    }
    return { ...closest, snapped };
  }

  // Find the closest wall to a point (for placing doors/windows)
  function findClosestWall(x: number, y: number): { wall: WallSegment; position: number; dist: number } | null {
    if (!floorPlanModel) return null;
    let best: { wall: WallSegment; position: number; dist: number } | null = null;
    for (const wall of floorPlanModel.walls) {
      const len = wallLength(wall);
      if (len === 0) continue;
      // Project point onto wall line
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      let t = ((x - wall.start.x) * dx + (y - wall.start.y) * dy) / (len * len);
      t = Math.max(0.05, Math.min(0.95, t)); // clamp with margin
      const proj = pointOnLine(wall.start, wall.end, t);
      const d = distance({ x, y }, proj);
      if (d < 30 && (!best || d < best.dist)) {
        best = { wall, position: t, dist: d };
      }
    }
    return best;
  }

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = { x: (pointer.x - panX) / oldScale, y: (pointer.y - panY) / oldScale };
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      setZoom(newScale);
      setPan(pointer.x - mousePointTo.x * newScale, pointer.y - mousePointTo.y * newScale);
    },
    [zoom, panX, panY, setZoom, setPan]
  );

  // Track mouse for snap indicator
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall" && tool !== "door" && tool !== "window") { setSnapIndicator(null); return; }
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = (pointer.x - panX) / zoom;
      const y = (pointer.y - panY) / zoom;

      if (tool === "wall") {
        const snap = snapToEndpoint(x, y);
        setSnapIndicator(snap.snapped ? { x: snap.x, y: snap.y } : null);
      } else {
        // door/window: show snap on closest wall
        const closest = findClosestWall(x, y);
        if (closest) {
          const pt = pointOnLine(closest.wall.start, closest.wall.end, closest.position);
          setSnapIndicator(pt);
        } else {
          setSnapIndicator(null);
        }
      }
    },
    [tool, zoom, panX, panY, floorPlanModel]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = (pointer.x - panX) / zoom;
      const y = (pointer.y - panY) / zoom;

      if (tool === "measure") {
        addMeasurePoint({ x, y });
        return;
      }

      if (tool === "wall") {
        const snap = snapToEndpoint(x, y);
        if (!wallDrawStart) {
          setWallDrawStart({ x: snap.x, y: snap.y });
        } else {
          addWall({
            id: makeId("wall"),
            start: wallDrawStart,
            end: { x: snap.x, y: snap.y },
            thickness: 8,
            height: floorPlanModel?.wallHeight || 2.8,
          });
          setWallDrawStart(null);
        }
        return;
      }

      if (tool === "door" || tool === "window") {
        const closest = findClosestWall(x, y);
        if (closest) {
          addOpening({
            id: makeId("opening"),
            type: tool === "door" ? "door" : "window",
            wallId: closest.wall.id,
            position: closest.position,
            width: tool === "door" ? 0.9 : 1.2,
            height: tool === "door" ? 2.1 : 1.2,
            sillHeight: tool === "window" ? 0.9 : undefined,
          });
        }
        return;
      }

      if (tool === "room") {
        // Check closing FIRST with raw coordinates (before snapping moves them away)
        if (roomDrawPoints.length >= 3) {
          const first = roomDrawPoints[0];
          if (distance(first, { x, y }) < ROOM_CLOSE_THRESHOLD) {
            finishRoomDraw();
            return;
          }
        }
        // Snap to wall endpoints and existing room vertices
        const snap = snapToEndpoint(x, y, true);
        addRoomDrawPoint({ x: snap.x, y: snap.y });
        return;
      }

      // Click on empty space = deselect
      if (e.target === e.currentTarget || e.target.getClassName() === "Image") {
        selectElement(null);
        selectWall(null);
      }
    },
    [tool, zoom, panX, panY, addMeasurePoint, selectElement, selectWall, wallDrawStart, setWallDrawStart, addWall, addOpening, floorPlanModel]
  );

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) {
        setPan(e.target.x(), e.target.y());
      }
    },
    [setPan]
  );

  const showImage = viewMode === "image" || viewMode === "both" || !floorPlanModel;
  const showModel = (viewMode === "model" || viewMode === "both") && !!floorPlanModel;
  const imageOpacity = viewMode === "both" ? 0.3 : 1;

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      draggable={tool === "select"}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
      onDragEnd={handleStageDragEnd}
      className="bg-gray-100 dark:bg-zinc-900"
    >
      {/* Grid Layer */}
      <Layer listening={false}>
        <GridLayer width={4000} height={4000} spacing={50} />
      </Layer>

      {/* Floor Plan Image Layer */}
      {showImage && (
        <Layer listening={tool !== "measure"} opacity={imageOpacity}>
          {floorPlanUrl && <FloorPlanImage url={floorPlanUrl} />}
        </Layer>
      )}

      {/* Digital Model Layer */}
      {showModel && floorPlanModel && (
        <Layer>
          {/* Room fills and labels */}
          {floorPlanModel.rooms.map((room) => (
            <RoomLabel key={room.id} room={room} pixelsPerMeter={scale.pixelsPerMeter} />
          ))}
          {/* Walls */}
          {floorPlanModel.walls.map((wall) => (
            <WallSegment2D key={wall.id} wall={wall} pixelsPerMeter={scale.pixelsPerMeter} />
          ))}
          {/* Openings (doors/windows) */}
          {floorPlanModel.openings.map((opening) => {
            const wall = floorPlanModel.walls.find((w) => w.id === opening.wallId);
            if (!wall) return null;
            return <Opening2D key={opening.id} opening={opening} wall={wall} pixelsPerMeter={scale.pixelsPerMeter} />;
          })}
          {/* Snap indicators */}
          {(tool === "wall" || tool === "door" || tool === "window") && floorPlanModel.walls.map((wall) => (
            [wall.start, wall.end].map((pt, i) => (
              <Circle
                key={`${wall.id}-ep-${i}`}
                x={pt.x} y={pt.y} radius={5}
                fill="transparent"
                stroke={tool === "wall" ? "#6f5100" : tool === "door" ? "#b45309" : "#3b82f6"}
                strokeWidth={1.5}
                opacity={0.5}
                listening={false}
              />
            ))
          ))}
          {/* Active snap indicator (red dot) */}
          {snapIndicator && (
            <Circle x={snapIndicator.x} y={snapIndicator.y} radius={7} fill="#ef4444" opacity={0.8} listening={false} />
          )}
        </Layer>
      )}

      {/* Wall drawing preview */}
      {wallDrawStart && (
        <Layer listening={false}>
          <Circle x={wallDrawStart.x} y={wallDrawStart.y} radius={5} fill="#6f5100" />
        </Layer>
      )}

      {/* Room drawing preview */}
      {roomDrawPoints.length > 0 && (
        <Layer listening={false}>
          {/* Lines connecting points */}
          {roomDrawPoints.length >= 2 && (
            <Line
              points={roomDrawPoints.flatMap((p) => [p.x, p.y])}
              stroke="#16a34a"
              strokeWidth={2}
              dash={[6, 3]}
            />
          )}
          {/* Dashed line from last point back to first (closing preview) */}
          {roomDrawPoints.length >= 3 && (
            <Line
              points={[
                roomDrawPoints[roomDrawPoints.length - 1].x, roomDrawPoints[roomDrawPoints.length - 1].y,
                roomDrawPoints[0].x, roomDrawPoints[0].y,
              ]}
              stroke="#16a34a"
              strokeWidth={1}
              dash={[4, 4]}
              opacity={0.5}
            />
          )}
          {/* Vertex dots */}
          {roomDrawPoints.map((pt, i) => (
            <Circle
              key={`rdp-${i}`}
              x={pt.x}
              y={pt.y}
              radius={i === 0 && roomDrawPoints.length >= 3 ? 8 : 4}
              fill={i === 0 && roomDrawPoints.length >= 3 ? "#16a34a" : "#22c55e"}
              stroke="white"
              strokeWidth={i === 0 && roomDrawPoints.length >= 3 ? 2 : 1}
            />
          ))}
          {/* "Click to close" hint near first point */}
          {roomDrawPoints.length >= 3 && (
            <Text
              x={roomDrawPoints[0].x + 12}
              y={roomDrawPoints[0].y - 8}
              text="Click to close"
              fontSize={10}
              fill="#16a34a"
              listening={false}
            />
          )}
        </Layer>
      )}

      {/* Elements Layer (furniture) */}
      <Layer>
        {elements.map((el) => (
          <FurnitureItem key={el.id} element={el} />
        ))}
      </Layer>

      {/* Measurements Layer */}
      <Layer>
        {measurements.map((m) => (
          <MeasurementLine key={m.id} measurement={m} pixelsPerMeter={scale.pixelsPerMeter} />
        ))}
        {measurePoints.length === 1 && (
          <Rect x={measurePoints[0].x - 4} y={measurePoints[0].y - 4} width={8} height={8} fill="red" cornerRadius={4} />
        )}
      </Layer>

      {/* Selected wall endpoints — rendered on top of everything so they're always grabbable */}
      {selectedWallId && floorPlanModel && tool === "select" && (() => {
        const wall = floorPlanModel.walls.find((w) => w.id === selectedWallId);
        if (!wall) return null;
        return (
          <Layer>
            <Circle x={wall.start.x} y={wall.start.y} radius={10} fill="#6f5100" stroke="white" strokeWidth={3}
              draggable onDragEnd={(e) => updateWall(wall.id, { start: { x: e.target.x(), y: e.target.y() } })} />
            <Circle x={wall.end.x} y={wall.end.y} radius={10} fill="#6f5100" stroke="white" strokeWidth={3}
              draggable onDragEnd={(e) => updateWall(wall.id, { end: { x: e.target.x(), y: e.target.y() } })} />
          </Layer>
        );
      })()}

      {/* Calibration Layer */}
      <Layer>
        <ScaleCalibrator />
      </Layer>
    </Stage>
  );
}
