"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useGuest } from "@/components/providers/GuestProvider";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const PanoramaViewer = dynamic(
  () => import("@/components/viewer3d/PanoramaViewer").then((m) => ({ default: m.PanoramaViewer })),
  { ssr: false }
);

interface PanoramaRender {
  id: string;
  imageUrl: string;
  roomName: string | null;
}

export default function PanoramaPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [panoramas, setPanoramas] = useState<PanoramaRender[]>([]);
  const [selectedPanorama, setSelectedPanorama] = useState<PanoramaRender | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (!isGuest && status !== "authenticated") return;

    // Load project images for source
    fetch(`/api/projects/${projectId}/images`)
      .then((r) => r.json())
      .then((images) => {
        if (Array.isArray(images) && images.length > 0) {
          setSourceImageUrl(images[0].url);
        }
      }).catch(() => {});

    // Load existing panoramas from designs
    fetch(`/api/projects/${projectId}/designs`)
      .then((r) => r.json())
      .then((designs) => {
        if (!Array.isArray(designs)) return;
        const panos: PanoramaRender[] = [];
        for (const d of designs) {
          if (d.renders) {
            for (const r of d.renders) {
              if (r.perspective === "360-panorama") {
                panos.push({ id: r.id, imageUrl: r.imageUrl, roomName: r.roomName });
              }
            }
          }
        }
        setPanoramas(panos);
        if (panos.length > 0) setSelectedPanorama(panos[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, projectId, router, isGuest]);

  async function handleGenerate() {
    if (!sourceImageUrl) { toast.error("No source image available"); return; }
    setGenerating(true);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    try {
      const res = await fetch("/api/ai/generate-panorama", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectId,
          roomName: "",
          style: "modern",
          sourceImageUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const pano = { id: data.id, imageUrl: data.imageUrl, roomName: data.roomName };
        setPanoramas([pano, ...panoramas]);
        setSelectedPanorama(pano);
        toast.success("360 panorama generated!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate");
      }
    } catch {
      toast.error("Generation failed");
    }
    setGenerating(false);
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 surface-container-low">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6f5100" }}>panorama_photosphere</span>
          <h2 className="font-bold">360 Room View</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !sourceImageUrl}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            {generating ? "hourglass_top" : "auto_awesome"}
          </span>
          {generating ? "Generating..." : "Generate 360 View"}
        </button>
      </div>

      {/* Viewer */}
      <div className="flex-1 min-h-0">
        {selectedPanorama ? (
          <PanoramaViewer imageUrl={selectedPanorama.imageUrl} />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground space-y-3">
              <span className="material-symbols-outlined" style={{ fontSize: "64px" }}>panorama_photosphere</span>
              <p className="text-lg font-medium">No 360 panoramas yet</p>
              <p className="text-sm">Generate a 360 view to explore your room in all directions</p>
            </div>
          </div>
        )}
      </div>

      {/* Panorama gallery */}
      {panoramas.length > 1 && (
        <div className="px-5 py-3 surface-container-low flex gap-2 overflow-x-auto">
          {panoramas.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPanorama(p)}
              className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 transition-all ${
                selectedPanorama?.id === p.id ? "ring-2 ring-[#6f5100]" : "opacity-60 hover:opacity-100"
              }`}
            >
              <img src={p.imageUrl} alt="Panorama" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
