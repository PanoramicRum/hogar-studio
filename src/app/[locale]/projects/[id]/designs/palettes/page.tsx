"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

interface PaletteColors {
  wall: string;
  floor: string;
  accent1: string;
  accent2: string;
  trim: string;
}

interface Palette {
  id: string;
  name: string;
  colors: PaletteColors;
}

const PRESET_PALETTES: { name: string; colors: PaletteColors }[] = [
  { name: "Warm Neutrals", colors: { wall: "#f5f0eb", floor: "#c4a882", accent1: "#8b6914", accent2: "#89411d", trim: "#ffffff" } },
  { name: "Cool Coastal", colors: { wall: "#f0f4f8", floor: "#d4c8a0", accent1: "#3b82f6", accent2: "#14b8a6", trim: "#ffffff" } },
  { name: "Earthy Forest", colors: { wall: "#f2efe8", floor: "#8b7355", accent1: "#16a34a", accent2: "#78716c", trim: "#f5f0eb" } },
  { name: "Monochrome", colors: { wall: "#f5f5f5", floor: "#404040", accent1: "#171717", accent2: "#737373", trim: "#ffffff" } },
  { name: "Sunset Warmth", colors: { wall: "#fef3c7", floor: "#c4a882", accent1: "#f59e0b", accent2: "#ef4444", trim: "#ffffff" } },
];

export default function PalettesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [name, setName] = useState("");
  const [colors, setColors] = useState<PaletteColors>({
    wall: "#f5f0eb", floor: "#c4a882", accent1: "#8b6914", accent2: "#515f74", trim: "#ffffff",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/palettes").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setPalettes(data);
    });
  }, []);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);

    const res = await fetch("/api/users/palettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), colors, projectId }),
    });

    if (res.ok) {
      const palette = await res.json();
      setPalettes([palette, ...palettes]);
      setName("");
      toast.success(`Palette "${name}" created!`);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/users/palettes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPalettes(palettes.filter((p) => p.id !== id));
    toast.success("Palette deleted");
  }

  function applyPreset(preset: { name: string; colors: PaletteColors }) {
    setName(preset.name);
    setColors(preset.colors);
  }

  const colorFields: { key: keyof PaletteColors; label: string }[] = [
    { key: "wall", label: "Wall" },
    { key: "floor", label: "Floor" },
    { key: "accent1", label: "Accent 1" },
    { key: "accent2", label: "Accent 2" },
    { key: "trim", label: "Trim" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Color Palettes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create color palettes to apply when generating AI designs. Colors are injected into the AI prompt.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PALETTES.map((p) => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg surface-container-high hover:shadow-ambient transition-all text-xs">
              <div className="flex gap-0.5">
                {Object.values(p.colors).map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="rounded-xl surface-container-low p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Palette Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warm Mediterranean"
            className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-1.5 text-center">
              <label className="text-[10px] text-muted-foreground">{label}</label>
              <input type="color" value={colors[key]}
                onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                className="w-full h-10 rounded-lg border-0 cursor-pointer" />
              <p className="text-[9px] font-mono text-muted-foreground">{colors[key]}</p>
            </div>
          ))}
        </div>

        {/* Preview bar */}
        <div className="flex h-8 rounded-lg overflow-hidden">
          {Object.values(colors).map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
          {saving ? "Creating..." : "Save Palette"}
        </button>
      </div>

      {/* Saved palettes */}
      {palettes.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-sm">Your Palettes</h2>
          {palettes.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl surface-container-low">
              <div className="flex gap-0.5">
                {Object.values(p.colors).map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: c as string }} />
                ))}
              </div>
              <span className="font-medium text-sm flex-1">{p.name}</span>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-destructive hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => router.push(`/projects/${projectId}/designs`)}
        className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Designs
      </button>
    </div>
  );
}
