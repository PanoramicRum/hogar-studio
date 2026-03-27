"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

const PROMPT_TEMPLATES = [
  { label: "Rustic Farmhouse", prompt: "rustic farmhouse interior, reclaimed wood, stone fireplace, warm textiles, vintage accessories, cozy atmosphere, professional photography" },
  { label: "Art Deco", prompt: "art deco interior, geometric patterns, gold accents, velvet upholstery, mirrored surfaces, glamorous, professional photography" },
  { label: "Japanese Zen", prompt: "japanese zen interior, tatami mats, shoji screens, natural wood, minimal decoration, indoor garden, tranquil atmosphere, professional photography" },
  { label: "Coastal Beach", prompt: "coastal interior design, light blue and white palette, natural textures, driftwood, ocean-inspired, airy and bright, professional photography" },
  { label: "Dark Academia", prompt: "dark academia interior, rich mahogany, leather armchairs, bookshelves, warm lamplight, vintage paintings, scholarly atmosphere, professional photography" },
];

export default function CreateStylePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, distorted, low quality, cartoon, anime");
  const [color, setColor] = useState("#8b5cf6");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !prompt.trim()) { toast.error("Name and prompt are required"); return; }
    setSaving(true);

    const res = await fetch("/api/users/styles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), prompt: prompt.trim(), negativePrompt: negativePrompt.trim(), color }),
    });

    if (res.ok) {
      toast.success(`Style "${name}" created!`);
      router.push(`/projects/${projectId}/designs`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create");
    }
    setSaving(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Custom Style</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define an AI prompt that generates interior designs in your preferred aesthetic.
        </p>
      </div>

      <div className="space-y-6">
        {/* Name + Color */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Style Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tropical Paradise"
              className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Color Swatch</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded-lg border-0 cursor-pointer" />
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Start from a template</label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => { setName(t.label); setPrompt(t.prompt); }}
                className="px-3 py-1.5 text-xs rounded-lg surface-container-high hover:shadow-ambient transition-all">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">AI Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
            placeholder="Describe the interior design style in detail. Include materials, colors, mood, and photography style."
            className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg resize-none" />
          <p className="text-[10px] text-muted-foreground">
            Tip: Include &quot;professional photography&quot; for realistic results. Describe materials, colors, mood.
          </p>
        </div>

        {/* Negative prompt */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Negative Prompt</label>
          <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} rows={2}
            placeholder="Things to avoid in the generated image"
            className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg resize-none" />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Preview</label>
          <div className="rounded-xl surface-container p-4 flex items-center gap-4">
            <div className="w-16 h-10 rounded" style={{ backgroundColor: color }} />
            <div>
              <p className="text-sm font-bold">{name || "Style Name"}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{prompt || "AI prompt will appear here..."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => router.push(`/projects/${projectId}/designs`)}
          className="px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !name.trim() || !prompt.trim()}
          className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
          {saving ? "Creating..." : "Create Style"}
        </button>
      </div>
    </div>
  );
}
