"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { makeId } from "@/lib/geometry";

/**
 * Floating input that appears when the user has placed the first point of a wall.
 * Lets them type an exact length in meters — Enter creates the wall at that length
 * in the direction of their last mouse movement.
 */
export function WallLengthInput() {
  const { wallDrawStart, scale, floorPlanModel, addWall, setWallDrawStart, tool } = useEditorStore();
  const [length, setLength] = useState("");
  const [direction, setDirection] = useState(0); // radians
  const inputRef = useRef<HTMLInputElement>(null);

  // Track mouse to get wall direction
  useEffect(() => {
    if (!wallDrawStart) return;
    function handleMouseMove(e: MouseEvent) {
      if (!wallDrawStart) return;
      // Get canvas-relative coordinates (approximate — works for direction)
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const zoom = useEditorStore.getState().zoom;
      const panX = useEditorStore.getState().panX;
      const panY = useEditorStore.getState().panY;
      const x = (e.clientX - rect.left - panX) / zoom;
      const y = (e.clientY - rect.top - panY) / zoom;
      setDirection(Math.atan2(y - wallDrawStart.y, x - wallDrawStart.x));
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [wallDrawStart]);

  // Focus input when it appears
  useEffect(() => {
    if (wallDrawStart && inputRef.current) {
      inputRef.current.focus();
    }
  }, [wallDrawStart]);

  if (!wallDrawStart || tool !== "wall") return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const meters = parseFloat(length);
    if (!meters || meters <= 0 || !wallDrawStart || !scale.calibrated) return;

    const pixels = meters * scale.pixelsPerMeter;
    const end = {
      x: wallDrawStart.x + pixels * Math.cos(direction),
      y: wallDrawStart.y + pixels * Math.sin(direction),
    };

    addWall({
      id: makeId("wall"),
      start: wallDrawStart,
      end,
      thickness: 8,
      height: floorPlanModel?.wallHeight || 2.8,
    });
    setWallDrawStart(null);
    setLength("");
  }

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-background/95 backdrop-blur-sm shadow-ambient rounded-lg px-3 py-2">
        <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "16px" }}>straighten</span>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0.01"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          placeholder="Length (m)"
          className="input-ghost w-24 px-2 py-1 text-sm rounded font-mono text-center"
        />
        <span className="text-xs text-muted-foreground">m</span>
        <button type="submit" disabled={!length || !scale.calibrated}
          className="px-2 py-1 text-xs font-semibold text-white rounded disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
          Enter
        </button>
        <span className="text-[10px] text-muted-foreground">or click endpoint</span>
      </form>
    </div>
  );
}
