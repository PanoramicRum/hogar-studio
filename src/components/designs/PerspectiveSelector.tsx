"use client";

const PERSPECTIVES = [
  { id: "eye-level", label: "Eye Level", icon: "visibility", description: "Standing view at 1.6m height" },
  { id: "overhead", label: "Overhead", icon: "flight", description: "Bird's eye view from above" },
  { id: "corner", label: "Corner", icon: "crop_free", description: "Wide-angle from room corner" },
  { id: "window", label: "Window View", icon: "window", description: "Looking in from the window" },
  { id: "doorway", label: "Doorway", icon: "door_front", description: "Entering through the door" },
  { id: "detail", label: "Detail", icon: "zoom_in", description: "Close-up of furniture arrangement" },
];

interface PerspectiveSelectorProps {
  selectedPerspective: string;
  onSelect: (perspectiveId: string) => void;
}

export function PerspectiveSelector({ selectedPerspective, onSelect }: PerspectiveSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Perspective</label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PERSPECTIVES.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            title={p.description}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all ${
              selectedPerspective === p.id
                ? "ring-2 ring-[#6f5100] shadow-sm"
                : "surface-container-low hover:shadow-ambient"
            }`}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: "20px",
              color: selectedPerspective === p.id ? "#6f5100" : undefined,
            }}>{p.icon}</span>
            <span className={`text-[10px] ${selectedPerspective === p.id ? "font-semibold text-[#6f5100]" : "text-muted-foreground"}`}>
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { PERSPECTIVES };
