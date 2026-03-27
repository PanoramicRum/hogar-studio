"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StyleSelector } from "@/components/designs/StyleSelector";
import { GenerationProgress } from "@/components/designs/GenerationProgress";
import { RoomSelector } from "@/components/designs/RoomSelector";
import { PerspectiveSelector, PERSPECTIVES } from "@/components/designs/PerspectiveSelector";
import { useGuest } from "@/components/providers/GuestProvider";
import { ShareButton } from "@/components/designs/ShareButton";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import { useAIReady } from "@/hooks/useAIReady";
import { AISetupPrompt } from "@/components/designs/AISetupPrompt";
import { toast } from "sonner";

interface Render {
  id: string;
  imageUrl: string;
  prompt: string;
  modelUsed: string;
  roomName?: string | null;
  perspective?: string | null;
  createdAt: string;
}

interface DesignFile {
  id: string;
  name: string;
  style: string;
  status: string;
  aiParams: Record<string, unknown> | null;
  renders: Render[];
  project: { images: { id: string; url: string; type: string; filename: string }[] };
}

export default function DesignFilePage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const projectId = params.id as string;
  const fileId = params.fileId as string;
  const { styles: packageStyles } = usePackageRegistry();

  const [design, setDesign] = useState<DesignFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [providers, setProviders] = useState<{ id: string; name: string; configured: boolean }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [userStyles, setUserStyles] = useState<{ id: string; name: string; prompt: string; negativePrompt: string; color: string }[]>([]);
  const [palettes, setPalettes] = useState<{ id: string; name: string; colors: Record<string, string> }[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedPerspective, setSelectedPerspective] = useState<string>("eye-level");
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const { hasGeneration } = useAIReady();

  const fetchDesign = useCallback(() => {
    fetch(`/api/projects/${projectId}/designs/${fileId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: DesignFile) => {
        setDesign(d);
        if (!selectedImageUrl && d.project.images.length > 0) {
          setSelectedImageUrl(d.project.images[0].url);
        }
        const style = packageStyles.find((s) => s.id === d.style);
        if (style && !customPrompt) setCustomPrompt(style.prompt);
        if (d.renders.length > 0 && !selectedRender) setSelectedRender(d.renders[0]);
      })
      .catch(() => router.push(`/projects/${projectId}/designs`))
      .finally(() => setLoading(false));
  }, [projectId, fileId, router, selectedImageUrl, customPrompt, selectedRender]);

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (isGuest || status === "authenticated") {
      fetchDesign();
      fetch("/api/ai/providers").then((r) => r.json()).then(setProviders);
      fetch("/api/users/styles").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setUserStyles(d); });
      fetch("/api/users/palettes").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPalettes(d); });
      // Load rooms from project images (floor plan model metadata)
      fetch(`/api/projects/${projectId}/images`).then((r) => r.json()).then((images) => {
        if (Array.isArray(images)) {
          for (const img of images) {
            const model = (img.metadata as Record<string, unknown>)?.floorPlanModel as { rooms?: { id: string; name: string }[] } | undefined;
            if (model?.rooms?.length) {
              setRooms(model.rooms.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
              break;
            }
          }
        }
      }).catch(() => {});
    }
  }, [status, fetchDesign]);

  // Poll while generating
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      fetch(`/api/projects/${projectId}/designs/${fileId}`)
        .then((r) => r.json())
        .then((d: DesignFile) => {
          if (d.status !== "GENERATING") {
            setGenerating(false);
            setDesign(d);
            if (d.renders.length > 0) setSelectedRender(d.renders[0]);
            if (d.status === "COMPLETED") toast.success("Design generated!");
            if (d.status === "FAILED") toast.error("Generation failed");
          }
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [generating, projectId, fileId]);

  async function handleGenerate() {
    if (!selectedImageUrl) { toast.error("Select a source image"); return; }
    if (!hasGeneration) { setShowAISetup(true); return; }
    setGenerating(true);

    const roomObj = rooms.find((r) => r.id === selectedRoom);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    // Use room-view API if room or perspective is selected
    const useRoomView = selectedRoom || selectedPerspective !== "eye-level";

    const apiUrl = useRoomView
      ? "/api/ai/generate-room-view"
      : `/api/projects/${projectId}/designs/${fileId}/generate`;

    const body = useRoomView
      ? {
          designFileId: fileId,
          projectId,
          roomName: roomObj?.name || "",
          perspective: selectedPerspective,
          style: design?.style,
          customPrompt: customPrompt + getPalettePromptSuffix(),
          sourceImageUrl: selectedImageUrl,
          provider: selectedProvider || undefined,
        }
      : {
          sourceImageUrl: selectedImageUrl,
          customPrompt: customPrompt + getPalettePromptSuffix(),
          provider: selectedProvider || undefined,
        };

    const res = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to start generation");
      setGenerating(false);
    }
  }

  async function handleGenerateAllPerspectives() {
    if (!selectedImageUrl) { toast.error("Select a source image"); return; }
    if (!hasGeneration) { setShowAISetup(true); return; }
    setGeneratingAll(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    const roomObj = rooms.find((r) => r.id === selectedRoom);
    const perspectives = ["eye-level", "corner", "overhead", "doorway"];
    let completed = 0;

    for (const perspective of perspectives) {
      toast.info(`Generating ${perspective} view (${completed + 1}/${perspectives.length})...`);
      try {
        await fetch("/api/ai/generate-room-view", {
          method: "POST",
          headers,
          body: JSON.stringify({
            designFileId: fileId,
            projectId,
            roomName: roomObj?.name || "",
            perspective,
            style: design?.style,
            customPrompt: customPrompt + getPalettePromptSuffix(),
            sourceImageUrl: selectedImageUrl,
            provider: selectedProvider || undefined,
          }),
        });
        completed++;
      } catch {
        toast.error(`Failed: ${perspective}`);
      }
    }

    toast.success(`Generated ${completed} perspective views!`);
    setGeneratingAll(false);
    fetchDesign(); // Refresh to show new renders
  }

  async function handleStyleChange(styleId: string) {
    await fetch(`/api/projects/${projectId}/designs/${fileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ style: styleId }),
    });
    // Check package styles first, then user styles
    const pkgStyle = packageStyles.find((s) => s.id === styleId);
    if (pkgStyle) {
      setCustomPrompt(pkgStyle.prompt);
    } else if (styleId.startsWith("user:")) {
      const us = userStyles.find((s) => `user:${s.id}` === styleId);
      if (us) setCustomPrompt(us.prompt);
    }
    if (design) setDesign({ ...design, style: styleId });
  }

  function getPalettePromptSuffix(): string {
    if (!selectedPalette) return "";
    const p = palettes.find((pl) => pl.id === selectedPalette);
    if (!p) return "";
    const c = p.colors;
    return `. Color palette: walls ${c.wall || "white"}, floor ${c.floor || "wood"}, accent colors ${c.accent1 || ""} and ${c.accent2 || ""}, trim ${c.trim || "white"}`;
  }

  if (loading || !design) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">{t("common.loading")}</p></div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">{design.name}</h1>

      {/* Source image + result comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("designs.sourceImage")}</Label>
          <div className="border rounded-lg overflow-hidden bg-muted">
            {selectedImageUrl ? (
              <img src={selectedImageUrl} alt="Source" className="w-full h-64 object-contain" />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {design.project.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {design.project.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageUrl(img.url)}
                  className={`w-16 h-16 rounded border overflow-hidden shrink-0 ${
                    selectedImageUrl === img.url ? "ring-2 ring-amber-700" : ""
                  }`}
                >
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Result</Label>
          {generating ? (
            <GenerationProgress style={design.style} />
          ) : selectedRender ? (
            <div className="relative border rounded-lg overflow-hidden bg-muted">
              <img src={selectedRender.imageUrl} alt="Render" className="w-full h-64 object-contain" />
              <div className="absolute top-2 right-2">
                <ShareButton
                  imageUrl={selectedRender.imageUrl}
                  projectName={design.name}
                  roomName={selectedRender.roomName}
                  style={design.style}
                  perspective={selectedRender.perspective}
                />
              </div>
            </div>
          ) : (
            <div className="border rounded-lg h-64 flex items-center justify-center text-muted-foreground bg-muted">
              Generate a design to see results
            </div>
          )}
        </div>
      </div>

      {/* Style selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("designs.style")}</Label>
        <StyleSelector selectedStyle={design.style} onSelect={handleStyleChange} />
      </div>

      {/* Room selector */}
      {rooms.length > 0 && (
        <RoomSelector rooms={rooms} selectedRoom={selectedRoom} onSelect={setSelectedRoom} />
      )}

      {/* Perspective selector */}
      <PerspectiveSelector selectedPerspective={selectedPerspective} onSelect={setSelectedPerspective} />

      {/* Custom prompt */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("designs.customPrompt")}</Label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={3}
          className="w-full border rounded-lg p-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Color palette selector */}
      {palettes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Color Palette</Label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPalette("")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                !selectedPalette ? "ring-2 ring-[#6f5100] shadow-sm" : "surface-container-low hover:shadow-ambient"
              }`}
            >
              None
            </button>
            {palettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPalette(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedPalette === p.id ? "ring-2 ring-[#6f5100] shadow-sm" : "surface-container-low hover:shadow-ambient"
                }`}
              >
                <div className="flex gap-0.5">
                  {Object.values(p.colors).slice(0, 4).map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c as string }} />
                  ))}
                </div>
                {p.name}
              </button>
            ))}
            <Link
              href={`/projects/${projectId}/designs/palettes`}
              className="px-3 py-1.5 text-xs rounded-lg surface-container-low hover:shadow-ambient flex items-center gap-1"
              style={{ color: "#6f5100" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>add</span>
              New
            </Link>
          </div>
        </div>
      )}

      {palettes.length === 0 && (
        <Link
          href={`/projects/${projectId}/designs/palettes`}
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: "#6f5100" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>palette</span>
          Create a color palette
        </Link>
      )}

      {/* AI Provider selector */}
      {providers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">AI Provider</Label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedProvider("")}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                !selectedProvider ? "border-amber-700 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-muted-foreground/50"
              }`}
            >
              Auto
            </button>
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                disabled={!p.configured}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  selectedProvider === p.id ? "border-amber-700 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-muted-foreground/50"
                } ${!p.configured ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {p.name} {!p.configured && "(not configured)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={generating || generatingAll || !selectedImageUrl}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>auto_awesome</span>
          {generating ? t("designs.generating") : t("designs.generate")}
        </button>

        <button
          onClick={handleGenerateAllPerspectives}
          disabled={generating || generatingAll || !selectedImageUrl}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg surface-container-high hover:shadow-ambient transition-all disabled:opacity-50"
          style={{ color: "#6f5100" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>grid_view</span>
          {generatingAll ? "Generating 4 views..." : "Generate All Perspectives"}
        </button>
      </div>

      {/* Render history */}
      {design.renders.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("designs.history")}</Label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {design.renders.map((render) => (
              <button
                key={render.id}
                onClick={() => setSelectedRender(render)}
                className={`w-20 h-20 rounded border overflow-hidden shrink-0 ${
                  selectedRender?.id === render.id ? "ring-2 ring-amber-700" : ""
                }`}
              >
                <img src={render.imageUrl} alt="Render" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {selectedRender && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              {selectedRender.roomName && (
                <span className="px-2 py-0.5 rounded-full surface-container-high font-medium">{selectedRender.roomName}</span>
              )}
              {selectedRender.perspective && (
                <span className="px-2 py-0.5 rounded-full surface-container-high">{selectedRender.perspective}</span>
              )}
              <span>Model: {selectedRender.modelUsed}</span>
              <span>&middot; {new Date(selectedRender.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Setup prompt */}
      {showAISetup && (
        <AISetupPrompt feature="generate designs" onClose={() => setShowAISetup(false)} />
      )}
    </div>
  );
}
