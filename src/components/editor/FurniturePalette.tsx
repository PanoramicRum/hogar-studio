"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import { useGuest } from "@/components/providers/GuestProvider";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";

const FURNITURE_ICONS: Record<string, string> = {
  sofa: "weekend", "sofa-bed": "weekend", bed: "bed", table: "table_restaurant",
  "dining-table": "table_restaurant", "coffee-table": "table_restaurant",
  chair: "chair", armchair: "chair", desk: "desk", shelf: "shelves",
  bookshelf: "shelves", lamp: "light", "floor-lamp": "light", rug: "square",
  cabinet: "kitchen", wardrobe: "door_sliding", piano: "piano",
  "tv-stand": "tv", nightstand: "nightlight", dresser: "dresser",
  mirror: "flip", plant: "potted_plant", other: "category",
};

interface CustomElement {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  height3d: number;
  color: string | null;
}

export function FurniturePalette() {
  const { addElement, scale, setTool } = useEditorStore();
  const { furniture } = usePackageRegistry();
  const { isGuest } = useGuest();
  const params = useParams();
  const projectId = params.id as string;
  const [customItems, setCustomItems] = useState<CustomElement[]>([]);

  useEffect(() => {
    if (isGuest) return;
    fetch(`/api/projects/${projectId}/elements/custom`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCustomItems(data); })
      .catch(() => {});
  }, [projectId, isGuest]);

  const grouped = furniture.reduce<Record<string, typeof furniture>>((acc, f) => {
    const cat = f.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  function handleAdd(type: string, name: string, defaultW: number, defaultH: number, color?: string) {
    const ppm = scale.pixelsPerMeter;
    addElement({
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name, type,
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      width: defaultW * ppm,
      height: defaultH * ppm,
      rotation: 0,
      color,
    });
    setTool("select");
  }

  function handleAddCustom(item: CustomElement) {
    addElement({
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name,
      type: item.type,
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      width: item.width,
      height: item.height,
      rotation: 0,
      color: item.color || undefined,
    });
    setTool("select");
  }

  return (
    <div className="absolute top-14 left-2 z-10 rounded-xl shadow-ambient p-4 w-56 space-y-3 max-h-[70vh] overflow-y-auto surface-container-lowest">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Furniture Palette</p>

      {/* Custom furniture */}
      {customItems.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#6f5100] font-semibold mt-2 mb-1">Your Custom</p>
          {customItems.map((item) => (
            <button key={item.id} onClick={() => handleAddCustom(item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: item.color || "#6f5100" }}>
                {FURNITURE_ICONS[item.type] || "category"}
              </span>
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(item.width / 100).toFixed(1)} x {(item.height / 100).toFixed(1)} m
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Package furniture */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mt-2 mb-1">{category}</p>
          {items.map((f) => (
            <button key={f.type} onClick={() => handleAdd(f.type, f.nameI18n?.en || f.name, f.defaultWidth, f.defaultDepth, undefined)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: f.color }}>
                {FURNITURE_ICONS[f.type] || "category"}
              </span>
              <div>
                <p className="text-sm font-medium">{f.nameI18n?.en || f.name}</p>
                <p className="text-[10px] text-muted-foreground">{f.defaultWidth} x {f.defaultDepth} m</p>
              </div>
            </button>
          ))}
        </div>
      ))}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <Link href={`/projects/${projectId}/elements/create`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          Create Custom
        </Link>
        <Link href="/settings/packages"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>download</span>
          Import Package
        </Link>
      </div>
    </div>
  );
}
