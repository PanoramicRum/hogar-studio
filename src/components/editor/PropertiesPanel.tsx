"use client";

import { useTranslations } from "next-intl";
import { useEditorStore } from "@/stores/editorStore";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import { wallLength } from "@/lib/geometry";

export function PropertiesPanel() {
  const t = useTranslations("editor");
  const {
    selectedElementId, elements, updateElement, removeElement, duplicateElement, scale,
    selectedWallId, selectedOpeningId, floorPlanModel,
    updateWall, removeWall, updateOpening, removeOpening, updateRoom, removeRoom,
    selectWall, selectOpening,
  } = useEditorStore();
  const { getFurnitureColor } = usePackageRegistry();

  // ─── Wall selected ────────────────────────────────
  if (selectedWallId && floorPlanModel) {
    const wall = floorPlanModel.walls.find((w) => w.id === selectedWallId);
    if (wall) {
      const lengthM = wallLength(wall) / scale.pixelsPerMeter;
      return (
        <div className="w-64 surface-container-low p-5 space-y-5 hidden lg:block overflow-y-auto">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6f5100" }}>border_all</span>
              Wall Properties
            </h3>
            <p className="text-xs text-muted-foreground">Length: {lengthM.toFixed(2)}m</p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Height (m)</label>
            <input type="number" step="0.1" value={wall.height}
              onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) || 2.8 })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono mt-1" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Thickness (px)</label>
            <input type="number" step="1" min="2" max="20" value={wall.thickness}
              onChange={(e) => updateWall(wall.id, { thickness: parseInt(e.target.value) || 8 })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono mt-1" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Start Point</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input type="number" step="1" value={Math.round(wall.start.x)}
                onChange={(e) => updateWall(wall.id, { start: { ...wall.start, x: parseFloat(e.target.value) } })}
                className="input-ghost px-2 py-1.5 text-xs rounded font-mono" />
              <input type="number" step="1" value={Math.round(wall.start.y)}
                onChange={(e) => updateWall(wall.id, { start: { ...wall.start, y: parseFloat(e.target.value) } })}
                className="input-ghost px-2 py-1.5 text-xs rounded font-mono" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">End Point</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input type="number" step="1" value={Math.round(wall.end.x)}
                onChange={(e) => updateWall(wall.id, { end: { ...wall.end, x: parseFloat(e.target.value) } })}
                className="input-ghost px-2 py-1.5 text-xs rounded font-mono" />
              <input type="number" step="1" value={Math.round(wall.end.y)}
                onChange={(e) => updateWall(wall.id, { end: { ...wall.end, y: parseFloat(e.target.value) } })}
                className="input-ghost px-2 py-1.5 text-xs rounded font-mono" />
            </div>
          </div>

          <button onClick={() => { removeWall(wall.id); selectWall(null); }}
            className="w-full py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
            Delete Wall
          </button>
        </div>
      );
    }
  }

  // ─── Opening selected (door/window) ────────────────
  if (selectedOpeningId && floorPlanModel) {
    const opening = floorPlanModel.openings.find((o) => o.id === selectedOpeningId);
    if (opening) {
      const isDoor = opening.type === "door" || opening.type === "balcony";
      return (
        <div className="w-64 surface-container-low p-5 space-y-5 hidden lg:block overflow-y-auto">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: isDoor ? "#b45309" : "#3b82f6" }}>
                {isDoor ? "door_front" : "window"}
              </span>
              {opening.type.charAt(0).toUpperCase() + opening.type.slice(1)} Properties
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Type</label>
            <select
              value={opening.type}
              onChange={(e) => updateOpening(opening.id, { type: e.target.value as "door" | "window" | "balcony" })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg"
            >
              <option value="door">Door</option>
              <option value="window">Window</option>
              <option value="balcony">Balcony</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Width (m)</label>
              <input type="number" step="0.1" value={opening.width}
                onChange={(e) => updateOpening(opening.id, { width: parseFloat(e.target.value) || 0.9 })}
                className="input-ghost w-full px-2 py-1.5 text-xs rounded font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Height (m)</label>
              <input type="number" step="0.1" value={opening.height}
                onChange={(e) => updateOpening(opening.id, { height: parseFloat(e.target.value) || 2.1 })}
                className="input-ghost w-full px-2 py-1.5 text-xs rounded font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Position along wall (0-1)</label>
            <input type="range" min="0.05" max="0.95" step="0.01" value={opening.position}
              onChange={(e) => updateOpening(opening.id, { position: parseFloat(e.target.value) })}
              className="w-full accent-[#6f5100]" />
            <span className="text-[10px] font-mono text-muted-foreground">{(opening.position * 100).toFixed(0)}%</span>
          </div>

          {opening.type === "window" && (
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Sill height (m)</label>
              <input type="number" step="0.1" value={opening.sillHeight || 0.9}
                onChange={(e) => updateOpening(opening.id, { sillHeight: parseFloat(e.target.value) })}
                className="input-ghost w-full px-2 py-1.5 text-xs rounded font-mono" />
            </div>
          )}

          <button onClick={() => { removeOpening(opening.id); selectOpening(null); }}
            className="w-full py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
            Delete {opening.type}
          </button>
        </div>
      );
    }
  }

  // ─── Room selected (via clicking a room label) ────
  const selectedRoomId = useEditorStore.getState().selectedWallId?.startsWith("room-") ? useEditorStore.getState().selectedWallId : null;
  if (selectedRoomId && floorPlanModel) {
    const room = floorPlanModel.rooms.find((r) => r.id === selectedRoomId);
    if (room) {
      const areaPx = room.points.reduce((a, p, i) => {
        const j = (i + 1) % room.points.length;
        return a + (p.x * room.points[j].y - room.points[j].x * p.y);
      }, 0);
      const areaM2 = Math.abs(areaPx) / 2 / (scale.pixelsPerMeter * scale.pixelsPerMeter);

      return (
        <div className="w-64 surface-container-low p-5 space-y-5 hidden lg:block overflow-y-auto">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6f5100" }}>meeting_room</span>
              Room Properties
            </h3>
            <p className="text-xs text-muted-foreground">Area: {areaM2.toFixed(1)} m²</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Room Name</label>
            <input value={room.name} onChange={(e) => updateRoom(room.id, { name: e.target.value })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={room.color} onChange={(e) => updateRoom(room.id, { color: e.target.value })}
                className="w-8 h-8 rounded border-0 cursor-pointer" />
              <span className="text-xs font-mono text-muted-foreground">{room.color}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {room.points.length} vertices
          </div>

          <button onClick={() => { removeRoom(room.id); selectWall(null); }}
            className="w-full py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
            Delete Room
          </button>
        </div>
      );
    }
  }

  // ─── Furniture element selected ───────────────────
  const element = elements.find((e) => e.id === selectedElementId);

  if (!element) {
    return (
      <div className="w-64 surface-container-low p-5 hidden lg:block">
        <h3 className="font-bold text-sm mb-2">Properties</h3>
        <p className="text-xs text-muted-foreground">
          Select an element, wall, or room to edit its properties
        </p>
        {floorPlanModel && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Model Summary</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>border_all</span>
                {floorPlanModel.walls.length} walls
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>meeting_room</span>
                {floorPlanModel.rooms.length} rooms
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>door_front</span>
                {floorPlanModel.openings.filter((o) => o.type === "door").length} doors
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>window</span>
                {floorPlanModel.openings.filter((o) => o.type === "window").length} windows
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>balcony</span>
                {floorPlanModel.openings.filter((o) => o.type === "balcony").length} balconies
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const widthM = element.width / scale.pixelsPerMeter;
  const heightM = element.height / scale.pixelsPerMeter;
  const posXM = element.x / scale.pixelsPerMeter;
  const posYM = element.y / scale.pixelsPerMeter;
  const elementColor = element.color || getFurnitureColor(element.type);

  return (
    <div className="w-64 surface-container-low p-5 space-y-5 hidden lg:block overflow-y-auto">
      <div>
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6f5100" }}>chair</span>
          Furniture Properties
        </h3>
        <p className="text-xs text-muted-foreground">Editing &ldquo;{element.name}&rdquo;</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("name")}</label>
        <input value={element.name} onChange={(e) => updateElement(element.id, { name: e.target.value })}
          className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Dimensions</label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <span className="text-[10px] text-muted-foreground">Width (m)</span>
            <input type="number" step="0.01" value={widthM.toFixed(2)}
              onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) * scale.pixelsPerMeter })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Depth (m)</span>
            <input type="number" step="0.01" value={heightM.toFixed(2)}
              onChange={(e) => updateElement(element.id, { height: parseFloat(e.target.value) * scale.pixelsPerMeter })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Position (m)</label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <span className="text-[10px] text-muted-foreground">X</span>
            <input type="number" step="0.01" value={posXM.toFixed(2)}
              onChange={(e) => updateElement(element.id, { x: parseFloat(e.target.value) * scale.pixelsPerMeter })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Y</span>
            <input type="number" step="0.01" value={posYM.toFixed(2)}
              onChange={(e) => updateElement(element.id, { y: parseFloat(e.target.value) * scale.pixelsPerMeter })}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Appearance</label>
        <div className="space-y-3 mt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color</span>
            <input type="color" value={elementColor} onChange={(e) => updateElement(element.id, { color: e.target.value })}
              className="w-8 h-8 rounded-full border-0 cursor-pointer" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Opacity</span>
              <span className="text-xs font-mono text-muted-foreground">{Math.round((element.opacity ?? 1) * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="1" step="0.05" value={element.opacity ?? 1}
              onChange={(e) => updateElement(element.id, { opacity: parseFloat(e.target.value) })}
              className="w-full mt-1 accent-[#6f5100]" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("rotation")} (°)</label>
        <input type="number" step="1" value={Math.round(element.rotation)}
          onChange={(e) => updateElement(element.id, { rotation: parseFloat(e.target.value) || 0 })}
          className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
      </div>

      {element.furnitureUrl !== undefined && (
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("furnitureLink")}</label>
          <input value={element.furnitureUrl || ""} placeholder="https://..."
            onChange={(e) => updateElement(element.id, { furnitureUrl: e.target.value })}
            className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
        </div>
      )}

      <div className="space-y-2 pt-2">
        <button onClick={() => removeElement(element.id)}
          className="w-full py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
          Delete
        </button>
        <button onClick={() => duplicateElement(element.id)}
          className="w-full py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors" style={{ color: "#6f5100" }}>
          Duplicate
        </button>
      </div>
    </div>
  );
}
