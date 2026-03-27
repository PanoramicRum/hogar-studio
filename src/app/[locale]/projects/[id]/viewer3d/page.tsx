"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useGuest } from "@/components/providers/GuestProvider";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import type { EditorElement, ScaleConfig } from "@/types/editor";

const RoomScene = dynamic(
  () => import("@/components/viewer3d/RoomScene").then((m) => ({ default: m.RoomScene })),
  { ssr: false }
);

export default function Viewer3DPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const projectId = params.id as string;
  const { furniture } = usePackageRegistry();

  const [elements, setElements] = useState<EditorElement[]>([]);
  const [scale, setScale] = useState<ScaleConfig>({ pixelsPerMeter: 100, calibrated: false });
  const [loading, setLoading] = useState(true);

  const { getProject: getGuestProject } = useGuest();

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (!isGuest && status !== "authenticated") return;

    if (isGuest) {
      const gp = getGuestProject(projectId);
      if (gp) {
        setElements(
          gp.elements.map((el) => ({
            id: el.id, name: el.name, type: el.type,
            x: el.positionX || 0, y: el.positionY || 0,
            width: el.width || 50, height: el.height || 50,
            rotation: el.rotation || 0, furnitureUrl: el.furnitureUrl || undefined,
          }))
        );
      }
      setLoading(false);
      return;
    }

    // Load elements from API
    fetch(`/api/projects/${projectId}/elements`)
      .then((r) => r.json())
      .then((els: { id: string; name: string; type: string; positionX: number; positionY: number; width: number; height: number; rotation: number; furnitureUrl: string | null }[]) => {
        if (Array.isArray(els)) {
          setElements(
            els.map((el) => ({
              id: el.id, name: el.name, type: el.type,
              x: el.positionX || 0, y: el.positionY || 0,
              width: el.width || 50, height: el.height || 50,
              rotation: el.rotation || 0, furnitureUrl: el.furnitureUrl || undefined,
            }))
          );
        }
        setLoading(false);
      });

    // Load scale from project image metadata
    fetch(`/api/projects/${projectId}/images`)
      .then((r) => r.json())
      .then((images: { metadata: { scalePixelsPerMeter?: number } | null }[]) => {
        if (Array.isArray(images)) {
          const floorPlan = images.find((img) => img.metadata?.scalePixelsPerMeter);
          if (floorPlan?.metadata?.scalePixelsPerMeter) {
            setScale({ pixelsPerMeter: floorPlan.metadata.scalePixelsPerMeter, calibrated: true });
          }
        }
      });
  }, [status, projectId, router, isGuest, getGuestProject]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 surface-container-low">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6f5100" }}>view_in_ar</span>
          <h2 className="font-bold">{t("viewer3d.title")}</h2>
        </div>
        <Link href={`/projects/${projectId}/editor`}>
          <Button variant="outline" size="sm">
            <span className="material-symbols-outlined mr-1" style={{ fontSize: "14px" }}>arrow_back</span>
            {t("viewer3d.backToEditor")}
          </Button>
        </Link>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 relative">
        {elements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "48px" }}>view_in_ar</span>
              <p className="mb-2">No furniture placed yet</p>
              <Link href={`/projects/${projectId}/editor`}>
                <Button variant="outline" size="sm">Go to Editor</Button>
              </Link>
            </div>
          </div>
        ) : (
          <RoomScene
            elements={elements}
            scale={scale}
            furnitureColors={Object.fromEntries(furniture.map((f) => [f.type, f.color]))}
            furnitureHeights={Object.fromEntries(furniture.map((f) => [f.type, f.height3d]))}
          />
        )}

        {/* Rendering Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-2 surface-container-high/80 backdrop-blur-sm flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#10b981" }}>circle</span>
            <span>Rendering engine: Studio v4.2 Ready</span>
          </div>
          <span>{elements.length} element{elements.length !== 1 ? "s" : ""} in scene</span>
        </div>
      </div>
    </div>
  );
}
