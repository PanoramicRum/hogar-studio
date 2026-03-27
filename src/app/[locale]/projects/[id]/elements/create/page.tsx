"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useGuest } from "@/components/providers/GuestProvider";
import { toast } from "sonner";

const FURNITURE_TYPES = [
  "sofa", "sofa-bed", "bed", "table", "dining-table", "coffee-table",
  "chair", "armchair", "desk", "shelf", "bookshelf", "cabinet",
  "wardrobe", "lamp", "floor-lamp", "rug", "piano", "tv-stand",
  "nightstand", "dresser", "mirror", "plant", "other",
];

export default function CreateFurniturePage() {
  const params = useParams();
  const router = useRouter();
  const { isGuest } = useGuest();
  const projectId = params.id as string;

  const [name, setName] = useState("");
  const [type, setType] = useState("sofa");
  const [width, setWidth] = useState("1.0");
  const [depth, setDepth] = useState("0.5");
  const [height3d, setHeight3d] = useState("0.8");
  const [color, setColor] = useState("#8b5cf6");
  const [furnitureUrl, setFurnitureUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);

    const ppm = 100; // default pixels per meter
    const body = {
      name: name.trim(),
      type,
      width: parseFloat(width) * ppm,
      height: parseFloat(depth) * ppm,
      height3d: parseFloat(height3d),
      color,
      furnitureUrl: furnitureUrl || null,
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    const res = await fetch(`/api/projects/${projectId}/elements/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(`"${name}" created!`);
      router.push(`/projects/${projectId}/elements`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create");
    }
    setSaving(false);
  }

  const previewW = Math.min(parseFloat(width) || 1, 4) * 60;
  const previewD = Math.min(parseFloat(depth) || 0.5, 4) * 60;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Custom Furniture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define a furniture piece with custom dimensions to place in your floor plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Living Room Piano"
              className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg">
              {FURNITURE_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Width (m)</label>
              <input type="number" step="0.01" min="0.1" value={width} onChange={(e) => setWidth(e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Depth (m)</label>
              <input type="number" step="0.01" min="0.1" value={depth} onChange={(e) => setDepth(e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Height (m)</label>
              <input type="number" step="0.01" min="0.01" value={height3d} onChange={(e) => setHeight3d(e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              <input value={color} onChange={(e) => setColor(e.target.value)}
                className="input-ghost flex-1 px-3 py-2.5 text-sm rounded-lg font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Product URL (optional)</label>
            <input value={furnitureUrl} onChange={(e) => setFurnitureUrl(e.target.value)} placeholder="https://store.com/product"
              className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg" />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Preview</label>
          <div className="surface-container rounded-xl p-6 flex items-center justify-center" style={{ minHeight: "200px" }}>
            <div className="relative">
              <div
                style={{ width: previewW, height: previewD, backgroundColor: color + "40", borderColor: color, borderWidth: 2, borderStyle: "solid" }}
                className="rounded flex items-center justify-center"
              >
                <span className="text-[10px] font-bold" style={{ color }}>{name || "Furniture"}</span>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                {width} x {depth} x {height3d} m
              </p>
            </div>
          </div>

          <div className="rounded-xl surface-container p-4 space-y-2">
            <p className="text-xs font-semibold">How it works</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "14px", color: "#6f5100" }}>check</span>
                Appears in your furniture palette in the editor
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "14px", color: "#6f5100" }}>check</span>
                Drag and place with real dimensions
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "14px", color: "#6f5100" }}>check</span>
                Shows in 3D viewer at correct height
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => router.push(`/projects/${projectId}/elements`)}
          className="px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
          {saving ? "Creating..." : "Create Furniture"}
        </button>
      </div>
    </div>
  );
}
