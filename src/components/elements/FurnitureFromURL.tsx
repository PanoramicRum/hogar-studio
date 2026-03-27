"use client";

import { useState } from "react";
import { useGuest } from "@/components/providers/GuestProvider";
import { toast } from "sonner";

interface ExtractedFurniture {
  name: string;
  type: string;
  widthM: number;
  depthM: number;
  heightM: number;
  color: string;
  material: string;
  price: string;
  currency: string;
  imageUrl: string;
  description: string;
  sourceUrl: string;
}

interface FurnitureFromURLProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function FurnitureFromURL({ projectId, onClose, onCreated }: FurnitureFromURLProps) {
  const { isGuest } = useGuest();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<ExtractedFurniture | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields after extraction
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [height, setHeight] = useState("");
  const [color, setColor] = useState("#6b7280");

  async function handleAnalyze() {
    if (!url.trim()) return;
    setAnalyzing(true);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    try {
      const res = await fetch("/api/ai/digitize-furniture", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to analyze");
        setAnalyzing(false);
        return;
      }

      const extracted = await res.json();
      setData(extracted);
      setName(extracted.name);
      setType(extracted.type);
      setWidth(extracted.widthM.toFixed(2));
      setDepth(extracted.depthM.toFixed(2));
      setHeight(extracted.heightM.toFixed(2));
      setColor(extracted.color.startsWith("#") ? extracted.color : "#6b7280");
    } catch {
      toast.error("Failed to analyze URL");
    }
    setAnalyzing(false);
  }

  async function handleSave() {
    setSaving(true);
    const ppm = 100;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    const res = await fetch(`/api/projects/${projectId}/elements/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name,
        type,
        width: parseFloat(width) * ppm,
        height: parseFloat(depth) * ppm,
        height3d: parseFloat(height),
        color,
        furnitureUrl: data?.sourceUrl || url,
        furnitureData: {
          material: data?.material,
          price: data?.price,
          currency: data?.currency,
          description: data?.description,
        },
        imageUrl: data?.imageUrl || null,
      }),
    });

    if (res.ok) {
      toast.success(`"${name}" added to project`);
      onCreated();
      onClose();
    } else {
      toast.error("Failed to save");
    }
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-ambient-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-bold">Import from URL</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="px-5 pb-5 space-y-5">
            {/* URL input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Product URL</label>
              <div className="flex gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.ikea.com/product/..." disabled={analyzing}
                  className="input-ghost flex-1 px-3 py-2.5 text-sm rounded-lg" />
                <button onClick={handleAnalyze} disabled={analyzing || !url.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-50 shrink-0 flex items-center gap-1"
                  style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {analyzing ? "hourglass_top" : "auto_awesome"}
                  </span>
                  {analyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Paste a link to any furniture product page. AI will extract name, dimensions, and details.
              </p>
            </div>

            {/* Extracted data (editable) */}
            {data && (
              <>
                {/* Preview image */}
                {data.imageUrl && (
                  <div className="rounded-lg overflow-hidden surface-container h-40 flex items-center justify-center">
                    <img src={data.imageUrl} alt={data.name} className="max-h-full object-contain" />
                  </div>
                )}

                <div className="rounded-xl surface-container p-4 space-y-1">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#16a34a" }}>check_circle</span>
                    AI Extracted — review and edit below
                  </p>
                  {data.material && <p className="text-xs text-muted-foreground">Material: {data.material}</p>}
                  {data.price && <p className="text-xs text-muted-foreground">Price: {data.currency} {data.price}</p>}
                  {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)}
                        className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Type</label>
                      <input value={type} onChange={(e) => setType(e.target.value)}
                        className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Width (m)</label>
                      <input type="number" step="0.01" value={width} onChange={(e) => setWidth(e.target.value)}
                        className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Depth (m)</label>
                      <input type="number" step="0.01" value={depth} onChange={(e) => setDepth(e.target.value)}
                        className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Height (m)</label>
                      <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)}
                        className="input-ghost w-full px-3 py-2 text-sm rounded-lg font-mono" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer" />
                      <span className="text-xs font-mono text-muted-foreground">{color}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving || !name.trim()}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
                  {saving ? "Saving..." : "Add to Project"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
