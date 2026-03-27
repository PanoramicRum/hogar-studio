"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import type { EditorTool } from "@/types/editor";

interface EditorToolbarProps {
  onSave: () => void;
  onDigitize: () => void;
  onManualModel: () => void;
  onDetectRooms: () => void;
  saving: boolean;
  digitizing: boolean;
}

export function EditorToolbar({ onSave, onDigitize, onManualModel, onDetectRooms, saving, digitizing }: EditorToolbarProps) {
  const t = useTranslations("editor");
  const { tool, setTool, zoom, setZoom, undo, redo, isDirty, floorPlanModel, viewMode, setViewMode, floorPlanUrl } = useEditorStore();

  const baseTools: { id: EditorTool; label: string; icon: string }[] = [
    { id: "select", label: t("select"), icon: "near_me" },
    { id: "measure", label: t("measure"), icon: "straighten" },
    { id: "furniture", label: t("addFurniture"), icon: "chair" },
  ];

  const modelTools: { id: EditorTool; label: string; icon: string }[] = [
    { id: "wall", label: "Wall", icon: "border_all" },
    { id: "door", label: "Door", icon: "door_front" },
    { id: "window", label: "Window", icon: "window" },
    { id: "room", label: "Room", icon: "meeting_room" },
  ];

  const allTools = floorPlanModel ? [...baseTools, ...modelTools] : baseTools;

  return (
    <div className="flex items-center gap-1 p-2 surface-container-low flex-wrap">
      {/* Tool buttons */}
      <div className="flex gap-0.5 pr-2 mr-1" style={{ borderRight: "1px solid rgba(209,197,178,0.2)" }}>
        {allTools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tool === t.id
                ? "text-white"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
            style={tool === t.id ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
            <span className="hidden md:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* View mode toggle (only when model exists) */}
      {floorPlanModel && (
        <div className="flex rounded-full p-0.5 mr-2" style={{ background: "var(--muted)" }}>
          {(["image", "both", "model"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-all capitalize ${
                viewMode === mode ? "text-white shadow-sm" : "text-muted-foreground"
              }`}
              style={viewMode === mode ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
            >
              {mode === "both" ? "Overlay" : mode === "image" ? "Image" : "Model"}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 pr-2 mr-1" style={{ borderRight: "1px solid rgba(209,197,178,0.2)" }}>
        <Button variant="outline" size="sm" onClick={() => setZoom(zoom / 1.2)}>-</Button>
        <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={() => setZoom(zoom * 1.2)}>+</Button>
        <button onClick={() => { setZoom(1); useEditorStore.getState().setPan(0, 0); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50" title="Reset view">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>fit_screen</span>
        </button>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-0.5 pr-2 mr-1" style={{ borderRight: "1px solid rgba(209,197,178,0.2)" }}>
        <button onClick={undo} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50" title={t("undo")}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>undo</span>
        </button>
        <button onClick={redo} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50" title={t("redo")}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>redo</span>
        </button>
      </div>

      {/* Model creation buttons (when no model exists) */}
      {floorPlanUrl && !floorPlanModel && (
        <div className="flex gap-1">
          <button
            onClick={onManualModel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-[#6f5100] hover:bg-[#6f5100]/5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>draw</span>
            Manual
          </button>
          <button
            onClick={onDigitize}
            disabled={digitizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-[#6f5100] hover:bg-[#6f5100]/5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>auto_awesome</span>
            {digitizing ? "Analyzing..." : "AI Digitize"}
          </button>
        </div>
      )}

      {/* Hint when model is empty */}
      {floorPlanModel && floorPlanModel.walls.length === 0 && (
        <span className="text-[10px] text-muted-foreground hidden md:inline">
          Select Wall tool → click two points to draw
        </span>
      )}

      {/* Hint for door/window tools */}
      {(tool === "door" || tool === "window") && floorPlanModel && floorPlanModel.walls.length > 0 && (
        <span className="text-[10px] text-muted-foreground hidden md:inline">
          Click on a wall to place a {tool}
        </span>
      )}

      {/* Hint for room tool */}
      {tool === "room" && floorPlanModel && (
        <span className="text-[10px] text-muted-foreground hidden md:inline">
          Click corners to draw room. Click near first point to close.
        </span>
      )}

      {/* Detect Rooms button */}
      {floorPlanModel && floorPlanModel.walls.length >= 3 && (
        <button
          onClick={onDetectRooms}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-[#6f5100] hover:bg-[#6f5100]/5"
          title="Auto-detect enclosed rooms from walls"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>meeting_room</span>
          <span className="hidden md:inline">Detect Rooms</span>
        </button>
      )}

      {/* Save */}
      <div className="ml-auto flex gap-2 items-center">
        {isDirty && <span className="text-xs text-amber-600">Unsaved</span>}
        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
        >
          {saving ? t("save") + "..." : t("save")}
        </button>
      </div>
    </div>
  );
}
