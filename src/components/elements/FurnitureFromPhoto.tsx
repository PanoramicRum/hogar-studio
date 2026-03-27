"use client";

import { useState, useRef } from "react";
import { useGuest } from "@/components/providers/GuestProvider";
import { toast } from "sonner";

interface FurnitureFromPhotoProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function FurnitureFromPhoto({ projectId, onClose, onCreated }: FurnitureFromPhotoProps) {
  const { isGuest } = useGuest();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [height, setHeight] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalyzed(false);
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);

    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (isGuest) headers["x-guest-mode"] = "true";

    try {
      const res = await fetch("/api/ai/analyze-furniture-image", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Analysis failed");
        setAnalyzing(false);
        return;
      }

      const data = await res.json();
      setName(data.name);
      setType(data.type);
      setWidth(data.widthM.toFixed(2));
      setDepth(data.depthM.toFixed(2));
      setHeight(data.heightM.toFixed(2));
      setColor(data.color?.startsWith("#") ? data.color : "#6b7280");
      setAnalyzed(true);
    } catch {
      toast.error("Failed to analyze image");
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
        name, type,
        width: parseFloat(width) * ppm,
        height: parseFloat(depth) * ppm,
        height3d: parseFloat(height),
        color,
      }),
    });

    if (res.ok) {
      toast.success(`"${name}" added`);
      onCreated();
      onClose();
    }
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-ambient-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-bold">Import from Photo</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="px-5 pb-5 space-y-5">
            {/* Photo upload */}
            {!preview ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-40 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-muted-foreground/40" style={{ fontSize: "36px" }}>add_a_photo</span>
                <p className="text-sm text-muted-foreground">Click to upload a furniture photo</p>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden surface-container">
                <img src={preview} alt="Furniture" className="w-full h-40 object-contain" />
                <button onClick={() => { setPreview(null); setFile(null); setAnalyzed(false); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {/* Analyze button */}
            {preview && !analyzed && (
              <button onClick={handleAnalyze} disabled={analyzing}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {analyzing ? "hourglass_top" : "auto_awesome"}
                </span>
                {analyzing ? "AI Analyzing..." : "Analyze with AI"}
              </button>
            )}

            {/* Results */}
            {analyzed && (
              <div className="space-y-4">
                <div className="rounded-lg surface-container p-3 flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#16a34a" }}>check_circle</span>
                  AI extracted — review and edit
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Type</label>
                    <input value={type} onChange={(e) => setType(e.target.value)}
                      className="input-ghost w-full px-3 py-2 text-sm rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">W (m)</label>
                    <input type="number" step="0.01" value={width} onChange={(e) => setWidth(e.target.value)}
                      className="input-ghost w-full px-2 py-1.5 text-sm rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">D (m)</label>
                    <input type="number" step="0.01" value={depth} onChange={(e) => setDepth(e.target.value)}
                      className="input-ghost w-full px-2 py-1.5 text-sm rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">H (m)</label>
                    <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)}
                      className="input-ghost w-full px-2 py-1.5 text-sm rounded font-mono" />
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving || !name.trim()}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
                  {saving ? "Saving..." : "Add to Project"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
