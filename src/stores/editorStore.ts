import { create } from "zustand";
import type { EditorTool, EditorElement, Measurement, ScaleConfig, ViewMode } from "@/types/editor";
import type { FloorPlanModel, WallSegment, Opening, RoomPolygon } from "@/types/floorplan";

interface EditorState {
  // Canvas state
  zoom: number;
  panX: number;
  panY: number;

  // Tool state
  tool: EditorTool;
  selectedElementId: string | null;

  // Floor plan
  floorPlanUrl: string | null;
  floorPlanImageId: string | null;

  // Scale calibration
  scale: ScaleConfig;
  calibrationPoints: { x: number; y: number }[];

  // Elements
  elements: EditorElement[];

  // Measurements
  measurements: Measurement[];
  measurePoints: { x: number; y: number }[];

  // Undo/redo
  history: HistorySnapshot[];
  historyIndex: number;

  // Floor plan model (digital)
  floorPlanModel: FloorPlanModel | null;
  viewMode: ViewMode;
  selectedWallId: string | null;
  selectedOpeningId: string | null;
  wallDrawStart: { x: number; y: number } | null;
  roomDrawPoints: { x: number; y: number }[];

  // Dirty flag
  isDirty: boolean;

  // Actions
  setTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setFloorPlan: (url: string, imageId: string) => void;
  setScale: (scale: ScaleConfig) => void;
  addCalibrationPoint: (point: { x: number; y: number }) => void;
  resetCalibration: () => void;
  selectElement: (id: string | null) => void;
  addElement: (element: EditorElement) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  addMeasurePoint: (point: { x: number; y: number }) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  loadElements: (elements: EditorElement[]) => void;
  undo: () => void;
  redo: () => void;
  setDirty: (dirty: boolean) => void;

  // Floor plan model actions
  setFloorPlanModel: (model: FloorPlanModel | null) => void;
  setViewMode: (mode: ViewMode) => void;
  selectWall: (id: string | null) => void;
  selectOpening: (id: string | null) => void;
  addWall: (wall: WallSegment) => void;
  updateWall: (id: string, updates: Partial<WallSegment>) => void;
  removeWall: (id: string) => void;
  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  removeOpening: (id: string) => void;
  addRoom: (room: RoomPolygon) => void;
  updateRoom: (id: string, updates: Partial<RoomPolygon>) => void;
  removeRoom: (id: string) => void;
  setWallDrawStart: (point: { x: number; y: number } | null) => void;
  addRoomDrawPoint: (point: { x: number; y: number }) => void;
  finishRoomDraw: () => void;
  cancelRoomDraw: () => void;
  createEmptyModel: () => void;
}

interface HistorySnapshot {
  elements: EditorElement[];
  floorPlanModel: FloorPlanModel | null;
}

function takeSnapshot(state: EditorState): HistorySnapshot {
  return JSON.parse(JSON.stringify({ elements: state.elements, floorPlanModel: state.floorPlanModel }));
}

function pushHistory(state: EditorState): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(takeSnapshot(state));
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  tool: "select",
  selectedElementId: null,
  floorPlanUrl: null,
  floorPlanImageId: null,
  scale: { pixelsPerMeter: 100, calibrated: false },
  calibrationPoints: [],
  elements: [],
  measurements: [],
  measurePoints: [],
  history: [{ elements: [], floorPlanModel: null }],
  historyIndex: 0,
  isDirty: false,
  floorPlanModel: null,
  viewMode: "image" as ViewMode,
  selectedWallId: null,
  selectedOpeningId: null,
  wallDrawStart: null,
  roomDrawPoints: [],

  setTool: (tool) => set({ tool, selectedElementId: null, measurePoints: [], wallDrawStart: null, roomDrawPoints: [] }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setFloorPlan: (url, imageId) => set({ floorPlanUrl: url, floorPlanImageId: imageId }),

  setScale: (scale) => set({ scale }),

  addCalibrationPoint: (point) => {
    const pts = get().calibrationPoints;
    if (pts.length < 2) {
      set({ calibrationPoints: [...pts, point] });
    }
  },

  resetCalibration: () => set({ calibrationPoints: [], scale: { pixelsPerMeter: 100, calibrated: false } }),

  selectElement: (id) => set({ selectedElementId: id }),

  addElement: (element) => {
    const state = get();
    const newElements = [...state.elements, element];
    set({ elements: newElements, ...pushHistory({ ...state, elements: newElements }) });
  },

  updateElement: (id, updates) => {
    const state = get();
    const newElements = state.elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    set({ elements: newElements, isDirty: true });
  },

  removeElement: (id) => {
    const state = get();
    const newElements = state.elements.filter((el) => el.id !== id);
    set({
      elements: newElements,
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      ...pushHistory({ ...state, elements: newElements }),
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const original = state.elements.find((el) => el.id === id);
    if (!original) return;
    const duplicate: EditorElement = {
      ...original,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${original.name} (copy)`,
      x: original.x + 20,
      y: original.y + 20,
    };
    const newElements = [...state.elements, duplicate];
    set({
      elements: newElements,
      selectedElementId: duplicate.id,
      ...pushHistory({ ...state, elements: newElements }),
    });
  },

  addMeasurePoint: (point) => {
    const pts = get().measurePoints;
    if (pts.length === 0) {
      set({ measurePoints: [point] });
    } else {
      const start = pts[0];
      const measurement: Measurement = {
        id: `m-${Date.now()}`,
        start,
        end: point,
      };
      set({
        measurements: [...get().measurements, measurement],
        measurePoints: [],
      });
    }
  },

  removeMeasurement: (id) => {
    set({ measurements: get().measurements.filter((m) => m.id !== id) });
  },

  clearMeasurements: () => set({ measurements: [], measurePoints: [] }),

  loadElements: (elements) => {
    const model = get().floorPlanModel;
    set({ elements, history: [{ elements, floorPlanModel: model }], historyIndex: 0, isDirty: false });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = JSON.parse(JSON.stringify(history[newIndex])) as HistorySnapshot;
      set({
        elements: snapshot.elements,
        floorPlanModel: snapshot.floorPlanModel,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const snapshot = JSON.parse(JSON.stringify(history[newIndex])) as HistorySnapshot;
      set({
        elements: snapshot.elements,
        floorPlanModel: snapshot.floorPlanModel,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  setDirty: (isDirty) => set({ isDirty }),

  // Floor plan model actions
  setFloorPlanModel: (model) => set({ floorPlanModel: model, isDirty: true }),
  setViewMode: (viewMode) => set({ viewMode }),
  selectWall: (id) => set({ selectedWallId: id, selectedOpeningId: null, selectedElementId: null }),
  selectOpening: (id) => set({ selectedOpeningId: id, selectedWallId: null, selectedElementId: null }),
  setWallDrawStart: (point) => set({ wallDrawStart: point }),

  addRoomDrawPoint: (point) => set({ roomDrawPoints: [...get().roomDrawPoints, point] }),

  cancelRoomDraw: () => set({ roomDrawPoints: [] }),

  finishRoomDraw: () => {
    const state = get();
    const model = state.floorPlanModel;
    const pts = state.roomDrawPoints;
    if (!model || pts.length < 3) { set({ roomDrawPoints: [] }); return; }

    const colors = ["#dbeafe", "#fef3c7", "#d1fae5", "#fce7f3", "#e0e7ff", "#fde68a", "#bbf7d0"];
    const newRoom: RoomPolygon = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Room ${model.rooms.length + 1}`,
      points: pts,
      color: colors[model.rooms.length % colors.length],
    };

    // Auto-create walls for each edge of the room polygon
    const WALL_MATCH_THRESHOLD = 12;
    const newWalls: WallSegment[] = [];
    for (let i = 0; i < pts.length; i++) {
      const start = pts[i];
      const end = pts[(i + 1) % pts.length];
      // Check if a wall already exists between these two points
      const existsAlready = model.walls.some((w) => {
        const d1 = Math.sqrt((w.start.x - start.x) ** 2 + (w.start.y - start.y) ** 2);
        const d2 = Math.sqrt((w.end.x - end.x) ** 2 + (w.end.y - end.y) ** 2);
        const d3 = Math.sqrt((w.start.x - end.x) ** 2 + (w.start.y - end.y) ** 2);
        const d4 = Math.sqrt((w.end.x - start.x) ** 2 + (w.end.y - start.y) ** 2);
        return (d1 < WALL_MATCH_THRESHOLD && d2 < WALL_MATCH_THRESHOLD) ||
               (d3 < WALL_MATCH_THRESHOLD && d4 < WALL_MATCH_THRESHOLD);
      });
      if (!existsAlready) {
        newWalls.push({
          id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          thickness: 8,
          height: model.wallHeight || 2.8,
        });
      }
    }

    const newModel = {
      ...model,
      rooms: [...model.rooms, newRoom],
      walls: [...model.walls, ...newWalls],
    };
    set({ floorPlanModel: newModel, roomDrawPoints: [], ...pushHistory({ ...state, floorPlanModel: newModel }) });
  },

  createEmptyModel: () => {
    const state = get();
    const newModel = { walls: [], rooms: [], openings: [], wallHeight: 2.8 } as FloorPlanModel;
    set({
      floorPlanModel: newModel,
      viewMode: "both" as ViewMode,
      ...pushHistory({ ...state, floorPlanModel: newModel }),
    });
  },

  addWall: (wall) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, walls: [...model.walls, wall] };
    set({ floorPlanModel: newModel, ...pushHistory({ ...state, floorPlanModel: newModel }) });
  },
  updateWall: (id, updates) => {
    const model = get().floorPlanModel;
    if (!model) return;
    set({
      floorPlanModel: { ...model, walls: model.walls.map((w) => w.id === id ? { ...w, ...updates } : w) },
      isDirty: true,
    });
  },
  removeWall: (id) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, walls: model.walls.filter((w) => w.id !== id), openings: model.openings.filter((o) => o.wallId !== id) };
    set({
      floorPlanModel: newModel,
      selectedWallId: state.selectedWallId === id ? null : state.selectedWallId,
      ...pushHistory({ ...state, floorPlanModel: newModel }),
    });
  },

  addOpening: (opening) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, openings: [...model.openings, opening] };
    set({ floorPlanModel: newModel, ...pushHistory({ ...state, floorPlanModel: newModel }) });
  },
  updateOpening: (id, updates) => {
    const model = get().floorPlanModel;
    if (!model) return;
    set({
      floorPlanModel: { ...model, openings: model.openings.map((o) => o.id === id ? { ...o, ...updates } : o) },
      isDirty: true,
    });
  },
  removeOpening: (id) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, openings: model.openings.filter((o) => o.id !== id) };
    set({
      floorPlanModel: newModel,
      selectedOpeningId: state.selectedOpeningId === id ? null : state.selectedOpeningId,
      ...pushHistory({ ...state, floorPlanModel: newModel }),
    });
  },

  addRoom: (room) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, rooms: [...model.rooms, room] };
    set({ floorPlanModel: newModel, ...pushHistory({ ...state, floorPlanModel: newModel }) });
  },
  updateRoom: (id, updates) => {
    const model = get().floorPlanModel;
    if (!model) return;
    set({
      floorPlanModel: { ...model, rooms: model.rooms.map((r) => r.id === id ? { ...r, ...updates } : r) },
      isDirty: true,
    });
  },
  removeRoom: (id) => {
    const state = get();
    const model = state.floorPlanModel;
    if (!model) return;
    const newModel = { ...model, rooms: model.rooms.filter((r) => r.id !== id) };
    set({ floorPlanModel: newModel, ...pushHistory({ ...state, floorPlanModel: newModel }) });
  },
}));
