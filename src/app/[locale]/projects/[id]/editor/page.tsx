"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useGuest } from "@/components/providers/GuestProvider";
import { useEditorStore } from "@/stores/editorStore";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { FurniturePalette } from "@/components/editor/FurniturePalette";
import { CalibrationDialog } from "@/components/editor/CalibrationDialog";
import { toast } from "sonner";
import { useAIReady } from "@/hooks/useAIReady";
import { AISetupPrompt } from "@/components/designs/AISetupPrompt";

// Konva must be loaded client-side only (no SSR)
const FloorPlanCanvas = dynamic(
  () => import("@/components/editor/FloorPlanCanvas").then((m) => ({ default: m.FloorPlanCanvas })),
  { ssr: false }
);

export default function EditorPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [saving, setSaving] = useState(false);
  const [digitizing, setDigitizing] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const { hasDigitization } = useAIReady();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    tool, floorPlanUrl, elements, calibrationPoints, scale,
    setFloorPlan, loadElements, setDirty, setFloorPlanModel, setViewMode,
  } = useEditorStore();

  // Resize canvas to fill container
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load project data
  const { getProject: getGuestProject } = useGuest();

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (!isGuest && status !== "authenticated") return;

    if (isGuest) {
      // Load from guest context
      const gp = getGuestProject(projectId);
      if (gp) {
        const floorPlan = gp.images.find((img) => img.type === "FLOOR_PLAN") || gp.images[0];
        if (floorPlan) setFloorPlan(floorPlan.url, floorPlan.id);
        loadElements(gp.elements.map((el) => ({
          id: el.id, name: el.name, type: el.type,
          x: el.positionX || 0, y: el.positionY || 0,
          width: el.width || 50, height: el.height || 50,
          rotation: el.rotation || 0, furnitureUrl: el.furnitureUrl || undefined,
        })));
      }
      return;
    }

    // Load from API
    fetch(`/api/projects/${projectId}/images`)
      .then((r) => r.json())
      .then((images: { id: string; type: string; url: string }[]) => {
        const floorPlan = images.find((img) => img.type === "FLOOR_PLAN") || images[0];
        if (floorPlan) setFloorPlan(floorPlan.url, floorPlan.id);
      });

    fetch(`/api/projects/${projectId}/elements`)
      .then((r) => r.json())
      .then((els: { id: string; name: string; type: string; positionX: number; positionY: number; width: number; height: number; rotation: number; furnitureUrl: string | null }[]) => {
        loadElements(els.map((el) => ({
          id: el.id, name: el.name, type: el.type,
          x: el.positionX || 0, y: el.positionY || 0,
          width: el.width || 50, height: el.height || 50,
          rotation: el.rotation || 0, furnitureUrl: el.furnitureUrl || undefined,
        })));
      });
  }, [status, projectId, router, setFloorPlan, loadElements, isGuest, getGuestProject]);

  // Save elements
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/elements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements }),
      });
      if (res.ok) {
        setDirty(false);
        toast.success("Layout saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  }, [projectId, elements, setDirty]);

  // Digitize floor plan
  const handleDigitize = useCallback(async () => {
    if (!floorPlanUrl) return;
    if (!hasDigitization) {
      setShowAISetup(true);
      return;
    }
    setDigitizing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isGuest) headers["x-guest-mode"] = "true";

      const res = await fetch("/api/ai/digitize-floorplan", {
        method: "POST",
        headers,
        body: JSON.stringify({ imageUrl: floorPlanUrl }),
      });

      if (res.ok) {
        const model = await res.json();
        setFloorPlanModel(model);
        setViewMode("model");
        toast.success("Floor plan digitized!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Digitization failed");
      }
    } catch {
      toast.error("Digitization failed");
    }
    setDigitizing(false);
  }, [floorPlanUrl, isGuest, hasDigitization, setFloorPlanModel, setViewMode]);

  function handleCreateManualModel() {
    useEditorStore.getState().createEmptyModel();
    useEditorStore.getState().setTool("wall");
    toast.success("Manual model started — draw walls on the floor plan image");
  }

  function handleDetectRooms() {
    const { detectRoomsFromWalls } = require("@/lib/geometry");
    const { makeId } = require("@/lib/geometry");
    const state = useEditorStore.getState();
    const model = state.floorPlanModel;
    if (!model || model.walls.length < 3) {
      toast.error("Need at least 3 walls to detect rooms");
      return;
    }

    const roomColors = ["#dbeafe", "#fef3c7", "#d1fae5", "#fce7f3", "#e0e7ff", "#fde68a", "#bbf7d0", "#fbcfe8"];
    const polygons = detectRoomsFromWalls(model.walls);

    if (polygons.length === 0) {
      toast.info("No enclosed areas found. Make sure walls connect at their endpoints.");
      return;
    }

    // Remove existing auto-detected rooms, keep manually named ones
    const manualRooms = model.rooms.filter((r) => !r.name.startsWith("Room "));

    const newRooms = polygons.map((pts: { x: number; y: number }[], i: number) => ({
      id: makeId("room"),
      name: `Room ${i + 1}`,
      points: pts,
      color: roomColors[i % roomColors.length],
    }));

    state.setFloorPlanModel({
      ...model,
      rooms: [...manualRooms, ...newRooms],
    });

    toast.success(`Detected ${newRooms.length} room(s)!`);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = useEditorStore.getState();
        if (s.selectedElementId) {
          s.removeElement(s.selectedElementId);
        } else if (s.selectedWallId) {
          const isRoom = s.floorPlanModel?.rooms.find((r) => r.id === s.selectedWallId);
          if (isRoom) s.removeRoom(s.selectedWallId);
          else s.removeWall(s.selectedWallId);
          s.selectWall(null);
        } else if (s.selectedOpeningId) {
          s.removeOpening(s.selectedOpeningId);
          s.selectOpening(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      const { isDirty } = useEditorStore.getState();
      if (isDirty) handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleSave]);

  // Handle calibration clicks on canvas
  useEffect(() => {
    function handleCalibrationClick(e: MouseEvent) {
      if (calibrationPoints.length < 2 && tool === "select") {
        // This is handled via the canvas click in FloorPlanCanvas
      }
    }
    // Calibration is handled through the store
  }, [calibrationPoints, tool]);

  if (status === "loading") return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <EditorToolbar onSave={handleSave} onDigitize={handleDigitize} onManualModel={handleCreateManualModel} onDetectRooms={handleDetectRooms} saving={saving} digitizing={digitizing} />

      {/* Calibration banner */}
      {floorPlanUrl && !scale.calibrated && (
        <div className="px-4 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(111,81,0,0.06)", color: "#6f5100" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>straighten</span>
          <span className="font-medium">Calibrate your scale:</span>
          <span className="text-muted-foreground">Click &ldquo;Calibrate scale&rdquo; at the bottom-left, then click two points on a known dimension.</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        {/* Furniture palette (when furniture tool active) */}
        {tool === "furniture" && <FurniturePalette />}

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 min-h-0 relative">
          {canvasSize.width > 0 && canvasSize.height > 0 && (
            <FloorPlanCanvas width={canvasSize.width} height={canvasSize.height} />
          )}

          {/* Scale indicator */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur border rounded px-3 py-1.5 text-xs z-10">
            {useEditorStore.getState().scale.calibrated ? (
              <span>1m = {Math.round(useEditorStore.getState().scale.pixelsPerMeter)}px</span>
            ) : (
              <button
                className="text-amber-700 hover:underline"
                onClick={() => {
                  toast.info("Click two points on a known dimension to calibrate");
                  useEditorStore.getState().resetCalibration();
                }}
              >
                Calibrate scale
              </button>
            )}
          </div>

          {/* Calibration dialog */}
          <CalibrationDialog />

          {/* No floor plan message */}
          {!floorPlanUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-muted-foreground">
                <span className="material-symbols-outlined mb-3" style={{ fontSize: "48px" }}>architecture</span>
                <p className="text-lg mb-2">No floor plan uploaded</p>
                <p className="text-sm">Upload a floor plan image in the project overview first</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties panel */}
        <PropertiesPanel />
      </div>

      {/* AI Setup prompt */}
      {showAISetup && (
        <AISetupPrompt feature="digitize floor plans" onClose={() => setShowAISetup(false)} />
      )}
    </div>
  );
}
